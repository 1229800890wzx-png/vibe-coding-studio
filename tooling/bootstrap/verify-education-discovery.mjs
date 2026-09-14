/** Live public discovery/schedule preview acceptance; uses original auth + a real isolated-test MySQL runtime. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(s=>s.split('=')));
const base='http://127.0.0.1:48080', run=Date.now(), day=86400000;
const report={timestamp:new Date().toISOString(),checks:[],fixtures:{}};
const save=()=>fs.writeFileSync(path.join(root,'.runtime/education-discovery-report.json'),JSON.stringify(report,null,2)+'\n');
function pass(name,details){report.checks.push({name,details});save();console.log(`PASS: ${name}`);}
async function result(url,token,body,method=body?'POST':'GET') {return (await fetch(base+url,{method,headers:{'tenant-id':'1',terminal:'10','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})})).json();}
async function api(...args){const r=await result(...args);assert.equal(r.code,0,`${args[0]}: ${r.msg}`);return r.data;}
try {
  const admin=(await api('/admin-api/system/auth/login',null,{username:'admin',password:env.VIBE_ADMIN_PASSWORD})).accessToken;
  const member=(await api('/app-api/member/auth/login',null,{mobile:'13900000001',password:env.VIBE_MEMBER_PASSWORD})).accessToken;
  const a=(url,body,method)=>api('/admin-api/edu'+url,admin,body,method);
  const m=(url,body)=>api('/app-api/edu'+url,member,body);
  const p=(params)=>api('/app-api/edu/course/page?'+new URLSearchParams({pageNo:1,pageSize:100,...params}));
  const teacher=(await a('/teacher/page?pageNo=1&pageSize=100')).list.find(x=>x.status==='PUBLISHED');assert(teacher);
  const tag=`TEST探索${run}`;
  const first={name:tag+'A',code:'DISC-'+run,description:'TEST 已发布的公开课程说明',coverUrl:'http://127.0.0.1:5174/static/edu/courses/story.jpg',ageMin:8,ageMax:10,direction:'STORY',level:'BEGINNER',objectives:'解释选择',outcomes:'原创分支故事',lessons:[{title:'TEST 探索与验证',durationMinutes:60,objectives:'说明一个可检查的行为',materials:'测试用原创材料',assignment:'提交说明和测试'}]};
  const courseId=await a('/course/create',first);report.fixtures.courseId=courseId;
  await a('/course/publish',{id:courseId,version:0});
  const published=await a('/course/get?id='+courseId);
  const draft={...published,name:tag+'B',description:'TEST 仅运营可见的新草稿',ageMin:14,ageMax:16,direction:'TOOL',level:'ADVANCED'};
  await a('/course/update',draft,'PUT');
  assert((await p({keyword:first.name,age:9,direction:'STORY',level:'BEGINNER'})).list.some(x=>x.id===courseId));
  assert(!(await p({keyword:draft.name})).list.some(x=>x.id===courseId));
  assert(!(await p({keyword:tag,age:15,direction:'TOOL',level:'ADVANCED'})).list.some(x=>x.id===courseId));
  assert.equal((await a('/course/page?keyword='+encodeURIComponent(draft.name))).list[0].id,courseId);
  pass('Public discovery keeps published name, direction, age and level while admin edits a new draft');
  const start=run+240*day;
  async function cohort(kind,price,offset) {
    const t=start+offset*day;
    const id=await a('/cohort/create',{courseId,name:`${tag}${kind}`,kind,mode:'ONLINE',teacherId:teacher.id,capacity:4,price,startDate:t,endDate:t+3600000,terms:'TEST 本地验证规则',refundPolicy:'TEST 课前可按已付款项申请退款'});
    const sessionId=await a('/session/create',{cohortId:id,title:'TEST 目录场次',teacherId:teacher.id,startTime:t,endTime:t+3600000,joinInfo:{instructions:'TEST 外部课堂入口'},materials:[]});
    await a('/cohort/publish',{id});
    return {id,sessionId,t};
  }
  const trial=await cohort('TRIAL',0,0), regular=await cohort('REGULAR',5000,7);Object.assign(report.fixtures,{trial,regular});
  const trialOnly=(await p({keyword:tag,kind:'TRIAL'})).list.find(x=>x.id===courseId);assert.equal(trialOnly.price,0);assert.equal(trialOnly.cohortCount,1);
  const regularOnly=(await p({keyword:tag,kind:'REGULAR',mode:'ONLINE'})).list.find(x=>x.id===courseId);assert.equal(regularOnly.price,5000);assert.equal(regularOnly.cohortCount,1);
  pass('Standalone trial and combined delivery filters return matching cohort count and original SKU price');
  const date=new Date(regular.t).toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'});
  const dateResult=(await p({keyword:tag,startFrom:date,startTo:date})).list.find(x=>x.id===courseId);assert.equal(dateResult.price,5000);assert.equal(dateResult.cohortCount,1);
  assert.equal((await p({keyword:tag,startFrom:'2040-01-01',startTo:'2040-01-02'})).total,0);
  assert.notEqual((await result('/app-api/edu/course/page?startFrom=2051-01-01&startTo=2050-01-01')).code,0);
  pass('Inclusive calendar date boundaries, empty results and reversed date rejection verified',{date});
  const latest=await a('/course/get?id='+courseId);await a('/course/publish',{id:courseId,version:latest.version,revision:latest.revision});
  assert((await p({keyword:draft.name,age:15,direction:'TOOL',level:'ADVANCED'})).list.some(x=>x.id===courseId));
  assert(!(await p({keyword:first.name})).list.some(x=>x.id===courseId));
  assert.equal((await api('/app-api/edu/cohort/get?id='+trial.id)).courseName,first.name);
  pass('Publishing switches public discovery; existing cohort still presents its purchased curriculum version');
  const studentId=await m('/student/create',{name:'TEST探索学员'+run,birthMonth:(new Date().getFullYear()-8)+'-01',grade:'小学',experience:'初学'});
  const booking=await m('/trial/create',{studentId,cohortId:trial.id});Object.assign(report.fixtures,{studentId,bookingId:booking.id});
  const before=await a('/session/get?id='+trial.sessionId);
  const count=(await a('/session/page?cohortId='+trial.id)).total;
  const candidate={...before,startTime:trial.t+2*day,endTime:trial.t+2*day+3600000};
  const preview=await a('/session/preview',candidate);assert.equal(preview.canSave,true);assert.equal(preview.affectedCount,1);assert.equal(preview.affectedStudents[0].studentId,studentId);assert.equal(preview.affectedStudents[0].willNotify,true);assert(preview.checkedAt);
  assert.deepEqual(await a('/session/get?id='+trial.sessionId),before);assert.equal((await a('/session/page?cohortId='+trial.id)).total,count);
  pass('Schedule preview shows affected guardian notification and before/after without changing persisted data');
  const conflict=await a('/session/preview',{...before,startTime:regular.t,endTime:regular.t+3600000});assert.equal(conflict.canSave,false);assert(conflict.conflicts.some(x=>x.type==='TEACHER'));
  assert.notEqual((await result('/admin-api/edu/session/update',admin,{...before,startTime:regular.t,endTime:regular.t+3600000},'PUT')).code,0);
  assert.notEqual((await result('/admin-api/edu/session/preview',member,candidate)).code,0);
  pass('Conflicts block preview and authoritative save, and original member session cannot access staff preview');
  await m('/trial/cancel',{id:booking.id});
  report.status='PASSED';save();
} catch(error) { report.status='FAILED';report.error=error.message;save();throw error; }
