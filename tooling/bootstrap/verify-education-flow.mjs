/** Real local API acceptance. Credentials/tokens never appear in reports. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(x=>x.trim().split('=')));
const base='http://127.0.0.1:48080', run=Date.now(), day=86400000;
const report={timestamp:new Date().toISOString(),checks:[],fixtures:{}};
const save=()=>fs.writeFileSync(path.join(root,'.runtime/education-flow-report.json'),JSON.stringify(report,null,2)+'\n');
function pass(name,details){report.checks.push({name,...(details?{details}:{})});save();console.log(`PASS: ${name}`);}
async function result(url,{token,method='GET',body,form}={}){
  const response=await fetch(base+url,{method,headers:{'tenant-id':'1',terminal:'10',...(token?{Authorization:`Bearer ${token}`} : {}),...(!form?{'Content-Type':'application/json'}:{})},...(form?{body:form}:body?{body:JSON.stringify(body)}:{})});
  return response.json();
}
async function api(url,options){const r=await result(url,options);if(r.code!==0)throw Error(`${url}: ${r.code} ${r.msg}`);return r.data;}
async function denied(url,options,name){const r=await result(url,options);assert.notEqual(r.code,0,`${name} must reject`);pass(name,{code:r.code});}
try{
  const admin=(await api('/admin-api/system/auth/login',{method:'POST',body:{username:'admin',password:env.VIBE_ADMIN_PASSWORD}})).accessToken;
  const member=(await api('/app-api/member/auth/login',{method:'POST',body:{mobile:'13900000001',password:env.VIBE_MEMBER_PASSWORD}})).accessToken;
  const stranger=(await api('/app-api/member/auth/login',{method:'POST',body:{mobile:'13900000002',password:env.VIBE_MEMBER_PASSWORD}})).accessToken;
  const postAdmin=(url,body)=>api(`/admin-api/edu${url}`,{token:admin,method:'POST',body});
  const postMember=(url,body)=>api(`/app-api/edu${url}`,{token:member,method:'POST',body});
  const studentId=await postMember('/student/create',{name:`联调学员${run}`,birthMonth:'2016-01',grade:'小学',experience:'初学者'});
  report.fixtures.studentId=studentId;
  await denied(`/app-api/edu/learning/dashboard?studentId=${studentId}`,{token:stranger},'Cross-parent student access denied');
  pass('Child profile linked to original member',{studentId});
  const teachers=await api('/admin-api/edu/teacher/page?pageNo=1&pageSize=100',{token:admin});
  let teacherId=teachers.list.find(t=>t.userId===1)?.id;
  if(!teacherId)teacherId=await postAdmin('/teacher/create',{userId:1,name:'本地验收教师',bio:'负责本地测试课表和作业点评。',avatarUrl:'',status:'PUBLISHED'});
  report.fixtures.teacherId=teacherId;pass('Teacher profile reuses original system administrator identity');
  const lessons=Array.from({length:8},(_,i)=>({title:`第${i+1}课：创作与验证`,durationMinutes:90,objectives:'能够解释作品行为并验证一个边界案例。',materials:'本地示例',assignment:'提交原创说明及测试结果。'}));
  const courseId=await postAdmin('/course/create',{name:`本地验收课程${run}`,code:`LOCAL-${run}`,description:'用于实际验证课程发布、原商品模型和学习服务。',coverUrl:'http://127.0.0.1:5173/assets/course-placeholder.svg',ageMin:8,ageMax:16,direction:'AI_CREATION',level:'BEGINNER',objectives:'理解并验证程序',outcomes:'原创互动作品',lessons});
  report.fixtures.courseId=courseId;
  await denied(`/app-api/edu/course/get?id=${courseId}`,{},'Draft curriculum is not publicly readable');
  await postAdmin('/course/publish',{id:courseId,version:0});
  const course=await api(`/app-api/edu/course/get?id=${courseId}`);assert.equal(course.lessons.length,8);assert.equal(course.version,1);pass('Eight-lesson course published as a versioned snapshot');
  const cohortCount=(await api('/admin-api/edu/cohort/page?pageNo=1&pageSize=1',{token:admin})).total;
  const future=run+(14+cohortCount*14)*day;
  async function cohort(kind,price,count,start){
    const id=await postAdmin('/cohort/create',{courseId,name:`本地${kind}班${run}`,kind,mode:'ONLINE',teacherId,capacity:12,price,startDate:start,endDate:start+(count-1)*day+5400000,terms:'本地验收规则；仅测试使用。',refundPolicy:'开课前可通过原订单售后申请退款。'});
    const ids=[];
    for(let i=0;i<count;i++)ids.push(await postAdmin('/session/create',{cohortId:id,title:`${kind}第${i+1}次课`,teacherId,startTime:start+i*day,endTime:start+i*day+5400000,joinInfo:{instructions:'本地验收课堂信息，仅报名家长可见。'},materials:[]}));
    await postAdmin('/cohort/publish',{id});
    const info=await api(`/app-api/edu/cohort/get?id=${id}`);assert(info.skuId);assert.equal(info.sessions.length,count);assert.equal(info.price,price);assert.equal(info.stock,12);assert(!('joinInfo' in info.sessions[0]));
    return {id,sessionIds:ids,skuId:info.skuId};
  }
  const regular=await cohort('REGULAR',9900,8,future), trial=await cohort('TRIAL',0,1,future-2*day);
  report.fixtures.regular=regular;report.fixtures.trial=trial;
  const linkedCourse=await api(`/app-api/edu/course/get?id=${courseId}`);
  const spu=await api(`/admin-api/product/spu/get-detail?id=${linkedCourse.spuId}`,{token:admin});
  assert.equal(spu.price,0);assert.equal(spu.stock,24);
  pass('Original SPU minimum price follows added trial SKU without rewriting stock');
  pass('Formal eight-session and free trial cohorts create original SPU/SKUs and publish');
  const booked=await postMember('/trial/create',{studentId,cohortId:trial.id});
  const repeated=await postMember('/trial/create',{studentId,cohortId:trial.id});assert.equal(booked.id,repeated.id);
  const afterTrial=await api(`/app-api/edu/cohort/get?id=${trial.id}`);assert.equal(afterTrial.stock,11);
  const dashboard=await api(`/app-api/edu/learning/dashboard?studentId=${studentId}`,{token:member});
  const enrollment=dashboard.enrollments.find(e=>e.cohortId===trial.id);assert.equal(enrollment.status,'ACTIVE');
  report.fixtures.enrollmentId=enrollment.id;pass('Free trial booking idempotently grants learning access and decrements original SKU once');
  const session=await api(`/app-api/edu/session/get?id=${trial.sessionIds[0]}&studentId=${studentId}`,{token:member});assert(session.joinInfo.instructions);
  const assignmentId=await postAdmin('/assignment/create',{cohortId:trial.id,sessionId:trial.sessionIds[0],title:'本地作品与测试记录',description:'写下作品目标与验证步骤。',dueTime:future+day,status:'PUBLISHED',materials:[]});
  const form=new FormData();form.set('studentId',String(studentId));form.set('file',new Blob(['const greeting = "hello";\n'],{type:'text/plain'}),'local-project.js');
  const upload=await api('/app-api/edu/file/upload',{token:member,method:'POST',form});report.fixtures.fileId=upload.fileId;
  const link=await api(`/app-api/edu/file/get-url?fileId=${upload.fileId}&studentId=${studentId}`,{token:member});
  assert(!link.url.includes(member));const download=await fetch(link.url,{headers:link.headers});assert.equal(download.status,200);assert.equal(await download.text(),'const greeting = "hello";\n');assert.match(download.headers.get('cache-control'),/no-store/);
  await denied(`/app-api/edu/file/get-url?fileId=${upload.fileId}`,{token:stranger},'Cross-parent file download denied');
  pass('Private attachment stored through original infra with authenticated download');
  const draft=await postMember('/submission/save',{studentId,assignmentId,content:'我的作品说明：预测输出，再运行验证。',attachments:[upload]});assert.equal(draft.status,'DRAFT');
  await denied(`/admin-api/edu/submission/get?id=${draft.id}`,{token:admin},'Private homework draft is hidden from teacher detail');
  await denied(`/admin-api/edu/file/get-url?fileId=${upload.fileId}`,{token:admin},'Private draft attachment denied even to headquarters staff');
  const submitted=await postMember('/submission/submit',{id:draft.id,revision:draft.revision,studentId,assignmentId,content:draft.content,attachments:[upload]});assert.equal(submitted.status,'SUBMITTED');
  const duplicate=await postMember('/submission/submit',{studentId,assignmentId,content:draft.content,attachments:[upload]});assert.equal(duplicate.id,submitted.id);
  const savedReview=await postAdmin('/submission/review',{id:submitted.id,revision:0,status:'DRAFT',feedback:'已完成核心功能，请补充边界测试。',score:86,requireRevision:false});
  let ownReviews=await api(`/app-api/edu/review/list?studentId=${studentId}&assignmentId=${assignmentId}`,{token:member});assert(!ownReviews[0].review);
  await postAdmin('/submission/review',{id:submitted.id,revision:savedReview.revision,status:'PUBLISHED',feedback:'已完成核心功能，并解释了测试结果。',score:86,requireRevision:false});
  ownReviews=await api(`/app-api/edu/review/list?studentId=${studentId}&assignmentId=${assignmentId}`,{token:member});assert.equal(ownReviews[0].review.status,'PUBLISHED');
  pass('Homework draft, idempotent submission and published teacher review verified');
  const reportId=await postAdmin('/growth-report/create',{enrollmentId:enrollment.id,title:'本地阶段成长记录',summary:'能够独立描述目标并记录验证过程。',strengths:'表达清楚',nextSteps:'增加边界测试'});
  await denied(`/app-api/edu/report/get?id=${reportId}&studentId=${studentId}`,{token:member},'Unpublished growth report is hidden');
  await postAdmin('/growth-report/publish',{id:reportId});assert.equal((await api(`/app-api/edu/report/get?id=${reportId}&studentId=${studentId}`,{token:member})).status,'PUBLISHED');pass('Growth report publication and owner visibility verified');
  const workId=await postMember('/work/create',{studentId,submissionId:submitted.id,title:'我的本地互动作品',description:'仅展示经过审核的简短说明。'});
  await denied('/admin-api/edu/work/publish',{token:admin,method:'POST',body:{id:workId}},'Work cannot publish before guardian consent');
  await postMember('/work/consent',{id:workId,version:1});await postAdmin('/work/moderate',{id:workId,status:'APPROVED',note:'本地验收，无个人身份信息。'});await postAdmin('/work/publish',{id:workId});
  const publicWork=await api(`/app-api/edu/work/public-get?id=${workId}`);assert.equal(publicWork.id,workId);assert(!('studentId' in publicWork));assert(publicWork.attachments.every(a=>!('fileId' in a)&&!('url' in a)));
  await postMember('/work/revoke',{id:workId});await denied(`/app-api/edu/work/public-get?id=${workId}`,{},'Guardian revocation immediately withdraws public work');
  pass('Versioned guardian consent, moderation, publication and withdrawal verified');
  report.fixtures.submissionId=submitted.id;report.fixtures.reportId=reportId;report.fixtures.workId=workId;
  report.status='PASSED';save();
}catch(error){report.status='FAILED';report.error=error.message;save();throw error;}
