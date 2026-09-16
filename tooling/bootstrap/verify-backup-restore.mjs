/** Back up the local MySQL and restore into a NEW database. Never drops or rewrites existing data. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'.tools/package.json'));
const mysql=require('mysql2/promise');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(s=>s.trim().split('=')));
const distro=process.env.VIBE_WSL_DISTRO||'Ubuntu',container='vibe-edu-foundation-mysql-1';
const directory=path.join(root,'.runtime/backups');fs.mkdirSync(directory,{recursive:true});
const verifyOnly=process.argv.includes('--verify-only');
const timestamp=verifyOnly?fs.readdirSync(directory).filter(f=>/^vibe-edu-\d+\.sql$/.test(f)).sort().at(-1)?.match(/\d+/)?.[0]:new Date().toISOString().replace(/[^0-9]/g,'');
const database=`vibe_edu_restore_${timestamp}`;assert(/^vibe_edu_restore_\d+$/.test(database));
const backup=path.join(directory,`vibe-edu-${timestamp}.sql`);
function docker(args){return execFileSync('wsl.exe',['-d',distro,'-u','root','--exec','docker',...args],{maxBuffer:256*1024*1024,windowsHide:true,stdio:['ignore','pipe','pipe']});}
// MYSQL_ROOT_PASSWORD is read ONLY inside the existing local container and never printed.
const dump=verifyOnly?fs.readFileSync(backup):docker(['exec',container,'sh','-c','export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"; exec mysqldump -uroot --single-transaction --routines --events --hex-blob --skip-extended-insert --set-gtid-purged=OFF --no-tablespaces vibe_edu']);
if(!verifyOnly)fs.writeFileSync(backup,dump);
const sql=dump.toString('utf8');assert(sql.includes('-- Dump completed on'),'mysqldump must complete');assert(!/^USE /m.test(sql),'Restore must remain in its dedicated new database');
const counts=new Map();for(const match of sql.matchAll(/^CREATE TABLE `([^`]+)`/gm))counts.set(match[1],0);
for(const match of sql.matchAll(/^INSERT INTO `([^`]+)`(?: \([^)]*\))? VALUES /gm))counts.set(match[1],(counts.get(match[1])||0)+1);
assert(counts.size>=182,'Expected complete original and education schema');
if(!verifyOnly)docker(['exec',container,'sh','-c',`export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"; exec mysql -uroot -e "CREATE DATABASE ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON ${database}.* TO 'vibe_edu'@'%';"`]);
const c=await mysql.createConnection({host:'127.0.0.1',port:13306,user:'vibe_edu',password:env.VIBE_DB_PASSWORD,database,multipleStatements:true});
try{
  if(!verifyOnly)await c.query(sql);
  for(const [table,expected] of counts){assert(/^[\w]+$/.test(table));const [[{count}]]=await c.query(`SELECT COUNT(*) count FROM \`${table}\``);assert.equal(count,expected,`Restored ${table} must exactly match the dumped snapshot row count`);}
  const [[tenant]]=await c.query("SELECT id,name FROM system_tenant WHERE status=0 AND deleted=b'0'");assert.deepEqual(tenant,{id:1,name:'VIBE CODING'});
  const [[admin]]=await c.query('SELECT id,LENGTH(password) hashLength FROM system_users WHERE id=1');assert.equal(admin.hashLength,60);
  const [[member]]=await c.query('SELECT id,LENGTH(password) hashLength FROM member_user WHERE id=10001');assert.equal(member.hashLength,60);
  const [[{templates}]]=await c.query("SELECT COUNT(*) templates FROM system_notify_template WHERE code LIKE 'edu_%'");assert(templates>0);
  const [[{menuCount}]]=await c.query("SELECT COUNT(*) menuCount FROM system_menu WHERE id>=90000 AND deleted=b'0'");assert(menuCount>0);
  const [[{courseCount}]]=await c.query('SELECT COUNT(*) courseCount FROM edu_course');assert(courseCount>=6);
  const report={timestamp:new Date().toISOString(),status:'PASSED',sourceDatabase:'vibe_edu',restoredDatabase:database,backupPath:path.relative(root,backup).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(dump).digest('hex'),bytes:dump.length,verifiedTables:counts.size,verifiedRows:[...counts.values()].reduce((a,b)=>a+b,0),originalAdminId:admin.id,originalMemberId:member.id,activeBrand:tenant.name,educationNotificationTemplates:templates,educationMenuCount:menuCount,curriculumCount:courseCount,scope:'New restore database retained for review; source database unchanged. Password hashes and backup contents remain in ignored .runtime only.'};
  fs.writeFileSync(path.join(root,'.runtime/backup-restore-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`PASS: restored ${counts.size} tables with exact snapshot row counts into ${database}; original identities, brand, education menus/templates verified.`);
}finally{await c.end();}
