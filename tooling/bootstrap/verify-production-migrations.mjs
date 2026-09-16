/** Prove the production Liquibase bundle against a NEW isolated local MySQL8.4
 * database. The running development schema and its data are never changed. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'.tools/package.json'));
const mysql=require('mysql2/promise'),bcrypt=require('bcryptjs');
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.runtime/foundation.env'),'utf8').trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return[line.slice(0,i),line.slice(i+1)];}));
const database=`vibe_edu_migration_test_${new Date().toISOString().replace(/\D/g,'')}`;
assert(/^vibe_edu_migration_test_\d+$/.test(database));
const directory=path.join(root,'.runtime/production-migration',database);fs.mkdirSync(directory,{recursive:true});
const privateConfig=path.join(directory,'connection.json');
const bootstrapPassword=crypto.randomBytes(32).toString('hex');
const config={host:'127.0.0.1',port:13306,database,confirmDatabase:database,username:'vibe_edu',password:env.VIBE_DB_PASSWORD,adminUsername:'vibe_admin',adminPasswordHash:await bcrypt.hash(bootstrapPassword,10),oauthSecret:crypto.randomBytes(32).toString('hex'),adminRedirectUris:['http://127.0.0.1:5173/']};
fs.writeFileSync(privateConfig,JSON.stringify(config,null,2)+'\n',{mode:0o600,flag:'wx'});
const report={startedAt:new Date().toISOString(),database,engine:'Liquibase OSS 4.33.0',checks:[],privateConfig,scope:'New isolated local MySQL8.4 database; production migration assets, no deployment and no existing development data changes'};
const reportFile=path.join(root,'.runtime/production-migration-report.json');
const save=()=>fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
function pass(name,details){report.checks.push({name,status:'PASSED',...(details?{details}:{})});save();console.log(`PASS: ${name}`);}
function docker(args){return execFileSync('wsl.exe',['-d',process.env.VIBE_WSL_DISTRO||'Ubuntu','-u','root','--exec','docker',...args],{windowsHide:true,stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024});}
// Root password remains inside the existing local container; only the newly named
// test database receives a grant. No DROP/DELETE/TRUNCATE or global service changes.
docker(['exec','vibe-edu-foundation-mysql-1','sh','-c',`export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"; exec mysql -uroot -e "CREATE DATABASE ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON ${database}.* TO 'vibe_edu'@'%';"`]);
const db=await mysql.createConnection({host:config.host,port:config.port,user:config.username,password:config.password,database});
async function run(action,expectedFailure=false){
  const child=spawn(process.execPath,[path.join(root,'tooling/bootstrap/run-production-migrations.mjs'),action,privateConfig,'--local-test'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
  if(expectedFailure){assert.notEqual(code,0,'Liquibase checksum validation must reject the changed test ledger');return output;}
  assert.equal(code,0,output);console.log(output.trim());return output;
}
const tableCount=async()=>Number((await db.query('SELECT COUNT(*) count FROM information_schema.tables WHERE table_schema=DATABASE()'))[0][0].count);
try {
  const [[{version}]]=await db.query('SELECT VERSION() version');assert.match(version,/^8\.4\./);assert.equal(await tableCount(),0);
  await run('validate');
  const [metadata]=await db.query('SELECT table_name tableName FROM information_schema.tables WHERE table_schema=DATABASE()');
  assert(metadata.every(row=>['DATABASECHANGELOG','DATABASECHANGELOGLOCK'].includes(row.tableName.toUpperCase())),'Validation may initialize only the OSS engine metadata');
  const beforePreview=await tableCount();await run('preview');assert.equal(await tableCount(),beforePreview,'SQL preview must not create business tables');
  const preview=path.join(directory,'preview.sql');assert(fs.existsSync(preview));const sql=fs.readFileSync(preview,'utf8');
  assert.match(sql,/CREATE TABLE/);assert.match(sql,/DATABASECHANGELOG/);assert(!/^\s*(DROP TABLE|TRUNCATE|DELETE FROM)\b/im.test(sql));
  fs.copyFileSync(preview,path.join(directory,'initial-preview.sql'));
  pass('Liquibase renders a private SQL preview without applying business DDL or seeds',{mysqlVersion:version,validationMetadataTables:metadata.length,previewSha256:crypto.createHash('sha256').update(sql).digest('hex')});
  await run('migrate');assert.equal(await tableCount(),186);
  const [history]=await db.query('SELECT ID,AUTHOR,FILENAME,MD5SUM,EXECTYPE,DATEEXECUTED FROM DATABASECHANGELOG ORDER BY ORDEREXECUTED');
  assert.equal(history.length,10);assert(history.every(row=>row.MD5SUM&&row.EXECTYPE==='EXECUTED'));assert.equal(Number((await db.query('SELECT COUNT(*) count FROM DATABASECHANGELOGLOCK WHERE LOCKED=1'))[0][0].count),0);
  pass('Liquibase applies ten changesets including website CRM and content extensions',{businessTables:184,metadataTables:2,changesets:10});
  for(const table of['member_user','member_address','trade_cart','trade_order','trade_order_item','trade_after_sale','pay_order','pay_refund','pay_channel','pay_app','product_spu','product_sku','edu_student','edu_course','edu_course_version','edu_cohort','edu_trial_booking','edu_enrollment','edu_submission','edu_review','edu_work','infra_job','infra_job_log','infra_file','infra_file_config','infra_api_access_log','system_login_log','system_notify_message','system_oauth2_access_token']){
    const [[{count}]]=await db.query(`SELECT COUNT(*) count FROM \`${table}\``);assert.equal(Number(count),0,`${table} must contain no development fixtures`);
  }
  const [admins]=await db.query('SELECT id,username,password,status,tenant_id FROM system_users');assert.equal(admins.length,1);assert.equal(admins[0].username,config.adminUsername);assert.equal(admins[0].tenant_id,1);assert(await bcrypt.compare(bootstrapPassword,admins[0].password));
  const [tenants]=await db.query('SELECT id,name,status FROM system_tenant');assert.deepEqual(tenants.map(t=>({id:t.id,name:t.name,status:t.status})),[{id:1,name:'VIBE CODING',status:0}]);
  pass('Production initialization contains one original administrator/tenant and zero test members, commerce, education or channel records');
  const [columns]=await db.query("SELECT TABLE_NAME tableName,COLUMN_NAME columnName,IS_NULLABLE nullable,COLUMN_DEFAULT defaultValue,DATA_TYPE dataType,CHARACTER_MAXIMUM_LENGTH maxLength FROM information_schema.columns WHERE table_schema=DATABASE() AND (TABLE_NAME='edu_review' AND COLUMN_NAME='revision' OR TABLE_NAME='edu_trial_booking' AND COLUMN_NAME='crm_clue_id' OR TABLE_NAME='edu_teacher_profile' AND COLUMN_NAME='one_to_one_enabled' OR TABLE_NAME='crm_clue' AND COLUMN_NAME LIKE 'education_%')");
  const expectedColumns={
    'edu_review.revision':{nullable:'NO',dataType:'int',defaultValue:'0'},
    'edu_trial_booking.crm_clue_id':{nullable:'YES',dataType:'bigint'},
    'edu_teacher_profile.one_to_one_enabled':{nullable:'NO',dataType:'bit'},
    'crm_clue.education_member_id':{nullable:'YES',dataType:'bigint'},
    'crm_clue.education_student_id':{nullable:'YES',dataType:'bigint'},
    'crm_clue.education_course_id':{nullable:'YES',dataType:'bigint'},
    'crm_clue.education_consent_time':{nullable:'YES',dataType:'datetime'},
    'crm_clue.education_consent_version':{nullable:'YES',dataType:'varchar',maxLength:64},
    'crm_clue.education_service_type':{nullable:'YES',dataType:'varchar',maxLength:32},
    'crm_clue.education_teacher_id':{nullable:'YES',dataType:'bigint'},
    'crm_clue.education_teacher_name':{nullable:'YES',dataType:'varchar',maxLength:80},
    'crm_clue.education_preferred_start_time':{nullable:'YES',dataType:'datetime'},
    'crm_clue.education_preferred_end_time':{nullable:'YES',dataType:'datetime'},
    'crm_clue.education_appointment_status':{nullable:'YES',dataType:'varchar',maxLength:32},
    'crm_clue.education_origin':{nullable:'YES',dataType:'varchar',maxLength:16},
    'crm_clue.education_website_status':{nullable:'YES',dataType:'varchar',maxLength:16},
    'crm_clue.education_operator_note':{nullable:'YES',dataType:'varchar',maxLength:2000},
    'crm_clue.education_experience':{nullable:'YES',dataType:'varchar',maxLength:200},
    'crm_clue.education_interest':{nullable:'YES',dataType:'varchar',maxLength:200},
    'crm_clue.education_message':{nullable:'YES',dataType:'varchar',maxLength:2000}
  };
  assert.deepEqual(columns.map(column=>`${column.tableName}.${column.columnName}`).sort(),Object.keys(expectedColumns).sort(),'Verify named education extension fields, not an outdated aggregate column count');
  for(const column of columns){
    const name=`${column.tableName}.${column.columnName}`,expected=expectedColumns[name];
    assert.equal(column.nullable,expected.nullable,`${name} nullability`);assert.equal(column.dataType,expected.dataType,`${name} SQL type`);
    if(expected.maxLength!==undefined)assert.equal(Number(column.maxLength),expected.maxLength,`${name} maximum length`);
    if(expected.defaultValue!==undefined)assert.equal(String(column.defaultValue),expected.defaultValue,`${name} default`);
    if(name==='edu_teacher_profile.one_to_one_enabled')assert.match(String(column.defaultValue),/^(?:b'0'|0)$/,'New teachers must default to one-to-one disabled');
  }
  const expectedIndexes={
    'edu_trial_booking.ix_crm_clue':['tenant_id','crm_clue_id'],
    'edu_teacher_profile.ix_one_to_one_public':['tenant_id','status','one_to_one_enabled'],
    'crm_clue.idx_education_appointment':['tenant_id','education_member_id','education_student_id','education_service_type','education_appointment_status']
  };
  for(const [key,expected]of Object.entries(expectedIndexes)){
    const [table,index]=key.split('.');
    const [indexColumns]=await db.execute('SELECT COLUMN_NAME columnName FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=? AND index_name=? ORDER BY SEQ_IN_INDEX',[table,index]);
    assert.deepEqual(indexColumns.map(column=>column.columnName),expected,`${key} ordered fields`);
  }
  pass('Named review, CRM/trial and one-to-one fields and indexes are present; new teacher booking switch is non-null and defaults false',{verifiedColumns:Object.keys(expectedColumns),verifiedIndexes:Object.keys(expectedIndexes),oneToOneEnabledDefault:columns.find(column=>column.tableName==='edu_teacher_profile').defaultValue});
  await run('migrate');await run('validate');await run('status');
  const [again]=await db.query('SELECT ID,AUTHOR,FILENAME,MD5SUM,EXECTYPE,DATEEXECUTED FROM DATABASECHANGELOG ORDER BY ORDEREXECUTED');assert.deepEqual(again,history);
  pass('A second migration run is idempotent and preserves original Liquibase execution records');
  // Deliberately corrupt ONLY the new test database's checksum, then restore its
  // recorded value. This proves the OSS engine rejects drift without clearCheckSums.
  const first=history[0];await db.execute("UPDATE DATABASECHANGELOG SET MD5SUM=? WHERE ID=? AND AUTHOR=? AND FILENAME=?",['9:'+'0'.repeat(32),first.ID,first.AUTHOR,first.FILENAME]);
  try {const output=await run('validate',true);assert.match(output,/check.?sum|ValidationFailed|validation failed/i);}
  finally {await db.execute('UPDATE DATABASECHANGELOG SET MD5SUM=? WHERE ID=? AND AUTHOR=? AND FILENAME=?',[first.MD5SUM,first.ID,first.AUTHOR,first.FILENAME]);}
  await run('validate');pass('Liquibase rejects checksum drift; deliberately changed isolated-test checksum restored',{intentionalMutation:'Only DATABASECHANGELOG checksum in this newly created test database'});
  report.status='PASSED';
}catch(error){report.status='FAILED';report.error=error.message;process.exitCode=1;console.error(error.message);}
finally{report.completedAt=new Date().toISOString();save();await db.end();}
