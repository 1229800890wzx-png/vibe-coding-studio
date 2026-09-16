/** Local coupon acceptance: only original auth, coupon, quote, order, refund and cart APIs. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, '.tools/package.json'));
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => { const separator = line.indexOf('='); return [line.slice(0, separator), line.slice(separator + 1)]; }));
const db = await require('mysql2/promise').createConnection({ host: '127.0.0.1', port: 13306, user: 'vibe_edu', password: env.VIBE_DB_PASSWORD, database: 'vibe_edu', charset: 'utf8mb4' });
const base = 'http://127.0.0.1:48080', key = Date.now().toString(36), discount = 1001, unitPrice = 5000, capacity = 6;
const previousPath = path.join(root, '.runtime/education-coupon-report.json');
const previous = fs.existsSync(previousPath) ? JSON.parse(fs.readFileSync(previousPath, 'utf8')) : null;
const report = { startedAt: new Date().toISOString(), scope: 'Actual local original services and original mock pay only. SQL reads only; no production code/configuration changes or external messaging.', checks: [], fixtures: {}, browser: {} };
if (previous?.status === 'FAILED') report.previousFailedAttempts = [...(previous.previousFailedAttempts || (previous.previousFailedAttempt ? [previous.previousFailedAttempt] : [])), { startedAt: previous.startedAt, failure: previous.failure, fixtures: previous.fixtures }];
const save = () => fs.writeFileSync(path.join(root, '.runtime/education-coupon-report.json'), JSON.stringify(report, null, 2) + '\n');
let admin, member, memberId, cohort;
function pass(name, details = {}) { report.checks.push({ name, ...details }); save(); console.log(`PASS: ${name}`); }
async function api(url, { token, method = 'GET', body } = {}) {
  const response = await fetch(base + url, { method, headers: { 'tenant-id': '1', terminal: '10', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  const result = await response.json(); if (result.code !== 0) throw Error(`${url}: ${result.code} ${result.msg}`); return result.data;
}
const app = (url, options = {}) => api('/app-api' + url, { token: member, ...options });
const staff = (url, options = {}) => api('/admin-api' + url, { token: admin, ...options });
async function until(fetcher, check) { const end = Date.now() + 40000; while (Date.now() < end) { const value = await fetcher(); if (check(value)) return value; await new Promise(resolve => setTimeout(resolve, 200)); } throw Error('Timed out waiting for original callback'); }
async function stock() { return (await app(`/edu/cohort/get?id=${cohort.id}`)).stock; }
async function child(label) { const name = `TEST券验收${label}${key}`; return { id: await app('/edu/student/create', { method: 'POST', body: { name, birthMonth: `${new Date().getFullYear() - 10}-01`, grade: '本地验收', experience: 'TEST' } }), name }; }
async function coupon(label, spuId) {
  const name = `TEST ${label} 减10.01元 ${key}`;
  const templateId = await staff('/promotion/coupon-template/create', { method: 'POST', body: { name, description: '仅限本地 TEST 课程验收，不用于真实营销。', totalCount: 1, takeLimitCount: 1, takeType: 2, usePrice: 0, productScope: 2, productScopeValues: [spuId], validityType: 2, fixedStartTerm: 0, fixedEndTerm: 7, discountType: 1, discountPrice: discount } });
  (report.fixtures.createdTemplates ??= []).push({ id: templateId, name }); save();
  await staff('/promotion/coupon/send', { method: 'POST', body: { templateId, userIds: [memberId] } });
  const [[record]] = await db.execute('SELECT id FROM promotion_coupon WHERE template_id=? AND user_id=?', [templateId, memberId]); assert(record);
  const value = await app(`/promotion/coupon/get?id=${record.id}`); assert.equal(value.status, 1); assert.equal(value.name, name); assert.equal(value.discountPrice, discount);
  // Original LocalDateTime is stored at MySQL datetime second precision. Respect the returned start.
  if (value.validStartTime > Date.now()) await new Promise(resolve => setTimeout(resolve, value.validStartTime - Date.now() + 20));
  return { id: record.id, templateId, name };
}
async function quote(students, couponId) {
  const params = new URLSearchParams({ deliveryType: '3', pointStatus: 'false', ...(couponId ? { couponId: String(couponId) } : {}) });
  students.forEach((student, index) => { params.set(`items[${index}].skuId`, String(cohort.skuId)); params.set(`items[${index}].studentId`, String(student.id)); params.set(`items[${index}].count`, '1'); });
  return app(`/trade/order/settlement?${params}`);
}
async function createOrder(students, couponId, settlement) {
  return app('/trade/order/create', { method: 'POST', body: { items: students.map(student => ({ skuId: cohort.skuId, studentId: student.id, count: 1 })), deliveryType: 3, pointStatus: false, couponId, expectedPayPrice: settlement.price.payPrice, remark: `TEST coupon ${key}` } });
}
async function allocation(orderId) {
  const [rows] = await db.execute('SELECT id,student_id studentId,sku_id skuId,count,price,coupon_price couponPrice,pay_price payPrice FROM trade_order_item WHERE order_id=? ORDER BY id', [orderId]); return rows;
}

try {
  admin = (await api('/admin-api/system/auth/login', { method: 'POST', body: { username: 'admin', password: env.VIBE_ADMIN_PASSWORD } })).accessToken;
  member = (await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000001', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  memberId = (await app('/member/user/get')).id;
  const [counterDefaults] = await db.query("SELECT column_name columnName,column_default defaultValue,is_nullable nullable FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='promotion_coupon_template' AND column_name IN ('take_count','use_count') ORDER BY column_name");
  assert(counterDefaults.length === 2 && counterDefaults.every(value => value.defaultValue === '0' && value.nullable === 'NO'));
  report.publicSchemaReconciliation = { source: 'infra/database/model-overrides.json and 21-public-model-reconciliations.sql', counterDefaults };
  const teacher = (await staff('/edu/teacher/page?pageNo=1&pageSize=100')).list.find(value => value.userId === 1); assert(teacher);
  const [[scheduled]] = await db.execute('SELECT MAX(end_time) lastEnd FROM edu_session WHERE teacher_id=? AND deleted=0', [teacher.id]);
  const start = Math.max(Date.now() + 60 * 86400000, +(scheduled.lastEnd || 0) + 86400000);
  const courseName = `TEST 双孩子优惠券 ${key}`;
  const courseId = await staff('/edu/course/create', { method: 'POST', body: { code: `TEST-COUPON-${key}`, name: courseName, description: '本地优惠券分摊与状态验收，不用于销售。', coverUrl: 'http://127.0.0.1:5174/static/edu/courses/tools.jpg', ageMin: 8, ageMax: 16, direction: 'TOOL', level: 'BEGINNER', objectives: '本地验证', outcomes: '本地验证', lessons: [{ title: '优惠券与报名验收', durationMinutes: 60, objectives: '本地验证', materials: 'TEST', assignment: 'TEST' }] } });
  report.fixtures.course = { id: courseId, name: courseName }; save();
  await staff('/edu/course/publish', { method: 'POST', body: { id: courseId } });
  const cohortName = `TEST 双孩子券体验班 ${key}`;
  const cohortId = await staff('/edu/cohort/create', { method: 'POST', body: { courseId, name: cohortName, kind: 'TRIAL', mode: 'ONLINE', teacherId: teacher.id, capacity, price: unitPrice, terms: '仅本地验收', refundPolicy: '部分退款保留学习资格；按原优惠券规则处理。', startDate: start, endDate: start + 3600000 } });
  await staff('/edu/session/create', { method: 'POST', body: { cohortId, title: '本地双孩子优惠券课次', teacherId: teacher.id, startTime: start, endTime: start + 3600000, joinInfo: { instructions: '本地 TEST 课堂' } } });
  await staff('/edu/cohort/publish', { method: 'POST', body: { id: cohortId } });
  cohort = await app(`/edu/cohort/get?id=${cohortId}`);
  const linkedCourse = await app(`/edu/course/get?id=${courseId}`);
  report.fixtures.cohort = { id: cohort.id, name: cohortName, skuId: cohort.skuId, spuId: linkedCourse.spuId }; save();
  assert.equal(await stock(), capacity);
  const students = [await child('A'), await child('B')]; report.fixtures.students = students;
  const usedCoupon = await coupon('生命周期券', linkedCourse.spuId); report.fixtures.coupon = usedCoupon; save();
  pass('Original coupon template and admin grant create one scoped flat coupon for the original member', { couponId: usedCoupon.id, templateId: usedCoupon.templateId });
  const before = await quote(students);
  report.fixtures.initialCouponOptions = before.coupons; save();
  assert.equal(before.price.payPrice, unitPrice * 2); assert(before.coupons.some(value => value.id === usedCoupon.id && value.match === true));
  const discounted = await quote(students, usedCoupon.id);
  assert.equal(discounted.price.totalPrice, unitPrice * 2); assert.equal(discounted.price.couponPrice, discount); assert.equal(discounted.price.payPrice, unitPrice * 2 - discount); assert.equal(discounted.items.length, 2); assert.deepEqual(discounted.items.map(value => value.studentId).sort(), students.map(value => value.id).sort());
  pass('Original settlement offers the eligible coupon and quotes both same-SKU children with 1001-fen discount', { quotedPrice: discounted.price });
  const unpaid = await createOrder(students, usedCoupon.id, discounted); report.fixtures.unpaidOrder = unpaid; save();
  const lines = await allocation(unpaid.id); assert.equal(lines.length, 2); assert.equal(new Set(lines.map(line => line.studentId)).size, 2); assert(lines.every(line => line.skuId === cohort.skuId && line.count === 1));
  assert.equal(lines.reduce((sum, line) => sum + line.couponPrice, 0), discount); assert.equal(lines.reduce((sum, line) => sum + line.payPrice, 0), discounted.price.payPrice); assert.deepEqual(lines.map(line => line.couponPrice).sort(), [500, 501]);
  const orderView = await app(`/trade/order/get-detail?id=${unpaid.id}`); assert.equal(orderView.couponId, usedCoupon.id); assert.equal(orderView.payPrice, discounted.price.payPrice); assert.equal((await app(`/promotion/coupon/get?id=${usedCoupon.id}`)).status, 2); assert.equal(await stock(), capacity - 2);
  pass('Original order persists 500/501-fen line allocation without losing a child or a cent', { orderId: unpaid.id, lines });
  await app(`/trade/order/cancel?id=${unpaid.id}`, { method: 'DELETE' });
  assert.equal((await app(`/promotion/coupon/get?id=${usedCoupon.id}`)).status, 1); assert.equal(await stock(), capacity);
  const returned = await quote(students, usedCoupon.id); assert.equal(returned.price.payPrice, discounted.price.payPrice);
  pass('Unpaid cancellation restores the original coupon and both cohort seats');
  const paidOrder = await createOrder(students, usedCoupon.id, returned); report.fixtures.paidOrder = paidOrder; save();
  await app('/pay/order/submit', { method: 'POST', body: { id: paidOrder.payOrderId, channelCode: 'mock', channelExtras: {}, returnUrl: 'http://127.0.0.1:5174' } });
  const paid = await until(() => app(`/trade/order/get-detail?id=${paidOrder.id}&sync=true`), value => value.payStatus === true);
  const paidLines = await allocation(paidOrder.id); assert.equal(paidLines.reduce((sum, line) => sum + line.payPrice, 0), discounted.price.payPrice); assert.equal((await app(`/promotion/coupon/get?id=${usedCoupon.id}`)).status, 2);
  const afterSaleId = await app('/trade/after-sale/create', { method: 'POST', body: { orderItemId: paid.items[0].id, way: 10, refundPrice: 100, entitlementAction: 'KEEP', applyReason: '本地测试退款', applyDescription: 'TEST 优惠券部分退款不返券验收', applyPicUrls: [] } });
  report.fixtures.afterSaleId = afterSaleId; save();
  await staff(`/trade/after-sale/agree?id=${afterSaleId}`, { method: 'PUT' }); await staff(`/trade/after-sale/refund?id=${afterSaleId}`, { method: 'PUT' });
  await until(() => staff(`/trade/after-sale/get-detail?id=${afterSaleId}`), value => value.status === 50);
  assert.equal((await app(`/promotion/coupon/get?id=${usedCoupon.id}`)).status, 2); assert.equal(await stock(), capacity - 2);
  const [enrollments] = await db.execute('SELECT e.id,e.status FROM edu_enrollment e JOIN trade_order_item i ON i.id=e.order_item_id WHERE i.order_id=?', [paidOrder.id]); assert(enrollments.length === 2 && enrollments.every(value => value.status === 'ACTIVE'));
  const [[usedState]] = await db.execute('SELECT status,use_order_id useOrderId FROM promotion_coupon WHERE id=?', [usedCoupon.id]); assert.equal(usedState.useOrderId, paidOrder.id);
  pass('Paid partial KEEP refund preserves the redeemed coupon and both active enrollments', { orderId: paidOrder.id, afterSaleId, couponState: usedState, refundPrice: 100 });

  const previewStudents = [await child('页面C'), await child('页面D')];
  const previewCoupon = await coupon('页面验收券', linkedCourse.spuId);
  const originalCart = await app('/trade/cart/list');
  const oldSelected = [...(originalCart.validList || []), ...(originalCart.invalidList || [])].filter(value => value.selected).map(value => value.id);
  report.browser = { memberId, students: previewStudents, coupon: previewCoupon, cohort: report.fixtures.cohort, previouslySelectedCartIds: oldSelected }; save();
  if (oldSelected.length) await app('/trade/cart/update-selected', { method: 'PUT', body: { ids: oldSelected, selected: false } });
  for (const student of previewStudents) await app('/trade/cart/add', { method: 'POST', body: { skuId: cohort.skuId, studentId: student.id, count: 1 } });
  let cart = await app('/trade/cart/list');
  const ownLines = cart.validList.filter(value => value.sku.id === cohort.skuId && previewStudents.some(student => student.id === value.studentId)); assert.equal(ownLines.length, 2);
  await app('/trade/cart/update-selected', { method: 'PUT', body: { ids: ownLines.map(value => value.id), selected: true } });
  cart = await app('/trade/cart/list'); assert.deepEqual(cart.validList.filter(value => value.selected).map(value => value.id).sort(), ownLines.map(value => value.id).sort());
  const previewQuote = await quote(previewStudents, previewCoupon.id); assert.equal(previewQuote.price.payPrice, unitPrice * 2 - discount); assert.equal((await app(`/promotion/coupon/get?id=${previewCoupon.id}`)).status, 1); assert.equal(await stock(), capacity - 2);
  report.browser.cartIds = ownLines.map(value => value.id); report.browser.quote = previewQuote.price; report.browser.remainingStock = capacity - 2;
  pass('Browser fixture retains one unused coupon and exactly two selected unbought child cart lines', { couponId: previewCoupon.id, cartIds: report.browser.cartIds, previousSelectionRetainedForRestore: oldSelected });
  report.status = 'PASSED'; report.completedAt = new Date().toISOString(); save();
} catch (error) { report.status = 'FAILED'; report.failure = error.message; save(); throw error; }
finally { await db.end(); }
