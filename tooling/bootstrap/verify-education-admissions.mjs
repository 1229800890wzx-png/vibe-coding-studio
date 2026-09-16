/** Real local CRM admissions acceptance. Original APIs mutate TEST fixtures; SQL is read-only. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, '.tools/package.json'));
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').split(/\r?\n/).filter(x => x && !x.startsWith('#')).map(x => { const p = x.indexOf('='); return [x.slice(0, p), x.slice(p + 1)]; }));
const db = await require('mysql2/promise').createConnection({ host: '127.0.0.1', port: 13306, user: 'vibe_edu', password: env.VIBE_DB_PASSWORD, database: 'vibe_edu', charset: 'utf8mb4' });
const key = Date.now().toString(36), base = 'http://127.0.0.1:48080', configKey = 'edu.admission.owner-user-id';
const report = { startedAt: new Date().toISOString(), scope: 'Local TEST fixtures through original member/system/CRM/education APIs. SQL reads only. No SMS, phone calls, email or external messages sent.', checks: [], fixtures: {} };
const save = () => fs.writeFileSync(path.join(root, '.runtime/education-admissions-report.json'), JSON.stringify(report, null, 2) + '\n');
const pass = (name, details = {}) => { report.checks.push({ name, ...details }); save(); console.log(`PASS: ${name}`); };
async function result(url, { token, method = 'GET', body } = {}) {
  return fetch(base + url, { method, headers: { 'tenant-id': '1', terminal: '10', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) }).then(r => r.json());
}
async function api(url, options) { const r = await result(url, options); assert.equal(r.code, 0, `${url}: ${r.code} ${r.msg}`); return r.data; }
async function denied(url, options) { const r = await result(url, options); assert(r.code !== 0 && r.code !== 500, `${url}: expected policy rejection, got ${r.code} ${r.msg}`); return r.code; }
let admin, member, stranger, configId, previousConfig, deptId;
const staff = (url, options = {}) => api('/admin-api' + url, { token: admin, ...options });
const app = (url, options = {}) => api('/app-api' + url, { token: member, ...options });
async function ownerConfig(value) {
  const body = { id: configId, category: '教育招生', name: '咨询受理负责人', key: configKey, value: String(value), visible: false, remark: '使用原系统用户 ID；0 表示关闭受理。' };
  if (configId) await staff('/infra/config/update', { method: 'PUT', body });
  else configId = await staff('/infra/config/create', { method: 'POST', body });
}
async function user(label) {
  const username = `testcrm${label}${key}`;
  const id = await staff('/system/user/create', { method: 'POST', body: { username, nickname: `TEST 招生${label}${key}`, password: env.VIBE_ADMIN_PASSWORD, deptId, postIds: [] } });
  await staff('/system/permission/assign-user-role', { method: 'POST', body: { userId: id, roleIds: [91004] } });
  const token = (await api('/admin-api/system/auth/login', { method: 'POST', body: { username, password: env.VIBE_ADMIN_PASSWORD } })).accessToken;
  return { id, username, token };
}
try {
  admin = (await api('/admin-api/system/auth/login', { method: 'POST', body: { username: 'admin', password: env.VIBE_ADMIN_PASSWORD } })).accessToken;
  member = (await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000001', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  stranger = (await api('/app-api/member/auth/login', { method: 'POST', body: { mobile: '13900000002', password: env.VIBE_MEMBER_PASSWORD } })).accessToken;
  const memberId = (await app('/member/user/get')).id;
  deptId = await staff('/system/dept/create', { method: 'POST', body: { name: `TEST 招生部门${key}`, parentId: 0, sort: 90, status: 0 } }); report.fixtures.departmentId = deptId;
  const owners = [await user('A'), await user('B')]; report.fixtures.owners = owners.map(({ id, username }) => ({ id, username }));
  previousConfig = (await staff(`/infra/config/page?pageNo=1&pageSize=100&key=${configKey}`)).list.find(v => v.key === configKey);
  configId = previousConfig?.id;
  await ownerConfig(0); assert.equal((await app('/edu/admission/options')).enabled, false);
  await ownerConfig(owners[0].id);
  const options = await app('/edu/admission/options'); assert.equal(options.enabled, true); assert(options.consentVersion && options.consentText);
  pass('Original infra configuration selects an active original employee; disabled configuration closes admissions', { configId, ownerUserId: owners[0].id });
  const studentName = `TEST 招生孩子${key}`;
  const childBody = { name: studentName, birthMonth: `${new Date().getFullYear() - 10}-01`, grade: 'TEST', experience: 'TEST' };
  const studentId = await app('/edu/student/create', { method: 'POST', body: childBody });
  const strangerStudentId = await app('/edu/student/create', { token: stranger, method: 'POST', body: { ...childBody, name: `TEST 他人孩子${key}` } });
  report.fixtures.student = { id: studentId, name: studentName }; report.fixtures.strangerStudentId = strangerStudentId; save();
  const teacher = (await staff('/edu/teacher/page?pageNo=1&pageSize=100')).list.find(v => v.userId === 1); assert(teacher);
  const [[latest]] = await db.execute('SELECT MAX(end_time) lastEnd FROM edu_session WHERE teacher_id=? AND deleted=0', [teacher.id]);
  const start = Math.max(Date.now() + 60 * 86400000, +(latest.lastEnd || 0) + 86400000);
  const courseId = await staff('/edu/course/create', { method: 'POST', body: { code: `TEST-CRM-${key}`, name: `TEST 招生体验课${key}`, description: '本地 CRM 咨询与试听关联验收。', coverUrl: 'http://127.0.0.1:5174/static/edu/courses/tools.jpg', ageMin: 8, ageMax: 16, direction: 'TOOL', level: 'BEGINNER', objectives: '本地验证', outcomes: '本地验证', lessons: [{ title: '体验与咨询', durationMinutes: 60, objectives: 'TEST', materials: 'TEST', assignment: 'TEST' }] } });
  await staff('/edu/course/publish', { method: 'POST', body: { id: courseId } });
  const cohortId = await staff('/edu/cohort/create', { method: 'POST', body: { courseId, name: `TEST 招生免费试听${key}`, kind: 'TRIAL', mode: 'ONLINE', teacherId: teacher.id, capacity: 4, price: 0, terms: '仅限本地验收', refundPolicy: '免费预约可取消。', startDate: start, endDate: start + 3600000 } });
  await staff('/edu/session/create', { method: 'POST', body: { cohortId, title: 'TEST 招生试听课次', teacherId: teacher.id, startTime: start, endTime: start + 3600000, joinInfo: { instructions: '仅本地测试，无真实课堂。' } } });
  await staff('/edu/cohort/publish', { method: 'POST', body: { id: cohortId } });
  const trial = await app('/edu/trial/create', { method: 'POST', body: { studentId, cohortId, termsAccepted: true } });
  const trialBookingId = typeof trial === 'number' ? trial : trial.id;
  assert(trialBookingId); report.fixtures.courseId = courseId; report.fixtures.cohortId = cohortId; report.fixtures.trialBookingId = trialBookingId; save();
  const request = { studentId, courseId, trialBookingId, contactName: `TEST 家长${key}`, mobile: '13900000001', message: 'TEST 仅记录本地咨询申请，请勿外部联系。', contactConsent: true, consentVersion: options.consentVersion };
  const beforeInvalid = await db.execute('SELECT COUNT(*) n FROM crm_clue WHERE education_member_id=?', [memberId]);
  const invalidCodes = [await denied('/app-api/edu/admission/create', { token: member, method: 'POST', body: { ...request, contactConsent: false } }), await denied('/app-api/edu/admission/create', { token: member, method: 'POST', body: { ...request, consentVersion: 'old' } }), await denied('/app-api/edu/admission/create', { token: member, method: 'POST', body: { ...request, studentId: strangerStudentId } })];
  assert.equal((await db.execute('SELECT COUNT(*) n FROM crm_clue WHERE education_member_id=?', [memberId]))[0][0].n, beforeInvalid[0][0].n);
  pass('Missing consent, stale consent and another parent’s child reject without creating a CRM clue', { codes: invalidCodes });
  const consultation = await app('/edu/admission/create', { method: 'POST', body: request });
  const clueId = consultation.id; report.fixtures.clueId = clueId; save();
  assert.equal((await app('/edu/admission/create', { method: 'POST', body: request })).id, clueId);
  assert(consultation.trials.some(v => v.id === trialBookingId));
  const [[clue]] = await db.execute('SELECT id,owner_user_id ownerUserId,education_member_id memberId,education_student_id studentId,education_course_id courseId,education_consent_version consentVersion,education_consent_time consentTime FROM crm_clue WHERE id=?', [clueId]);
  assert.equal(clue.ownerUserId, owners[0].id); assert.equal(clue.memberId, memberId); assert.equal(clue.studentId, studentId); assert.equal(clue.courseId, courseId); assert.equal(clue.consentVersion, options.consentVersion); assert(clue.consentTime);
  const [[linked]] = await db.execute('SELECT crm_clue_id clueId FROM edu_trial_booking WHERE id=?', [trialBookingId]); assert.equal(linked.clueId, clueId);
  const permission = await api(`/admin-api/crm/permission/list?bizType=1&bizId=${clueId}`, { token: owners[0].token }); assert(permission.some(v => v.userId === owners[0].id && v.level === 1));
  pass('Consented consultation creates one original CRM clue and OWNER permission with explicit trial foreign-key linkage', { clueId, trialBookingId, originalOwnerPermissionId: permission.find(v => v.level === 1).id });
  const visible = await api('/admin-api/crm/clue/page?pageNo=1&pageSize=100&educationOnly=true', { token: owners[0].token }); assert(visible.list.some(v => v.id === clueId));
  assert(!(await api('/admin-api/crm/clue/page?pageNo=1&pageSize=100&educationOnly=true', { token: owners[1].token })).list.some(v => v.id === clueId));
  for (const url of [`/crm/clue/get?id=${clueId}`, `/crm/permission/list?bizType=1&bizId=${clueId}`, `/crm/follow-up-record/page?pageNo=1&pageSize=100&bizType=1&bizId=${clueId}`, `/edu/admission/get?id=${clueId}`]) await denied('/admin-api' + url, { token: owners[1].token });
  pass('Original CRM owner filtering hides another employee’s clue, team, follow-up and education detail');
  const directClueId = await api('/admin-api/crm/clue/create', { token: owners[0].token, method: 'POST', body: { name: `TEST 原 CRM 线索${key}`, mobile: '13900000001', ownerUserId: owners[0].id, source: 90, remark: '仅本地 API 验证' } });
  assert.equal((await api(`/admin-api/crm/clue/get?id=${directClueId}`, { token: owners[0].token })).id, directClueId);
  await denied('/admin-api/crm/clue/update', { token: owners[0].token, method: 'PUT', body: { id: directClueId, name: `TEST 原 CRM 线索${key}`, ownerUserId: owners[1].id } });
  assert.equal((await api(`/admin-api/crm/clue/get?id=${directClueId}`, { token: owners[0].token })).ownerUserId, owners[0].id);
  const otherClueId = await api('/admin-api/crm/clue/create', { token: owners[1].token, method: 'POST', body: { name: `TEST 他人 CRM 线索${key}`, ownerUserId: owners[1].id } });
  const otherPermission = (await api(`/admin-api/crm/permission/list?bizType=1&bizId=${otherClueId}`, { token: owners[1].token })).find(v => v.level === 1);
  await denied('/admin-api/crm/permission/update', { token: owners[0].token, method: 'PUT', body: { bizType: 1, bizId: directClueId, ids: [otherPermission.id], level: 2 } });
  assert.equal((await api(`/admin-api/crm/permission/list?bizType=1&bizId=${otherClueId}`, { token: owners[1].token })).find(v => v.id === otherPermission.id).level, 1);
  report.fixtures.directClueIds = [directClueId, otherClueId];
  pass('Original clue creation works and a forged team-update business ID cannot change another clue’s owner');
  const [dict] = await db.query("SELECT value,label FROM system_dict_data WHERE dict_type='crm_follow_up_type' AND status=0 AND deleted=0 ORDER BY sort LIMIT 1");
  assert(dict.length, 'Original CRM follow-up dictionary is required');
  const content = `TEST 试听需求已记录 ${key}；此为内部备注，没有联系家长。`;
  const followBody = { bizType: 1, bizId: clueId, type: Number(dict[0].value), content, nextTime: Date.now() + 86400000, businessIds: [], contactIds: [], picUrls: [], fileUrls: [] };
  await denied('/admin-api/crm/follow-up-record/create', { token: owners[1].token, method: 'POST', body: followBody });
  const followUpId = await api('/admin-api/crm/follow-up-record/create', { token: owners[0].token, method: 'POST', body: followBody });
  const originalDetail = await api(`/admin-api/crm/clue/get?id=${clueId}`, { token: owners[0].token }); assert.equal(originalDetail.followUpStatus, true); assert.equal(originalDetail.contactLastContent, content);
  assert((await api(`/admin-api/crm/follow-up-record/page?pageNo=1&pageSize=100&bizType=1&bizId=${clueId}`, { token: owners[0].token })).list.some(v => v.id === followUpId && v.content === content));
  const parentView = (await app(`/edu/admission/list?studentId=${studentId}`)).find(v => v.id === clueId); assert.equal(parentView.followUpStatus, true); assert(!JSON.stringify(parentView).includes(content)); assert(!('ownerUserId' in parentView));
  report.fixtures.followUpId = followUpId;
  pass('Original follow-up writes progress and next contact time; parent view omits internal CRM notes', { followUpId, followType: dict[0] });
  await denied(`/app-api/edu/admission/list?studentId=${studentId}`, { token: stranger });
  assert(!(await app('/edu/admission/list', { token: stranger })).some(v => v.id === clueId));
  await denied('/app-api/edu/admission/link-trial', { token: stranger, method: 'POST', body: { clueId, trialBookingId } });
  const wrongChildClue = await app('/edu/admission/create', { token: stranger, method: 'POST', body: { ...request, studentId: strangerStudentId, trialBookingId: null } });
  await denied('/app-api/edu/admission/link-trial', { token: stranger, method: 'POST', body: { clueId: wrongChildClue.id, trialBookingId } });
  assert.equal((await db.execute('SELECT crm_clue_id clueId FROM edu_trial_booking WHERE id=?', [trialBookingId]))[0][0].clueId, clueId);
  pass('Cross-parent list and trial linkage fail without changing the original trial association');
  await api('/admin-api/crm/clue/transfer', { token: owners[0].token, method: 'PUT', body: { id: clueId, newOwnerUserId: owners[1].id, oldOwnerPermissionLevel: null } });
  await denied(`/admin-api/crm/clue/get?id=${clueId}`, { token: owners[0].token });
  const transferred = await api(`/admin-api/edu/admission/get?id=${clueId}`, { token: owners[1].token }); assert.equal(transferred.clue.ownerUserId, owners[1].id); assert(transferred.trials.some(v => v.id === trialBookingId));
  assert((await api(`/admin-api/crm/follow-up-record/page?pageNo=1&pageSize=100&bizType=1&bizId=${clueId}`, { token: owners[1].token })).list.some(v => v.id === followUpId));
  pass('Original owner transfer removes old access and preserves trial association and follow-up history');
  // Original CRM deliberately does not grant every system administrator blanket CRM ownership.
  // Create a separate inspectable consultation explicitly assigned to the local admin via config.
  await ownerConfig(1);
  const browserStudentId = await app('/edu/student/create', { method: 'POST', body: { ...childBody, name: `TEST 咨询页面孩子${key}` } });
  const browserTrial = await app('/edu/trial/create', { method: 'POST', body: { studentId: browserStudentId, cohortId, termsAccepted: true } });
  const browserTrialId = typeof browserTrial === 'number' ? browserTrial : browserTrial.id;
  const browserClue = await app('/edu/admission/create', { method: 'POST', body: { ...request, studentId: browserStudentId, trialBookingId: browserTrialId } });
  const browserFollowUpId = await staff('/crm/follow-up-record/create', { method: 'POST', body: { ...followBody, bizId: browserClue.id } });
  assert((await staff(`/edu/admission/get?id=${browserClue.id}`)).trials.some(v => v.id === browserTrialId));
  report.browser = { clueId: browserClue.id, studentId: browserStudentId, courseId, cohortId, trialBookingId: browserTrialId, followUpId: browserFollowUpId, ownerUserId: 1 };
  report.status = 'PASSED'; report.completedAt = new Date().toISOString(); save();
} catch (error) { report.status = 'FAILED'; report.failure = error.message; save(); throw error; }
finally {
  // Restore an existing setting. If none existed, retain explicit local admin configuration for review.
  if (admin && configId) { await ownerConfig(previousConfig?.value ?? 1); report.configurationRestoredTo = previousConfig?.value ?? '1 (new local review configuration)'; save(); }
  await db.end();
}
