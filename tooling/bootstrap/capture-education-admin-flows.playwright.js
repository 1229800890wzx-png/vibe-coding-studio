// Actual original-admin UI recordings. Authentication occurs outside recorded contexts.
// Only TEST teaching data is created; scheduling is previewed and cancelled, never saved.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const cache = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
const runtime = process.env.PLAYWRIGHT_MODULE || fs.readdirSync(cache).map(name => path.join(cache, name, 'node_modules/playwright')).find(dir => fs.existsSync(path.join(dir, 'package.json')));
if (!runtime) throw Error('Playwright runtime unavailable');
const { chromium } = require(runtime);
const env = Object.fromEntries(fs.readFileSync('.runtime/foundation.env', 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }));
const fixtures = JSON.parse(fs.readFileSync('.runtime/education-flow-report.json', 'utf8')).fixtures;
const report = { startedAt: new Date().toISOString(), status: 'RUNNING', identity: 'original admin user 1', mode: 'Actual API and MySQL; no interception or mocks; no external sending', checks: [], fixtures: {}, videos: [], pageErrors: [], apiFailures: [] };
const saveReport = () => fs.writeFileSync('.runtime/education-admin-video-report.json', JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const loginContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const login = await loginContext.newPage();
let admin, member;
async function api(route, body) {
  const response = await login.request.fetch('http://127.0.0.1:48080' + route, { method: body ? 'POST' : 'GET', headers: { 'tenant-id': '1', terminal: '10', ...(route.endsWith('/auth/login') ? {} : { Authorization: `Bearer ${route.startsWith('/admin') ? admin : member}` }) }, ...(body ? { data: body } : {}) });
  const result = await response.json(); assert.equal(result.code, 0, `${route}: ${result.msg}`); return result.data;
}
const staff = (route, body) => api('/admin-api/edu' + route, body);
const localDateTime = value => { const d = new Date(value); const pad = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
let activeContext;
async function record(name, storageState, scenario) {
  activeContext = await browser.newContext({ storageState, viewport: { width: 1440, height: 1100 }, recordVideo: { dir: '.runtime/admin-flow-videos', size: { width: 1440, height: 1100 } } });
  const page = await activeContext.newPage();
  const pending = [];
  page.on('pageerror', e => report.pageErrors.push({ video: name, message: e.message }));
  page.on('response', response => {
    const pathname = new URL(response.url()).pathname;
    if (!pathname.startsWith('/admin-api/') && !pathname.startsWith('/app-api/')) return;
    pending.push((async () => {
      const body = await response.json().catch(() => null);
      if (response.status() >= 400 || (body && typeof body.code === 'number' && body.code !== 0)) report.apiFailures.push({ video: name, pathname, httpStatus: response.status(), code: body?.code, message: body?.msg });
    })());
  });
  await scenario(page);
  await Promise.all(pending);
  const video = page.video();
  await activeContext.close(); activeContext = undefined;
  const file = `docs/screenshots/${name}.webm`;
  await video.saveAs(file);
  const bytes = fs.readFileSync(file);
  report.videos.push({ file, sizeBytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), viewport: { width: 1440, height: 1100 }, authenticationExcluded: true });
  saveReport();
}
try {
  admin = (await api('/admin-api/system/auth/login', { username: 'admin', password: env.VIBE_ADMIN_PASSWORD })).accessToken;
  member = (await api('/app-api/member/auth/login', { mobile: '13900000001', password: env.VIBE_MEMBER_PASSWORD })).accessToken;
  const session = await staff(`/session/get?id=${fixtures.trial.sessionIds[0]}`);
  const title = `TEST 教师录屏 ${Date.now().toString(36)}`;
  const assignmentId = await staff('/assignment/create', { cohortId: fixtures.trial.id, sessionId: session.id, title, description: 'TEST 本地教师草稿录屏，不用于正式教学。', status: 'PUBLISHED', materials: [] });
  const draft = await api('/app-api/edu/submission/save', { studentId: fixtures.studentId, assignmentId, content: 'TEST 作品：我做了一个记录每日阅读的小工具，能够添加书名和阅读分钟。下一步想试试每周汇总。', attachments: [] });
  const submission = await api('/app-api/edu/submission/submit', { id: draft.id, revision: draft.revision, studentId: fixtures.studentId, assignmentId, content: draft.content, attachments: [] });
  report.fixtures = { assignmentId, submissionId: submission.id, sessionId: session.id, studentId: fixtures.studentId, cohortId: fixtures.trial.id, marker: title };
  await login.goto('http://127.0.0.1:49090/login');
  await login.getByRole('textbox', { name: '请输入密码', exact: true }).fill(env.VIBE_ADMIN_PASSWORD);
  await login.getByRole('button', { name: '登录', exact: true }).click();
  await login.waitForURL(url => !url.pathname.includes('/login'));
  await login.waitForLoadState('networkidle');
  const storageState = await loginContext.storageState(); // Memory only; never writes authentication material.
  await record('flow-teacher-review', storageState, async page => {
    await page.goto('http://127.0.0.1:49090/edu/submission');
    const row = page.getByRole('row').filter({ hasText: title });
    await row.waitFor(); await page.waitForTimeout(1200);
    await row.getByRole('button', { name: '开始批改', exact: true }).click();
    const drawer = page.locator('.el-drawer:visible');
    await drawer.getByText('尚未保存反馈草稿', { exact: true }).waitFor();
    await page.waitForTimeout(1500);
    await drawer.locator('textarea').fill('我注意到你已经把“添加记录”和“查看记录”分开，操作路径很清楚。下一步可以先画出每周汇总的样子，再试着统计阅读总分钟。请保留一次测试记录，方便比较改进前后的结果。');
    await drawer.getByText('邀请学员修改后再次提交', { exact: true }).click();
    await page.waitForTimeout(1500);
    const savedResponse = page.waitForResponse(r => r.url().endsWith('/edu/submission/review') && r.request().method() === 'POST');
    await drawer.getByRole('button', { name: '保存批改草稿', exact: true }).click();
    const response = await savedResponse; const saved = await response.json();
    assert.equal(saved.code, 0, saved.msg); assert.equal(saved.data.status, 'DRAFT'); assert.equal(saved.data.revision, 1);
    assert.equal(response.request().postDataJSON().revision, 0);
    const stamp = drawer.getByText(/草稿服务器保存时间/);
    await stamp.waitFor();
    assert((await stamp.textContent()).includes(new Date(saved.data.updateTime).toLocaleString('zh-CN', { hour12: false })));
    await page.waitForTimeout(3500);
    const persisted = await staff(`/submission/get?id=${submission.id}`);
    assert.equal(persisted.review.status, 'DRAFT'); assert.equal(persisted.review.updateTime, saved.data.updateTime);
    report.checks.push({ name: 'Open TEST submission, edit unpublished feedback, save revision 0 and show exact server updateTime', status: 'PASSED', reviewId: saved.data.id, revision: saved.data.revision, serverSavedAt: saved.data.updateTime, remainsUnpublished: true });
  });
  await record('flow-schedule-preview', storageState, async page => {
    const before = await staff(`/session/get?id=${session.id}`);
    await page.goto(`http://127.0.0.1:49090/edu/session?cohortId=${fixtures.trial.id}`);
    await page.getByText('月历', { exact: true }).click();
    const month = new Date(before.startTime);
    await page.locator('.calendar-toolbar input').fill(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`);
    await page.locator('.calendar-toolbar input').press('Enter');
    const entry = page.locator('.calendar-session').filter({ hasText: before.title });
    await entry.waitFor(); await page.waitForTimeout(1800);
    await entry.getByRole('button', { name: '调整', exact: true }).click();
    const drawer = page.locator('.el-drawer:visible');
    const delta = 30 * 60 * 1000;
    for (const [label, value] of [['开始时间', Number(before.startTime) + delta], ['结束时间', Number(before.endTime) + delta]]) {
      const input = drawer.getByPlaceholder(label, { exact: true });
      await input.fill(localDateTime(value)); await input.press('Enter'); await input.press('Tab');
    }
    await page.waitForTimeout(1500);
    const previewResponse = page.waitForResponse(r => r.url().endsWith('/edu/session/preview'));
    await drawer.getByRole('button', { name: '检查冲突与影响', exact: true }).click();
    const preview = await (await previewResponse).json();
    assert.equal(preview.code, 0, preview.msg);
    // Element Plus datetime inputs display/edit whole seconds, while TEST fixtures can contain milliseconds.
    assert.equal(Number(preview.data.proposed.startTime), Math.floor((Number(before.startTime) + delta) / 1000) * 1000);
    assert.equal(Number(preview.data.proposed.endTime), Math.floor((Number(before.endTime) + delta) / 1000) * 1000);
    assert(preview.data.affectedCount > 0, 'TEST lesson must have a real affected learner');
    const dialog = page.getByRole('dialog', { name: '确认本次排课影响', exact: true });
    await dialog.getByText('原上课时间', { exact: true }).waitFor();
    for (const student of preview.data.affectedStudents) await dialog.getByText(student.name, { exact: true }).waitFor();
    await page.waitForTimeout(4000);
    await dialog.getByRole('button', { name: '返回调整', exact: true }).click();
    await drawer.getByRole('button', { name: '关闭', exact: true }).click();
    await drawer.waitFor({ state: 'hidden' }); await page.waitForTimeout(1600);
    const after = await staff(`/session/get?id=${session.id}`);
    for (const field of ['startTime', 'endTime', 'version', 'title', 'teacherId', 'roomId']) assert.equal(after[field], before[field], `Cancelled preview must preserve ${field}`);
    report.checks.push({ name: 'Actual month calendar, +30 minute candidate, affected learner/conflict preview, cancel without saving', status: 'PASSED', canSave: preview.data.canSave, affectedCount: preview.data.affectedCount, conflictTypes: preview.data.conflicts.map(c => c.type), scheduleUnchanged: true });
  });
  assert.deepEqual(report.pageErrors, []); assert.deepEqual(report.apiFailures, []);
  report.status = 'PASSED'; report.completedAt = new Date().toISOString(); saveReport();
  console.log(`PASS: ${report.checks.length} actual-admin video flows; no API failures or page exceptions; credentials excluded`);
} catch (error) {
  report.status = 'FAILED'; report.failure = error.message; saveReport(); throw error;
} finally {
  if (activeContext) await activeContext.close();
  await browser.close();
}
