// Advances only local synthetic fixture clocks to exercise the original persistent Quartz/payment job.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');const require=createRequire(path.join(root,'.tools/package.json'));
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)];}));
const db=await require('mysql2/promise').createConnection({host:'127.0.0.1',port:13306,user:'vibe_edu',password:env.VIBE_DB_PASSWORD,database:'vibe_edu'});
const fixture=JSON.parse(fs.readFileSync(path.join(root,'.runtime/education-trade-report.json'),'utf8')).fixtures;
const report={environment:'actual local MySQL, original mock pay and Quartz',checks:[]};let admin,member;
async function api(path,{method='GET',token,body,failure=false}={}){const r=await fetch('http://127.0.0.1:48080'+path,{method,headers:{'Content-Type':'application/json','tenant-id':'1',terminal:'10',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})}).then(r=>r.json());if(!failure&&r.code!==0)throw new Error(`${path}: ${JSON.stringify(r)}`);return failure?r:r.data;}
const app=(p,o={})=>api('/app-api'+p,{token:member,...o}),staff=(p,o={})=>api('/admin-api'+p,{token:admin,...o});
function pass(check,details){report.checks.push({check,details});console.log('PASS: '+check);}
async function poll(fn,test){for(let i=0;i<100;i++){const v=await fn();if(test(v))return v;await new Promise(r=>setTimeout(r,300));}throw new Error('Timed out waiting for original job/callback');}
try{
 admin=(await api('/admin-api/system/auth/login',{method:'POST',body:{username:'admin',password:env.VIBE_ADMIN_PASSWORD}})).accessToken;
 member=(await api('/app-api/member/auth/login',{method:'POST',body:{mobile:'13900000001',password:env.VIBE_MEMBER_PASSWORD}})).accessToken;
 const c=await app(`/edu/cohort/get?id=${fixture.last}`);const child=await app('/edu/student/create',{method:'POST',body:{name:'本地到期验收'+Date.now(),birthMonth:`${new Date().getFullYear()-10}-01`,grade:'TEST',experience:'TEST'}});
 const order=await app('/trade/order/create',{method:'POST',body:{items:[{skuId:c.skuId,studentId:child,count:1}],pointStatus:false,deliveryType:3,expectedPayPrice:c.price}});
 assert.equal((await app(`/edu/cohort/get?id=${c.id}`)).stock,c.stock-1);
 await db.execute('UPDATE pay_order SET expire_time=DATE_SUB(NOW(),INTERVAL 1 MINUTE) WHERE id=?',[order.payOrderId]);
 await db.execute('UPDATE edu_seat_hold h JOIN trade_order_item i ON i.id=h.order_item_id SET h.expires_at=DATE_SUB(NOW(),INTERVAL 1 MINUTE) WHERE i.order_id=?',[order.id]);
 const [[job]]=await db.query("SELECT id FROM infra_job WHERE handler_name='eduTradeMaintenanceJob' AND deleted=b'0'");assert(job);
 await staff(`/infra/job/trigger?id=${job.id}`,{method:'PUT'});
 const expired=await poll(async()=>{const [[v]]=await db.execute('SELECT e.status,p.status payStatus,o.status orderStatus FROM edu_enrollment e JOIN trade_order_item i ON i.id=e.order_item_id JOIN trade_order o ON o.id=i.order_id JOIN pay_order p ON p.id=o.pay_order_id WHERE o.id=?',[order.id]);return v;},v=>v.status==='EXPIRED');
 assert.equal(expired.payStatus,30);assert.equal(expired.orderStatus,40);assert.equal((await app(`/edu/cohort/get?id=${c.id}`)).stock,c.stock);pass('Expired original pay order closes before Quartz releases education inventory',{orderId:order.id,jobId:job.id});
 const original=await app(`/trade/order/get-detail?id=${fixture.orderId}`);const item=original.items.find(i=>i.studentId===fixture.students[1]);assert(item);
 const input={orderItemId:item.id,way:10,refundPrice:500,entitlementAction:'KEEP',applyReason:'本地测试退款',applyPicUrls:[]};
 const parallel=await Promise.all([app('/trade/after-sale/create',{method:'POST',body:input,failure:true}),app('/trade/after-sale/create',{method:'POST',body:input,failure:true})]);report.concurrentResults=parallel.map(r=>({code:r.code,afterSaleId:r.code===0?r.data:undefined,message:r.code!==0?r.msg:undefined}));assert.equal(parallel.filter(x=>x.code===0).length,1);pass('Concurrent original after-sale applications serialize one in-flight refund');
 const [[enrolled]]=await db.execute('SELECT id FROM edu_enrollment WHERE order_item_id=?',[item.id]);
 const blocked=await app('/edu/transfer/create',{method:'POST',body:{enrollmentId:enrolled.id,targetCohortId:fixture.target,reason:'处理中禁止转班验收'},failure:true});assert.notEqual(blocked.code,0);pass('In-flight refund blocks transfer under shared enrollment state');
 const refundId=parallel.find(x=>x.code===0).data;await staff(`/trade/after-sale/agree?id=${refundId}`,{method:'PUT'});await staff(`/trade/after-sale/refund?id=${refundId}`,{method:'PUT'});await poll(()=>staff(`/trade/after-sale/get-detail?id=${refundId}`),v=>v.status===50);
 report.status='PASSED';report.completedAt=new Date().toISOString();
}catch(e){report.failure=e.message;throw e;}finally{fs.writeFileSync(path.join(root,'.runtime/education-recovery-report.json'),JSON.stringify(report,null,2)+'\n');await db.end();}
