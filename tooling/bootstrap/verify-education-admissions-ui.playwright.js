// Independent browser process; original form logins and live business APIs only. No routes/mocks.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const cache = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
const modulePath = fs.readdirSync(cache).map(name => path.join(cache, name, 'node_modules/playwright')).find(dir => fs.existsSync(path.join(dir, 'package.json')));
if (!modulePath) throw Error('Cached Playwright runtime is required.');
const { chromium } = require(modulePath);
const env = Object.fromEntries(fs.readFileSync('.runtime/foundation.env', 'utf8').split(/\r?\n/).filter(x => x && !x.startsWith('#')).map(x => { const p = x.indexOf('='); return [x.slice(0, p), x.slice(p + 1)]; }));
const fixture = JSON.parse(fs.readFileSync('.runtime/education-admissions-report.json', 'utf8')).browser;
const report = { startedAt: new Date().toISOString(), session: 'independent-admissions-acceptance', source: 'Original admin/member form logins; no API interception or fabricated responses. TEST contact submission records consent only; no external messages sent.', checks: [], fixture };
const save = () => fs.writeFileSync('.runtime/education-admissions-ui-report.json', JSON.stringify(report, null, 2) + '\n');
const pass = (name, details = {}) => { report.checks.push({ name, ...details }); save(); console.log(`PASS: ${name}`); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const admin = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const mini = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
const pageErrors = [], failures = [];
for (const [label, page] of [['admin', admin], ['miniapp', mini]]) {
  page.on('pageerror', error => pageErrors.push({ page: label, message: error.message }));
  page.on('response', async response => { if (response.url().includes('/app-api/') || response.url().includes('/admin-api/')) { try { const body = await response.json(); if (body.code !== 0) failures.push({ page: label, path: new URL(response.url()).pathname, code: body.code, msg: body.msg }); } catch {} } });
}
fs.mkdirSync('docs/screenshots', { recursive: true });
try {
  await admin.goto('http://127.0.0.1:49090/login');
  await admin.getByRole('textbox', { name: '请输入密码', exact: true }).fill(env.VIBE_ADMIN_PASSWORD);
  await admin.getByRole('button', { name: '登录', exact: true }).click();
  await admin.waitForURL(url => !url.pathname.includes('/login'));
  const deskResponse = admin.waitForResponse(r => r.url().includes('/crm/clue/page') && r.url().includes('educationOnly=true'));
  await admin.goto('http://127.0.0.1:49090/edu/admission');
  const desk = await (await deskResponse).json(); assert.equal(desk.code, 0, desk.msg);
  const clue = desk.data.list.find(row => row.id === fixture.clueId); assert(clue, 'Fixture consultation must be in original owner-scoped CRM page');
  report.fixture.clueName = clue.name;
  const row = admin.getByRole('row').filter({ hasText: clue.name }); await row.waitFor();
  await admin.screenshot({ path: 'docs/screenshots/admission-admin-live.png', fullPage: true, animations: 'disabled' });
  pass('90500 admissions desk reads fixture 15 from the original owner-scoped clue API');
  const followResponse = admin.waitForResponse(r => r.url().includes('/crm/follow-up-record/page') && r.url().includes(`bizId=${fixture.clueId}`));
  await row.getByRole('button', { name: clue.name, exact: true }).click();
  const follow = await (await followResponse).json(); assert.equal(follow.code, 0, follow.msg); assert(follow.data.list.some(item => item.id === fixture.followUpId));
  const drawer = admin.locator('.el-drawer:visible'); await drawer.getByText('跟进记录', { exact: true }).waitFor();
  const detailResponse = admin.waitForResponse(r => r.url().includes('/crm/clue/get') && r.url().includes(`id=${fixture.clueId}`));
  await drawer.getByRole('button', { name: '完整 CRM 记录', exact: true }).click();
  await detailResponse; await admin.waitForURL(url => url.pathname.endsWith(`/crm/clue/detail/${fixture.clueId}`));
  await admin.getByRole('tabpanel', { name: '跟进记录' }).getByText(follow.data.list.find(item => item.id === fixture.followUpId).content, { exact: true }).waitFor();
  await admin.screenshot({ path: 'docs/screenshots/admission-followup-live.png', fullPage: true, animations: 'disabled' });
  pass('Original CRM detail and reused follow-up component display persisted follow-up 4');
  const listResponse = admin.waitForResponse(r => r.url().includes('/crm/clue/page'));
  await admin.goto('http://127.0.0.1:49090/edu/admission-clues');
  const list = await (await listResponse).json(); assert.equal(list.code, 0, list.msg); assert(list.data.list.some(item => item.id === fixture.clueId));
  await admin.getByText(clue.name, { exact: true }).waitFor();
  pass('90520 original CRM clue list resolves and displays the same consultation');

  await mini.goto('http://127.0.0.1:5174/#/pages/edu/login');
  await mini.getByText('密码登录', { exact: true }).click();
  await mini.locator('input').nth(0).fill('13900000001');
  await mini.locator('input').nth(1).fill(env.VIBE_MEMBER_PASSWORD);
  await mini.locator('.checkrow').click();
  const loginResponse = mini.waitForResponse(r => r.url().endsWith('/member/auth/login'));
  await mini.getByText(/^登录(?: \/ 注册|并继续)$/).click();
  const login = await (await loginResponse).json(); assert.equal(login.code, 0);
  await mini.waitForURL(url => !url.hash.includes('/pages/edu/login'));
  const draftFixturePath = '.runtime/admissions-ui-draft-fixture.json';
  let uiFixture;
  if (fs.existsSync(draftFixturePath)) uiFixture = JSON.parse(fs.readFileSync(draftFixturePath, 'utf8'));
  else {
    const key = String(Date.now()).slice(-5), name = `TEST 咨询学员${key}`;
    async function prepare(route, data) {
      const response = await mini.request.post('http://127.0.0.1:5174/app-api' + route, { headers: { 'tenant-id': '1', terminal: '10', Authorization: `Bearer ${login.data.accessToken}` }, data });
      const result = await response.json(); assert.equal(result.code, 0, result.msg); return result.data;
    }
    const studentId = await prepare('/edu/student/create', { name, birthMonth: '2016-01', grade: 'TEST', experience: '本地浏览器验收' });
    const trial = await prepare('/edu/trial/create', { studentId, cohortId: fixture.cohortId, termsAccepted: true });
    uiFixture = { studentId, name, trialBookingId: typeof trial === 'number' ? trial : trial.id, courseId: fixture.courseId, cohortId: fixture.cohortId, contactName: `TEST 咨询家长${key}`, message: `TEST 浏览器咨询验收 ${key}，仅验证表单与原 CRM 记录，请勿外部联系。` };
    fs.writeFileSync(draftFixturePath, JSON.stringify(uiFixture, null, 2) + '\n');
  }
  report.submissionFixture = uiFixture;
  const historyResponse = mini.waitForResponse(r => r.url().includes('/edu/admission/list'));
  await mini.goto(`http://127.0.0.1:5174/#/pages/edu/consultation?studentId=${uiFixture.studentId}`);
  const history = await (await historyResponse).json(); assert.equal(history.code, 0, history.msg);
  await mini.getByText('咨询的孩子', { exact: true }).waitFor();
  async function movePicker(pickerIndex, offset) {
    await mini.locator('uni-picker').nth(pickerIndex).click();
    await mini.waitForTimeout(350); // Wait for the native bottom-sheet entry transition before pointer geometry.
    const content = mini.locator('uni-picker-view-column:visible .uni-picker-view-content'); await content.waitFor();
    const indicator = mini.locator('.uni-picker-view-indicator:visible'); const box = await indicator.boundingBox(); assert(box);
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await mini.mouse.move(x, y); await mini.mouse.wheel(0, -offset * 100);
    await mini.waitForTimeout(350);
    await mini.locator('.uni-picker-action-confirm:visible').click();
  }
  // Real wheel gestures move to the preceding owned child and back to this captured form child.
  await movePicker(0, 1);
  await mini.waitForTimeout(200);
  assert(!(await mini.locator('uni-picker').nth(0).locator('.field').textContent()).includes(uiFixture.name));
  await movePicker(0, -1);
  await mini.waitForTimeout(200);
  assert((await mini.locator('uni-picker').nth(0).locator('.field').textContent()).includes(uiFixture.name));
  await movePicker(2, -1);
  assert(!(await mini.locator('uni-picker').nth(2).locator('.field').textContent()).includes('不关联'));
  assert(!(await mini.locator('uni-picker').nth(1).locator('.field').textContent()).includes('暂未确定'));
  pass('Native UniApp child picker changes and restores the captured child; trial picker selects its real owned booking and course');
  await mini.locator('input').nth(0).fill(uiFixture.contactName);
  await mini.locator('input').nth(1).fill('13900000001');
  await mini.locator('textarea').fill(uiFixture.message);
  const submit = mini.locator('uni-button').filter({ hasText: '提交咨询' });
  assert.equal(await submit.getAttribute('disabled'), 'true');
  const beforeRequests = [];
  const trackCreate = request => { if (request.url().includes('/edu/admission/create')) beforeRequests.push(request); };
  mini.on('request', trackCreate);
  await submit.click({ force: true }); await mini.waitForTimeout(200);
  assert.equal(beforeRequests.length, 0, 'Unchecked consent must not issue a create request');
  mini.off('request', trackCreate);
  await mini.screenshot({ path: 'docs/screenshots/mini-consultation-live.png', fullPage: true, animations: 'disabled' });
  pass('Populated form remains disabled without explicit contact consent and sends no create request');
  await mini.locator('.consent').click();
  assert.notEqual(await submit.getAttribute('disabled'), 'true');
  const createResponse = mini.waitForResponse(r => r.url().endsWith('/edu/admission/create') && r.request().method() === 'POST');
  const refreshedHistory = mini.waitForResponse(r => r.url().includes('/edu/admission/list'));
  await submit.click();
  const createdResponse = await createResponse, created = await createdResponse.json(); assert.equal(created.code, 0, created.msg);
  const sent = createdResponse.request().postDataJSON();
  assert.equal(sent.studentId, uiFixture.studentId); assert.equal(sent.trialBookingId, uiFixture.trialBookingId); assert.equal(sent.courseId, uiFixture.courseId); assert.equal(sent.contactConsent, true);
  const refreshed = await (await refreshedHistory).json(); assert.equal(refreshed.code, 0); assert(refreshed.data.some(item => item.id === created.data.id && item.trials.some(trial => trial.id === uiFixture.trialBookingId)));
  await mini.getByText('咨询已提交，受理老师会与你联系。', { exact: true }).waitFor();
  await mini.getByText(created.data.name, { exact: true }).waitFor();
  await mini.locator('uni-button').filter({ hasText: '提交咨询' }).waitFor();
  await mini.getByText('我的咨询', { exact: true }).scrollIntoViewIfNeeded();
  await mini.screenshot({ path: 'docs/screenshots/mini-consultation-success.png', fullPage: true, animations: 'disabled' });
  report.createdClueId = created.data.id; report.originalCreateResponse = { id: created.data.id, studentId: created.data.studentId, courseId: created.data.courseId, trials: created.data.trials };
  pass('Consented submit persists a real original CRM clue with captured child/trial IDs and refreshes actual parent history', { clueId: created.data.id });
  // Read the newly created original clue from the real staff screen too.
  await admin.goto('http://127.0.0.1:49090/edu/admission');
  await admin.getByRole('row').filter({ hasText: created.data.name }).waitFor();
  pass('New browser-created consultation appears in the original admin admissions list');
  assert.deepEqual(pageErrors, []); assert.deepEqual(failures, []);
  report.status = 'PASSED'; report.completedAt = new Date().toISOString(); report.pageErrors = pageErrors; report.apiFailures = failures;
  report.screenshots = ['admission-admin-live.png', 'admission-followup-live.png', 'mini-consultation-live.png', 'mini-consultation-success.png'].map(name => 'docs/screenshots/' + name);
  save();
} catch (error) {
  report.status = 'FAILED'; report.failure = error.message; report.pageErrors = pageErrors; report.apiFailures = failures; save();
  await admin.screenshot({ path: '.runtime/admissions-admin-failure.png', fullPage: true }).catch(() => {});
  await mini.screenshot({ path: '.runtime/admissions-mini-failure.png', fullPage: true }).catch(() => {});
  throw error;
} finally { await browser.close(); }
