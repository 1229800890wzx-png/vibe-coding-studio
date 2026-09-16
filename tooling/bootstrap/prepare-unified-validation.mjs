import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { applyWebsiteSchema, seedWebsiteContent } from './website-schema.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, '.tools/package.json'));
const mysql = require('mysql2/promise');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').split(/\r?\n/).filter(s => s && !s.startsWith('#')).map(s => { const i=s.indexOf('='); return [s.slice(0,i),s.slice(i+1)]; }));
const backup = JSON.parse(fs.readFileSync(path.join(root, '.runtime/backup-restore-report.json'), 'utf8'));
assert.equal(backup.status, 'PASSED');
assert.match(backup.restoredDatabase, /^vibe_edu_restore_\d+$/);
assert.notEqual(backup.restoredDatabase, backup.sourceDatabase);
const db = await mysql.createConnection({host:'127.0.0.1',port:13306,user:'vibe_edu',password:env.VIBE_DB_PASSWORD,database:backup.restoredDatabase,multipleStatements:true});
try {
  // The restored payment application contains local callback URLs. Keep callbacks
  // inside this copy as well as API requests; never notify the original API port.
  for (const [table, columns] of [
    ['pay_app', ['order_notify_url', 'refund_notify_url', 'transfer_notify_url']],
    ['pay_order', ['notify_url']], ['pay_refund', ['notify_url']],
    ['pay_transfer', ['notify_url']], ['pay_notify_task', ['notify_url']],
  ]) {
    for (const column of columns) {
      await db.query(`UPDATE \`${table}\` SET \`${column}\`=REPLACE(\`${column}\`,'http://127.0.0.1:48080/','http://127.0.0.1:48081/') WHERE \`${column}\` LIKE 'http://127.0.0.1:48080/%'`);
    }
  }
  await applyWebsiteSchema(db, root);
  await seedWebsiteContent(db, root);
  // A second upgrade proves additive local deployment is repeatable.
  await applyWebsiteSchema(db, root);
  await seedWebsiteContent(db, root);
  const [[{offerings}]] = await db.query('SELECT COUNT(*) offerings FROM edu_website_offering');
  assert(offerings >= 3);
  const [[{legacy}]] = await db.query("SELECT COUNT(*) legacy FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='edu_inquiry'");
  assert.equal(legacy, 0);
  const environment = {database:backup.restoredDatabase,sourceDatabasePreserved:backup.sourceDatabase,apiBase:'http://127.0.0.1:48081',website:'http://127.0.0.1:4175',redisDatabase:14,backupPath:backup.backupPath};
  fs.mkdirSync(path.join(root,'.runtime/unified'),{recursive:true});
  fs.writeFileSync(path.join(root,'.runtime/unified/environment.json'),JSON.stringify(environment,null,2));
  console.log(`PASS isolated upgrade twice; ${offerings} website configurations; source database untouched.`);
} finally { await db.end(); }
