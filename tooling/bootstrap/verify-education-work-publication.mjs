/** Real local API + original infra storage regression. Creates only TEST work fixtures. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, '.tools/package.json'));
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').trim().split(/\r?\n/).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }));
const db = await require('mysql2/promise').createConnection({ host: '127.0.0.1', port: 13306, user: 'vibe_edu', password: env.VIBE_DB_PASSWORD, database: 'vibe_edu' });
const base = 'http://127.0.0.1:48080', key = Date.now().toString(36), day = 86400000;
const report = { startedAt: new Date().toISOString(), checks: [], fixtures: {}, environment: 'Actual local API/MySQL/original FileService; TEST only' };
const save = () => fs.writeFileSync(path.join(root, '.runtime/education-work-publication-report.json'), JSON.stringify(report, null, 2) + '\n');
function pass(name) { report.checks.push({ name, status: 'PASSED' }); save(); console.log(`PASS: ${name}`); }
let admin, member, stranger, workId, bookingId;
async function response(url, { token, method = 'GET', body, form } = {}) {
  return fetch(base + url, { method, signal: AbortSignal.timeout(30000), headers: { 'tenant-id': '1', terminal: '10', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(!form ? { 'Content-Type': 'application/json' } : {}) }, ...(form ? { body: form } : body ? { body: JSON.stringify(body) } : {}) });
}
async function api(url, options) { const result = await (await response(url, options)).json(); assert.equal(result.code, 0, `${url}: ${result.code} ${result.msg}`); return result.data; }
async function denied(url, options) { const result = await (await response(url, options)).json(); assert.notEqual(result.code, 0, `${url} must reject`); }
const staff = (url, body) => api('/admin-api/edu' + url, { token: admin, ...(body ? { method: 'POST', body } : {}) });
const app = (url, body) => api('/app-api/edu' + url, { token: member, ...(body ? { method: 'POST', body } : {}) });
const publicFile = (id, version, attachment) => `/app-api/edu/work/public-file?id=${id}&version=${version}&attachment=${attachment}`;
function noPrivateIdentity(value) {
  if (Array.isArray(value)) return value.forEach(noPrivateIdentity);
  if (!value || typeof value !== 'object') return;
  for (const [name, child] of Object.entries(value)) {
    assert(!['studentId', 'studentName', 'guardianMemberId', 'submissionId', 'fileId', 'ownerMemberId', 'tenantId', 'url', 'path', 'sha256'].includes(name), `Private field leaked: ${name}`);
    noPrivateIdentity(child);
  }
}
try {
  admin = (await api('/admin-api/system/auth/login', { method: 'POST', body: { username: 'admin', password: env.VIBE_ADMIN_PASSWORD } })).accessToken;
  member = (await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000001', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  stranger = (await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000002', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  const teacher = (await staff('/teacher/page?pageNo=1&pageSize=100')).list.find(item => item.status === 'PUBLISHED');
  assert(teacher, 'A previously configured published original-account teacher is required');
  const [timeline] = await db.query('SELECT start_time,end_time FROM edu_session WHERE teacher_id=? AND status<>? AND deleted=0', [teacher.id, 'CANCELLED']);
  let start = Date.now() + 90 * day;
  while (timeline.some(item => start < new Date(item.end_time).getTime() && start + 3600000 > new Date(item.start_time).getTime())) start += day;
  const studentId = await app('/student/create', { name: `TEST作品孩子${key}`, birthMonth: `${new Date().getFullYear() - 10}-01`, grade: 'TEST', experience: 'TEST public work regression' });
  const courseId = await staff('/course/create', { code: `TEST-W-${key}`, name: `TEST作品课程${key}`, description: 'TEST publication only', coverUrl: 'http://127.0.0.1:5174/static/edu/courses/tools.jpg', ageMin: 8, ageMax: 16, direction: 'TOOL', lessons: [{ title: 'TEST作品课', objectives: 'TEST snapshot', materials: 'TEST', assignment: 'TEST', durationMinutes: 60 }] });
  await staff('/course/publish', { id: courseId, version: 0 });
  const cohortId = await staff('/cohort/create', { courseId, teacherId: teacher.id, name: `TEST作品班${key}`, kind: 'TRIAL', mode: 'ONLINE', capacity: 12, price: 0, terms: 'TEST only', refundPolicy: 'TEST only' });
  const sessionId = await staff('/session/create', { cohortId, teacherId: teacher.id, title: 'TEST作品课次', startTime: start, endTime: start + 3600000, joinInfo: { instructions: 'TEST only' }, materials: [] });
  await staff('/cohort/publish', { id: cohortId });
  const booking = await app('/trial/create', { studentId, cohortId }); bookingId = booking.id;
  const assignmentId = await staff('/assignment/create', { cohortId, sessionId, title: 'TEST发布作品任务', description: 'TEST snapshot attachments', dueTime: start + day, status: 'PUBLISHED', materials: [] });
  async function upload(name, bytes) { const form = new FormData(); form.set('studentId', String(studentId)); form.set('file', new Blob([bytes]), name); return api('/app-api/edu/file/upload', { token: member, method: 'POST', form }); }
  const htmlBytes = Buffer.from('<!doctype html><title>TEST immutable work</title><script>window.TEST_EXECUTABLE=true</script>');
  const zipBytes = Buffer.alloc(22); zipBytes.writeUInt32LE(0x06054b50, 0);
  const html = await upload(`TEST-work-${key}.html`, htmlBytes), zip = await upload(`TEST-work-${key}.zip`, zipBytes), privateFile = await upload(`TEST-private-${key}.txt`, 'TEST private unreviewed bytes');
  const content = 'TEST第一个不可变作品版本：我用故事解释了程序的行为。';
  const submission = await app('/submission/submit', { studentId, assignmentId, content, attachments: [html, zip] });
  workId = await app('/work/create', { studentId, submissionId: submission.id, title: `TEST公开作品${key}`, description: 'TEST immutable work preview' });
  Object.assign(report.fixtures, { studentId, courseId, cohortId, sessionId, assignmentId, bookingId, submissionId: submission.id, workId, privateFileId: privateFile.fileId }); save();
  const preview = await app(`/work/preview?id=${workId}&version=1`);
  assert.equal(preview.content, content); assert.equal(preview.attachments.length, 2); assert.deepEqual(preview.attachments.map(item => item.index), [0, 1]); noPrivateIdentity(preview);
  await denied(`/app-api/edu/work/preview?id=${workId}&version=1`, { token: stranger });
  await denied(`/app-api/edu/work/preview?id=${workId}&version=2`, { token: member });
  const ownBytes = await response(`/app-api/edu/work/preview-file?id=${workId}&version=1&attachment=0`, { token: member }); assert.equal(ownBytes.status, 200); assert.deepEqual(Buffer.from(await ownBytes.arrayBuffer()), htmlBytes);
  assert.equal((await response(`/app-api/edu/work/preview-file?id=${workId}&version=1&attachment=0`, { token: stranger })).status, 404);
  pass('Exact immutable version preview and files available only to owning guardian');
  await app('/submission/submit', { studentId, assignmentId, content: 'TEST later submission must not replace earlier work snapshot', attachments: [privateFile] });
  assert.equal((await app(`/work/preview?id=${workId}&version=1`)).content, content);
  assert.equal((await app(`/work/preview?id=${workId}&version=1`)).attachments.length, 2);
  pass('New submission version cannot change an existing work snapshot');
  await denied(`/app-api/edu/work/public-get?id=${workId}`);
  assert.equal((await response(publicFile(workId, 1, 0))).status, 404);
  await denied('/app-api/edu/work/consent', { token: member, method: 'POST', body: { id: workId, version: 2 } });
  await app('/work/consent', { id: workId, version: 1 });
  assert.equal((await response(publicFile(workId, 1, 0))).status, 404);
  await staff('/work/moderate', { id: workId, status: 'APPROVED', note: 'TEST fixture approved' });
  assert.equal((await response(publicFile(workId, 1, 0))).status, 404);
  await staff('/work/publish', { id: workId });
  const publicResponse = await response(`/app-api/edu/work/public-get?id=${workId}&version=1`); assert.match(publicResponse.headers.get('cache-control'), /no-store/);
  const published = (await publicResponse.json()).data; assert.equal(published.content, content); assert.deepEqual(published.attachments, preview.attachments); noPrivateIdentity(published);
  pass('Consent, moderation and explicit publication jointly gate sanitized public content');
  for (const [index, bytes] of [htmlBytes, zipBytes].entries()) {
    const downloaded = await response(publicFile(workId, 1, index)); assert.equal(downloaded.status, 200); assert.match(downloaded.headers.get('content-type'), /^application\/octet-stream(?:;|$)/); assert.match(downloaded.headers.get('content-disposition'), /^attachment/); assert.equal(downloaded.headers.get('x-content-type-options'), 'nosniff'); assert.match(downloaded.headers.get('content-security-policy'), /sandbox/); assert.match(downloaded.headers.get('cache-control'), /no-store/); assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes);
  }
  pass('Anonymous HTML and ZIP downloads preserve bytes and force non-executing attachment responses');
  for (const [version, index] of [[2, 0], [1, -1], [1, 2], [1, privateFile.fileId]]) assert.equal((await response(publicFile(workId, version, index))).status, 404);
  const otherWork = await app('/work/create', { studentId, submissionId: submission.id, title: 'TEST unreviewed work', description: 'TEST private' });
  assert.equal((await response(publicFile(otherWork, 1, 0))).status, 404);
  pass('Guessed private file IDs, out-of-version ordinals and unreviewed work cannot expose attachments');
  await app('/work/revoke', { id: workId });
  await denied(`/app-api/edu/work/public-get?id=${workId}&version=1`);
  for (const index of [0, 1]) assert.equal((await response(publicFile(workId, 1, index))).status, 404);
  assert(!(await api('/app-api/edu/work/public-page')).list.some(item => item.id === workId));
  assert.equal((await app(`/work/preview?id=${workId}&version=1`)).content, content);
  await app('/work/consent', { id: workId, version: 1 });
  assert.equal((await response(publicFile(workId, 1, 0))).status, 404);
  pass('Revocation blocks old public metadata/file requests; re-consent needs fresh review and publication');
  report.status = 'PASSED';
} catch (error) { report.status = 'FAILED'; report.error = error.message; console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
finally {
  if (workId) await app('/work/revoke', { id: workId }).catch(error => { report.cleanupError = error.message; });
  if (bookingId) await app('/trial/cancel', { id: bookingId }).catch(error => { report.cleanupError = error.message; });
  report.completedAt = new Date().toISOString(); save(); await db.end();
}
