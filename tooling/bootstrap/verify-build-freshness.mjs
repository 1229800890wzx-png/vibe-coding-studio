/** Refuse to start a jar while recently edited backend source is newer than its compiled class. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const modules=['yudao-module-edu','yudao-module-crm','yudao-module-infra','yudao-module-pay','yudao-module-mall/yudao-module-product','yudao-module-mall/yudao-module-trade','yudao-server'];
const stale=[],excluded=[];let checked=0;
function walk(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(directory,e.name)):[path.join(directory,e.name)]);}
for(const module of modules){
  const base=path.join(root,'apps/server',module),source=path.join(base,'src/main/java');
  if(!fs.existsSync(source))continue;
  for(const file of walk(source).filter(p=>p.endsWith('.java')&&!p.endsWith('package-info.java'))){
    const compiled=path.join(base,'target/classes',path.relative(source,file).replace(/\.java$/,'.class'));
    const relative=path.relative(source,file).replaceAll('\\','/');
    // The deployed CRM Maven profile explicitly excludes only optional BPM adapters.
    // Reject stale classes from a previous BPM build instead of packaging them.
    if(module==='yudao-module-crm'&&/\/(integration\/bpm\/|service\/contract\/listener\/|service\/receivable\/listener\/|util\/CrmAuditStatusUtils\.java$)/.test('/'+relative)){
      assert(!fs.existsSync(compiled),'Default CRM runtime must not contain excluded BPM class: '+relative);excluded.push(path.relative(root,file).replaceAll('\\','/'));continue;
    }
    if(!fs.existsSync(compiled)||fs.statSync(file).mtimeMs>fs.statSync(compiled).mtimeMs)stale.push(path.relative(root,file).replaceAll('\\','/'));
    checked++;
  }
}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const resource='application-foundation.yaml';
assert.equal(hash(path.join(root,'apps/server/yudao-server/src/main/resources',resource)),hash(path.join(root,'apps/server/yudao-server/target/classes',resource)),'Foundation configuration must be copied into the current build');
assert.deepEqual(stale,[],'Backend edits arrived after compilation; rebuild before starting this jar');
const jar=path.join(root,'apps/server/yudao-server/target/yudao-server.jar');
const report={timestamp:new Date().toISOString(),status:'PASSED',checkedJavaSources:checked,monitoredModules:modules,excludedOptionalCrmBpmSources:excluded,jarSha256:hash(jar),jarModified:fs.statSync(jar).mtime.toISOString(),stale};
fs.writeFileSync(path.join(root,'.runtime/backend-build-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`PASS: ${checked} Java sources are no newer than compiled classes; foundation configuration matches; packaged jar fingerprint recorded.`);
