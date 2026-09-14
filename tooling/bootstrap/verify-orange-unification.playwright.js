/** Orange PR frontend acceptance against the isolated unified platform.
 * Only the historical 4186 baseline receives a course fixture for visual parity.
 * Every integrated-site/admin response is real; offline/latency tests use Chromium networking.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(import.meta.url);
const cache=path.join(process.env.LOCALAPPDATA,'npm-cache','_npx');
const modulePath=fs.readdirSync(cache).map(name=>path.join(cache,name,'node_modules/playwright')).find(dir=>fs.existsSync(path.join(dir,'package.json')));
assert(modulePath,'Cached Playwright must exist');
const {chromium}=require(modulePath);
const sharp=require(path.join(root,'node_modules/sharp'));
const runtime=path.join(root,'.runtime/unified');
const output=path.join(runtime,'orange-browser');fs.mkdirSync(output,{recursive:true});
const reportPath=path.join(runtime,'orange-browser-report.json');
const environment=JSON.parse(fs.readFileSync(path.join(runtime,'environment.json'),'utf8'));
assert.match(environment.database,/^vibe_edu_restore_\d+$/);assert.equal(environment.apiBase,'http://127.0.0.1:48081');
const site='http://127.0.0.1:4175',baseline='http://127.0.0.1:4186',adminBase='http://127.0.0.1:49091';
const report=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')):{startedAt:new Date().toISOString(),checks:[],screenshots:[]};
if(report.error)report.previousErrors=[...(report.previousErrors||[]),{error:report.error,updatedAt:report.updatedAt}];
report.pageErrors=[];report.networkErrors=[];report.status='RUNNING';delete report.error;
report.scope={database:environment.database,integratedSite:site,admin:adminBase,api:environment.apiBase,baseline,visualFixture:'Only 4186 /app-api/education/courses is supplied the real unified offering list with id=slug; baseline fixture demonstrates layout parity, not business correctness.',integratedApiMocked:false,original48080Accessed:false};
const save=()=>{report.updatedAt=new Date().toISOString();fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');};
const result=(name,status,details={})=>{report.checks=report.checks.filter(c=>c.name!==name);report.checks.push({name,status,...details});save();console.log(`${status} ${name}`);};
const pass=(name,details)=>result(name,'PASSED',details);
const browser=await chromium.launch({channel:'msedge',headless:true});
async function pageFor(viewport){
 const page=await browser.newPage({viewport,reducedMotion:'reduce',deviceScaleFactor:1});
 page.on('pageerror',error=>report.pageErrors.push({url:page.url(),message:error.message}));
 page.on('response',response=>{if(response.status()>=400)report.networkErrors.push({url:response.url(),status:response.status()});});
 return page;
}
async function settle(page){
 await page.waitForLoadState('networkidle');
 await page.evaluate(async()=>{await document.fonts.ready;for(let y=0;y<document.body.scrollHeight;y+=650){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}window.scrollTo(0,0);});
 await page.waitForLoadState('networkidle');await page.waitForTimeout(100);
 const broken=await page.locator('img').evaluateAll(images=>images.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src')));
 assert.deepEqual(broken,[],'All page images must load');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 assert.equal(overflow,false,'Page must not overflow horizontally');
}
async function shot(page,name){const file=path.join(output,name+'.png');await page.screenshot({path:file,fullPage:true,animations:'disabled'});const relative=path.relative(root,file).replaceAll('\\','/');report.screenshots.push(relative);save();return file;}
async function compare(a,b){
 const left=await sharp(a).ensureAlpha().raw().toBuffer({resolveWithObject:true}),right=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(left.info.width!==right.info.width||left.info.height!==right.info.height)return{sameSize:false,baseline:left.info,integrated:right.info};
 let changedPixels=0,maxDifference=0;
 for(let i=0;i<left.data.length;i+=4){let delta=0;for(let c=0;c<3;c++)delta=Math.max(delta,Math.abs(left.data[i+c]-right.data[i+c]));if(delta>2)changedPixels++;maxDifference=Math.max(maxDifference,delta);}
 return{sameSize:true,width:left.info.width,height:left.info.height,changedPixels,changedFraction:changedPixels/(left.info.width*left.info.height),maxDifference};
}
async function expectApi(promise){const response=await promise;const body=await response.json();assert.equal(body.code,0,`${new URL(response.url()).pathname}: ${body.msg}`);return{data:body.data,sent:response.request().postDataJSON()};}
async function visuals(){
 const response=await fetch(site+'/app-api/edu/website-offering/list');const api=await response.json();assert.equal(api.code,0);assert(api.data.some(r=>r.slug==='start'));
 const courses=api.data.map(row=>({...row,id:row.slug,offeringId:row.id}));
 report.visualCourseSnapshot=courses;save();
 for(const[size,viewport]of[['desktop',{width:1365,height:900}],['mobile',{width:390,height:844}]]){
  for(const route of['/','/courses','/courses/start','/method','/mentors','/projects']){
   const old=await pageFor(viewport),current=await pageFor(viewport);
   try{
    await old.route('**/app-api/education/courses',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({code:0,data:courses,msg:''})}));
    await Promise.all([old.goto(baseline+route),current.goto(site+route)]);
    await Promise.all([settle(old),settle(current)]);
    const label=(route==='/'?'home':route.slice(1).replaceAll('/','-'));
    const files=await Promise.all([shot(old,`${size}-${label}-friend`),shot(current,`${size}-${label}-unified`)]);
    const pixels=await compare(...files);const oldText=await old.locator('main').innerText(),currentText=await current.locator('main').innerText();
    const sameText=oldText===currentText;
    const okay=pixels.sameSize&&pixels.changedFraction<=0.001&&sameText;
    result(`Visual ${size} ${route}`,okay?'PASSED':'FAILED',{pixels,sameText,...(!sameText?{baselineText:oldText,integratedText:currentText}:{})});
   }finally{await old.close();await current.close();}
  }
 }
}
async function liveFlows(){
 const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1)];}));
 const fixtures=JSON.parse(fs.readFileSync(path.join(runtime,'api-report.json'),'utf8')).fixtures;
 const page=await pageFor({width:1365,height:900}),operator=await pageFor({width:1440,height:1000}),owner=await pageFor({width:1440,height:1000});
 const key=Date.now().toString(36);
 async function login(p,username){
  await p.goto(adminBase+'/login');
  await p.getByRole('textbox',{name:'请输入租户名称',exact:true}).fill('VIBE CODING');
  await p.getByRole('textbox',{name:'请输入用户名',exact:true}).fill(username);
  await p.getByRole('textbox',{name:'请输入密码',exact:true}).fill(env.VIBE_ADMIN_PASSWORD);
  const response=p.waitForResponse(r=>r.url().endsWith('/system/auth/login')&&r.request().method()==='POST');
  await p.getByRole('button',{name:'登录',exact:true}).click();await expectApi(response);
  await p.waitForURL(url=>!url.pathname.includes('/login'));await p.goto(adminBase+'/edu/website');
  await p.getByRole('tab',{name:'课程管理',exact:true}).waitFor();
 }
 try{
  await page.goto(site+'/');await settle(page);
  const expected=report.visualCourseSnapshot||((await(await fetch(site+'/app-api/edu/website-offering/list')).json()).data.map(r=>({...r,id:r.slug})));
  const finder=page.locator('#course-finder');
  for(const[stage,label]of[[1,'初次接触'],[2,'动手创作'],[3,'持续进阶']]){await finder.getByRole('button',{name:label,exact:true}).click();assert.equal(await finder.locator('.edu-course').count(),expected.filter(c=>c.stage===stage).length);}
  await finder.getByRole('button',{name:'全部课程',exact:true}).click();
  await finder.getByRole('textbox',{name:'搜索课程'}).fill('不存在的课程-'+key);
  await finder.getByRole('heading',{name:'暂未找到匹配课程',exact:true}).waitFor();
  await finder.getByRole('button',{name:'清除筛选',exact:true}).click();assert.equal(await finder.locator('.edu-course').count(),expected.length);
  await finder.getByRole('textbox',{name:'搜索课程'}).fill('AI 项目');assert.equal(await finder.locator('.edu-course').count(),1);
  await finder.getByRole('link',{name:'了解课程内容',exact:true}).click();await page.waitForURL('**/courses/create');
  await page.getByRole('heading',{name:'课程内容',exact:true}).waitFor();
  pass('Real offering list preserves stage filters, text search, empty state, reset and slug detail links');

  for(const viewport of[{width:1365,height:900},{width:390,height:844}]){
   await page.setViewportSize(viewport);await page.goto(site+'/courses/start');await settle(page);
   await page.getByRole('heading',{name:'创意启蒙',exact:true}).waitFor();await page.reload();await settle(page);
   await page.getByRole('heading',{name:'创意启蒙',exact:true}).waitFor();
  }
  pass('Desktop and mobile /courses/start loads and refreshes against actual published data');
  await page.setViewportSize({width:1365,height:900});
  await login(operator,fixtures.operator.username);
  let row=operator.getByRole('row').filter({hasText:'创意启蒙'});await row.waitFor();
  let withdrawn=false;
  try{
   let change=operator.waitForResponse(r=>r.url().includes('/edu/website-offering/publish')&&r.request().method()==='POST');
   await row.getByRole('button',{name:'撤下',exact:true}).click();const hidden=await expectApi(change);assert.equal(hidden.data.published,false);withdrawn=true;
   await page.reload();await page.getByText('该课程暂未发布或已下架。',{exact:true}).waitFor();
   await shot(page,'withdrawn-course-detail');
   pass('Real admin withdrawal removes a published slug from the public detail page');
  }finally{
   if(withdrawn){row=operator.getByRole('row').filter({hasText:'创意启蒙'});const restored=operator.waitForResponse(r=>r.url().includes('/edu/website-offering/publish')&&r.request().method()==='POST');await row.getByRole('button',{name:'发布',exact:true}).click();assert.equal((await expectApi(restored)).data.published,true);}
  }
  await page.reload();await page.getByRole('heading',{name:'创意启蒙',exact:true}).waitFor();
  pass('Temporarily withdrawn fixture was republished and its detail restored');

  await page.goto(site+'/');await settle(page);
  const openInquiry=page.getByRole('button',{name:'咨询课程',exact:true}).first();await openInquiry.waitFor();
  const [optionsResponse]=await Promise.all([page.waitForResponse(r=>r.url().includes('/edu/website-admission/options')),openInquiry.click()]);
  const opts=await expectApi(Promise.resolve(optionsResponse));assert.equal(opts.data.enabled,true);
  const dialog=page.getByRole('dialog');const submit=dialog.getByRole('button',{name:'提交课程咨询',exact:true});
  const contactName=`TEST 橙色前端 ${key}`,contact=`orange-${key}@example.com`,message=`TEST 橙色留言 ${key}，仅隔离验收请勿外部联系。`;
  await dialog.locator('input[name="name"]').fill(contactName);await dialog.locator('input[name="contact"]').fill(contact);
  await dialog.locator('select[name="experience"]').selectOption('接触过 AI 创作');await dialog.locator('select[name="interest"]').selectOption('AI 项目创作');
  await dialog.locator('textarea[name="message"]').fill(message);
  const submissions=[];page.on('request',r=>{if(r.url().includes('/edu/website-admission/create')&&r.method()==='POST')submissions.push(r.postDataJSON());});
  await submit.click();assert.equal(await dialog.locator('input[name="consent"]').evaluate(e=>e.validity.valid),false);assert.equal(submissions.length,0);assert.equal(await dialog.getByRole('heading',{name:'已提交至课程咨询后台',exact:true}).count(),0);
  await dialog.locator('input[name="consent"]').check();
  pass('Explicit contact consent blocks submission until the existing checkbox is checked');
  const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  for(let n=0;n<2;n++){const failed=page.waitForRequest(r=>r.url().includes('/edu/website-admission/create'));await submit.click();await failed;await dialog.getByRole('alert').waitFor();assert.equal(await dialog.getByRole('heading',{name:'已提交至课程咨询后台',exact:true}).count(),0);}
  assert.equal(submissions.length,2);assert.equal(submissions[0].requestId,submissions[1].requestId);
  const changedMessage=message+' 已确认新的咨询问题';await dialog.locator('textarea[name="message"]').fill(changedMessage);
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:700,downloadThroughput:1000000,uploadThroughput:1000000});
  const created=page.waitForResponse(r=>r.url().includes('/edu/website-admission/create')&&r.request().method()==='POST');
  await submit.click();
  for(const field of['input[name="name"]','input[name="contact"]','select[name="experience"]','select[name="interest"]','textarea[name="message"]','input[name="consent"]'])assert(await dialog.locator(field).isDisabled(),`${field} must lock while saving`);
  assert.equal(await dialog.getByRole('heading',{name:'已提交至课程咨询后台',exact:true}).count(),0);
  const accepted=await expectApi(created);assert.equal(accepted.data.status,'ACCEPTED');assert(accepted.data.receipt);
  assert.notEqual(accepted.sent.requestId,submissions[0].requestId);assert.equal(accepted.sent.contactType,'EMAIL');assert.equal(accepted.sent.contactConsent,true);assert.equal(accepted.sent.contact,contact);assert.equal(accepted.sent.message,changedMessage);assert.equal(accepted.sent.consentVersion,opts.data.consentVersion);
  await dialog.getByRole('heading',{name:'已提交至课程咨询后台',exact:true}).waitFor();
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await shot(page,'real-inquiry-success');
  report.liveFixture={contactName,contact,message:changedMessage,receipt:accepted.data.receipt,requestId:accepted.sent.requestId,failedRetryRequestId:submissions[0].requestId};save();
  pass('Real browser network failures retain retry identity; edited payload gets a new identity; six controls lock and success waits for actual server receipt');

  await login(owner,fixtures.owner.username);await owner.getByRole('tab',{name:'咨询跟进',exact:true}).click();
  const inquiry=owner.getByRole('row').filter({hasText:contactName});await inquiry.waitFor();
  const read=owner.waitForResponse(r=>r.url().includes('/edu/website-admission/get?'));await inquiry.getByRole('button',{name:'查看与跟进',exact:true}).click();
  const actual=(await expectApi(read)).data;assert.equal(actual.contactName,contactName);assert.equal(actual.email,contact);assert.equal(actual.message,changedMessage);
  const detail=owner.getByRole('dialog');const note=`TEST 橙色统一后台跟进 ${key}，未向外部发送消息。`;
  await detail.getByLabel('内部备注',{exact:true}).fill(note);const update=owner.waitForResponse(r=>r.url().includes('/edu/website-admission/update')&&r.request().method()==='PUT');
  await detail.getByRole('button',{name:'保存跟进',exact:true}).click();await expectApi(update);
  const reread=owner.waitForResponse(r=>r.url().includes('/edu/website-admission/get?'));await inquiry.getByRole('button',{name:'查看与跟进',exact:true}).click();
  const persisted=(await expectApi(reread)).data;assert.equal(persisted.note,note);assert.equal(persisted.message,changedMessage);
  report.liveFixture.clueId=actual.id;report.liveFixture.note=note;save();await shot(owner,'real-owner-inquiry-note');
  pass('Original owner login reads the newly submitted CRM inquiry and persists internal notes through the unified admin');
 }finally{await page.close();await operator.close();await owner.close();}
}
try{
 if(!process.argv.includes('--flows-only'))await visuals();
 if(!process.argv.includes('--visual-only'))await liveFlows();
 report.screenshots=[...new Set(report.screenshots)];
 report.status=report.checks.some(c=>c.status==='FAILED')||report.pageErrors.length||report.networkErrors.length?'FAILED':process.argv.includes('--visual-only')?'VISUAL_PASSED':'PASSED';
 if(report.status==='FAILED')process.exitCode=1;
 save();
}catch(error){
 report.status='FAILED';report.error=error.stack;
 report.failurePages=[];
 for(const p of browser.contexts().flatMap(c=>c.pages()))try{const name=`failure-${Date.now()}-${report.failurePages.length}`;report.failurePages.push({url:p.url(),alerts:await p.getByRole('alert').allTextContents(),screenshot:path.relative(root,await shot(p,name)).replaceAll('\\','/')});}catch{}
 save();console.error(error.stack);process.exitCode=1;
}finally{await browser.close();}
