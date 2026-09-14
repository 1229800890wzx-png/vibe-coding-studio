/** Snapshot before restart; verify after restart. No real orders are altered by migration probes. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'.tools/package.json'));
const mysql=require('mysql2/promise');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(s=>s.trim().split('=')));
const c=await mysql.createConnection({host:'127.0.0.1',port:13306,user:'vibe_edu',password:env.VIBE_DB_PASSWORD,database:'vibe_edu',multipleStatements:true});
const target=path.join(root,'.runtime/runtime-persistence-report.json');
try{
  const [[job]]=await c.query("SELECT id,handler_name handlerName,cron_expression cronExpression,status FROM infra_job WHERE handler_name='eduTradeMaintenanceJob' AND deleted=b'0'");
  assert(job,'Original scheduler job must already be registered');
  const [[{jobCount}]]=await c.query("SELECT COUNT(*) jobCount FROM QRTZ_JOB_DETAILS WHERE SCHED_NAME='vibeEduScheduler'");assert(jobCount>0);
  const [[{triggerCount}]]=await c.query("SELECT COUNT(*) triggerCount FROM QRTZ_CRON_TRIGGERS WHERE SCHED_NAME='vibeEduScheduler'");assert(triggerCount>0);
  if(process.argv.includes('--before')){
    fs.writeFileSync(target,JSON.stringify({before:{timestamp:new Date().toISOString(),job,jobCount,triggerCount}},null,2)+'\n');
    console.log(`Saved pre-restart original Quartz job ${job.id}.`);
  }else{
    const report=JSON.parse(fs.readFileSync(target,'utf8'));assert.equal(job.id,report.before.job.id);assert.equal(jobCount,report.before.jobCount);assert.equal(triggerCount,report.before.triggerCount);
    // Run the exact reconciliation on an isolated temporary copy with a deliberately stale NULL.
    await c.query('CREATE TEMPORARY TABLE vibe_refund_default_probe LIKE trade_order');
    await c.query('ALTER TABLE vibe_refund_default_probe MODIFY refund_point int NULL');
    await c.query('INSERT INTO vibe_refund_default_probe(id,refund_point) VALUES(1,NULL)');
    await c.query(fs.readFileSync(path.join(root,'infra/database/21-public-model-reconciliations.sql'),'utf8').replaceAll('trade_order','vibe_refund_default_probe'));
    await c.query('INSERT INTO vibe_refund_default_probe(id) VALUES(2)');
    const [probe]=await c.query('SELECT id,refund_point refundPoint FROM vibe_refund_default_probe ORDER BY id');assert.deepEqual(probe,[{id:1,refundPoint:0},{id:2,refundPoint:0}]);
    const [[definition]]=await c.query("SELECT COLUMN_DEFAULT defaultValue,IS_NULLABLE nullable FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='trade_order' AND column_name='refund_point'");assert.equal(definition.defaultValue,'0');assert.equal(definition.nullable,'NO');
    const [[{nullCount}]]=await c.query('SELECT COUNT(*) nullCount FROM trade_order WHERE refund_point IS NULL');assert.equal(nullCount,0);
    const [tenants]=await c.query("SELECT id,name FROM system_tenant WHERE status=0 AND deleted=b'0'");assert.deepEqual(tenants,[{id:1,name:'VIBE CODING'}]);
    const [menus]=await c.query("SELECT path FROM system_menu WHERE parent_id=0 AND visible=b'1' AND deleted=b'0'");assert(menus.every(m=>['/system','/infra','/member','/pay','/mall','/product','/trade','/promotion','/statistics','/edu'].includes(m.path)));
    execFileSync(process.execPath,[path.join(root,'tooling/bootstrap/register-jobs.mjs')],{cwd:root,stdio:'inherit'});
    const execution=JSON.parse(fs.readFileSync(path.join(root,'.runtime/job-registration-report.json'),'utf8'));assert.equal(execution.jobId,job.id);assert.equal(execution.status,1);
    report.after={timestamp:new Date().toISOString(),job,jobCount,triggerCount,execution,refundPoint:{definition,legacyNullBackfilled:probe[0].refundPoint===0,newRowDefault:probe[1].refundPoint},activeTenants:tenants,visibleRootMenus:menus};report.status='PASSED';fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
    console.log('PASS: Quartz identity/cron survived restart and executed a fresh successful log; actual MySQL stale-NULL/default migration and single-brand baseline verified.');
  }
}finally{await c.end();}
