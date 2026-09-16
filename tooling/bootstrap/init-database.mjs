import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { applyWebsiteSchema, seedWebsiteContent } from './website-schema.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, '.tools/package.json'));
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
for (const line of fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').split(/\r?\n/)) {
  const m = line.trim().match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const connection = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'vibe_edu', password: process.env.VIBE_DB_PASSWORD, database: 'vibe_edu', multipleStatements: true, charset: 'utf8mb4', supportBigNumbers: true });
try {
  const [[{ tableCount }]] = await connection.query("SELECT COUNT(*) tableCount FROM information_schema.tables WHERE table_schema=DATABASE()");
  if (tableCount) throw new Error('Initialization requires an empty vibe_edu database. Existing data was preserved. Use a separate empty Docker volume/database for a clean boot.');
  // Preserve upstream system/infra DDL and actual RBAC seed model; omit upstream demo histories and third-party credentials.
  const allowedSeeds = new Set(['system_dept', 'system_dict_data', 'system_dict_type', 'system_menu', 'system_post', 'system_role', 'system_role_menu', 'system_user_post', 'system_user_role', 'system_users', 'system_tenant', 'system_tenant_package', 'system_oauth2_client']);
  const upstream = fs.readFileSync(path.join(root, 'apps/server/sql/mysql/ruoyi-vue-pro.sql'), 'utf8');
  const publicBase = upstream.split(/\r?\n/).filter(line => { const m = line.match(/^INSERT INTO `([^`]+)`/); return !m || allowedSeeds.has(m[1]); }).join('\n');
  await connection.query(publicBase);
  // Import Quartz DDL only; jobs must be registered with original JobService so both stores agree.
  await connection.query(fs.readFileSync(path.join(root, 'apps/server/sql/mysql/quartz.sql'), 'utf8').split(/\r?\n/).filter(line=>!/^INSERT INTO /.test(line)).join('\n'));
  console.log('Imported public upstream system/infra schema and RBAC seeds (external demo credentials excluded).');
  await connection.query(fs.readFileSync(path.join(root, 'infra/database/20-public-business-models.sql'), 'utf8'));
  await connection.query(fs.readFileSync(path.join(root, 'infra/database/21-public-model-reconciliations.sql'), 'utf8'));
  await connection.query(fs.readFileSync(path.join(root, 'infra/database/22-local-brand-baseline.sql'), 'utf8'));
  const adminHash = await bcrypt.hash(process.env.VIBE_ADMIN_PASSWORD, 10);
  const memberHash = await bcrypt.hash(process.env.VIBE_MEMBER_PASSWORD, 10);
  await connection.execute('UPDATE system_users SET status=1 WHERE id <> 1');
  await connection.execute("UPDATE system_users SET password=?, nickname='本地管理员', mobile=NULL, email=NULL, tenant_id=1, status=0 WHERE id=1", [adminHash]);
  await connection.execute("UPDATE system_tenant SET expire_time='2099-12-31 23:59:59', status=0 WHERE id=1");
  await connection.execute('UPDATE system_oauth2_client SET secret=?, redirect_uris=? WHERE client_id=?', [process.env.VIBE_ADMIN_PASSWORD, '["http://127.0.0.1:5173"]', 'default']);
  await connection.execute('INSERT INTO infra_file_config (id,name,storage,remark,master,config) VALUES (4,?,1,?,1,?)', ['本地数据库存储', 'Local foundation only', JSON.stringify({ '@class': 'cn.iocoder.yudao.module.infra.framework.file.core.client.db.DBFileClientConfig', domain: 'http://127.0.0.1:48080' })]);
  async function insert(table, row) {
    const columns = Object.keys(row);
    await connection.execute(`INSERT INTO \`${table}\` (${columns.map(x => `\`${x}\``).join(',')}) VALUES (${columns.map(() => '?').join(',')})`, Object.values(row));
  }
  await insert('member_user', { id: 10001, mobile: '13900000001', password: memberHash, nickname: '本地测试家长', status: 0, register_ip: '127.0.0.1', register_terminal: 10, point: 0, experience: 0, avatar: '', tenant_id: 1 });
  await insert('member_user', { id: 10002, mobile: '13900000002', password: memberHash, nickname: '本地隔离验证家长', status: 0, register_ip: '127.0.0.1', register_terminal: 10, point: 0, experience: 0, avatar: '', tenant_id: 1 });
  await insert('member_config', { id: 1, point_trade_deduct_enable: 0, point_trade_deduct_unit_price: 1, point_trade_deduct_max_price: 0, point_trade_give_point: 0, tenant_id: 1 });
  await insert('trade_config', { id: 1, after_sale_refund_reasons: '["本地测试退款"]', after_sale_return_reasons: '[]', delivery_express_free_enabled: 1, delivery_express_free_price: 0, delivery_pick_up_enabled: 1, brokerage_enabled: 0, brokerage_enabled_condition: 1, brokerage_bind_mode: 1, brokerage_poster_urls: '[]', brokerage_first_percent: 0, brokerage_second_percent: 0, brokerage_withdraw_min_price: 0, brokerage_withdraw_fee_percent: 0, brokerage_frozen_days: 0, brokerage_withdraw_types: '[]', tenant_id: 1 });
  await insert('pay_app', { id: 10001, app_key: 'mall', name: '本地商城联调', status: 0, remark: 'Local mock only', order_notify_url: 'http://127.0.0.1:48080/app-api/trade/order/update-paid', refund_notify_url: 'http://127.0.0.1:48080/admin-api/trade/after-sale/update-refunded', transfer_notify_url: 'http://127.0.0.1:48080/admin-api/pay/notify/transfer', tenant_id: 1 });
  await insert('pay_channel', { id: 10001, code: 'mock', status: 0, fee_rate: 0, app_id: 10001, remark: 'Local mock only; never copy to production', config: JSON.stringify({ '@class': 'cn.iocoder.yudao.module.pay.framework.pay.core.client.impl.NonePayClientConfig' }), tenant_id: 1 });
  await insert('product_category', { id: 10001, parent_id: 0, name: '少儿编程', pic_url: '', sort: 1, status: 0, tenant_id: 1 });
  await insert('product_category', { id: 10002, parent_id: 10001, name: '创意编程', pic_url: '', sort: 1, status: 0, tenant_id: 1 });
  await insert('product_brand', { id: 10001, name: 'VIBE CODING', pic_url: '', sort: 1, status: 0, tenant_id: 1 });
  await insert('product_spu', { id: 10001, name: '创意编程体验课', keyword: 'vibe coding', introduction: '本地验收课程', description: '用于验证原商城结算、库存、支付与退款。', category_id: 10002, brand_id: 10001, pic_url: '/assets/course-placeholder.svg', slider_pic_urls: '[]', sort: 1, status: 1, spec_type: 0, price: 9900, market_price: 9900, cost_price: 0, stock: 12, delivery_types: '2', delivery_template_id: 0, give_integral: 0, sub_commission_type: 0, sales_count: 0, virtual_sales_count: 0, browse_count: 0, tenant_id: 1 });
  await insert('product_sku', { id: 10001, spu_id: 10001, properties: '[]', price: 9900, market_price: 9900, cost_price: 0, bar_code: 'VIBE-LOCAL-10001', pic_url: '/assets/course-placeholder.svg', stock: 12, weight: 0, volume: 0, first_brokerage_price: 0, second_brokerage_price: 0, sales_count: 0, tenant_id: 1 });
  await insert('trade_delivery_pick_up_store', { id: 10001, name: '本地教学点', introduction: 'Local fixture', phone: '13900000000', area_id: 110101, detail_address: '本地验收', logo: '', opening_time: '09:00:00', closing_time: '18:00:00', latitude: 39.9, longitude: 116.4, verify_user_ids: '1', status: 0, tenant_id: 1 });
  for (const file of ['infra/sql/education.sql', 'infra/sql/education-menus.sql', 'infra/sql/education-content.sql']) {
    const p = path.join(root, file);
    if (fs.existsSync(p)) { await connection.query(fs.readFileSync(p, 'utf8')); console.log(`Applied ${file}`); }
  }
  const [[{ version }]] = await connection.query('SELECT VERSION() version');
  const [[{ count }]] = await connection.query('SELECT COUNT(*) count FROM information_schema.tables WHERE table_schema=DATABASE()');
  const report = { mysqlVersion: version, tables: count, upstreamCommit: '8e43004cf68a405cd3485f98f8a539b97ca6544a', adminUsername: 'admin', memberMobile: '13900000001', fixtureIds: { member: 10001, spu: 10001, sku: 10001, payApp: 10001, payChannel: 10001 }, credentials: '.runtime/foundation.env', localMockOnly: true };
  fs.writeFileSync(path.join(root, '.runtime/database-init-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Initialized ${count} tables on MySQL ${version}; original admin/member and mall fixtures ready. Credentials remain in ignored .runtime/foundation.env.`);
  await applyWebsiteSchema(connection, root);
  await seedWebsiteContent(connection, root);
} finally { await connection.end(); }
