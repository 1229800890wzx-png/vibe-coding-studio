/** Run existing acceptance assertions against the isolated unified restore.
 * Adapted copies and reports stay under .runtime/unified; source scripts remain untouched. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const runtime=path.join(root,'.runtime/unified');
const copies=path.join(runtime,'regressions/copies');
const reports=path.join(runtime,'regressions/reports');
const environment=JSON.parse(fs.readFileSync(path.join(runtime,'environment.json'),'utf8'));
const restore=JSON.parse(fs.readFileSync(path.join(root,'.runtime/backup-restore-report.json'),'utf8'));
assert.match(environment.database,/^vibe_edu_restore_\d+$/,'Unified regressions require an isolated restore database');
assert.equal(environment.database,restore.restoredDatabase,'Unified environment must use the verified restored database');
assert.equal(environment.apiBase,'http://127.0.0.1:48081','Unified regressions are restricted to API port 48081');

const suites={
 flow:'verify-education-flow.mjs',
 permissions:'verify-education-permissions.mjs',
 discovery:'verify-education-discovery.mjs',
 admissions:'verify-education-admissions.mjs',
 trade:'verify-education-trade.mjs'
};
const requested=process.argv.slice(2).filter(arg=>!arg.startsWith('--'));
const selected=requested.length?requested:['flow','permissions','discovery'];
assert(selected.length>0&&selected.every(name=>suites[name]),`Suites must be selected from: ${Object.keys(suites).join(', ')}`);
fs.mkdirSync(copies,{recursive:true});fs.mkdirSync(reports,{recursive:true});

function adapt(name,file){
 const source=path.join(root,'tooling/bootstrap',file);
 let code=fs.readFileSync(source,'utf8');
 code=code.replace(/const root\s*=\s*path\.resolve\(path\.dirname\(fileURLToPath\(import\.meta\.url\)\),\s*['"]\.\.\/\.\.['"]\s*\);/,"const root=process.env.VIBE_UNIFIED_ROOT; assert(path.isAbsolute(root),'VIBE_UNIFIED_ROOT must be absolute');");
 code=code.replaceAll('http://127.0.0.1:48080',environment.apiBase);
 code=code.replace(/(database\s*:\s*)['"]vibe_edu['"]/g,'$1process.env.VIBE_UNIFIED_DATABASE');
 code=code.replace(/(['"])\.runtime\/(education-[^'"/]+-report\.json)\1/g,(_match,quote,fileName)=>`${quote}.runtime/unified/regressions/reports/${fileName}${quote}`);
 assert(!code.includes('http://127.0.0.1:48080'),`${name}: adapted copy retains source API port`);
 assert(!/database\s*:\s*['"]vibe_edu['"]/.test(code),`${name}: adapted copy retains source database`);
 assert(code.includes(environment.apiBase),`${name}: adapted copy does not target unified API`);
 const destination=path.join(copies,file);fs.writeFileSync(destination,code);
 return destination;
}

const adapted=selected.map(name=>({name,file:adapt(name,suites[name])}));
const staticReport={timestamp:new Date().toISOString(),status:'PASSED',mode:'static-check',apiBase:environment.apiBase,database:environment.database,sourceDatabasePreserved:restore.sourceDatabase,suites:selected,copies:adapted.map(item=>path.relative(root,item.file).replaceAll('\\','/')),checks:['verified restore identity','rejected source API port 48080','rejected source database connection','kept adapted copies and suite reports under .runtime/unified']};
fs.writeFileSync(path.join(reports,'runner-static-check.json'),JSON.stringify(staticReport,null,2)+'\n');
if(process.argv.includes('--check')){console.log(`PASS: prepared ${selected.length} isolated regression copies for ${environment.apiBase} / ${environment.database}`);process.exit(0);}

// API rewrites alone cannot isolate payment callbacks stored in a restored DB.
// Refuse execution until prepare-unified-validation has redirected those as well.
const require=createRequire(path.join(root,'.tools/package.json'));
const localEnv=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)];}));
const db=await require('mysql2/promise').createConnection({host:'127.0.0.1',port:13306,user:'vibe_edu',password:localEnv.VIBE_DB_PASSWORD,database:environment.database});
try {
 const [apps]=await db.query('SELECT order_notify_url,refund_notify_url,transfer_notify_url FROM pay_app WHERE deleted=0');
 for(const app of apps) for(const url of Object.values(app)) if(url) assert(String(url).startsWith(environment.apiBase+'/'),'Restored payment callbacks are not isolated; run prepare-unified-validation first');
 const [[channels]]=await db.query("SELECT COUNT(*) n FROM pay_channel WHERE deleted=0 AND status=0 AND code<>'mock'");
 assert.equal(Number(channels.n),0,'Isolated regressions only allow the foundation mock payment channel');
} finally {await db.end();}
const health=await fetch(environment.apiBase+'/app-api/edu/course/page?pageNo=1&pageSize=1',{headers:{'tenant-id':'1'},signal:AbortSignal.timeout(5000)});
assert(health.ok,`Unified backend is not ready: HTTP ${health.status}`);
const execution={...staticReport,mode:'execution',status:'RUNNING',results:[]};
const save=()=>fs.writeFileSync(path.join(reports,'runner-execution.json'),JSON.stringify(execution,null,2)+'\n');
save();
for(const suite of adapted){
 const startedAt=new Date().toISOString();
 const child=spawn(process.execPath,[suite.file],{cwd:root,env:{...process.env,VIBE_UNIFIED_ROOT:root,VIBE_UNIFIED_DATABASE:environment.database},stdio:'inherit',windowsHide:true});
 const exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
 execution.results.push({suite:suite.name,startedAt,finishedAt:new Date().toISOString(),exitCode});save();
 assert.equal(exitCode,0,`${suite.name} regression failed`);
}
execution.status='PASSED';execution.finishedAt=new Date().toISOString();save();
console.log(`PASS: ${selected.join(', ')} regressions completed against isolated ${environment.database} on ${environment.apiBase}`);
