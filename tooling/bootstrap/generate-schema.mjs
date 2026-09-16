/** Reconcile public upstream models into a local MySQL schema. Never fetches restricted SQL. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'apps/server');
const destination = path.join(root, 'infra/database');
const overrides = JSON.parse(fs.readFileSync(path.join(destination, 'model-overrides.json'), 'utf8'));
const modules = ['member', 'pay', 'mall', 'crm'];
const files = [];
function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, entry.name); if (entry.isDirectory()) walk(p); else files.push(p); } }
for (const name of modules) walk(path.join(source, `yudao-module-${name}`));
const read = p => fs.readFileSync(p, 'utf8');
const rel = p => path.relative(root, p).replaceAll('\\', '/');
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const snake = s => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
const hints = new Map();
const sqlFiles = files.filter(p => /[\\/]src[\\/]test[\\/]resources[\\/]sql[\\/]create_tables.sql$/.test(p));
for (const p of sqlFiles) {
  const sql = read(p);
  for (const table of sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+["`]?([a-z_]+)["`]?\s*\(([\s\S]*?)\)\s*(?:COMMENT[^;]*)?;/gi)) {
    const columns = new Map();
    for (const line of table[2].split('\n')) {
      const match = line.match(/^\s*["`]?([a-z_]+)["`]?\s+(bigint|int|integer|tinyint|smallint|number|decimal|double|float|bit|boolean|datetime|timestamp|date|varchar|text|mediumtext|longtext|json)(\([^)]*\))?/i);
      if (match) columns.set(match[1], { type: (match[2] + (match[3] || '')).toLowerCase(), source: rel(p) });
    }
    hints.set(table[1], columns);
  }
}
const models = new Map();
for (const p of files.filter(p => /[\\/]src[\\/]main[\\/]java[\\/].*[\\/]dal[\\/]dataobject[\\/].*DO.java$/.test(p))) {
  const raw = read(p);
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const name = text.match(/public\s+(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/);
  const table = text.match(/@TableName\(\s*(?:value\s*=\s*)?"([^"]+)"/);
  if (!name) continue;
  const body = text.slice(text.indexOf('{', name.index) + 1);
  let depth = 0, prefix = '', parsed = [];
  for (const line of body.split('\n')) {
    if (depth === 0) {
      const field = line.match(/^\s*private\s+(?!static\b|final\b)([\w<>?, .\[\]]+)\s+(\w+)\s*(?:=[^;]*)?;/);
      if (field) {
        const annotations = prefix;
        if (!/@TableField\([^)]*exist\s*=\s*false/.test(annotations)) {
          const explicit = annotations.match(/@TableField\(\s*(?:value\s*=\s*)?"([^"]+)"/);
          parsed.push({ name: explicit?.[1] || snake(field[2]), javaType: field[1].trim(), annotations });
        }
        prefix = '';
      } else if (line.trim().startsWith('@')) prefix += line;
      else if (line.trim() && !line.trim().startsWith(')')) prefix = '';
    }
    // Braces in string literals do not affect Java nesting.
    const code = line.replace(/"(?:\\.|[^"\\])*"/g, '');
    depth += (code.match(/{/g) || []).length - (code.match(/}/g) || []).length;
  }
  models.set(name[1], { table: table?.[1], parent: name[2], tenantIgnore: /@TenantIgnore/.test(text), fields: parsed, source: rel(p), sha256: sha256(p) });
}
const base = [
  { name: 'creator', javaType: 'String' }, { name: 'create_time', javaType: 'LocalDateTime' },
  { name: 'updater', javaType: 'String' }, { name: 'update_time', javaType: 'LocalDateTime' },
  { name: 'deleted', javaType: 'Boolean' },
];
function inherited(model) {
  if (model.parent === 'TenantBaseDO') return [...base, { name: 'tenant_id', javaType: 'Long' }];
  if (model.parent === 'BaseDO') return base;
  if (!model.parent) return [];
  const parent = models.get(model.parent);
  if (!parent) throw new Error(`Unknown model parent ${model.parent}: ${model.source}`);
  return [...parent.fields, ...inherited(parent)];
}
function compatibleHint(field, hint) {
  if (!hint) return false;
  const t = field.javaType, type = hint.type;
  if (t === 'String') return /^(varchar|text|mediumtext|longtext|json)/.test(type);
  if (['Long', 'long', 'Integer', 'int', 'Short', 'Byte'].includes(t)) return /^(bigint|int|integer|tinyint|smallint|number)/.test(type);
  if (['Boolean', 'boolean'].includes(t)) return /^(bit|boolean|tinyint)/.test(type);
  if (['Double', 'Float', 'BigDecimal'].includes(t)) return /^(decimal|double|float|number)/.test(type);
  if (['LocalDateTime', 'Date', 'Instant'].includes(t)) return /^(datetime|timestamp)/.test(type);
  if (t === 'LocalDate') return type === 'date';
  if (t === 'LocalTime') return type === 'time';
  return false;
}
function sqlType(field, hint) {
  const t = field.javaType;
  if (t.includes('<') || t.endsWith('[]') || /TypeHandler/.test(field.annotations || '') && !['String', 'Long', 'Integer', 'Boolean'].includes(t)) return 'text';
  if (compatibleHint(field, hint)) {
    let type = hint.type.replace(/^number$/, 'bigint').replace(/^varchar$/, 'varchar(255)').replace(/^timestamp/, 'datetime');
    if (type.startsWith('varchar(') && Number(type.match(/\d+/)[0]) > 2048) type = 'text';
    return type;
  }
  if (t === 'Long' || t === 'long') return 'bigint';
  if (['Integer', 'int', 'Short', 'Byte'].includes(t)) return 'int';
  if (['Boolean', 'boolean'].includes(t)) return 'bit(1)';
  if (t === 'BigDecimal') return 'decimal(24,6)';
  if (['Double', 'Float'].includes(t)) return 'double';
  if (t === 'LocalDate') return 'date';
  if (t === 'LocalTime') return 'time';
  if (['LocalDateTime', 'Date', 'Instant'].includes(t)) return 'datetime';
  if (t === 'String') return /description|content|config|body|extra|reason|remark|url|pic|images|detail/.test(field.name) ? 'text' : 'varchar(255)';
  throw new Error(`Unmapped Java type ${t} (${field.name}); add an explicit mapping`);
}
const frameworkSources = [
  'yudao-framework/yudao-spring-boot-starter-mybatis/src/main/java/cn/iocoder/yudao/framework/mybatis/core/dataobject/BaseDO.java',
  'yudao-framework/yudao-spring-boot-starter-biz-tenant/src/main/java/cn/iocoder/yudao/framework/tenant/core/db/TenantBaseDO.java',
  'yudao-framework/yudao-spring-boot-starter-biz-tenant/src/main/java/cn/iocoder/yudao/framework/tenant/core/db/TenantDatabaseInterceptor.java',
].map(p => ({ path: rel(path.join(source, p)), sha256: sha256(path.join(source, p)) }));
const baseSql = path.join(source, 'sql/mysql/ruoyi-vue-pro.sql');
const manifest = { upstream: { repository: 'https://github.com/YunaiV/ruoyi-vue-pro', commit: '8e43004cf68a405cd3485f98f8a539b97ca6544a', license: 'MIT' }, policy: 'Public source-derived local development schema. Not the restricted official mall SQL; official constraints and production migrations require separate reconciliation.', baseSql: { path: rel(baseSql), sha256: sha256(baseSql) }, frameworkSources, typeHintSources: sqlFiles.map(p => ({ path: rel(p), sha256: sha256(p) })), tables: [] };
let output = '-- Generated by tooling/bootstrap/generate-schema.mjs. MySQL 8.4.\n-- Public DO fields are authoritative; H2 tests supply type hints only.\nSET NAMES utf8mb4;\n\n';
for (const model of [...models.values()].filter(m => m.table).sort((a, b) => a.table.localeCompare(b.table))) {
  const fields = [...model.fields, ...inherited(model)];
  // Upstream TenantDatabaseInterceptor applies tenant_id even to BaseDO unless @TenantIgnore.
  if (!model.tenantIgnore && !fields.some(f => f.name === 'tenant_id')) fields.push({ name: 'tenant_id', javaType: 'Long' });
  const seen = new Set();
  const table = { name: model.table, source: model.source, sha256: model.sha256, hashScope: 'Current workspace source; local education extensions are explicitly marked per column', columns: [] };
  const lines = [];
  for (const f of fields) {
    if (seen.has(f.name)) continue;
    seen.add(f.name);
    const hint = hints.get(model.table)?.get(f.name);
    const type = sqlType(f, hint);
    const defaults = f.name === 'id' ? ' NOT NULL AUTO_INCREMENT' : f.name === 'deleted' ? " NOT NULL DEFAULT b'0'" : f.name === 'tenant_id' ? ' NOT NULL DEFAULT 0' : f.name === 'create_time' ? ' NOT NULL DEFAULT CURRENT_TIMESTAMP' : f.name === 'update_time' ? ' NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' : ' NULL';
    const override = overrides[`${model.table}.${f.name}`];
    lines.push(`  \`${f.name}\` ${override?.definition || type + defaults}`);
    table.columns.push({ name: f.name, javaType: f.javaType, mysqlType: type, origin: override?.localExtension ? 'local education extension' : 'public upstream model', typeHint: compatibleHint(f, hint) ? hint.source : 'Java field mapping', ...(hint && !compatibleHint(f, hint) ? { supersededTestHint: hint } : {}), ...(override ? { reconciliation: override } : {}) });
  }
  if (!seen.has('id')) throw new Error(`No primary key: ${model.table}`);
  lines.push('  PRIMARY KEY (`id`)');
  // Operational indexes use the original model fields. They do not introduce alternate models.
  for (const col of ['user_id', 'order_id', 'spu_id', 'sku_id', 'app_id', 'status', 'create_time']) if (seen.has(col)) lines.push(`  KEY \`idx_${col}\` (\`${col}\`)`);
  if (model.table === 'member_user') lines.push('  UNIQUE KEY `uk_mobile_tenant_deleted` (`mobile`, `tenant_id`, `deleted`)');
  if (model.table === 'pay_app') lines.push('  UNIQUE KEY `uk_app_key_deleted` (`app_key`, `deleted`)');
  if (model.table === 'trade_cart') lines.push('  KEY `idx_user_sku` (`user_id`, `sku_id`)');
  if (model.table === 'trade_cart' && seen.has('student_id')) lines.push('  KEY `idx_trade_cart_learner` (`user_id`, `sku_id`, `student_id`, `deleted`)');
  if (model.table === 'trade_order_item' && seen.has('student_id')) lines.push('  KEY `idx_trade_order_item_learner` (`student_id`, `sku_id`, `order_id`)');
  if (model.table === 'crm_clue') {
    lines.push('  KEY `idx_education_member` (`tenant_id`, `education_member_id`, `education_student_id`)');
    lines.push('  KEY `idx_education_appointment` (`tenant_id`, `education_member_id`, `education_student_id`, `education_service_type`, `education_appointment_status`)');
  }
  output += `-- ${model.source}\nCREATE TABLE IF NOT EXISTS \`${model.table}\` (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
  manifest.tables.push(table);
}
fs.mkdirSync(destination, { recursive: true });
manifest.columnCounts = { publicUpstream: manifest.tables.flatMap(t=>t.columns).filter(c=>c.origin==='public upstream model').length, localExtensions: manifest.tables.flatMap(t=>t.columns).filter(c=>c.origin==='local education extension').length };
fs.writeFileSync(path.join(destination, '20-public-business-models.sql'), output);
fs.writeFileSync(path.join(destination, 'source-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Generated ${manifest.tables.length} public business tables, ${manifest.tables.reduce((n,t) => n + t.columns.length, 0)} columns.`);
