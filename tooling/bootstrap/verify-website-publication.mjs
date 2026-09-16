/** Local real-API regression. Creates marked fixtures; no messages or payments. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').trim()
  .split(/\r?\n/).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }));
const report = { timestamp: new Date().toISOString(), checks: [] };
let token;
async function result(url, body, method = 'POST') {
  return fetch('http://127.0.0.1:48080' + url, { method,
    headers: { 'tenant-id': '1', 'Content-Type': 'application/json', ...(token && url.startsWith('/admin-api/') ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000),
  }).then(r => r.json());
}
async function api(url, body, method) {
  const r = await result(url, body, method);
  assert.equal(r.code, 0, `${url}: ${r.msg}`);
  return r.data;
}
function pass(name) { report.checks.push(name); console.log(`PASS: ${name}`); }
const offeringPath = '/admin-api/edu/website-offering';
let offering;
try {
  token = (await api('/admin-api/system/auth/login', { username: 'admin', password: env.VIBE_ADMIN_PASSWORD })).accessToken;
  const stamp = Date.now();
  const courseId = await api('/admin-api/edu/course/create', {
    name: `发布回归课程（测试）${stamp}`, code: `PUB-${stamp}`, description: '仅用于本地发布约束回归',
    coverUrl: 'http://127.0.0.1:5174/static/logo.png',
    ageMin: 8, ageMax: 16, direction: 'AI_CREATION', level: 'BEGINNER', objectives: '发布校验', outcomes: '回归记录',
    lessons: [{ title: '发布校验', durationMinutes: 90, objectives: '回归验证', materials: '测试', assignment: '测试' }],
  });
  offering = await api(offeringPath + '/create', {
    slug: `regression-${stamp}`, title: '发布约束回归（测试）', description: '仅用于本地验证',
    outline: '', stage: 1, image: 'minecraft', sortOrder: 999, courseId,
  });
  const publish = await result(offeringPath + '/publish', { id: offering.id, revision: offering.revision, published: true });
  assert.notEqual(publish.code, 0); assert.match(publish.msg, /发布关联的业务课程/);
  const read = () => api(offeringPath + '/list', undefined, 'GET').then(rows => rows.find(r => r.id === offering.id));
  assert.equal((await read()).published, false);
  pass('Draft-linked offering publication rejected without changing stored state');
  offering = await api(offeringPath + '/update', { ...offering, title: '草稿编辑回归（测试）' }, 'PUT');
  pass('Draft offering remains editable with a draft course');
  offering = await api(offeringPath + '/update', { ...offering, courseId: null }, 'PUT');
  offering = await api(offeringPath + '/publish', { id: offering.id, revision: offering.revision, published: true });
  pass('Unlinked informational offering can publish');
  const relink = await result(offeringPath + '/update', { ...offering, courseId }, 'PUT');
  assert.notEqual(relink.code, 0); assert.match(relink.msg, /发布关联的业务课程/);
  assert.equal((await read()).courseId, null);
  pass('Published offering relink to draft rejected without changing stored link');
  await api('/admin-api/edu/course/publish', { id: courseId, version: 0 });
  offering = await api(offeringPath + '/update', { ...offering, courseId }, 'PUT');
  const publicRows = await api('/app-api/edu/website-offering/list', undefined, 'GET');
  assert(publicRows.some(row => row.id === offering.id && row.courseId === courseId));
  pass('Published-course link is visible through the public endpoint');
  report.status = 'PASSED';
} catch (error) {
  report.status = 'FAILED'; report.error = error.message; throw error;
} finally {
  if (offering?.published) {
    await api(offeringPath + '/publish', { id: offering.id, revision: offering.revision, published: false });
    pass('Only this regression offering was unpublished after verification');
  }
  fs.writeFileSync(path.join(root, '.runtime/website-publication-report.json'), JSON.stringify(report, null, 2) + '\n');
}
