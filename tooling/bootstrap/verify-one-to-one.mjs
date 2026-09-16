/** Real local one-to-one acceptance. Original auth/CRM/education APIs mutate TEST fixtures only.
 * SQL is SELECT-only, including a temporary lock on one TEST student to expose snapshot races.
 * Never prints or persists passwords, login results or authentication tokens.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, '.tools/package.json'));
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').split(/\r?\n/)
  .filter(line => line && !line.startsWith('#')).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }));
const db = await require('mysql2/promise').createConnection({ host: '127.0.0.1', port: 13306, user: 'vibe_edu', password: env.VIBE_DB_PASSWORD, database: 'vibe_edu', charset: 'utf8mb4' });
const base = 'http://127.0.0.1:48080', key = Date.now().toString(36), configKey = 'edu.admission.owner-user-id';
const reportPath = path.join(root, '.runtime/one-to-one-api-report.json');
const report = { startedAt: new Date().toISOString(), status: 'RUNNING', scope: 'Actual local Java API and MySQL8.4. TEST fixtures only through original account, role, teacher, CRM and admission APIs. SQL SELECT reads and a temporary TEST-child row lock only. No external messages, payment, orders or seat reservations.', checks: [], fixtures: { teachers: [], students: [], clueIds: [] } };
const save = () => fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
const pass = (name, details = {}) => { report.checks.push({ name, status: 'PASSED', details }); save(); console.log(`PASS: ${name}`); };
async function result(url, { token, method = 'GET', body } = {}) {
  return fetch(base + url, { method, headers: { 'tenant-id': '1', terminal: '10', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) }).then(response => response.json());
}
async function api(url, options) { const response = await result(url, options); assert.equal(response.code, 0, `${url}: ${response.code} ${response.msg}`); return response.data; }
async function denied(url, options) { const response = await result(url, options); assert(response.code !== 0 && response.code !== 500, `${url}: expected policy rejection, got ${response.code} ${response.msg}`); return { code: response.code, message: response.msg }; }
let admin, member, stranger, previousConfig, configId, configurationChanged = false;
const staff = (url, options = {}) => api('/admin-api' + url, { token: admin, ...options });
const app = (url, options = {}) => api('/app-api' + url, { token: member, ...options });
const rejectApp = (url, body, token = member) => denied('/app-api' + url, { token, method: 'POST', body });
const publicTeachers = () => api('/app-api/edu/teacher/list?oneToOne=true');
const teacherState = new Map();
function localTime(milliseconds) { return new Date(milliseconds + 8 * 3600000).toISOString().slice(0, 19); }
const anchor = Math.ceil((Date.now() + 7 * 86400000) / 60000) * 60000;

async function configureOwner() {
  const page = await staff(`/infra/config/page?pageNo=1&pageSize=100&key=${configKey}`);
  const item = page.list.find(row => row.key === configKey);
  previousConfig = item ? await staff(`/infra/config/get?id=${item.id}`) : null;
  configId = previousConfig?.id;
  const body = { id: configId, category: '教育招生', name: '咨询受理负责人', key: configKey, value: '1', visible: false, remark: 'TEST 验收期间使用本地原管理员，完成后恢复配置。' };
  if (configId) await staff('/infra/config/update', { method: 'PUT', body });
  else configId = await staff('/infra/config/create', { method: 'POST', body });
  configurationChanged = true;
}
async function teacher(label, enabled) {
  const username = `test1to1${label}${key}`, name = `TEST 一对一老师${label} ${key}`;
  const userId = await staff('/system/user/create', { method: 'POST', body: { username, nickname: name, password: env.VIBE_ADMIN_PASSWORD, postIds: [], remark: 'TEST one-to-one acceptance only; not actual teaching staff.' } });
  await staff('/system/permission/assign-user-role', { method: 'POST', body: { userId, roleIds: [91003] } });
  const token = (await api('/admin-api/system/auth/login', { method: 'POST', body: { username, password: env.VIBE_ADMIN_PASSWORD } })).accessToken;
  const body = { userId, name, bio: 'TEST 本地预约验收教师，不是真实授课师资。本档案仅用于验证孩子、老师和期望时段的预约申请；没有正式课程价格或已锁定时间。', avatarUrl: '', status: 'PUBLISHED', oneToOneEnabled: enabled };
  const id = await staff('/edu/teacher/create', { method: 'POST', body });
  teacherState.set(id, { ...body, id });
  const fixture = { id, userId, name, username, enabled }; report.fixtures.teachers.push(fixture); save();
  return { ...fixture, token };
}
async function updateTeacher(id, patch) {
  const body = { ...teacherState.get(id), ...patch };
  await staff('/edu/teacher/update', { method: 'PUT', body });
  teacherState.set(id, body);
}
async function child(label, token = member) {
  const name = `TEST 一对一孩子${label} ${key}`;
  const id = await app('/edu/student/create', { token, method: 'POST', body: { name, birthMonth: `${new Date().getFullYear() - 11}-01`, grade: 'TEST', experience: 'TEST 预约验收数据，无真实学员信息。' } });
  const fixture = { id, name, owner: token === member ? 'primary-test-parent' : 'other-test-parent' };
  report.fixtures.students.push(fixture); save(); return fixture;
}
async function countClues(studentId) { return (await db.execute('SELECT COUNT(*) n FROM crm_clue WHERE education_student_id=? AND deleted=0', [studentId]))[0][0].n; }
async function row(id) {
  return (await db.execute('SELECT id, owner_user_id ownerUserId, education_member_id memberId, education_student_id studentId, education_service_type serviceType, education_teacher_id teacherId, education_teacher_name teacherName, education_preferred_start_time startTime, education_preferred_end_time endTime, education_appointment_status appointmentStatus FROM crm_clue WHERE id=?', [id]))[0][0];
}
async function parallelCreates(studentId, bodies) {
  assert(report.fixtures.students.some(student => student.id === studentId && student.owner === 'primary-test-parent'));
  await db.beginTransaction();
  await db.execute('SELECT id FROM edu_student WHERE id=? AND tenant_id=1 FOR UPDATE', [studentId]);
  let pending;
  try {
    pending = Promise.allSettled(bodies.map(body => app('/edu/admission/create', { method: 'POST', body })));
    await new Promise(resolve => setTimeout(resolve, 700));
  } finally { await db.rollback(); }
  const outcomes = await pending;
  report.parallelResponses = outcomes.map(outcome => outcome.status === 'fulfilled'
    ? { status: 'fulfilled', clueId: outcome.value.id }
    : { status: 'rejected', message: outcome.reason.message }); save();
  const failure = outcomes.find(outcome => outcome.status === 'rejected');
  if (failure) throw failure.reason;
  return outcomes.map(outcome => outcome.value);
}

try {
  admin = (await api('/admin-api/system/auth/login', { method: 'POST', body: { username: 'admin', password: env.VIBE_ADMIN_PASSWORD } })).accessToken;
  member = (await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000001', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  stranger = (await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000002', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  const memberId = (await app('/member/user/get')).id;
  report.mysql = (await db.query('SELECT VERSION() version, @@transaction_isolation isolation'))[0][0];
  assert.match(report.mysql.version, /^8\.4\./);
  await configureOwner();
  const options = await app('/edu/admission/options'); assert.equal(options.enabled, true);
  const teacherA = await teacher('A', true), teacherB = await teacher('B', false);
  const studentA = await child('A'), studentB = await child('B'), otherStudent = await child('他人', stranger);
  report.browser = { route: '/pages/edu/one-to-one', parentMobile: '13900000001', teacherId: teacherA.id, teacherName: teacherA.name,
    studentId: studentA.id, studentName: studentA.name, studentBId: studentB.id, studentBName: studentB.name,
    account: 'existing-local-test-parent', note: 'Only TEST teachers/children, not real teaching staff or reserved lessons.' }; save();
  const request = { serviceType: 'ONE_TO_ONE', teacherId: teacherA.id, studentId: studentA.id,
    contactName: `TEST 家长 ${key}`, mobile: '13900000001', message: 'TEST 想制作一个个人网站并学习检查 AI 生成的代码。仅本地验收，请勿外部联系。',
    preferredStartTime: localTime(anchor), preferredEndTime: localTime(anchor + 60 * 60000), contactConsent: true, consentVersion: options.consentVersion };
  let directory = await publicTeachers();
  assert(directory.some(t => t.id === teacherA.id)); assert(!directory.some(t => t.id === teacherB.id));
  for (const t of directory) { assert(t.oneToOneEnabled === true); assert(t.bio?.trim()); assert(!('userId' in t)); assert.deepEqual(Object.keys(t).sort(), ['avatarUrl','bio','id','name','oneToOneEnabled'].sort()); }
  const ordinaryDirectory = await api('/app-api/edu/teacher/list');
  assert(ordinaryDirectory.some(t => t.id === teacherB.id)); assert(ordinaryDirectory.every(t => !('userId' in t)));
  pass('Public directory separates explicitly enabled one-to-one teachers and never exposes original staff IDs', { teacherIds: [teacherA.id, teacherB.id] });

  const countBefore = await countClues(studentA.id);
  const invalid = [];
  invalid.push(await rejectApp('/edu/admission/create', { ...request, teacherId: teacherB.id }));
  await updateTeacher(teacherB.id, { oneToOneEnabled: false, status: 'DRAFT' });
  assert(!(await publicTeachers()).some(t => t.id === teacherB.id));
  invalid.push(await rejectApp('/edu/admission/create', { ...request, teacherId: teacherB.id }));
  await updateTeacher(teacherB.id, { oneToOneEnabled: true, status: 'PUBLISHED' });
  await staff('/system/user/update-status', { method: 'PUT', body: { id: teacherB.userId, status: 1 } });
  assert(!(await publicTeachers()).some(t => t.id === teacherB.id));
  invalid.push(await rejectApp('/edu/admission/create', { ...request, teacherId: teacherB.id }));
  await staff('/system/user/update-status', { method: 'PUT', body: { id: teacherB.userId, status: 0 } });
  assert((await publicTeachers()).some(t => t.id === teacherB.id));
  for (const patch of [
    { teacherId: null }, { studentId: otherStudent.id }, { contactConsent: false }, { consentVersion: 'stale' },
    { message: ' ' }, { preferredStartTime: localTime(anchor - 10 * 86400000), preferredEndTime: localTime(anchor - 10 * 86400000 + 3600000) },
    { preferredEndTime: localTime(anchor + 29 * 60000) }, { preferredEndTime: localTime(anchor + 181 * 60000) },
    { preferredStartTime: null }, { preferredStartTime: 'not-a-date' }, { trialBookingId: 1 }
  ]) invalid.push(await rejectApp('/edu/admission/create', { ...request, ...patch }));
  assert.equal(await countClues(studentA.id), countBefore);
  assert.equal(await countClues(otherStudent.id), 0);
  pass('Switch-off, unpublished or disabled staff, missing teacher, cross-parent child, consent, goal, future time and duration validations reject without creating leads', { rejectionCount: invalid.length, rejections: invalid });

  const concurrent = await parallelCreates(studentA.id, [request, request, request]);
  const ids = concurrent.map(item => item.id); report.fixtures.clueIds.push(...new Set(ids)); save();
  assert.equal(new Set(ids).size, 1, 'Same child/teacher/time concurrent requests must converge to one original CRM clue, including under REPEATABLE READ');
  assert.equal(await countClues(studentA.id), countBefore + 1);
  const clueId = ids[0];
  assert.equal((await app('/edu/admission/create', { method: 'POST', body: request })).id, clueId);
  pass('Same request under simultaneous transactions and a TEST-child lock gate creates exactly one original CRM clue', { clueId, concurrentResponses: ids, isolation: report.mysql.isolation });

  const otherTeacherClue = await app('/edu/admission/create', { method: 'POST', body: { ...request, teacherId: teacherB.id } });
  const otherTimeClue = await app('/edu/admission/create', { method: 'POST', body: { ...request, preferredStartTime: localTime(anchor + 86400000), preferredEndTime: localTime(anchor + 86400000 + 3600000) } });
  const otherChildClue = await app('/edu/admission/create', { method: 'POST', body: { ...request, studentId: studentB.id } });
  assert.equal(new Set([clueId, otherTeacherClue.id, otherTimeClue.id, otherChildClue.id]).size, 4);
  report.fixtures.clueIds.push(otherTeacherClue.id, otherTimeClue.id, otherChildClue.id);
  const persisted = await row(clueId);
  assert.equal(persisted.ownerUserId, 1); assert.notEqual(persisted.ownerUserId, teacherA.userId);
  assert.equal(persisted.memberId, memberId); assert.equal(persisted.teacherId, teacherA.id); assert.equal(persisted.teacherName, teacherA.name);
  assert.equal(persisted.serviceType, 'ONE_TO_ONE'); assert.equal(persisted.appointmentStatus, 'REQUESTED');
  const permissions = await staff(`/crm/permission/list?bizType=1&bizId=${clueId}`);
  assert(permissions.some(item => item.userId === 1 && item.level === 1));
  assert(!permissions.some(item => item.userId === teacherA.userId || item.userId === teacherB.userId));
  for (const url of [`/crm/clue/get?id=${clueId}`, '/crm/clue/page?pageNo=1&pageSize=20&educationOnly=true', `/edu/admission/get?id=${clueId}`])
    await denied('/admin-api' + url, { token: teacherA.token });
  pass('Different teacher, time or child stays separate; original CRM owner/team is preserved and teaching role gains no CRM access', { clueId, distinctClueIds: [otherTeacherClue.id, otherTimeClue.id, otherChildClue.id], originalOwnerUserId: 1 });

  const crm = await staff(`/crm/clue/get?id=${clueId}`);
  assert.equal(crm.educationTeacherName, teacherA.name); assert.equal(crm.educationServiceType, 'ONE_TO_ONE');
  assert.equal(crm.educationAppointmentStatus, 'REQUESTED'); assert.equal(typeof crm.educationPreferredStartTime, 'number');
  const onePage = await staff(`/crm/clue/page?pageNo=1&pageSize=100&educationOnly=true&educationServiceType=ONE_TO_ONE&name=${encodeURIComponent(key)}`);
  assert(onePage.list.some(item => item.id === clueId)); assert(onePage.list.every(item => item.educationServiceType === 'ONE_TO_ONE'));
  await updateTeacher(teacherA.id, { name: `TEST 一对一老师A（更新）${key}` });
  const parent = (await app(`/edu/admission/list?studentId=${studentA.id}`)).find(item => item.id === clueId);
  assert.equal(parent.teacherName, teacherA.name); assert.equal(typeof parent.preferredStartTime, 'number'); assert(!('ownerUserId' in parent));
  assert.equal((await staff(`/crm/clue/get?id=${clueId}`)).educationTeacherName, teacherA.name);
  await updateTeacher(teacherA.id, { name: teacherA.name });
  await staff('/crm/clue/update', { method: 'PUT', body: { ...crm, id: clueId, ownerUserId: 1,
    educationServiceType: 'COURSE', educationTeacherId: teacherB.id, educationTeacherName: '伪造老师',
    educationPreferredStartTime: null, educationPreferredEndTime: null, educationAppointmentStatus: 'CANCELLED' } });
  assert.deepEqual(await row(clueId), persisted);
  const { serviceType, teacherId, preferredStartTime, preferredEndTime, ...ordinaryRequest } = request;
  const courseClue = await app('/edu/admission/create', { method: 'POST', body: ordinaryRequest });
  assert.notEqual(courseClue.id, clueId); assert.equal(courseClue.serviceType, 'COURSE');
  assert.equal((await app('/edu/admission/create', { method: 'POST', body: ordinaryRequest })).id, courseClue.id);
  assert.equal((await app('/edu/admission/create', { method: 'POST', body: { ...ordinaryRequest, serviceType: 'COURSE' } })).id, courseClue.id);
  const coursePage = await staff(`/crm/clue/page?pageNo=1&pageSize=100&educationOnly=true&educationServiceType=COURSE&name=${encodeURIComponent(key)}`);
  assert(coursePage.list.some(item => item.id === courseClue.id)); assert(!coursePage.list.some(item => item.id === clueId));
  report.fixtures.clueIds.push(courseClue.id);
  pass('Original CRM response/filter and immutable teacher snapshot work; generic editing cannot replace appointment facts; default and explicit COURSE consultation remain compatible', { clueId, ordinaryCourseClueId: courseClue.id, frozenTeacherName: teacherA.name });

  await rejectApp('/edu/admission/cancel', { id: clueId }, stranger);
  assert.equal((await row(clueId)).appointmentStatus, 'REQUESTED');
  await rejectApp('/edu/admission/cancel', { id: courseClue.id });
  await rejectApp('/edu/admission/link-trial', { clueId, trialBookingId: 1 });
  const cancelResults = await Promise.all([1,2].map(() => app('/edu/admission/cancel', { method: 'POST', body: { id: clueId } })));
  assert(cancelResults.every(item => item.id === clueId && item.appointmentStatus === 'CANCELLED'));
  assert.equal((await row(clueId)).appointmentStatus, 'CANCELLED');
  assert.equal((await row(clueId)).teacherName, teacherA.name);
  assert((await app(`/edu/admission/list?studentId=${studentA.id}`)).some(item => item.id === clueId && item.appointmentStatus === 'CANCELLED'));
  const reapplied = await app('/edu/admission/create', { method: 'POST', body: request });
  assert.notEqual(reapplied.id, clueId); assert.equal(reapplied.appointmentStatus, 'REQUESTED'); report.fixtures.clueIds.push(reapplied.id);
  await denied(`/app-api/edu/admission/list?studentId=${studentA.id}`, { token: stranger });
  assert(!(await app('/edu/admission/list', { token: stranger })).some(item => report.fixtures.clueIds.includes(item.id)));
  pass('Withdrawal is guardian-only and idempotent under concurrent calls; cancelled history stays readable and a new application creates a new lead', { cancelledClueId: clueId, reappliedClueId: reapplied.id });

  report.browser = { route: '/pages/edu/one-to-one', parentMobile: '13900000001', teacherId: teacherA.id, teacherName: teacherA.name,
    studentId: studentA.id, studentName: studentA.name, studentBId: studentB.id, studentBName: studentB.name,
    clueId: reapplied.id, cancelledClueId: clueId, ordinaryCourseClueId: courseClue.id,
    preferredStartTime: request.preferredStartTime, preferredEndTime: request.preferredEndTime,
    ownerUserId: 1, account: 'existing-local-test-parent', note: 'All listed teachers/children/requests are TEST fixtures, not real staff or scheduled lessons.' };
  report.status = 'PASSED'; report.completedAt = new Date().toISOString(); save();
} catch (error) { report.status = 'FAILED'; report.failure = error.message; save(); throw error; }
finally {
  const cleanupFailures = [];
  // Restore global configuration even if a TEST teacher restoration encounters an error.
  for (const teacher of report.fixtures.teachers) {
    try {
      await staff('/system/user/update-status', { method: 'PUT', body: { id: teacher.userId, status: 0 } });
      await updateTeacher(teacher.id, { name: teacher.name, status: 'PUBLISHED', oneToOneEnabled: true });
    } catch (error) { cleanupFailures.push(error.message); }
  }
  try {
    if (configurationChanged) {
      if (previousConfig) await staff('/infra/config/update', { method: 'PUT', body: previousConfig });
      else await staff(`/infra/config/delete?id=${configId}`, { method: 'DELETE' });
      report.configurationRestored = true;
      report.configurationRestoredTo = previousConfig?.value ?? '(originally absent)';
    }
  } catch (error) { cleanupFailures.push(error.message); }
  if (cleanupFailures.length) { report.status = 'FAILED'; report.cleanupFailures = cleanupFailures; process.exitCode = 1; }
  save(); await db.end();
}
