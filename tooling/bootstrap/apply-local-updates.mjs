/** Additive updates for this disposable local foundation database; does not drop tables or records. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { applyWebsiteSchema, seedWebsiteContent } from './website-schema.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, '.tools/package.json'));
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').trim().split(/\r?\n/).map(s=>s.trim().split('=')));
const c = await mysql.createConnection({host:'127.0.0.1',port:13306,user:'vibe_edu',password:env.VIBE_DB_PASSWORD,database:'vibe_edu',multipleStatements:true});
try {
  const [[{quartzCount}]]=await c.query("SELECT COUNT(*) quartzCount FROM information_schema.tables WHERE table_schema=DATABASE() AND UPPER(table_name) LIKE 'QRTZ_%'");
  if(!quartzCount){await c.query(fs.readFileSync(path.join(root,'apps/server/sql/mysql/quartz.sql'),'utf8').split(/\r?\n/).filter(line=>!/^INSERT INTO /.test(line)).join('\n'));console.log('Imported public upstream Quartz JDBC schema without demo job seeds.');}
  for (const [table, column, definition] of [
    ['trade_cart','student_id','BIGINT NULL'], ['trade_order_item','student_id','BIGINT NULL'],
    ['edu_course','revision','INT NOT NULL DEFAULT 0'], ['edu_file_access','cohort_id','BIGINT NULL'],
    ['edu_review','revision','INT NOT NULL DEFAULT 0'],
    ['edu_trial_booking','crm_clue_id','BIGINT NULL'],
    ['crm_clue','education_member_id','BIGINT NULL'], ['crm_clue','education_student_id','BIGINT NULL'],
    ['crm_clue','education_course_id','BIGINT NULL'], ['crm_clue','education_consent_time','DATETIME NULL'],
    ['crm_clue','education_consent_version','VARCHAR(64) NULL'],
    ['edu_teacher_profile','one_to_one_enabled',"BIT(1) NOT NULL DEFAULT b'0'"],
    ['crm_clue','education_service_type','VARCHAR(32) NULL'],
    ['crm_clue','education_teacher_id','BIGINT NULL'], ['crm_clue','education_teacher_name','VARCHAR(80) NULL'],
    ['crm_clue','education_preferred_start_time','DATETIME NULL'], ['crm_clue','education_preferred_end_time','DATETIME NULL'],
    ['crm_clue','education_appointment_status','VARCHAR(32) NULL'],
  ]) {
    const [[{count}]] = await c.execute('SELECT COUNT(*) count FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?',[table,column]);
    if (!count) { await c.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`); console.log(`Added ${table}.${column}`); }
  }
  await c.query('ALTER TABLE edu_file_access MODIFY student_id BIGINT NULL, MODIFY owner_member_id BIGINT NULL');
  // Original async pay callbacks have no interactive user; align education audit nullability with upstream BaseDO.
  const [educationTables]=await c.query("SELECT TABLE_NAME tableName FROM information_schema.tables WHERE table_schema=DATABASE() AND TABLE_NAME LIKE 'edu\\_%'");
  for(const {tableName} of educationTables){if(!/^edu_[a-z_]+$/.test(tableName))throw Error('Unexpected education table name');await c.query(`ALTER TABLE \`${tableName}\` MODIFY creator varchar(64) NULL DEFAULT '', MODIFY updater varchar(64) NULL DEFAULT ''`);}
  for (const [table,index,columns] of [['trade_cart','idx_trade_cart_learner','user_id,sku_id,student_id,deleted'],['trade_order_item','idx_trade_order_item_learner','student_id,sku_id,order_id'],['edu_trial_booking','ix_crm_clue','tenant_id,crm_clue_id'],['crm_clue','idx_education_member','tenant_id,education_member_id,education_student_id'],['edu_teacher_profile','ix_one_to_one_public','tenant_id,status,one_to_one_enabled'],['crm_clue','idx_education_appointment','tenant_id,education_member_id,education_student_id,education_service_type,education_appointment_status']]) {
    const [[{count}]] = await c.execute('SELECT COUNT(*) count FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=? AND index_name=?',[table,index]);
    if (!count) await c.query(`CREATE INDEX \`${index}\` ON \`${table}\` (${columns})`);
  }
  for (const file of ['infra/database/21-public-model-reconciliations.sql','infra/database/22-local-brand-baseline.sql','infra/sql/education-menus.sql','infra/sql/education-content.sql']) {
    const p=path.join(root,file); if (fs.existsSync(p)) { await c.query(fs.readFileSync(p,'utf8')); console.log(`Applied ${file}`); }
  }
  // Second original member account is only a cross-owner local authorization fixture.
  const [[{count}]]=await c.execute('SELECT COUNT(*) count FROM member_user WHERE mobile=? AND tenant_id=1',['13900000002']);
  if(!count) await c.execute("INSERT INTO member_user (mobile,password,nickname,status,register_ip,register_terminal,point,experience,avatar,tenant_id) VALUES (?,?,'本地隔离验证家长',0,'127.0.0.1',10,0,0,'',1)",['13900000002',await bcrypt.hash(env.VIBE_MEMBER_PASSWORD,10)]);
  console.log('Local additive migrations and original-account authorization fixture ready.');
  await applyWebsiteSchema(c, root);
  await seedWebsiteContent(c, root);
} finally { await c.end(); }
