import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, '.tools/package.json'));
const mysql = require('mysql2/promise');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').trim().split(/\r?\n/).map(s => s.trim().split('=')));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'infra/database/source-manifest.json')));
const connection = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'vibe_edu', password: env.VIBE_DB_PASSWORD, database: 'vibe_edu' });
try {
  const [columns] = await connection.query('SELECT TABLE_NAME tableName, COLUMN_NAME columnName FROM information_schema.columns WHERE table_schema=DATABASE()');
  const actual = new Set(columns.map(c => `${c.tableName}.${c.columnName}`));
  const missing = manifest.tables.flatMap(t => t.columns.filter(c => !actual.has(`${t.name}.${c.name}`)).map(c => `${t.name}.${c.name}`));
  assert.deepEqual(missing, [], 'Current public DO columns must all exist in MySQL');
  for (const critical of ['trade_cart.user_id', 'trade_config.brokerage_enabled', 'trade_order_log.order_id', 'member_user.register_terminal', 'pay_order.user_id', 'trade_order.tenant_id']) assert(actual.has(critical), critical);
  const [[version]] = await connection.query('SELECT VERSION() version');
  assert.match(version.version, /^8\.4\./, 'Acceptance requires actual MySQL 8.4');
  const [[{tableCount}]]=await connection.query('SELECT COUNT(*) tableCount FROM information_schema.tables WHERE table_schema=DATABASE()');
  fs.writeFileSync(path.join(root,'.runtime/schema-verification-report.json'),JSON.stringify({timestamp:new Date().toISOString(),status:'PASSED',mysqlVersion:version.version,tableCount,publicBusinessTables:manifest.tables.length,columnCounts:manifest.columnCounts,missingColumns:missing},null,2)+'\n');
  console.log(`PASS: MySQL ${version.version}, ${manifest.tables.length} public model tables and ${manifest.tables.reduce((n, t) => n+t.columns.length, 0)} columns verified.`);
} finally { await connection.end(); }
