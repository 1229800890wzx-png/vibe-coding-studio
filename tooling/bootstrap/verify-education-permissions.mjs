/** Exercises original system RBAC/data scopes through real HTTP requests. Local fixtures only. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(x=>x.trim().split('=')));
const fixture=JSON.parse(fs.readFileSync(path.join(root,'.runtime/education-flow-report.json'),'utf8')).fixtures;
const report={timestamp:new Date().toISOString(),checks:[],fixtures:{}};
const save=()=>fs.writeFileSync(path.join(root,'.runtime/education-permissions-report.json'),JSON.stringify(report,null,2)+'\n');
const pass=(name,details)=>{report.checks.push({name,details});save();console.log(`PASS: ${name}`);};
async function result(url,{token,method='GET',body}={}){return fetch('http://127.0.0.1:48080'+url,{method,headers:{'tenant-id':'1','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})}).then(r=>r.json());}
async function api(url,options){const r=await result(url,options);assert.equal(r.code,0,`${url}: ${r.msg}`);return r.data;}
async function deny(url,token,name){const r=await result(url,{token});assert([403,1090000001].includes(r.code),`${url} must deny by access policy, got ${r.code}: ${r.msg}`);pass(name,{code:r.code});}
let admin,originalSession,sessionChanged=false;
try{
  admin=(await api('/admin-api/system/auth/login',{method:'POST',body:{username:'admin',password:env.VIBE_ADMIN_PASSWORD}})).accessToken;
  const post=(url,body)=>api('/admin-api'+url,{token:admin,method:'POST',body});
  async function user(roleId,deptId,prefix){
    const username=prefix+Date.now();
    const id=await post('/system/user/create',{username,nickname:prefix,password:env.VIBE_ADMIN_PASSWORD,deptId,postIds:[]});
    await post('/system/permission/assign-user-role',{userId:id,roleIds:[roleId]});
    const token=(await api('/admin-api/system/auth/login',{method:'POST',body:{username,password:env.VIBE_ADMIN_PASSWORD}})).accessToken;
    return {id,username,token};
  }
  const role=await api('/admin-api/system/role/get?id=91003',{token:admin});assert.equal(role.dataScope,5);
  const teacher=await user(91003,null,'localteach');report.fixtures.teacherUserId=teacher.id;
  const teacherId=await post('/edu/teacher/create',{userId:teacher.id,name:'权限验收教师',bio:'仅用于本地数据权限验收。',status:'PUBLISHED'});
  for(const [resource,id] of [['cohort',fixture.trial.id],['student',fixture.studentId],['submission',fixture.submissionId]])await deny(`/admin-api/edu/${resource}/get?id=${id}`,teacher.token,`Unassigned SELF teacher cannot read ${resource}`);
  for(const resource of ['cohort','student','submission'])assert.equal((await api(`/admin-api/edu/${resource}/page?pageNo=1&pageSize=100`,{token:teacher.token})).total,0);
  pass('Unassigned SELF teacher lists contain no unrelated records');
  originalSession=await api(`/admin-api/edu/session/get?id=${fixture.trial.sessionIds[0]}`,{token:admin});
  await post('/edu/session/update',{...originalSession,teacherId});sessionChanged=true;
  for(const [resource,id] of [['cohort',fixture.trial.id],['student',fixture.studentId],['submission',fixture.submissionId]]){
    assert.equal((await api(`/admin-api/edu/${resource}/get?id=${id}`,{token:teacher.token})).id,id);
    pass(`Assigned SELF teacher can read related ${resource}`);
  }
  const visible=await api('/admin-api/edu/cohort/page?pageNo=1&pageSize=100',{token:teacher.token});assert.deepEqual(visible.list.map(x=>x.id),[fixture.trial.id]);
  await deny(`/admin-api/edu/cohort/get?id=${fixture.regular.id}`,teacher.token,'Assigned SELF teacher cannot read another cohort');
  pass('SELF teacher cohort list is limited to the assigned cohort');
  // Restore the original fixture teacher so this acceptance is safe to repeat.
  await post('/edu/session/update',{...originalSession,version:originalSession.version+1});sessionChanged=false;
  const suffix=String(Date.now()).slice(-8);
  const deptA=await post('/system/dept/create',{name:`验收校区A${suffix}`,parentId:0,sort:90,status:0});
  const deptB=await post('/system/dept/create',{name:`验收校区B${suffix}`,parentId:0,sort:91,status:0});
  const campusA=await post('/edu/campus/create',{deptId:deptA,name:`验收校区A${suffix}`,city:'本地',address:'本地验收A',status:'PUBLISHED'});
  const campusB=await post('/edu/campus/create',{deptId:deptB,name:`验收校区B${suffix}`,city:'本地',address:'本地验收B',status:'PUBLISHED'});
  const coordinator=await user(91002,deptA,'localstaff');report.fixtures.coordinatorUserId=coordinator.id;
  assert.equal((await api('/admin-api/system/role/get?id=91002',{token:admin})).dataScope,4);
  const future=Date.now()+500*86400000;
  async function cohort(campusId,name){return post('/edu/cohort/create',{courseId:fixture.courseId,name,kind:'REGULAR',mode:'OFFLINE',campusId,teacherId:fixture.teacherId,capacity:12,price:9900,startDate:future,endDate:future+8*86400000,terms:'权限验收',refundPolicy:'本地测试'});}
  const cohortA=await cohort(campusA,`权限班期A${suffix}`),cohortB=await cohort(campusB,`权限班期B${suffix}`);
  report.fixtures.campuses=[campusA,campusB];report.fixtures.cohorts=[cohortA,cohortB];
  assert.equal((await api(`/admin-api/edu/campus/get?id=${campusA}`,{token:coordinator.token})).id,campusA);
  assert.equal((await api(`/admin-api/edu/cohort/get?id=${cohortA}`,{token:coordinator.token})).id,cohortA);
  pass('Original department-scoped coordinator can read its campus and cohort');
  await deny(`/admin-api/edu/campus/get?id=${campusB}`,coordinator.token,'Department-scoped coordinator cannot read another campus');
  await deny(`/admin-api/edu/cohort/get?id=${cohortB}`,coordinator.token,'Department-scoped coordinator cannot read another campus cohort');
  const scoped=await api('/admin-api/edu/cohort/page?pageNo=1&pageSize=100',{token:coordinator.token});assert.deepEqual(scoped.list.map(x=>x.id),[cohortA]);pass('Original department scope filters cohort list');
  report.status='PASSED';save();
}catch(e){report.status='FAILED';report.error=e.message;save();throw e;}
finally{
  if(sessionChanged&&admin&&originalSession){const current=await api(`/admin-api/edu/session/get?id=${originalSession.id}`,{token:admin});await api('/admin-api/edu/session/update',{token:admin,method:'POST',body:{...originalSession,version:current.version}});}
}
