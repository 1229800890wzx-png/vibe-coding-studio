// Registers through original JobService API so Quartz and infra_job stay synchronized.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(s=>s.trim().split('=')));
let token;
async function api(url,method='GET',body){const r=await fetch('http://127.0.0.1:48080'+url,{method,headers:{'tenant-id':'1','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})}).then(r=>r.json());if(r.code!==0)throw Error(`${url}: ${r.code} ${r.msg}`);return r.data;}
token=(await api('/admin-api/system/auth/login','POST',{username:'admin',password:env.VIBE_ADMIN_PASSWORD})).accessToken;
const definitions=[
  {name:'教育订单占位与迟到支付恢复',handlerName:'eduTradeMaintenanceJob',cronExpression:'0 * * * * ?'},
  {name:'原支付通知重试',handlerName:'payNotifyJob',cronExpression:'0/5 * * * * ?'},
  {name:'原退款状态同步',handlerName:'payRefundSyncJob',cronExpression:'0 * * * * ?'},
  {name:'原支付订单状态同步',handlerName:'payOrderSyncJob',cronExpression:'0 * * * * ?'},
];
const executions=[];
for(const definition of definitions){
const job={...definition,handlerParam:'',retryCount:3,retryInterval:1000,monitorTimeout:30000};
const existing=await api(`/admin-api/infra/job/page?pageNo=1&pageSize=100&handlerName=${job.handlerName}`);
let id=existing.list.find(j=>j.handlerName===job.handlerName)?.id;
if(!id)id=await api('/admin-api/infra/job/create','POST',job);
const previousLogs=await api(`/admin-api/infra/job-log/page?pageNo=1&pageSize=10&jobId=${id}`);
const previousMaxId=Math.max(0,...previousLogs.list.map(x=>x.id));
await api(`/admin-api/infra/job/trigger?id=${id}`,'PUT');
let log;
for(let i=0;i<60;i++){
  const page=await api(`/admin-api/infra/job-log/page?pageNo=1&pageSize=10&jobId=${id}`);
  log=page.list.find(x=>x.endTime&&x.id>previousMaxId);
  if(log)break;
  await new Promise(resolve=>setTimeout(resolve,250));
}
assert(log,'Original Quartz execution must produce an infra job log');
assert.equal(log.status,1,`Original Quartz job failed: ${log.result}`);
executions.push({jobId:id,handlerName:job.handlerName,cronExpression:job.cronExpression,logId:log.id,status:log.status,result:log.result});
console.log(`PASS: original Quartz job ${id} (${job.handlerName}) registered and executed successfully (infra_job_log ${log.id}).`);
}
fs.writeFileSync(path.join(root,'.runtime/job-registration-report.json'),JSON.stringify({...executions[0],timestamp:new Date().toISOString(),jobs:executions},null,2)+'\n');
