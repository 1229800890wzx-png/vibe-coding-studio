/** Original infra_config integration, public whitelist and two-editor conflict acceptance. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(s=>s.split('=')));
const base='http://127.0.0.1:48080';
const report={timestamp:new Date().toISOString(),checks:[]};
const save=()=>fs.writeFileSync(path.join(root,'.runtime/education-brand-report.json'),JSON.stringify(report,null,2)+'\n');
function pass(name){report.checks.push({name});save();console.log('PASS: '+name);}
async function result(url,token,body){return(await fetch(base+url,{method:body?'POST':'GET',headers:{'tenant-id':'1','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})})).json();}
async function api(...args){const r=await result(...args);assert.equal(r.code,0,`${args[0]}: ${r.msg}`);return r.data;}
let admin, original, changed=false;
try {
  admin=(await api('/admin-api/system/auth/login',null,{username:'admin',password:env.VIBE_ADMIN_PASSWORD})).accessToken;
  const member=(await api('/app-api/member/auth/login',null,{mobile:'13900000001',password:env.VIBE_MEMBER_PASSWORD})).accessToken;
  original=await api('/admin-api/edu/settings/get',admin);
  assert(original.revision&&original.values.brandName);
  for(const token of [undefined,member])assert.notEqual((await result('/admin-api/edu/settings/get',token)).code,0);
  pass('Brand operator endpoint inherits original staff authentication and permissions');
  const invalid=await result('/admin-api/edu/settings/save',admin,{revision:original.revision,values:{'pay.mock-enabled':'true'}});assert.notEqual(invalid.code,0);
  for(const [key,value] of [['logoUrl','javascript:alert(1)'],['supportPhone','invalid phone']])assert.notEqual((await result('/admin-api/edu/settings/save',admin,{revision:original.revision,values:{[key]:value}})).code,0);
  pass('Fixed original config key whitelist rejects unrelated keys and unsafe display values');
  const tag=Date.now();
  const attempts=await Promise.all(['A','B'].map(s=>result('/admin-api/edu/settings/save',admin,{revision:original.revision,values:{brandName:`TEST品牌${s}${tag}`,heroTitle:`TEST首页${s}${tag}`}})));
  changed=attempts.some(x=>x.code===0);assert.equal(attempts.filter(x=>x.code===0).length,1);assert.equal(attempts.filter(x=>x.code!==0).length,1);
  const stored=await api('/admin-api/edu/settings/get',admin);assert.notEqual(stored.revision,original.revision);
  const publicView=await api('/app-api/edu/config/get');assert.equal(publicView.brandName,stored.values.brandName);assert.equal(publicView.heroTitle,stored.values.heroTitle);
  assert.deepEqual(Object.keys(publicView).sort(),Object.keys(original.values).sort());
  pass('Two editors cannot silently overwrite: exactly one revision wins and public branding matches persisted values');
  const configs=await api('/admin-api/infra/config/page?pageNo=1&pageSize=100&name='+encodeURIComponent('品牌展示'),admin);
  assert(configs.list.some(x=>x.key==='edu.brand.brandName'&&x.value===stored.values.brandName));
  pass('Brand edits persist in original infra_config and remain visible through original config administration');
  report.status='PASSED';
} catch(error) { report.status='FAILED';report.error=error.message;throw error; }
finally {
  if(changed&&original&&admin){
    const current=await api('/admin-api/edu/settings/get',admin);
    await api('/admin-api/edu/settings/save',admin,{revision:current.revision,values:original.values});
    assert.deepEqual((await api('/admin-api/edu/settings/get',admin)).values,original.values);
    report.restoredOriginalValues=true;
  }
  save();
}
