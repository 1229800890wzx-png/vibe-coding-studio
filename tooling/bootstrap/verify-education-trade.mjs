// Actual local MySQL/API integration. Uses original member/admin auth and original mock pay provider.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'.tools/package.json'));
const mysql=require('mysql2/promise');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)];}));
const db=await mysql.createConnection({host:'127.0.0.1',port:13306,user:'vibe_edu',password:env.VIBE_DB_PASSWORD,database:'vibe_edu',charset:'utf8mb4'});
const evidence={startedAt:new Date().toISOString(),environment:'local original mock channel, actual MySQL8.4',checks:[]};
const base='http://127.0.0.1:48080';let admin,member;
async function request(url,{token,method='GET',body,acceptFailure=false}={}){const response=await fetch(base+url,{method,headers:{'Content-Type':'application/json','tenant-id':'1',terminal:'10',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();if(!acceptFailure&&result.code!==0)throw new Error(`${method} ${url}: ${JSON.stringify(result)}`);return acceptFailure?result:result.data;}
const app=(url,options={})=>request('/app-api'+url,{token:member,...options});
const staff=(url,options={})=>request('/admin-api'+url,{token:admin,...options});
function pass(name,detail={}){evidence.checks.push({name,...detail});console.log(`PASS: ${name}`);}
async function until(fn,check,seconds=30){const end=Date.now()+seconds*1000;while(Date.now()<end){const value=await fn();if(check(value))return value;await new Promise(r=>setTimeout(r,300));}throw new Error('Timed out waiting for persisted state');}
async function cohortStock(id){const c=await app(`/edu/cohort/get?id=${id}`);return c.stock;}
async function child(name){return app('/edu/student/create',{method:'POST',body:{name,birthMonth:`${new Date().getFullYear()-10}-01`,grade:'本地验收',experience:'TEST'}});}
async function order(cohort,children){return app('/trade/order/create',{method:'POST',body:{items:children.map(studentId=>({skuId:cohort.skuId,studentId,count:1})),deliveryType:3,pointStatus:false,expectedPayPrice:cohort.price*children.length,remark:'自动化本地教育交易验收'}});}
async function pay(o){await app('/pay/order/submit',{method:'POST',body:{id:o.payOrderId,channelCode:'mock',channelExtras:{},returnUrl:'http://127.0.0.1:5174'}});return until(()=>app(`/trade/order/get-detail?id=${o.id}&sync=true`),v=>v.payStatus===true);}
async function enrollmentFor(itemId){const [[row]]=await db.execute('SELECT * FROM edu_enrollment WHERE order_item_id=?',[itemId]);return row;}
async function refund(itemId,price,action){const id=await app('/trade/after-sale/create',{method:'POST',body:{orderItemId:itemId,way:10,refundPrice:price,entitlementAction:action,applyReason:'本地测试退款',applyDescription:'自动化交易验收',applyPicUrls:[]}});await staff(`/trade/after-sale/agree?id=${id}`,{method:'PUT'});await staff(`/trade/after-sale/refund?id=${id}`,{method:'PUT'});await until(()=>staff(`/trade/after-sale/get-detail?id=${id}`),v=>v.status===50);return id;}
try{
 admin=(await request('/admin-api/system/auth/login',{method:'POST',body:{username:'admin',password:env.VIBE_ADMIN_PASSWORD}})).accessToken;
 member=(await request('/app-api/member/auth/login',{method:'POST',body:{mobile:'13900000001',password:env.VIBE_MEMBER_PASSWORD}})).accessToken;
 const teachers=await staff('/edu/teacher/page?pageNo=1&pageSize=100');let teacher=teachers.list.find(t=>t.userId===1);
 if(!teacher){const id=await staff('/edu/teacher/create',{method:'POST',body:{userId:1,name:'本地验收教师',bio:'仅本地联调，不是招生师资资料。',status:'PUBLISHED'}});teacher={id};}
 const key=Date.now().toString(36);const courseId=await staff('/edu/course/create',{method:'POST',body:{code:`TEST-T-${key}`,name:`本地教育交易 ${key}`,description:'本地验收记录，不用于销售',coverUrl:'http://127.0.0.1:5174/static/edu/courses/tools.jpg',ageMin:8,ageMax:16,direction:'TOOL',level:'BEGINNER',objectives:'验证',outcomes:'验证',lessons:[{title:'交易验收课次',objectives:'验证教学生命周期',durationMinutes:60,materials:'测试',assignment:'测试'}]}});
 await staff('/edu/course/publish',{method:'POST',body:{id:courseId}});
 const scheduled=await staff(`/edu/session/page?teacherId=${teacher.id}&pageNo=1&pageSize=100`);const anchor=Math.max(Date.now()+45*86400000,...scheduled.list.map(s=>Number(s.endTime)+86400000));
 async function makeCohort(label,capacity,slot){const start=anchor+slot*86400000;const id=await staff('/edu/cohort/create',{method:'POST',body:{courseId,name:`TEST ${label} ${key}`,kind:'TRIAL',mode:'ONLINE',teacherId:teacher.id,capacity,price:10000,terms:'仅本地验收',refundPolicy:'测试退款规则',startDate:start,endDate:start+3600000}});await staff('/edu/session/create',{method:'POST',body:{cohortId:id,title:label,startTime:start,endTime:start+3600000,teacherId:teacher.id,joinInfo:{instructions:'本地测试课堂'}}});await staff('/edu/cohort/publish',{method:'POST',body:{id}});return app(`/edu/cohort/get?id=${id}`);}
 const source=await makeCohort('多孩子原班',3,0),target=await makeCohort('同价目标班',3,1),last=await makeCohort('最后名额',1,2);
 const a=await child(`验收A-${key}`),b=await child(`验收B-${key}`),c=await child(`验收C-${key}`),d=await child(`验收D-${key}`);
 await app('/trade/cart/add',{method:'POST',body:{skuId:source.skuId,studentId:a,count:1}});await app('/trade/cart/add',{method:'POST',body:{skuId:source.skuId,studentId:b,count:1}});
 const carts=await app('/trade/cart/list');const lines=carts.validList.filter(x=>x.sku.id===source.skuId);assert.equal(lines.length,2);assert.equal(new Set(lines.map(x=>x.studentId)).size,2);pass('Same SKU siblings stay separate original cart lines');
 const params=new URLSearchParams({deliveryType:'3',pointStatus:'false','items[0].skuId':String(source.skuId),'items[0].studentId':String(a),'items[0].count':'1','items[1].skuId':String(source.skuId),'items[1].studentId':String(b),'items[1].count':'1'});
 const quote=await app(`/trade/order/settlement?${params}`);assert.equal(quote.items.length,2);assert.equal(quote.price.payPrice,20000);pass('Original quote preserves two children and charges twice without shipping');
 const bought=await order(source,[a,b]);assert.equal(await cohortStock(source.id),1);const paid=await pay(bought);assert.equal(paid.items.length,2);assert.equal(await cohortStock(source.id),1);assert(paid.items.every(i=>i.studentId));pass('Original order deducts once; payment activates both registrations without second deduction');
 for(const item of paid.items)assert.equal((await enrollmentFor(item.id)).status,'ACTIVE');
 const rejected=await app('/trade/order/create',{method:'POST',body:{items:[{skuId:source.skuId,studentId:a,count:1}],deliveryType:3,pointStatus:false},acceptFailure:true});assert.notEqual(rejected.code,0);pass('Duplicate child enrollment rejected');
 const contenders=await Promise.allSettled([order(last,[c]),order(last,[d])]);assert.equal(contenders.filter(r=>r.status==='fulfilled').length,1);assert.equal(await cohortStock(last.id),0);pass('Concurrent last-seat purchases produce one successful original order');
 const winner=contenders.find(r=>r.status==='fulfilled').value;await app(`/trade/order/cancel?id=${winner.id}`,{method:'DELETE'});assert.equal(await cohortStock(last.id),1);pass('Original unpaid cancellation releases the education seat');
 const itemA=paid.items.find(i=>i.studentId===a),itemB=paid.items.find(i=>i.studentId===b);await refund(itemA.id,1000,'KEEP');assert.equal((await enrollmentFor(itemA.id)).status,'ACTIVE');assert.equal(await cohortStock(source.id),1);await refund(itemA.id,1000,'KEEP');pass('Repeated partial KEEP refunds preserve teaching entitlement and seat');
 const excessive=await app('/trade/after-sale/create',{method:'POST',body:{orderItemId:itemA.id,way:10,refundPrice:8001,entitlementAction:'KEEP',applyReason:'本地测试退款',applyPicUrls:[]},acceptFailure:true});assert.notEqual(excessive.code,0);pass('Cumulative refund cap enforced in the original after-sale flow');
 const enrollment=await enrollmentFor(itemA.id);const transfer=await app('/edu/transfer/create',{method:'POST',body:{enrollmentId:enrollment.id,targetCohortId:target.id,reason:'验收同价转班'}});await staff('/edu/request/approve',{method:'POST',body:{id:transfer,type:'TRANSFER',reason:'同价、同版本、开课前'}});assert.equal(await cohortStock(source.id),2);assert.equal(await cohortStock(target.id),2);pass('Transfer moves enrollment and original SKU inventory while preserving original order');
 await refund(itemA.id,8000,'CANCEL');assert.equal((await enrollmentFor(itemA.id)).status,'CANCELLED');assert.equal(await cohortStock(source.id),2);assert.equal(await cohortStock(target.id),3);assert.equal((await enrollmentFor(itemB.id)).status,'ACTIVE');pass('CANCEL refund after transfer releases current cohort only; sibling stays enrolled');
 evidence.fixtures={courseId,source:source.id,target:target.id,last:last.id,students:[a,b,c,d],orderId:bought.id};evidence.completedAt=new Date().toISOString();
}catch(error){evidence.failure=error.message;throw error;}finally{fs.writeFileSync(path.join(root,'.runtime/education-trade-report.json'),JSON.stringify(evidence,null,2)+'\n');await db.end();}
