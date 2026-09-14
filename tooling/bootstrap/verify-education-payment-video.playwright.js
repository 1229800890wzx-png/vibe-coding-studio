// Actual local UI checkout/payment recording. Existing original mock channel only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root = process.cwd(), require = createRequire(import.meta.url);
const cache = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
const runtime = fs.readdirSync(cache).map(n => path.join(cache,n,'node_modules/playwright')).find(p => fs.existsSync(path.join(p,'package.json')));
const { chromium } = require(runtime);
const env = Object.fromEntries(fs.readFileSync('.runtime/foundation.env','utf8').split(/\r?\n/).filter(x => x && !x.startsWith('#')).map(x => { const i=x.indexOf('='); return [x.slice(0,i),x.slice(i+1)]; }));
const db = await require(path.join(root,'.tools/node_modules/mysql2/promise')).createConnection({host:'127.0.0.1',port:13306,user:'vibe_edu',database:'vibe_edu',password:env.VIBE_DB_PASSWORD});
const origin='http://127.0.0.1:5177', apiOrigin='http://127.0.0.1:48080';
const fixturePath='.runtime/education-payment-video-fixture.json', reportPath='.runtime/education-payment-video-report.json';
const report={startedAt:new Date().toISOString(),status:'RUNNING',scope:'Actual UI clicks on isolated local TEST child/course/cart lines, original member auth and original mock payment. No production sources changed, request interception, real merchant, or external messaging.',testEnvironment:{origin,apiOrigin,existingTestFlag:'VITE_ENABLE_TEST_PAYMENT=true',memberId:10002},checks:[],pageErrors:[],videos:[],limitations:['This proves local H5 and the upstream mock channel only; real WeChat merchant payment, AppID, HTTPS and device acceptance remain pending.','Refund recording is a read-only replay of existing refunds created by original local API regression tests, not a new UI refund request.']};
let fixture=fs.existsSync(fixturePath)?JSON.parse(fs.readFileSync(fixturePath,'utf8')):{};
const save=()=>{fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');fs.writeFileSync(fixturePath,JSON.stringify(fixture,null,2)+'\n');};
const pass=(name,details={})=>{report.checks.push({name,...details});save();console.log('PASS: '+name);};
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
async function api(url,token,method='GET',body){const r=await fetch(apiOrigin+url,{method,headers:{'tenant-id':'1',terminal:'10','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});const v=await r.json();assert.equal(v.code,0,url+': '+v.msg);return v.data;}
const browser=await chromium.launch({channel:'msedge',headless:true});
let context,film;
async function login(mobile){const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true});const p=await ctx.newPage();await p.goto(origin+'/#/pages/edu/login');await p.getByText('密码登录',{exact:true}).click();await p.locator('input').nth(0).fill(mobile);await p.locator('input').nth(1).fill(env.VIBE_MEMBER_PASSWORD);await p.locator('.checkrow').click();const response=p.waitForResponse(r=>r.url().endsWith('/member/auth/login'));await p.getByText('登录 / 注册',{exact:true}).click();assert.equal((await (await response).json()).code,0);await p.waitForURL(u=>!u.hash.includes('/pages/edu/login'));const state=await ctx.storageState();await ctx.close();return state;}
async function startVideo(state){context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,storageState:state,recordVideo:{dir:path.join(root,'.runtime/payment-video-raw'),size:{width:390,height:844}}});film=await context.newPage();film.on('pageerror',e=>report.pageErrors.push(e.message));return film.video();}
async function finishVideo(video,file,scope){const raw=await video.path();await film.close();await context.close();context=null;await video.saveAs(path.join(root,file));const item={file,scope,sha256:hash(file),bytes:fs.statSync(file).size,decodedMedia:JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,avg_frame_rate','-of','json',file],{encoding:'utf8'}))};assert(item.bytes>10000);if(path.resolve(raw).startsWith(path.resolve('.runtime/payment-video-raw')+path.sep)&&hash(raw)===item.sha256)fs.unlinkSync(raw);report.videos.push(item);save();}
async function until(fn,accept){const end=Date.now()+35000;while(Date.now()<end){const v=await fn();if(accept(v))return v;await new Promise(r=>setTimeout(r,200));}throw Error('Original callback did not complete within 35 seconds');}
try{
  const admin=(await api('/admin-api/system/auth/login',null,'POST',{username:'admin',password:env.VIBE_ADMIN_PASSWORD})).accessToken;
  const member=(await api('/app-api/member/auth/login',null,'POST',{mobile:'13900000002',password:env.VIBE_MEMBER_PASSWORD})).accessToken;
  const guardian=(await api('/app-api/member/auth/login',null,'POST',{mobile:'13900000001',password:env.VIBE_MEMBER_PASSWORD})).accessToken;
  const app=(url,method,body)=>api('/app-api'+url,member,method,body),staff=(url,method,body)=>api('/admin-api'+url,admin,method,body);
  const rootCartBefore=await api('/app-api/trade/cart/list',guardian);
  assert.equal((await app('/member/user/get')).id,10002);
  const currentCart=await app('/trade/cart/list');
  const cartItems=[...(currentCart.validList||[]),...(currentCart.invalidList||[])];
  assert(cartItems.every(x=>x.studentId===fixture.studentId&&x.sku?.id===fixture.skuId),'Isolated member has unrelated cart lines; do not alter them');
  if(!fixture.courseId){
    assert.equal(cartItems.length,0);
    const key=Date.now().toString(36),name='TEST 报名流程 '+key;
    const teacher=(await staff('/edu/teacher/page?pageNo=1&pageSize=100')).list.find(x=>x.userId===1);assert(teacher);
    const [[slot]]=await db.execute('SELECT MAX(end_time) lastEnd FROM edu_session WHERE teacher_id=? AND deleted=0',[teacher.id]);
    const start=Math.max(Date.now()+60*86400000,+(slot.lastEnd||0)+86400000);
    fixture={key,memberId:10002,studentName:'TEST 录屏学员 '+key,courseName:name,cohortName:'TEST 独立报名班 '+key,capacity:3,price:1500};save();
    fixture.studentId=await app('/edu/student/create','POST',{name:fixture.studentName,birthMonth:'2016-01',grade:'本地 TEST',experience:'TEST'});save();
    fixture.courseId=await staff('/edu/course/create','POST',{code:'TEST-VIDEO-'+key,name,description:'仅本地 TEST 报名与原模拟支付录屏，不用于真实销售。',coverUrl:'http://127.0.0.1:5174/static/edu/courses/tools.jpg',ageMin:8,ageMax:16,direction:'TOOL',level:'BEGINNER',objectives:'说明问题、验证想法',outcomes:'完成一段可验证的创作',lessons:[{title:'本地报名验收课',durationMinutes:60,objectives:'验证原报名流程',materials:'TEST',assignment:'TEST'}]});save();
    await staff('/edu/course/publish','POST',{id:fixture.courseId});
    fixture.cohortId=await staff('/edu/cohort/create','POST',{courseId:fixture.courseId,name:fixture.cohortName,kind:'TRIAL',mode:'ONLINE',teacherId:teacher.id,capacity:fixture.capacity,price:fixture.price,terms:'仅本地 TEST：使用原系统模拟支付，不发生真实扣款。',refundPolicy:'按原退款审批流程；KEEP 保留学习资格，CANCEL 取消资格。',startDate:start,endDate:start+3600000});save();
    await staff('/edu/session/create','POST',{cohortId:fixture.cohortId,title:'TEST 原报名流程验收',teacherId:teacher.id,startTime:start,endTime:start+3600000,joinInfo:{instructions:'仅本地测试，不连接外部课堂。'}});
    await staff('/edu/cohort/publish','POST',{id:fixture.cohortId});
    fixture.skuId=(await app('/edu/cohort/get?id='+fixture.cohortId)).skuId;
    fixture.spuId=(await app('/edu/course/get?id='+fixture.courseId)).spuId;
    fixture.templateId=await staff('/promotion/coupon-template/create','POST',{name:'TEST 报名录屏减3.01元 '+key,description:'仅本地测试，不做外部联系。',totalCount:1,takeLimitCount:1,takeType:2,usePrice:0,productScope:2,productScopeValues:[fixture.spuId],validityType:2,fixedStartTerm:0,fixedEndTerm:7,discountType:1,discountPrice:301});save();
    await staff('/promotion/coupon/send','POST',{templateId:fixture.templateId,userIds:[10002]});
    const [[coupon]]=await db.execute('SELECT id FROM promotion_coupon WHERE template_id=? AND user_id=10002',[fixture.templateId]);fixture.couponId=coupon.id;save();
  }
  assert(!fixture.orderId,'This recording fixture already created an order; inspect evidence before any new enrollment');
  report.fixture={...fixture};save();
  pass('Dedicated original isolation member and new TEST child/course/cohort/coupon prepared; main guardian cart is untouched',{memberId:10002,studentId:fixture.studentId,cohortId:fixture.cohortId,couponId:fixture.couponId});
  const state=await login('13900000002'),video=await startVideo(state);
  const calls=[];film.on('request',r=>{const pathname=new URL(r.url()).pathname;if(['/app-api/trade/order/create','/app-api/pay/order/submit'].includes(pathname))calls.push({pathname,body:r.postDataJSON()});});
  await film.goto(origin+'/#/pages/edu/course?id='+fixture.courseId);
  await film.getByText(fixture.courseName,{exact:true}).waitFor();await film.waitForTimeout(1100);
  await film.getByText('选择适合的班期',{exact:true}).click();
  await film.getByText(fixture.cohortName,{exact:true}).waitFor();
  await film.locator('.edu-header .child').click();
  await film.locator('.student-choice').filter({hasText:fixture.studentName}).click();
  await film.getByText('当前报名孩子：'+fixture.studentName+'。加入选课袋后，孩子信息会随该课程保存。',{exact:true}).waitFor();
  await film.locator('.checkrow').click();await film.waitForTimeout(1100);
  const added=film.waitForResponse(r=>r.url().endsWith('/trade/cart/add'));await film.getByText('加入选课袋',{exact:true}).click();assert.equal((await(await added).json()).code,0);
  await film.getByText('已选 1 项',{exact:true}).waitFor();await film.waitForTimeout(1000);
  const before=film.waitForResponse(r=>r.url().includes('/trade/order/settlement'));await film.getByText('确认课程',{exact:true}).click();assert.equal((await(await before).json()).data.price.payPrice,1500);
  await film.locator('.edu-page uni-button').filter({hasText:'选择可用满减券'}).click();await film.locator('.coupon-radio').first().click();await film.waitForTimeout(500);
  const discounted=film.waitForResponse(r=>r.url().includes('/trade/order/settlement')&&r.url().includes('couponId='+fixture.couponId));await film.locator('.confirm-btn').click();const quote=await(await discounted).json();assert.equal(quote.code,0);assert.equal(quote.data.price.payPrice,1199);assert.equal(quote.data.price.couponPrice,301);
  await film.getByText('费用已从 ¥15 更新为 ¥11.99，请核对后重新确认。',{exact:true}).waitFor();
  await film.locator('textarea').fill('TEST 独立 UI 录屏；仅原本地 mock，不涉及真实商户。');await film.locator('.checkrow').click();await film.waitForTimeout(1400);
  await film.screenshot({path:'docs/screenshots/mini-enrollment-checkout.png',fullPage:true,animations:'disabled'});
  const created=film.waitForResponse(r=>r.url().endsWith('/trade/order/create'));await film.getByText('提交订单并付款',{exact:true}).click();const result=await(await created).json();assert.equal(result.code,0);fixture.orderId=result.data.id;fixture.payOrderId=result.data.payOrderId;report.fixture={...fixture};save();
  await film.getByText('模拟支付',{exact:true}).waitFor();
  const orderCall=calls.find(x=>x.pathname.endsWith('/trade/order/create'));assert.equal(orderCall.body.items.length,1);assert.equal(orderCall.body.items[0].studentId,fixture.studentId);assert.equal(orderCall.body.items[0].skuId,fixture.skuId);assert.equal(orderCall.body.couponId,fixture.couponId);assert.equal(orderCall.body.expectedPayPrice,1199);
  pass('UI selects the TEST child and cohort, reprices the original coupon and creates exactly one isolated original order',{orderId:fixture.orderId,payOrderId:fixture.payOrderId,expectedPayPrice:1199});
  await film.getByText('模拟支付',{exact:true}).click();await film.waitForTimeout(1000);
  const paidResponse=film.waitForResponse(r=>r.url().endsWith('/pay/order/submit'));await film.getByText('确认支付',{exact:true}).click();assert.equal((await(await paidResponse).json()).code,0);
  const payCall=calls.find(x=>x.pathname.endsWith('/pay/order/submit'));assert.equal(payCall.body.channelCode,'mock');assert.equal(Number(payCall.body.id),fixture.payOrderId);
  await film.getByText('付款已确认。',{exact:true}).waitFor();await film.waitForTimeout(1400);
  const paid=await until(()=>app('/trade/order/get-detail?id='+fixture.orderId+'&sync=true'),o=>o.payStatus===true&&o.items[0].enrollmentStatus==='ACTIVE');
  assert.equal(paid.items.length,1);assert.equal(paid.items[0].studentId,fixture.studentId);assert.equal(paid.payPrice,1199);
  assert.equal((await app('/edu/cohort/get?id='+fixture.cohortId)).stock,fixture.capacity-1);
  report.originalState={orderId:paid.id,orderNo:paid.no,status:paid.status,payStatus:paid.payStatus,payOrderId:fixture.payOrderId,itemId:paid.items[0].id,studentId:fixture.studentId,enrollmentStatus:paid.items[0].enrollmentStatus,payPrice:paid.payPrice,remainingStock:fixture.capacity-1};
  await film.getByText('查看报名订单',{exact:true}).click();
  await film.getByText(fixture.courseName,{exact:true}).waitFor();
  await film.locator('.card').filter({hasText:fixture.courseName}).getByText('订单详情',{exact:true}).click();
  await film.getByText('已付款',{exact:true}).waitFor();await film.waitForTimeout(1400);
  await film.screenshot({path:'docs/screenshots/mini-enrollment-paid.png',fullPage:true,animations:'disabled'});
  assert.equal(calls.filter(x=>x.pathname.endsWith('/trade/order/create')).length,1);assert.equal(calls.filter(x=>x.pathname.endsWith('/pay/order/submit')).length,1);
  pass('UI mock payment calls the original service once; original callback activates enrollment and deducts one seat',{...report.originalState});
  await finishVideo(video,'docs/screenshots/flow-enrollment-payment.webm','Actual recorded child/cohort selection → original coupon quote → UI order creation → original mock payment → paid order');
  assert.deepEqual(await api('/app-api/trade/cart/list',guardian),rootCartBefore);
  const endingCart=await app('/trade/cart/list');assert.equal([...(endingCart.validList||[]),...(endingCart.invalidList||[])].length,0);
  pass('Original primary guardian cart is byte-for-byte unchanged and the isolated member has no leftover cart line');

  // Read-only result replay from existing original API suites, never new refund writes.
  const refunds=(await api('/app-api/trade/after-sale/page?pageNo=1&pageSize=100',guardian)).list;
  const keep=refunds.find(x=>x.status===50&&x.entitlementAction==='KEEP');
  const cancel=refunds.find(x=>x.status===50&&x.entitlementAction==='CANCEL');assert(keep&&cancel);
  const refundState=await login('13900000001'),refundVideo=await startVideo(refundState);
  const refundWrites=[];film.on('request',r=>{const p=new URL(r.url()).pathname;if(r.method()!=='GET'&&/\/(trade\/after-sale|trade\/order|pay\/)/.test(p))refundWrites.push({method:r.method(),pathname:p});});
  const response=film.waitForResponse(r=>r.url().includes('/trade/after-sale/page'));await film.goto(origin+'/#/pages/edu/refunds');assert.equal((await(await response).json()).code,0);
  const keepCard=film.locator('.card').filter({has:film.getByText(keep.applyReason,{exact:true})}).filter({hasText:'保留学习资格'}).first();
  await keepCard.scrollIntoViewIfNeeded();await keepCard.getByText('退款成功',{exact:true}).waitFor();await film.waitForTimeout(1500);
  const cancelCard=film.locator('.card').filter({has:film.getByText(cancel.applyReason,{exact:true})}).filter({hasText:'取消学习资格'}).first();
  await cancelCard.scrollIntoViewIfNeeded();await cancelCard.getByText('退款成功',{exact:true}).waitFor();await film.waitForTimeout(1500);
  await film.screenshot({path:'docs/screenshots/mini-refund-results.png',fullPage:true,animations:'disabled'});
  const detail=await api('/app-api/trade/order/get-detail?id='+cancel.orderId+'&sync=true',guardian);
  const cancelledItem=detail.items.find(x=>x.id===cancel.orderItemId);assert.equal(cancelledItem.enrollmentStatus,'CANCELLED');
  await film.goto(origin+'/#/pages/edu/orders?id='+cancel.orderId);await film.getByText('学习资格已取消。',{exact:true}).first().waitFor();await film.getByText('学习资格已取消。',{exact:true}).first().scrollIntoViewIfNeeded();await film.waitForTimeout(1500);
  assert.deepEqual(refundWrites,[]);
  report.refundEvidence={source:'Existing actual local original API regression records; read-only browser replay',keep:{afterSaleId:keep.id,orderId:keep.orderId,orderItemId:keep.orderItemId,status:keep.status,refundPrice:keep.refundPrice,entitlementAction:keep.entitlementAction},cancel:{afterSaleId:cancel.id,orderId:cancel.orderId,orderItemId:cancel.orderItemId,status:cancel.status,refundPrice:cancel.refundPrice,entitlementAction:cancel.entitlementAction,enrollmentStatus:cancelledItem.enrollmentStatus}};
  pass('Read-only UI replay displays successful original KEEP and CANCEL refunds, including cancelled learning entitlement',report.refundEvidence);
  await finishVideo(refundVideo,'docs/screenshots/flow-refund-progress.webm','Read-only replay of existing original API-created mock refunds and actual entitlement state');
  assert.deepEqual(report.pageErrors,[]);report.status='PASSED';report.completedAt=new Date().toISOString();save();
}catch(error){report.status='FAILED';report.failure=error.message;report.fixture={...fixture};save();if(film&&!film.isClosed())await film.screenshot({path:'.runtime/payment-video-failure.png',fullPage:true}).catch(()=>{});throw error;}
finally{if(context)await context.close().catch(()=>{});await browser.close();await db.end();}
