import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'.tools/package.json'));
const mysql=require('mysql2/promise');
const environment=JSON.parse(fs.readFileSync(path.join(root,'.runtime/unified/environment.json'),'utf8'));
assert.match(environment.database,/^vibe_edu_restore_\d+$/);
assert.equal(environment.apiBase,'http://127.0.0.1:48081');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)];}));
const db=await mysql.createConnection({host:'127.0.0.1',port:13306,user:'vibe_edu',password:env.VIBE_DB_PASSWORD,database:environment.database});
const report={startedAt:new Date().toISOString(),database:environment.database,checks:[],fixtures:{}};
const save=()=>fs.writeFileSync(path.join(root,'.runtime/unified/api-report.json'),JSON.stringify(report,null,2));
const pass=(name)=>{report.checks.push({name,status:'PASSED'});save();console.log('PASS '+name);};
async function raw(url,{token,method='GET',body,headers={}}={}) {
 const response=await fetch(environment.apiBase+url,{method,headers:{'tenant-id':'1','Content-Type':'application/json','X-Vibe-Client-IP':'192.0.2.20',...(token?{Authorization:'Bearer '+token}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 return response.json();
}
async function api(url,options){const result=await raw(url,options);assert.equal(result.code,0,`${url}: ${result.msg}`);return result.data;}
async function denied(url,options){const result=await raw(url,options);assert.notEqual(result.code,0,`${url} must deny`);return result;}
const key=Date.now().toString(36);
try {
 const priorFile=path.join(root,'.runtime/unified/api-report.json');
 if(fs.existsSync(priorFile)) {
   const prior=JSON.parse(fs.readFileSync(priorFile,'utf8'));
   if(prior.database===environment.database && prior.fixtures?.replayPayload) {
     const replay=await api('/app-api/edu/website-admission/create',{method:'POST',body:prior.fixtures.replayPayload});
     assert.equal(replay.receipt,prior.fixtures.receipt);
     pass('Previously persisted receipt survives a backend process restart');
   }
 }
 const admin=(await api('/admin-api/system/auth/login',{method:'POST',body:{username:'admin',password:env.VIBE_ADMIN_PASSWORD}})).accessToken;
 const staff=(url,options={})=>api('/admin-api'+url,{...options,token:admin});
 async function employee(label,roles){
   const username=`unified${label}${key}`;
   const id=await staff('/system/user/create',{method:'POST',body:{username,nickname:`TEST ${label}`,password:env.VIBE_ADMIN_PASSWORD,deptId:100,postIds:[]}});
   await staff('/system/permission/assign-user-role',{method:'POST',body:{userId:id,roleIds:roles}});
   const token=(await api('/admin-api/system/auth/login',{method:'POST',body:{username,password:env.VIBE_ADMIN_PASSWORD}})).accessToken;
   return {id,username,token};
 }
 const owner=await employee('owner',[91004]);
 const stranger=await employee('stranger',[91004]);
 const operator=await employee('operator',[91001]);
 report.fixtures.owner={id:owner.id,username:owner.username};report.fixtures.operator={id:operator.id,username:operator.username};
 const configKey='edu.admission.owner-user-id';
 const configs=await staff('/infra/config/page?pageNo=1&pageSize=100&key='+configKey);
 const ownerConfig=configs.list.find(c=>c.key===configKey);
 const configBody={category:'edu',type:2,name:'教育咨询受理人',key:configKey,value:String(owner.id),visible:false,remark:'Unified isolated validation'};
 await staff('/infra/config/'+(ownerConfig?'update':'create'),{method:ownerConfig?'PUT':'POST',body:{...configBody,...(ownerConfig?{id:ownerConfig.id}:{})}});
 const options=await api('/app-api/edu/website-admission/options');assert(options.enabled);
 const publicOfferings=await api('/app-api/edu/website-offering/list');assert.deepEqual(publicOfferings.slice(0,3).map(x=>x.slug),['start','create','grow']);
 pass('Shared website configuration preserves the three approved service directions');
 const body={slug:`test-${key}`,title:'TEST 官网介绍',description:'简'.repeat(600),outline:'纲'.repeat(2000),stage:2,image:'museum',sortOrder:999};
 const op=(url,options={})=>api('/admin-api'+url,{...options,token:operator.token});
 let row=await op('/edu/website-offering/create',{method:'POST',body});
 assert.equal(row.published,false);assert.equal(row.description.length,600);assert.equal(row.outline.length,2000);
 await denied('/admin-api/edu/website-offering/create',{token:operator.token,method:'POST',body});
 await denied('/admin-api/edu/website-offering/update',{token:operator.token,method:'PUT',body:{...body,id:row.id,revision:row.revision,slug:'mutated'}});
 const stale=row.revision;
 row=await op('/edu/website-offering/update',{method:'PUT',body:{...body,id:row.id,revision:row.revision,sortOrder:0}});
 await denied('/admin-api/edu/website-offering/update',{token:operator.token,method:'PUT',body:{...body,id:row.id,revision:stale}});
 row=await op('/edu/website-offering/publish',{method:'POST',body:{id:row.id,revision:row.revision,published:true}});
 assert.equal((await api('/app-api/edu/website-offering/list'))[0].id,row.id);
 row=await op('/edu/website-offering/publish',{method:'POST',body:{id:row.id,revision:row.revision,published:false}});
 assert(!(await api('/app-api/edu/website-offering/list')).some(x=>x.id===row.id));
 await denied('/admin-api/edu/website-offering/update',{token:owner.token,method:'PUT',body:{...body,id:row.id,revision:row.revision}});
 pass('Website operator CRUD, old field limits, sorting, publishing, revision conflicts and role separation');
 const payload={requestId:randomUUID(),contactName:'TEST 官网家长',contactType:'EMAIL',contact:`unified-${key}@example.com`,experience:'刚刚开始',interest:'AI 基础与新知',message:'TEST 仅隔离环境验证，不要外部联系',contactConsent:true,consentVersion:options.consentVersion};
 const receipts=await Promise.all(Array.from({length:20},()=>api('/app-api/edu/website-admission/create',{method:'POST',body:payload})));
 assert.equal(new Set(receipts.map(r=>r.receipt)).size,1);
 assert.deepEqual(Object.keys(receipts[0]).sort(),['receipt','status']);
 const [journal]=await db.execute('SELECT * FROM edu_website_admission_receipt WHERE request_id=?',[payload.requestId]);assert.equal(journal.length,1);
 const clueId=journal[0].crm_clue_id;report.fixtures.clueId=clueId;report.fixtures.replayPayload=payload;report.fixtures.receipt=receipts[0].receipt;
 const [[clue]]=await db.execute('SELECT * FROM crm_clue WHERE id=?',[clueId]);
 assert.equal(clue.education_member_id,null);assert.equal(clue.education_student_id,null);assert.equal(clue.email,payload.contact);assert.equal(clue.owner_user_id,owner.id);assert.equal(clue.education_origin,'WEBSITE');
 const [[{n}]]=await db.execute('SELECT COUNT(*) n FROM crm_permission WHERE biz_type=1 AND biz_id=? AND level=1 AND deleted=0',[clueId]);assert.equal(n,1);
 assert.equal((await denied('/app-api/edu/website-admission/create',{method:'POST',body:{...payload,message:'changed'}})).code,1090010002);
 pass('20 concurrent retries produce exactly one CRM clue, OWNER permission and durable receipt; changed payload conflicts');
 const view=await api('/admin-api/edu/website-admission/get?id='+clueId,{token:owner.token});assert.equal(view.message,payload.message);
 const list=await api('/admin-api/edu/website-admission/page?pageNo=1&pageSize=100',{token:owner.token});assert(list.list.some(x=>x.id===clueId));
 const otherList=await api('/admin-api/edu/website-admission/page?pageNo=1&pageSize=100',{token:stranger.token});assert(!otherList.list.some(x=>x.id===clueId));
 await denied('/admin-api/edu/website-admission/get?id='+clueId,{token:stranger.token});
 await denied('/admin-api/edu/website-admission/get?id='+clueId);
 for (const status of ['CONTACTED','CLOSED','NEW']) await api('/admin-api/edu/website-admission/update',{token:owner.token,method:'PUT',body:{id:clueId,status,note:'内'.repeat(2000)}});
 const [[updated]]=await db.execute('SELECT * FROM crm_clue WHERE id=?',[clueId]);assert.equal(updated.education_website_status,'NEW');assert.equal(updated.education_operator_note.length,2000);assert.equal(updated.education_message,payload.message);assert.equal(updated.contact_next_time,clue.contact_next_time);
 pass('Migrated inquiry details, reversible three statuses and 2000-character internal note preserve message and CRM data scopes');
 await staff('/system/user/update-status',{method:'PUT',body:{id:owner.id,status:1}});
 assert.equal((await api('/app-api/edu/website-admission/create',{method:'POST',body:payload})).receipt,receipts[0].receipt);
 assert.equal((await denied('/app-api/edu/website-admission/create',{method:'POST',body:{...payload,requestId:randomUUID()}})).code,1090010003);
 await staff('/system/user/update-status',{method:'PUT',body:{id:owner.id,status:0}});
 pass('Committed receipt still replays after owner disabled; new submissions are refused');
 assert.equal((await denied('/app-api/edu/website-admission/create',{method:'POST',headers:{'X-Vibe-Client-IP':'192.0.2.21'},body:{...payload,requestId:randomUUID(),contactConsent:false}})).code,1090010001);
 assert.equal((await denied('/app-api/edu/website-admission/create',{method:'POST',headers:{'X-Vibe-Client-IP':'192.0.2.21'},body:{...payload,requestId:randomUUID(),consentVersion:'old'}})).code,1090010001);
 await denied('/app-api/edu/website-admission/options',{headers:{'tenant-id':'0'}});
 await denied('/app-api/edu/admission/list');
 const mobile=await api('/app-api/edu/website-admission/create',{method:'POST',headers:{'X-Vibe-Client-IP':'192.0.2.21'},body:{...payload,requestId:randomUUID(),contactType:'MOBILE',contact:'13900000003'}});assert(mobile.receipt);
 pass('Email and mobile supported; missing authorization, stale version, wrong tenant and anonymous member APIs denied');
 const attempts=await Promise.all(Array.from({length:35},(_,i)=>raw('/app-api/edu/website-admission/create',{method:'POST',headers:{'X-Vibe-Client-IP':'192.0.2.22','X-Forwarded-For':`198.51.100.${i+1}`},body:{...payload,requestId:randomUUID(),consentVersion:'old',message:'vary '+i}})));
 assert(attempts.some(r=>/频繁|稍后|限流|too many/i.test(r.msg)),'changing payload/request id must not bypass rate limit');
 assert(attempts.some(r=>r.code===1090010004));
 pass('Distributed rate limit remains effective when request IDs, payloads and forwarded headers vary');
 // Allow asynchronous access logging to settle, then ensure request payload was not persisted.
 await new Promise(resolve=>setTimeout(resolve,1200));
 const [[{leaks}]]=await db.execute("SELECT COUNT(*) leaks FROM infra_api_access_log WHERE request_url LIKE '%website-admission%' AND request_params LIKE ?",['%'+payload.contact+'%']);assert.equal(leaks,0);
 pass('Website contact payload is absent from generic access-log storage');
 report.status='PASSED';save();
} catch(error){report.status='FAILED';report.error=error.message;save();throw error;} finally {await db.end();}
