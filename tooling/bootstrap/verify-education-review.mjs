/** Actual local Java21/MySQL teacher-review and attendance checks. All new records
 * are TEST fixtures; original account/RBAC/trial APIs remain authoritative. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'.tools/package.json'));
const mysql=require('mysql2/promise');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(line=>{const split=line.indexOf('=');return[line.slice(0,split),line.slice(split+1)];}));
const db=await mysql.createConnection({host:'127.0.0.1',port:13306,user:'vibe_edu',password:env.VIBE_DB_PASSWORD,database:'vibe_edu'});
const report={startedAt:new Date().toISOString(),checks:[],fixtures:{teacherUserIds:[],cohortIds:[],trialIds:[]}};
const reportPath=path.join(root,'.runtime/education-review-report.json');
const save=()=>fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
const key=Date.now().toString(36),day=86400000,anchor=Date.now()+90*day;
let admin,member;
async function result(url,{token,body,method='GET'}={}) {
  return fetch('http://127.0.0.1:48080'+url,{method,signal:AbortSignal.timeout(30000),headers:{'tenant-id':'1',terminal:'10','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})}).then(r=>r.json());
}
async function api(url,options){const r=await result(url,options);assert.equal(r.code,0,`${url}: ${r.code} ${r.msg}`);return r.data;}
const staff=(url,body,token=admin)=>api('/admin-api'+url,{token,...(body?{method:'POST',body}:{})});
const app=(url,body)=>api('/app-api'+url,{token:member,...(body?{method:'POST',body}:{})});
function pass(name,details){report.checks.push({name,status:'PASSED',...(details?{details}:{})});save();console.log(`PASS: ${name}`);}
function conflict(response,pattern){assert.equal(response.code,1090000001,`${response.code}: ${response.msg}`);assert.match(response.msg,pattern);}
async function teacher(label) {
  const username=`TESTreview${key}${label}`;
  const userId=await staff('/system/user/create',{username,nickname:`TEST点评教师${label}`,password:env.VIBE_ADMIN_PASSWORD,postIds:[],remark:'TEST review concurrency only'});
  await staff('/system/permission/assign-user-role',{userId,roleIds:[91003]});
  const id=await staff('/edu/teacher/create',{userId,name:`TEST点评教师${label}`,bio:'本地并发回归档案',status:'PUBLISHED'});
  const token=(await api('/admin-api/system/auth/login',{method:'POST',body:{username,password:env.VIBE_ADMIN_PASSWORD}})).accessToken;
  report.fixtures.teacherUserIds.push(userId);return{id,userId,token};
}
try {
  admin=(await api('/admin-api/system/auth/login',{method:'POST',body:{username:'admin',password:env.VIBE_ADMIN_PASSWORD}})).accessToken;
  member=(await api('/app-api/member/auth/login',{method:'POST',body:{mobile:'13900000001',password:env.VIBE_MEMBER_PASSWORD}})).accessToken;
  const a=await teacher('A'),b=await teacher('B'),unassigned=await teacher('C');
  assert.equal((await staff('/system/role/get?id=91003')).dataScope,5);
  const courseId=await staff('/edu/course/create',{name:`TEST点评课程${key}`,code:`TEST-REVIEW-${key}`,description:'本地点评与出勤回归',coverUrl:'/assets/course-placeholder.svg',ageMin:8,ageMax:16,direction:'TOOL',level:'BEGINNER',lessons:[{title:'测试与解释',durationMinutes:60,objectives:'解释一个测试案例',assignment:'提交测试说明'}]});
  await staff('/edu/course/publish',{id:courseId,version:0});report.fixtures.courseId=courseId;
  const studentId=await app('/edu/student/create',{name:`TEST点评学员${key}`,birthMonth:'2016-01',grade:'小学',experience:'初学'});report.fixtures.studentId=studentId;
  async function cohort(offset) {
    const id=await staff('/edu/cohort/create',{courseId,name:`TEST点评班${key}-${offset}`,kind:'TRIAL',mode:'ONLINE',teacherId:a.id,capacity:6,price:0,startDate:anchor+offset*day,endDate:anchor+offset*day+3600000,terms:'本地回归规则',refundPolicy:'本地测试预约可取消'});
    report.fixtures.cohortIds.push(id);
    const sessionId=await staff('/edu/session/create',{cohortId:id,title:`TEST点评课次${offset}`,teacherId:b.id,startTime:anchor+offset*day,endTime:anchor+offset*day+3600000,joinInfo:{instructions:'本地测试'},materials:[]});
    await staff('/edu/cohort/publish',{id});
    const trial=await app('/edu/trial/create',{studentId,cohortId:id});report.fixtures.trialIds.push(trial.id);
    const dashboard=await app(`/edu/learning/dashboard?studentId=${studentId}`);
    return{id,sessionId,enrollmentId:dashboard.enrollments.find(e=>e.cohortId===id).id};
  }
  const first=await cohort(0),second=await cohort(2);report.fixtures.first=first;report.fixtures.second=second;
  const assignmentId=await staff('/edu/assignment/create',{cohortId:first.id,sessionId:first.sessionId,title:'TEST解释测试过程',description:'写下预期与实际',dueTime:anchor+day,materials:[],status:'PUBLISHED'});
  const submitted=await app('/edu/submission/submit',{studentId,assignmentId,content:'测试前写出预期，运行后对比结果。',attachments:[]});report.fixtures.submissionId=submitted.id;
  for(const teacher of[a,b])assert.equal((await staff(`/edu/submission/get?id=${submitted.id}`,null,teacher.token)).id,submitted.id);
  pass('Two original SELF staff accounts gain access only through assigned cohort/session');
  const payload={id:submitted.id,revision:0,status:'DRAFT',score:80,requireRevision:true};
  // Both requests begin while only this new fixture's submission row is locked.
  // Once released, their writes serialize; the second must observe the first revision.
  await db.beginTransaction();await db.execute('SELECT id FROM edu_submission WHERE id=? AND tenant_id=1 FOR UPDATE',[submitted.id]);
  let pending;
  try {
    pending=[a,b].map((t,index)=>result('/admin-api/edu/submission/review',{token:t.token,method:'POST',body:{...payload,feedback:`教师${index}的具体反馈`}}));
    await new Promise(resolve=>setTimeout(resolve,600));
  } finally {await db.rollback();}
  const responses=await Promise.all(pending);assert.equal(responses.filter(r=>r.code===0).length,1);
  conflict(responses.find(r=>r.code!==0),/草稿.*更新/);
  const winner=responses.find(r=>r.code===0).data;assert.equal(winner.revision,1);assert.equal(typeof winner.updateTime,'number');assert.equal(winner.requireRevision,true);
  const persisted=(await staff(`/edu/submission/get?id=${submitted.id}`,null,a.token)).review;
  assert.equal(persisted.feedback,winner.feedback);assert.equal(persisted.revision,1);assert.equal(persisted.updateTime,winner.updateTime);
  pass('Concurrent first drafts accept exactly one writer and expose persisted server revision/time',{revision:winner.revision});
  const own=await app(`/edu/review/list?studentId=${studentId}&assignmentId=${assignmentId}`);assert.equal(own[0].review,undefined);
  pass('Teacher draft remains invisible to the guardian');
  const missing={...payload,feedback:'缺少修订号的旧客户端'};delete missing.revision;
  conflict(await result('/admin-api/edu/submission/review',{token:a.token,method:'POST',body:missing}),/修订号/);
  conflict(await result('/admin-api/edu/submission/review',{token:b.token,method:'POST',body:{...payload,feedback:'过期草稿'}}),/草稿.*更新/);
  pass('Missing and stale revisions cannot bypass review overwrite protection');
  await new Promise(resolve=>setTimeout(resolve,20));
  const saved=await staff('/edu/submission/review',{...payload,revision:1,feedback:'合并后保留具体建议'},b.token);
  assert.equal(saved.revision,2);assert(saved.updateTime>winner.updateTime);
  assert.equal((await staff(`/edu/submission/get?id=${submitted.id}`,null,a.token)).review.requireRevision,true);
  pass('Fresh revision saves and reopens requireRevision with a newer server save time');
  await db.beginTransaction();await db.execute('SELECT id FROM edu_submission WHERE id=? AND tenant_id=1 FOR UPDATE',[submitted.id]);
  try {
    pending=[a,b].map((t,index)=>result('/admin-api/edu/submission/review',{token:t.token,method:'POST',body:{...payload,revision:2,feedback:`已有草稿并发修改${index}`}}));
    await new Promise(resolve=>setTimeout(resolve,600));
  } finally {await db.rollback();}
  const edits=await Promise.all(pending);assert.equal(edits.filter(r=>r.code===0).length,1);conflict(edits.find(r=>r.code!==0),/草稿.*更新/);
  const latest=(await staff(`/edu/submission/get?id=${submitted.id}`,null,b.token)).review;
  assert.equal(latest.revision,3);assert.equal(latest.feedback,edits.find(r=>r.code===0).data.feedback);
  pass('Concurrent updates to an existing draft accept one writer without a repeatable-read lost update');
  const published=await staff('/edu/submission/review',{...payload,revision:3,status:'PUBLISHED',feedback:'已发布的具体反馈'},a.token);assert.equal(published.revision,4);
  conflict(await result('/admin-api/edu/submission/review',{token:b.token,method:'POST',body:{...payload,revision:4,feedback:'不能覆盖已发布点评'}}),/已发布点评不可覆盖/);
  assert.equal((await app(`/edu/review/list?studentId=${studentId}&assignmentId=${assignmentId}`))[0].review.feedback,'已发布的具体反馈');
  pass('Published review remains immutable even with the current revision');
  await staff('/edu/attendance/save',{enrollmentId:first.enrollmentId,sessionId:first.sessionId,status:'PRESENT',note:'TEST 已完成到课'},a.token);
  const roster=await staff(`/edu/enrollment/page?pageNo=1&pageSize=100&cohortId=${first.id}&sessionId=${first.sessionId}&status=ACTIVE`,null,b.token);
  const mark=roster.list.find(e=>e.id===first.enrollmentId);assert.equal(mark.attendanceStatus,'PRESENT');assert.equal(mark.attendanceNote,'TEST 已完成到课');assert.equal(typeof mark.attendanceUpdateTime,'number');
  const blank=await staff(`/edu/enrollment/page?pageNo=1&pageSize=100&cohortId=${second.id}&sessionId=${second.sessionId}&status=ACTIVE`,null,a.token);
  assert.equal(blank.list[0].attendanceStatus,null);assert.equal(blank.list[0].attendanceNote,'');assert.equal(blank.list[0].attendanceUpdateTime,null);
  pass('Attendance reopens persisted session marks while another session stays unmarked');
  conflict(await result(`/admin-api/edu/enrollment/page?cohortId=${first.id}&sessionId=${second.sessionId}`,{token:a.token}),/课次不属于/);
  conflict(await result(`/admin-api/edu/enrollment/page?sessionId=${first.sessionId}`,{token:unassigned.token}),/无权/);
  conflict(await result(`/admin-api/edu/submission/get?id=${submitted.id}`,{token:unassigned.token}),/无权/);
  pass('Attendance scope rejects mismatched cohorts and unassigned teachers');
  report.status='PASSED';
} catch(error) {report.status='FAILED';report.error=error.message;process.exitCode=1;console.error(`FAIL: ${error.message}`);}
finally {
  for(const id of report.fixtures.trialIds)try{await app('/edu/trial/cancel',{id});}catch(error){report.cleanupError=error.message;report.status='FAILED';process.exitCode=1;}
  report.completedAt=new Date().toISOString();save();await db.end();
}
