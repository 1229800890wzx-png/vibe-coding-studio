import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').trim().split(/\r?\n/).map(s => s.trim().split('=')));
const base = 'http://127.0.0.1:48080';
const evidence = { upstreamCommit: '8e43004cf68a405cd3485f98f8a539b97ca6544a', timestamp: new Date().toISOString(), checks: [] };
async function api(url, { token, method='GET', body } = {}) {
  const response = await fetch(base + url, { method, headers: { 'tenant-id': '1', 'terminal': '10', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (result.code !== 0) throw new Error(`${method} ${url}: ${JSON.stringify(result)}`);
  return result.data;
}
function pass(check, details) { evidence.checks.push({ check, details }); console.log(`PASS: ${check}`); }
try {
  const anonymous = await fetch(`${base}/app-api/member/user/get`, { headers: { 'tenant-id': '1' } }).then(r=>r.json());
  assert.equal(anonymous.code, 401); pass('Original member authentication rejects anonymous requests');
  const mock = await fetch(`${base}/app-api/member/user/get`, { headers: { 'tenant-id': '1', Authorization: 'Bearer test10001' } }).then(r=>r.json());
  assert.equal(mock.code, 401); pass('Upstream authentication mock disabled');
  const admin = await api('/admin-api/system/auth/login', { method: 'POST', body: { username: 'admin', password: env.VIBE_ADMIN_PASSWORD } });
  assert(admin.accessToken); pass('Original system admin password login');
  const permission = await api('/admin-api/system/auth/get-permission-info', { token: admin.accessToken });
  assert(permission.roles?.length); pass('Original RBAC permission and menu retrieval');
  const member = await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000001', password: env.VIBE_MEMBER_PASSWORD } });
  assert(member.accessToken); pass('Original member password login');
  const token = member.accessToken;
  const product = await api('/app-api/product/spu/get-detail?id=10001', { token });
  assert.equal(product.id, 10001); pass('Original product SPU detail', { spuId: product.id });
  const params = new URLSearchParams({ 'items[0].skuId': '10001', 'items[0].count': '1', pointStatus: 'false', deliveryType: '2', pickUpStoreId: '10001', receiverName: '本地验收', receiverMobile: '13900000001' });
  const settlement = await api(`/app-api/trade/order/settlement?${params}`, { token });
  assert.equal(settlement.price.payPrice, 9900); pass('Original server price settlement', { payPrice: settlement.price.payPrice });
  const order = await api('/app-api/trade/order/create', { token, method:'POST', body: { items: [{ skuId: 10001, count: 1 }], pointStatus: false, deliveryType: 2, pickUpStoreId: 10001, receiverName: '本地验收', receiverMobile: '13900000001', remark: 'M0 upstream flow verification' } });
  assert(order.id && order.payOrderId); pass('Original trade order and pay order creation', order);
  const payment = await api('/app-api/pay/order/submit', { token, method:'POST', body: { id: order.payOrderId, channelCode: 'mock', channelExtras: {}, returnUrl: 'http://127.0.0.1:5173' } });
  assert.equal(payment.status, 10); pass('Original local MockPayClient payment', { payOrderId: order.payOrderId, status: payment.status });
  const paid = await api(`/app-api/trade/order/get-detail?id=${order.id}&sync=true`, { token });
  assert.equal(paid.payStatus, true); pass('Original payment-state validation updates trade order');
  const afterSale = await api('/app-api/trade/after-sale/create', { token, method:'POST', body: { orderItemId: paid.items[0].id, way: 10, refundPrice: 9900, applyReason: '本地测试退款', applyDescription: 'M0 local mock refund', applyPicUrls: [] } });
  pass('Original after-sale refund request', { afterSaleId: afterSale });
  await api(`/admin-api/trade/after-sale/agree?id=${afterSale}`, { token: admin.accessToken, method: 'PUT' });
  await api(`/admin-api/trade/after-sale/refund?id=${afterSale}`, { token: admin.accessToken, method: 'PUT' });
  pass('Original admin after-sale approval and local mock refund');
  let result;
  for (let attempt = 0; attempt < 30; attempt++) {
    result = await api(`/admin-api/trade/after-sale/get-detail?id=${afterSale}`, { token: admin.accessToken });
    if (result.status === 50) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.equal(result.status, 50, 'Original asynchronous refund callback must complete the trade after-sale');
  pass('Original refund callback completes after-sale status 50');
  evidence.afterSale = { id: afterSale, status: result.status, payRefundId: result.payRefundId };
  evidence.status = 'PASSED';
} catch(error) {
  evidence.status = 'FAILED';
  evidence.error = error.message;
  throw error;
} finally {
  fs.writeFileSync(path.join(root, '.runtime/upstream-flow-report.json'), JSON.stringify(evidence, null, 2) + '\n');
}
