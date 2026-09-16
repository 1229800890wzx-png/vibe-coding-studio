/** Actual local API/MySQL scheduling regression. Every created record is a TEST fixture.
 * Uses original system/member auth. Never logs credentials or authentication tokens.
 * Controlled locks touch only fixture rows; all order cleanup uses original cancellation.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, '.tools/package.json'));
const mysql = require('mysql2/promise');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').trim().split(/\r?\n/).map(line => {
  const offset = line.indexOf('=');
  return [line.slice(0, offset), line.slice(offset + 1)];
}));
const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'vibe_edu', password: env.VIBE_DB_PASSWORD, database: 'vibe_edu', charset: 'utf8mb4' });
const base = 'http://127.0.0.1:48080';
const key = Date.now().toString(36), day = 86400000, hour = 3600000;
const anchor = Date.now() + 60 * day;
const report = { startedAt: new Date().toISOString(), environment: 'Actual local Java21 API / MySQL8.4; TEST fixtures only', checks: [], fixtures: { users: [], teachers: [], courses: [], cohorts: [], sessions: [], students: [], orders: [] } };
const reportPath = path.join(root, '.runtime/education-scheduling-report.json');
const save = () => fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
let admin, member;

async function request(url, { token, method = 'GET', body, acceptFailure = false } = {}) {
  const response = await fetch(base + url, {
    method, signal: AbortSignal.timeout(45000),
    headers: { 'Content-Type': 'application/json', 'tenant-id': '1', terminal: '10', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const result = await response.json();
  if (!acceptFailure && result.code !== 0) throw new Error(`${method} ${url}: ${result.code} ${result.msg}`);
  return acceptFailure ? result : result.data;
}
const staff = (url, options = {}) => request('/admin-api' + url, { token: admin, ...options });
const app = (url, options = {}) => request('/app-api' + url, { token: member, ...options });
const post = (url, body, acceptFailure = false) => staff('/edu' + url, { method: 'POST', body, acceptFailure });
async function check(name, action) {
  try {
    const details = await action();
    report.checks.push({ name, status: 'PASSED', details });
    console.log(`PASS: ${name}`);
  } catch (error) {
    report.checks.push({ name, status: 'FAILED', error: error.message });
    console.log(`FAIL: ${name}: ${error.message}`);
  }
  save();
}
function requireDomainConflict(response, pattern) {
  assert.equal(response.code, 1090000001, `Expected education validation error, got ${response.code}: ${response.msg}`);
  assert.match(response.msg, pattern);
}
// Both HTTP transactions start while a fixture row is locked. This exposes stale
// REPEATABLE READ snapshots after the row lock is released, instead of relying on timing.
async function raceOnFixture(table, id, operations) {
  assert(['edu_teacher_profile', 'edu_room', 'edu_student', 'edu_cohort'].includes(table));
  await db.beginTransaction();
  await db.query(`SELECT id FROM ${table} WHERE id=? AND tenant_id=1 FOR UPDATE`, [id]);
  let requests;
  try {
    requests = operations.map(operation => operation());
    await new Promise(resolve => setTimeout(resolve, 600));
  } finally { await db.rollback(); }
  return Promise.all(requests);
}
async function teacher(label) {
  const userId = await staff('/system/user/create', { method: 'POST', body: { username: `TESTsched${key}${label}`, nickname: `TEST排课教师${label}`, password: env.VIBE_ADMIN_PASSWORD, postIds: [], remark: 'TEST scheduling regression only' } });
  report.fixtures.users.push(userId);
  const id = await post('/teacher/create', { userId, name: `TEST教师${label}-${key}`, bio: 'TEST local scheduling regression; not real teaching staff.', status: 'PUBLISHED' });
  report.fixtures.teachers.push(id);
  return id;
}
async function course(label, count = 2) {
  const id = await post('/course/create', {
    name: `TEST排课课程${label}-${key}`, code: `TEST-S-${key}-${label}`, description: 'TEST scheduling validation only, not for enrollment.',
    coverUrl: 'http://127.0.0.1:5174/static/edu/courses/tools.jpg', ageMin: 8, ageMax: 16, direction: 'TOOL', level: 'BEGINNER',
    objectives: 'TEST scheduling', outcomes: 'TEST assertions',
    lessons: Array.from({ length: count }, (_, index) => ({ title: `TEST课时${index + 1}`, durationMinutes: 60, objectives: 'TEST objective', materials: 'TEST material', assignment: 'TEST assignment' }))
  });
  report.fixtures.courses.push(id);
  await post('/course/publish', { id, version: 0 });
  return id;
}
async function cohort(courseId, teacherId, label, extra = {}) {
  const id = await post('/cohort/create', { courseId, teacherId, name: `TEST ${label} ${key}`, kind: 'TRIAL', mode: 'ONLINE', capacity: 12, price: 10000, terms: 'TEST local fixture only', refundPolicy: 'TEST original cancellation only', ...extra });
  report.fixtures.cohorts.push(id);
  return id;
}
function sessionBody(cohortId, teacherId, startTime, extra = {}) {
  return { cohortId, teacherId, title: `TEST session ${key}`, startTime, endTime: startTime + hour, joinInfo: { instructions: 'TEST classroom only' }, materials: [], ...extra };
}
async function session(body) {
  const id = await post('/session/create', body);
  report.fixtures.sessions.push(id);
  return id;
}
async function sessionRows(cohortIds) {
  const [rows] = await db.query('SELECT id,cohort_id,teacher_id,room_id,start_time,end_time,lesson_template_id FROM edu_session WHERE cohort_id IN (?) AND deleted=0 ORDER BY id', [cohortIds]);
  return rows;
}

try {
  admin = (await request('/admin-api/system/auth/login', { method: 'POST', body: { username: 'admin', password: env.VIBE_ADMIN_PASSWORD } })).accessToken;
  member = (await request('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000001', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  const [[isolation]] = await db.query('SELECT @@transaction_isolation AS isolation');
  report.isolation = isolation.isolation;
  const teacherA = await teacher('A'), teacherB = await teacher('B');
  const courseId = await course('main');
  const deptId = await staff('/system/dept/create', { method: 'POST', body: { name: `TEST排课部门${key}`, parentId: 0, sort: 99, status: 0 } });
  const campusId = await post('/campus/create', { deptId, name: `TEST排课校区${key}`, city: 'TEST', address: 'TEST local fixture address', status: 'PUBLISHED' });
  const roomId = await post('/room/create', { campusId, name: `TEST教室${key}`, capacity: 20 });
  Object.assign(report.fixtures, { deptId, campusId, roomId });
  save();

  await check('Concurrent sessions sharing one teacher persist exactly one schedule', async () => {
    const ids = [await cohort(courseId, teacherA, 'teacher race A'), await cohort(courseId, teacherA, 'teacher race B')];
    const responses = await raceOnFixture('edu_teacher_profile', teacherA, ids.map(id => () => post('/session/create', sessionBody(id, teacherA, anchor), true)));
    const persisted = await sessionRows(ids);
    report.teacherRace = { cohorts: ids, responses, persisted };
    assert.equal(responses.filter(result => result.code === 0).length, 1, 'Two overlapping teacher requests must not both succeed');
    assert.equal(persisted.length, 1, 'Only one overlapping teacher session may persist');
    requireDomainConflict(responses.find(result => result.code !== 0), /教师或教室/);
    return { persistedSessionIds: persisted.map(row => row.id) };
  });

  await check('Concurrent sessions sharing one room with different teachers persist exactly one schedule', async () => {
    const ids = [await cohort(courseId, teacherA, 'room race A', { mode: 'OFFLINE', campusId, roomId }), await cohort(courseId, teacherB, 'room race B', { mode: 'OFFLINE', campusId, roomId })];
    const responses = await raceOnFixture('edu_room', roomId, ids.map((id, index) => () => post('/session/create', sessionBody(id, index ? teacherB : teacherA, anchor + day, { roomId }), true)));
    const persisted = await sessionRows(ids);
    report.roomRace = { cohorts: ids, responses, persisted };
    assert.equal(responses.filter(result => result.code === 0).length, 1, 'Two overlapping room requests must not both succeed');
    assert.equal(persisted.length, 1, 'Only one overlapping room session may persist');
    requireDomainConflict(responses.find(result => result.code !== 0), /教师或教室/);
    return { persistedSessionIds: persisted.map(row => row.id) };
  });

  await check('Sequential teacher and room overlap requests fail without persisting rows', async () => {
    const id = await cohort(courseId, teacherA, 'sequential base', { mode: 'OFFLINE', campusId, roomId });
    await session(sessionBody(id, teacherA, anchor + 2 * day, { roomId }));
    const other = await cohort(courseId, teacherB, 'sequential attempts', { mode: 'OFFLINE', campusId, roomId });
    requireDomainConflict(await post('/session/create', sessionBody(other, teacherA, anchor + 2 * day), true), /教师或教室/);
    requireDomainConflict(await post('/session/create', sessionBody(other, teacherB, anchor + 2 * day, { roomId }), true), /教师或教室/);
    assert.equal((await sessionRows([other])).length, 0);
    return { baseCohortId: id, rejectedCohortId: other };
  });

  await check('Concurrent sessions in one cohort with different teachers persist exactly one schedule', async () => {
    const id = await cohort(courseId, teacherA, 'same cohort race');
    const responses = await raceOnFixture('edu_cohort', id, [teacherA, teacherB].map(teacherId => () => post('/session/create', sessionBody(id, teacherId, anchor + 4 * day), true)));
    const persisted = await sessionRows([id]);
    report.cohortRace = { cohortId: id, responses, persisted };
    assert.equal(responses.filter(result => result.code === 0).length, 1, 'One cohort cannot schedule two simultaneous sessions even with different teachers');
    assert.equal(persisted.length, 1);
    requireDomainConflict(responses.find(result => result.code !== 0), /班期.*重叠/);
    return { cohortId: id, persistedSessionIds: persisted.map(row => row.id) };
  });

  await check('Concurrent purchases for one child in overlapping distinct cohorts leave one valid pending enrollment', async () => {
    const cohorts = [];
    for (const [index, teacherId] of [teacherA, teacherB].entries()) {
      const id = await cohort(courseId, teacherId, `overlap purchase ${index}`);
      await session(sessionBody(id, teacherId, anchor + 3 * day));
      await post('/cohort/publish', { id });
      cohorts.push(await app(`/edu/cohort/get?id=${id}`));
    }
    report.purchaseRaces = [];
    for (let round = 0; round < 3; round++) {
      const studentId = await app('/edu/student/create', { method: 'POST', body: { name: `TEST并发孩子${round}-${key}`, birthMonth: `${new Date().getFullYear() - 10}-01`, grade: 'TEST', experience: 'TEST scheduling regression only' } });
      report.fixtures.students.push(studentId);
      const responses = await raceOnFixture('edu_student', studentId, cohorts.map(c => () => app('/trade/order/create', { method: 'POST', acceptFailure: true, body: { items: [{ skuId: c.skuId, studentId, count: 1 }], deliveryType: 3, expectedPayPrice: c.price, pointStatus: false, remark: 'TEST scheduling race only' } })));
      const [pending] = await db.query("SELECT id,current_cohort_id,status,order_item_id FROM edu_enrollment WHERE student_id=? AND status IN ('PENDING_PAYMENT','ACTIVE') AND deleted=0", [studentId]);
      report.purchaseRaces.push({ round, studentId, responses, pending });
      const winners = responses.filter(result => result.code === 0);
      // Always release our successfully created unpaid orders, even on assertion failure.
      try {
        assert.equal(winners.length, 1, `Round ${round}: overlapping courses must yield exactly one successful order`);
        assert.equal(pending.length, 1, `Round ${round}: only one valid pending/active enrollment may persist`);
        assert.equal(pending[0].status, 'PENDING_PAYMENT');
        requireDomainConflict(responses.find(result => result.code !== 0), /时间.*冲突/);
      } finally {
        for (const winner of winners) {
          report.fixtures.orders.push(winner.data.id);
          await app(`/trade/order/cancel?id=${winner.data.id}`, { method: 'DELETE' });
        }
      }
    }
    return { rounds: 3, cohorts: cohorts.map(c => c.id), outcome: 'Exactly one pending enrollment per child; original unpaid orders cancelled after verification.' };
  });

  await check('Publication pins every chronological lesson and rejects duplicate mappings', async () => {
    const id = await cohort(courseId, teacherA, 'pinned lessons', { kind: 'REGULAR' });
    const firstId = await session(sessionBody(id, teacherA, anchor + 5 * day));
    const secondId = await session(sessionBody(id, teacherA, anchor + 6 * day));
    await post('/cohort/publish', { id });
    const info = await staff(`/edu/cohort/get?id=${id}`);
    assert.equal(info.lessons.length, 2);
    assert.deepEqual(info.sessions.map(s => s.lessonTemplateId), info.lessons.map(lesson => lesson.id));
    const original = await staff(`/edu/session/get?id=${secondId}`);
    await post('/session/update', { ...original, lessonTemplateId: info.lessons[0].id });
    try {
      const rejected = await post('/cohort/publish', { id }, true);
      requireDomainConflict(rejected, /重复.*课程版本/);
      report.duplicateTemplate = { cohortId: id, response: rejected };
    } finally {
      const current = await staff(`/edu/session/get?id=${secondId}`);
      await post('/session/update', { ...current, lessonTemplateId: info.lessons[1].id });
    }
    report.fixtures.pinnedCohortId = id;
    report.fixtures.pinnedSessionId = firstId;
    return { cohortId: id, lessonIds: info.lessons.map(lesson => lesson.id) };
  });

  await check('Wrong-version lesson fails both session save and publication of deliberately malformed TEST fixture', async () => {
    const pinnedId = report.fixtures.pinnedCohortId;
    assert(pinnedId, 'Valid pinned fixture required');
    const otherCourseId = await course('other', 1);
    const [templates] = await db.query('SELECT l.id FROM edu_lesson_template l JOIN edu_course_version v ON v.id=l.course_version_id WHERE v.course_id=? AND l.deleted=0 ORDER BY l.id', [otherCourseId]);
    const sessionId = report.fixtures.pinnedSessionId;
    const original = await staff(`/edu/session/get?id=${sessionId}`);
    requireDomainConflict(await post('/session/update', { ...original, lessonTemplateId: templates[0].id }, true), /不属于.*课程版本/);
    // Only this explicitly recorded TEST row is deliberately corrupted to exercise
    // publication's independent guard against malformed legacy/imported data.
    await db.execute('UPDATE edu_session SET lesson_template_id=? WHERE id=? AND cohort_id=? AND tenant_id=1', [templates[0].id, sessionId, pinnedId]);
    try {
      const rejected = await post('/cohort/publish', { id: pinnedId }, true);
      requireDomainConflict(rejected, /重复.*课程版本/);
      report.wrongTemplate = { cohortId: pinnedId, sessionId, rejectedTemplateId: templates[0].id, response: rejected, intentionalFixtureMutation: true };
    } finally {
      await db.execute('UPDATE edu_session SET lesson_template_id=? WHERE id=? AND cohort_id=? AND tenant_id=1', [original.lessonTemplateId, sessionId, pinnedId]);
    }
    return { sessionId, rejectedTemplateId: templates[0].id, fixtureRestored: true };
  });
  report.status = report.checks.some(item => item.status === 'FAILED') ? 'FAILED' : 'PASSED';
  if (report.status === 'FAILED') process.exitCode = 1;
} catch (error) {
  report.status = 'FAILED';
  report.setupError = error.message;
  console.error(`FAIL: fixture setup: ${error.message}`);
  process.exitCode = 1;
} finally {
  report.completedAt = new Date().toISOString();
  save();
  await db.end();
}
