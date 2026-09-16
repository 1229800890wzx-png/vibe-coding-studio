/** Local-only acceptance through original member auth and system notification APIs. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8')
  .split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
const base = 'http://127.0.0.1:48080';
const endpoint = '/app-api/edu/notification';
const run = Date.now();
const report = { timestamp: new Date().toISOString(), scope: 'Local original-system in-app notifications only; no external channel', checks: [], fixtures: {}, skipped: [] };
const save = () => fs.writeFileSync(path.join(root, '.runtime/education-notification-report.json'), JSON.stringify(report, null, 2) + '\n');
function pass(name, details) {
  report.checks.push({ name, ...(details ? { details } : {}) }); save(); console.log(`PASS: ${name}`);
}
async function result(url, { token, method = 'GET', body } = {}) {
  const response = await fetch(base + url, {
    method, headers: { 'tenant-id': '1', terminal: '10', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000),
  });
  return response.json();
}
async function api(url, options) {
  const response = await result(url, options);
  if (response.code !== 0) throw Error(`${url}: ${response.code} ${response.msg}`);
  return response.data;
}
async function denied(url, options, name) {
  const response = await result(url, options);
  assert.notEqual(response.code, 0); pass(name, { code: response.code });
}
const page = (token, extra = '') => api(`${endpoint}/page?pageNo=1&pageSize=100${extra}`, { token });
const count = token => api(`${endpoint}/unread-count`, { token });
const read = (token, ids) => api(`${endpoint}/read`, { token, method: 'PUT', body: { ids } });

try {
  await denied(`${endpoint}/page?pageNo=1&pageSize=20`, {}, 'Anonymous page denied');
  await denied(`${endpoint}/unread-count`, {}, 'Anonymous unread count denied');
  await denied(`${endpoint}/read`, { method: 'PUT', body: { ids: [1] } }, 'Anonymous mutation denied');
  const admin = (await api('/admin-api/system/auth/login', { method: 'POST', body: { username: 'admin', password: env.VIBE_ADMIN_PASSWORD } })).accessToken;
  await denied(`${endpoint}/page?pageNo=1&pageSize=20`, { token: admin }, 'Administrator token cannot impersonate an app member');
  const first = (await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000001', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  const second = (await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000002', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  const firstUser = await api('/app-api/member/user/get', { token: first });
  const secondUser = await api('/app-api/member/user/get', { token: second });
  assert.notEqual(firstUser.id, secondUser.id);
  const secondUnreadBefore = await count(second);
  async function fixture(userId, suffix) {
    const title = `本地消息权限验收 ${run} ${suffix}`;
    const id = await api('/admin-api/system/notify-template/send-notify', {
      token: admin, method: 'POST', body: { userId, userType: 1, templateCode: 'edu_service_update', templateParams: { title, content: '仅供本地接口权限测试；没有外部短信、邮件或微信发送。' } },
    });
    assert(id); return { id, title, userId };
  }
  report.fixtures.first = await fixture(firstUser.id, 'A');
  report.fixtures.second = await fixture(secondUser.id, 'B'); save();
  const firstPage = await page(first), secondPage = await page(second);
  assert(firstPage.list.some(item => item.id === report.fixtures.first.id && item.title === report.fixtures.first.title && !item.readStatus));
  assert(!firstPage.list.some(item => item.id === report.fixtures.second.id));
  assert(secondPage.list.some(item => item.id === report.fixtures.second.id && !item.readStatus));
  assert(!secondPage.list.some(item => item.id === report.fixtures.first.id));
  const allowedFields = new Set(['content', 'createTime', 'id', 'readStatus', 'readTime', 'title']);
  assert(Object.keys(firstPage.list[0]).every(key => allowedFields.has(key)));
  assert(['id', 'title', 'content', 'readStatus', 'createTime'].every(key => key in firstPage.list[0]));
  pass('Each original member sees only their own minimal notification fields');
  const injected = await page(first, `&userId=${secondUser.id}&userType=2`);
  assert(injected.list.some(item => item.id === report.fixtures.first.id));
  assert(!injected.list.some(item => item.id === report.fixtures.second.id));
  pass('Client-supplied recipient and user type cannot override login identity');
  assert.equal(await read(first, [report.fixtures.second.id]), 0);
  assert((await page(second, '&readStatus=false')).list.some(item => item.id === report.fixtures.second.id));
  pass('Guessed cross-parent notification ID updates zero rows');
  assert.equal(await read(first, [report.fixtures.first.id]), 1);
  assert.equal(await read(first, [report.fixtures.first.id]), 0);
  assert(!(await page(first, '&readStatus=false')).list.some(item => item.id === report.fixtures.first.id));
  const readItem = (await page(first)).list.find(item => item.id === report.fixtures.first.id);
  assert.equal(readItem.readStatus, true); assert(readItem.readTime);
  pass('Own notification is marked read once and unread filter reflects persisted state');
  if (secondUnreadBefore === 0 && await count(second) === 1) {
    assert.equal(await api(`${endpoint}/read-all`, { token: second, method: 'PUT' }), 1);
    assert.equal(await count(second), 0);
    pass('Read all uses the original member-scoped update and count');
  } else {
    await read(second, [report.fixtures.second.id]);
    report.skipped.push('Read-all mutation skipped because unrelated existing unread notifications were present; fixture alone was marked read.');
  }
  await denied(`${endpoint}/read`, { token: first, method: 'PUT', body: { ids: [] } }, 'Empty read request rejected');
  await denied(`${endpoint}/read`, { token: first, method: 'PUT', body: { ids: Array.from({ length: 101 }, () => report.fixtures.first.id) } }, 'Oversized read request rejected');
  report.status = 'PASSED'; save();
} catch (error) {
  report.status = 'FAILED'; report.error = error.message; save(); throw error;
}
