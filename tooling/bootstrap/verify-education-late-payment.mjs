/** Local actual integration: original cancellation, original mock payment and original refund callbacks.
 * No SQL mutations, forged provider success, production endpoints or test-only server endpoints.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, '.tools/package.json'));
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8')
  .split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => {
    const separator = line.indexOf('='); return [line.slice(0, separator), line.slice(separator + 1)];
  }));
const db = await require('mysql2/promise').createConnection({ host: '127.0.0.1', port: 13306, user: 'vibe_edu', password: env.VIBE_DB_PASSWORD, database: 'vibe_edu', charset: 'utf8mb4' });
const base = 'http://127.0.0.1:48080', key = Date.now().toString(36);
const report = { startedAt: new Date().toISOString(), environment: 'Local MySQL 8.4; original foundation mock payment provider only', faultInjection: 'None: original member cancellation leaves its unexpired original pay order waiting, so a delayed submit can be exercised through existing APIs.', checks: [], fixtures: {}, observations: {}, limitations: [] };
const save = () => fs.writeFileSync(path.join(root, '.runtime/education-late-payment-report.json'), JSON.stringify(report, null, 2) + '\n');
let admin, member, memberId;
function pass(name, details = {}) { report.checks.push({ name, ...details }); save(); console.log(`PASS: ${name}`); }
async function api(url, { token, method = 'GET', body } = {}) {
  const response = await fetch(base + url, { method, headers: { 'tenant-id': '1', terminal: '10', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  const result = await response.json();
  if (result.code !== 0) throw Error(`${url}: ${result.code} ${result.msg}`);
  return result.data;
}
const app = (url, options = {}) => api('/app-api' + url, { token: member, ...options });
const staff = (url, options = {}) => api('/admin-api' + url, { token: admin, ...options });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fetcher, condition, seconds = 40) {
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) { const data = await fetcher(); if (condition(data)) return data; await delay(100); }
  throw Error('Timed out waiting for original payment/refund callback');
}
async function snapshot(orderId) {
  const [[data]] = await db.execute(`SELECT o.id orderId,o.pay_order_id payOrderId,o.status orderStatus,
    CAST(o.pay_status AS UNSIGNED) paid,o.refund_status refundStatus,o.refund_price refundPrice,
    i.id orderItemId,e.id enrollmentId,e.status enrollmentStatus,e.version enrollmentVersion,
    e.source enrollmentSource,e.trial_booking_id freeTrialSourceId,h.id holdId,h.status holdStatus,
    p.status paymentStatus,s.stock, c.id cohortId,c.sku_id skuId
    FROM trade_order o JOIN trade_order_item i ON i.order_id=o.id
    JOIN edu_enrollment e ON e.order_item_id=i.id JOIN edu_seat_hold h ON h.order_item_id=i.id
    JOIN edu_cohort c ON c.id=e.current_cohort_id JOIN product_sku s ON s.id=c.sku_id
    JOIN pay_order p ON p.id=o.pay_order_id WHERE o.id=?`, [orderId]);
  assert(data, `Missing original order/enrollment snapshot ${orderId}`); return data;
}
async function messagesAfter(id, title) {
  const [rows] = await db.execute("SELECT id FROM system_notify_message WHERE id>? AND user_id=? AND user_type=1 AND JSON_UNQUOTE(JSON_EXTRACT(template_params,'$.title'))=? ORDER BY id", [id, memberId, title]);
  return rows.map(row => row.id);
}
async function messageBaseline() { const [[row]] = await db.query('SELECT COALESCE(MAX(id),0) id FROM system_notify_message'); return row.id; }
async function child(label) { return app('/edu/student/create', { method: 'POST', body: { name: `TEST迟到付款${label}${key}`, birthMonth: `${new Date().getFullYear() - 10}-01`, grade: '本地验收', experience: 'TEST' } }); }
async function order(cohort, studentId) {
  return app('/trade/order/create', { method: 'POST', body: { items: [{ skuId: cohort.skuId, studentId, count: 1 }], deliveryType: 3, pointStatus: false, expectedPayPrice: cohort.price, remark: `TEST late payment ${key}` } });
}
async function cancel(value) { await app(`/trade/order/cancel?id=${value.id}`, { method: 'DELETE' }); const state = await snapshot(value.id); assert.equal(state.orderStatus, 40); assert.equal(state.paid, 0); assert.equal(state.enrollmentStatus, 'EXPIRED'); assert.equal(state.holdStatus, 'RELEASED'); assert.equal(state.paymentStatus, 0); return state; }
async function pay(value) { return app('/pay/order/submit', { method: 'POST', body: { id: value.payOrderId, channelCode: 'mock', channelExtras: {}, returnUrl: 'http://127.0.0.1:5174' } }); }
async function repeatPaid(value) { return api('/app-api/trade/order/update-paid', { method: 'POST', body: { merchantOrderId: String(value.id), payOrderId: value.payOrderId } }); }
async function task(type, dataId) {
  const [rows] = await db.execute('SELECT id,type,data_id dataId,merchant_order_id merchantOrderId,merchant_refund_id merchantRefundId,status,notify_times notifyTimes FROM pay_notify_task WHERE type=? AND data_id=?', [type, dataId]);
  return rows;
}

try {
  admin = (await api('/admin-api/system/auth/login', { method: 'POST', body: { username: 'admin', password: env.VIBE_ADMIN_PASSWORD } })).accessToken;
  member = (await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000001', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  memberId = (await app('/member/user/get')).id;
  const teachers = await staff('/edu/teacher/page?pageNo=1&pageSize=100');
  const teacher = teachers.list.find(row => row.userId === 1); assert(teacher, 'Original local administrator teacher fixture is required');
  const [[lastSession]] = await db.execute('SELECT MAX(end_time) lastEnd FROM edu_session WHERE teacher_id=? AND deleted=0', [teacher.id]);
  const anchor = Math.max(Date.now() + 60 * 86400000, +(lastSession.lastEnd || 0) + 86400000);
  const courseId = await staff('/edu/course/create', { method: 'POST', body: { code: `TEST-LATE-${key}`, name: `TEST迟到付款 ${key}`, description: '隔离本地交易验收数据，不用于真实销售。', coverUrl: 'http://127.0.0.1:5174/static/edu/courses/tools.jpg', ageMin: 8, ageMax: 16, direction: 'TOOL', level: 'BEGINNER', objectives: '本地验证', outcomes: '本地验证', lessons: [{ title: '本地支付生命周期验收', durationMinutes: 60, objectives: '验证取消后到账', materials: 'TEST', assignment: 'TEST' }] } });
  report.fixtures.courseId = courseId; save();
  await staff('/edu/course/publish', { method: 'POST', body: { id: courseId } });
  async function cohort(label, slot) {
    const start = anchor + slot * 86400000;
    const id = await staff('/edu/cohort/create', { method: 'POST', body: { courseId, name: `TEST ${label} ${key}`, kind: 'TRIAL', mode: 'ONLINE', teacherId: teacher.id, capacity: 1, price: 1200, terms: '仅本地故障恢复验收', refundPolicy: '无法恢复名额时由原支付退款', startDate: start, endDate: start + 3600000 } });
    await staff('/edu/session/create', { method: 'POST', body: { cohortId: id, title: label, teacherId: teacher.id, startTime: start, endTime: start + 3600000, joinInfo: { instructions: '本地 TEST 课堂' } } });
    await staff('/edu/cohort/publish', { method: 'POST', body: { id } });
    return app(`/edu/cohort/get?id=${id}`);
  }

  const available = await cohort('迟到付款可恢复', 0), unavailable = await cohort('迟到付款无名额', 1);
  const a = await child('A'), b = await child('B'), competitor = await child('C');
  report.fixtures.students = [a, b, competitor]; report.fixtures.cohorts = { available: available.id, unavailable: unavailable.id }; save();

  const recoverable = await order(available, a); report.fixtures.recoverable = recoverable; save();
  assert.equal((await snapshot(recoverable.id)).stock, 0);
  const cancelled = await cancel(recoverable); assert.equal(cancelled.stock, 1);
  pass('Original cancellation expires enrollment and releases stock before delayed payment', { orderId: recoverable.id, payOrderId: recoverable.payOrderId });
  const recoveryMessageStart = await messageBaseline();
  await pay(recoverable);
  const restored = await until(() => snapshot(recoverable.id), state => state.paid === 1 && state.enrollmentStatus === 'ACTIVE');
  assert.equal(restored.orderStatus, 10); assert.equal(restored.holdStatus, 'CONSUMED'); assert.equal(restored.stock, 0); assert.equal(restored.paymentStatus, 10); assert.equal(restored.enrollmentSource, 'ORDER'); assert.equal(restored.freeTrialSourceId, null);
  const [[trial]] = await db.execute('SELECT COUNT(*) count FROM edu_trial_booking WHERE order_item_id=? AND status=?', [restored.orderItemId, 'CONFIRMED']); assert.equal(trial.count, 1);
  const recoveryMessages = await messagesAfter(recoveryMessageStart, '课程报名已恢复'); assert.equal(recoveryMessages.length, 1);
  report.observations.restored = restored;
  pass('Delayed original mock payment reacquires one seat and restores the original enrollment', { orderItemId: restored.orderItemId, enrollmentId: restored.enrollmentId, paidTrialCount: trial.count, notificationIds: recoveryMessages });
  await repeatPaid(recoverable); await repeatPaid(recoverable);
  assert.deepEqual(await snapshot(recoverable.id), restored);
  assert.deepEqual(await messagesAfter(recoveryMessageStart, '课程报名已恢复'), recoveryMessages);
  const [[recoverRefund]] = await db.execute('SELECT COUNT(*) count FROM pay_refund WHERE order_id=?', [recoverable.payOrderId]); assert.equal(recoverRefund.count, 0);
  const paidTasks = await until(() => task(1, recoverable.payOrderId), rows => rows.length === 1 && rows[0].status === 10);
  pass('Repeated validated paid callbacks do not deduct, activate, notify or refund again', { originalPaymentNotificationTask: paidTasks[0] });

  const refundable = await order(unavailable, b); report.fixtures.refundable = refundable; save();
  assert.equal((await cancel(refundable)).stock, 1);
  const occupied = await order(unavailable, competitor); report.fixtures.competitor = occupied; save();
  assert.equal((await snapshot(occupied.id)).stock, 0);
  const refundMessageStart = await messageBaseline();
  const transitions = []; let stop = false;
  const observer = (async () => {
    const end = Date.now() + 45000;
    while (!stop && Date.now() < end) {
      const state = await snapshot(refundable.id);
      const signature = JSON.stringify([state.orderStatus, state.paid, state.enrollmentStatus, state.holdStatus, state.refundPrice]);
      if (!transitions.length || transitions.at(-1).signature !== signature) transitions.push({ observedAt: new Date().toISOString(), signature, state });
      if (state.holdStatus === 'REFUNDED') break;
      await delay(10);
    }
  })();
  let refunded;
  try {
    await pay(refundable);
    refunded = await until(() => snapshot(refundable.id), state => state.holdStatus === 'REFUNDED');
  } finally { stop = true; await observer; }
  report.observations.refundTransitions = transitions.map(({ signature, ...entry }) => entry);
  assert.equal(refunded.orderStatus, 40); assert.equal(refunded.paid, 1); assert.equal(refunded.enrollmentStatus, 'EXPIRED'); assert.equal(refunded.stock, 0); assert.equal(refunded.refundPrice, unavailable.price);
  const [refunds] = await db.execute('SELECT id,order_id payOrderId,merchant_order_id merchantOrderId,merchant_refund_id merchantRefundId,status,refund_price refundPrice,channel_refund_no channelRefundNo FROM pay_refund WHERE order_id=?', [refundable.payOrderId]);
  assert.equal(refunds.length, 1); const refund = refunds[0]; assert.equal(refund.status, 10); assert.equal(refund.refundPrice, unavailable.price); assert.equal(refund.merchantOrderId, String(refundable.id)); assert.equal(refund.merchantRefundId, `order-${refundable.id}`); assert.match(refund.channelRefundNo, /^MOCK-R-/);
  report.fixtures.originalRefund = refund;
  const refundTasks = await until(() => task(2, refund.id), rows => rows.length === 1 && rows[0].status === 10);
  const refundMessages = await messagesAfter(refundMessageStart, '迟到付款已退回'); assert.equal(refundMessages.length, 1);
  const [[noTrial]] = await db.execute('SELECT COUNT(*) count FROM edu_trial_booking WHERE order_item_id=?', [refunded.orderItemId]); assert.equal(noTrial.count, 0);
  assert.equal((await snapshot(occupied.id)).enrollmentStatus, 'PENDING_PAYMENT');
  pass('No-capacity late payment uses one original durable refund and confirms without granting enrollment', { orderId: refundable.id, payOrderId: refundable.payOrderId, originalRefund: refund, originalRefundNotificationTask: refundTasks[0], notificationIds: refundMessages });
  if (transitions.some(entry => entry.state.holdStatus === 'REFUND_PENDING')) {
    pass('Persisted REFUND_PENDING intent observed before original refund callback confirmation');
  } else {
    report.limitations.push('The synchronous original mock refund completed too quickly to sample REFUND_PENDING. Actual durable pay_refund/pay_notify_task and final REFUNDED were verified; intermediate intent ordering remains supported by the production transaction code, not claimed as an observed integration assertion.');
  }
  const finalRefundState = await snapshot(refundable.id);
  await repeatPaid(refundable); await repeatPaid(refundable);
  const refundCallback = { merchantOrderId: String(refundable.id), merchantRefundId: refund.merchantRefundId, payRefundId: refund.id };
  await api('/admin-api/trade/after-sale/update-refunded', { method: 'POST', body: refundCallback });
  await api('/admin-api/trade/after-sale/update-refunded', { method: 'POST', body: refundCallback });
  assert.deepEqual(await snapshot(refundable.id), finalRefundState);
  assert.deepEqual(await messagesAfter(refundMessageStart, '迟到付款已退回'), refundMessages);
  const [[refundCount]] = await db.execute('SELECT COUNT(*) count FROM pay_refund WHERE order_id=?', [refundable.payOrderId]); assert.equal(refundCount.count, 1);
  pass('Repeated validated paid/refund callbacks preserve one refund, no seat change and one guardian notice');
  await app(`/trade/order/cancel?id=${occupied.id}`, { method: 'DELETE' });
  assert.equal((await snapshot(occupied.id)).stock, 1);
  pass('Disposable competitor hold released through original cancellation without altering refunded order');
  report.status = report.limitations.length ? 'PASSED_WITH_LIMITATION' : 'PASSED'; report.completedAt = new Date().toISOString(); save();
} catch (error) {
  report.status = 'FAILED'; report.failure = error.message; save(); throw error;
} finally { await db.end(); }
