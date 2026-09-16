// Real local original auth and published catalog. No SMS, bookings, orders or payments.
// A single child-list request is aborted after real login to verify recovery semantics.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { normalizeCohortContext, filterCohorts, courseRouteParams } from '../../apps/miniapp/edu/cohort-context.js';
import { safeContinuation, continueTo } from '../../apps/miniapp/edu/navigation.js';

const report = { startedAt: new Date().toISOString(), scope: 'Actual local published APIs and original member password login; independent browser. One child GET failure is deliberately injected. No SMS, new booking, order or payment.', checks: [], screenshots: [], errors: [] };
const save = () => fs.writeFileSync('.runtime/benchmark-ux-report.json', JSON.stringify(report, null, 2) + '\n');
const pass = (name, evidence = {}) => { report.checks.push({ name, status: 'PASSED', ...evidence }); save(); console.log('PASS: ' + name); };
const origin = 'http://127.0.0.1:5174';
async function get(url) { const r = await fetch(origin + '/app-api/edu/' + url, { headers: { 'tenant-id': '1' } }); assert(r.ok); const body = await r.json(); assert.equal(body.code, 0); return body.data; }

// Beijing midnight boundaries and exact continuation IDs are material regression cases.
assert.deepEqual(normalizeCohortContext({ kind: 'REGULAR', mode: 'ONLINE', campusId: 1, unknown: 'ignored' }), { kind: 'REGULAR', mode: 'ONLINE' });
const interval = [
  { id: 1, kind: 'REGULAR', mode: 'ONLINE', startDate: Date.parse('2026-10-01T00:00:00+08:00') },
  { id: 2, kind: 'REGULAR', mode: 'ONLINE', startDate: Date.parse('2026-10-02T00:00:00+08:00') },
  { id: 3, kind: 'TRIAL', mode: 'ONLINE', startDate: Date.parse('2026-10-01T12:00:00+08:00') },
];
assert.deepEqual(filterCohorts(interval, { kind: 'REGULAR', startFrom: '2026-10-01', startTo: '2026-10-01' }).map(r => r.id), [1]);
assert.deepEqual(courseRouteParams(28, { kind: 'REGULAR', keyword: 'private-text' }), { id: 28, kind: 'REGULAR' });
for (const bad of ['https://example.com/', '//example.com', '/pages/edu/../login', '/pages/edu/login?x=1', '/pages/edu/cohort\\evil', '/pages/edu/cohort\n']) assert.equal(safeContinuation(bad), '');
const navigation = [];
globalThis.getCurrentPages = () => [{ route: 'pages/edu/cohort', $page: { fullPath: '/pages/edu/cohort?id=10' } }, { route: 'pages/edu/login' }];
globalThis.uni = { navigateBack: () => navigation.push('back'), redirectTo: o => navigation.push(o.url), switchTab: o => navigation.push(o.url) };
continueTo('/pages/edu/cohort?id=11'); assert.equal(navigation.pop(), '/pages/edu/cohort?id=11');
continueTo('/pages/edu/cohort?id=10'); assert.equal(navigation.pop(), 'back');
delete globalThis.uni; delete globalThis.getCurrentPages;
pass('Selection query whitelist, Beijing date boundary and distinct cohort continuation routes');

const candidates = (await get('course/page?kind=REGULAR&pageSize=100')).list;
let fixture;
for (const course of [...candidates].sort((a,b) => (a.id === 28 ? -1 : b.id === 28 ? 1 : 0))) {
  const cohorts = await get('cohort/list?courseId=' + course.id);
  const regular = cohorts.filter(c => c.kind === 'REGULAR' && c.stock > 0 && c.price > 0);
  const trial = cohorts.filter(c => c.kind === 'TRIAL' && c.price === 0);
  if (regular.length && trial.length) { fixture = { course, cohorts, regular, trial }; break; }
}
assert(fixture, 'Need existing TEST course with both a paid regular cohort and a free trial');
const minPrice = Math.min(...fixture.regular.map(c => c.price));
const require = createRequire(import.meta.url), cache = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
const lib = fs.readdirSync(cache).map(n => path.join(cache, n, 'node_modules/playwright')).find(p => fs.existsSync(path.join(p, 'package.json')));
const { chromium } = require(lib), browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai', deviceScaleFactor: 1 });
const page = await context.newPage(); page.on('pageerror', e => report.errors.push(e.message));
const shot = async (name, locator = page) => {
  const file = 'docs/screenshots/benchmark-' + name + '.png';
  const viewport = page.viewportSize();
  if (locator !== page) {
    const bounds = await locator.boundingBox();
    await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, Math.ceil(bounds.height) + 360) });
    await locator.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
  }
  await locator.screenshot({ path: file, animations: 'disabled' });
  if (locator !== page) await page.setViewportSize(viewport);
  report.screenshots.push(file);
};
const buttons = text => page.locator('uni-button').filter({ hasText: text });
const requestFor = predicate => page.waitForResponse(r => r.url().includes('/edu/course/page?') && predicate(new URL(r.url()).searchParams));
try {
  await page.goto(origin + '/#/pages/tab/home'); await page.locator('.service-path').first().waitFor();
  assert.equal(await page.locator('.service-path').count(), 3);
  await shot('home-paths', page.locator('.service-paths'));
  const formal = requestFor(p => p.get('kind') === 'REGULAR');
  await page.locator('.service-path').filter({ hasText: '系统班课' }).click(); assert.equal((await (await formal).json()).code, 0);
  await page.locator('.course-card').first().waitFor();
  const searched = requestFor(p => p.get('keyword') === fixture.course.name && p.get('kind') === 'REGULAR');
  await page.locator('.search-row input').fill(fixture.course.name); await page.locator('.search-row uni-button').click(); await searched;
  await page.locator('.course-card').filter({ hasText: fixture.course.name }).waitFor();
  const card = page.locator('.course-card').filter({ hasText: fixture.course.name }).first();
  assert((await card.innerText()).includes('正式班期起价')); await shot('selected-courses');
  await card.click(); await page.waitForURL(u => u.hash.includes('/pages/edu/course?') && u.hash.includes('kind=REGULAR'));
  await page.locator('[data-cohort-id]').first().waitFor();
  const displayedIds = await page.locator('[data-cohort-id]').evaluateAll(rows => rows.map(n => Number(n.getAttribute('data-cohort-id'))));
  assert.deepEqual(displayedIds.sort(), fixture.regular.map(c => c.id).sort());
  assert((await page.locator('.dock').innerText()).includes('¥' + minPrice / 100));
  assert(!(await page.locator('.dock').innerText()).includes('¥0'));
  await shot('regular-detail');
  pass('Home separates three learning services; regular list selection and actual price remain consistent in detail', { courseId: fixture.course.id, regularCohortIds: displayedIds, minimumPriceFen: minPrice });

  // Explicit broadening is a local detail action; the list selection stays intact.
  await buttons(/查看.*全部班期|查看本课程全部班期|查看全部班期/).first().click();
  await page.locator('[data-cohort-id="' + fixture.trial[0].id + '"]').waitFor();
  assert.equal(await page.locator('.cohort-group').count(), 2);
  await shot('cohort-choices', page.locator('#course-cohorts'));
  await page.locator('.dock uni-button').last().click();
  assert(page.url().includes('/pages/edu/course?'), 'Multiple class choices should scroll, not silently choose a class');
  const position = await page.locator('#course-cohorts').boundingBox(); assert(position && position.y < 220 && position.y > -60);
  await page.locator('.edu-header .brand').click(); await page.waitForURL(u => u.hash.includes('/pages/tab/courses'));
  assert((await page.locator('.type-choice.selected').innerText()).includes('正式班'));
  assert.equal(await page.locator('.search-row input').inputValue(), fixture.course.name);
  pass('Detail explicitly broadens to grouped trial/regular classes, scrolls to choices, and preserves original list search on return');

  const empty = requestFor(p => p.get('keyword') === 'UX-NO-SUCH-COURSE');
  await page.locator('.search-row input').fill('UX-NO-SUCH-COURSE'); await page.locator('.search-row uni-button').click(); await empty;
  await page.getByText('还没有匹配的课程', { exact: true }).waitFor();
  const relax = requestFor(p => p.get('keyword') === 'UX-NO-SUCH-COURSE' && !p.get('kind'));
  await page.locator('.selected-filter').filter({ hasText: '正式班' }).click(); await relax;
  assert.equal(await page.locator('.search-row input').inputValue(), 'UX-NO-SUCH-COURSE'); await shot('filter-recovery', page.locator('.edu-page'));
  const restored = requestFor(p => !p.get('keyword') && !p.get('kind'));
  await page.locator('.selected-filter').filter({ hasText: 'UX-NO-SUCH-COURSE' }).click(); await restored; await page.locator('.course-card').first().waitFor();
  pass('Zero-result recovery removes one condition at a time and preserves search until explicitly removed');

  await page.goto(origin + '/#/pages/edu/cohort?id=' + fixture.regular[0].id);
  await page.locator('.dock uni-button').waitFor();
  await page.locator('.dock uni-button').last().click(); await page.waitForURL(u => u.hash.includes('/pages/edu/login?'));
  assert(page.url().includes('returnTo=')); await page.reload();
  await page.getByText('密码登录', { exact: true }).click(); await shot('login-continuation');
  const env = Object.fromEntries(fs.readFileSync('.runtime/foundation.env', 'utf8').split(/\r?\n/).filter(x => x && !x.startsWith('#')).map(x => { const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1)]; }));
  let loginCalls = 0, childAborts = 0;
  page.on('request', r => { if (r.url().endsWith('/member/auth/login')) loginCalls++; });
  await page.route('**/edu/student/list*', route => { childAborts++; return route.abort(); }, { times: 1 });
  await page.locator('input').nth(0).fill('13900000001'); await page.locator('input').nth(1).fill(env.VIBE_MEMBER_PASSWORD);
  await page.locator('.checkrow').click(); const login = page.waitForResponse(r => r.url().endsWith('/member/auth/login'));
  await page.getByText('登录并继续', { exact: true }).click(); assert.equal((await (await login).json()).code, 0);
  await page.waitForURL(u => u.hash === '#/pages/edu/cohort?id=' + fixture.regular[0].id);
  await page.locator('.dock').waitFor(); assert.equal(loginCalls, 1); assert.equal(childAborts, 1);
  await page.unroute('**/edu/student/list*'); await page.reload(); await page.locator('.dock').waitFor();
  await shot('cohort-confirmation');
  pass('Original member login survives login-page reload and child-list failure, returns to the same cohort without reauthenticating', { cohortId: fixture.regular[0].id, originalLoginCalls: loginCalls, deliberatelyAbortedChildRequests: childAborts });

  await page.locator('.checkrow').click();
  const reconfirmHint = page.getByText('请阅读并勾选后继续。更换孩子或规则更新后，需要重新确认。', { exact: true });
  await reconfirmHint.waitFor({ state: 'hidden' });
  const firstChild = await page.locator('.current-child .child-name').textContent();
  await page.locator('.edu-header .child').click();
  const nextChild = page.locator('.student-choice').filter({ hasNotText: '当前孩子' }).first();
  await nextChild.waitFor(); await nextChild.click();
  await page.getByText(/报名孩子已切换为/).waitFor();
  await reconfirmHint.waitFor();
  assert.notEqual(await page.locator('.current-child .child-name').textContent(), firstChild);
  pass('Switching to another real child clears class-rule consent and states whose enrollment is being confirmed');

  // Independent guest session: login must preserve the teacher already selected in the page stack.
  const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai' });
  const guest = await guestContext.newPage(); guest.on('pageerror', e => report.errors.push(e.message));
  await guest.goto(origin + '/#/pages/edu/one-to-one'); await guest.locator('.teacher-card').first().waitFor();
  await guest.locator('.teacher-card').first().click(); const teacherChoice = await guest.locator('.teacher-card.selected .teacher-heading').innerText();
  await guest.getByText('家长登录', { exact: true }).click(); await guest.getByText('密码登录', { exact: true }).click();
  await guest.locator('input').nth(0).fill('13900000001'); await guest.locator('input').nth(1).fill(env.VIBE_MEMBER_PASSWORD);
  await guest.locator('.checkrow').click(); await guest.getByText('登录并继续', { exact: true }).click();
  await guest.waitForURL(u => u.hash.endsWith('/pages/edu/one-to-one')); await guest.locator('.booking-form').waitFor();
  assert.equal(await guest.locator('.teacher-card.selected .teacher-heading').innerText(), teacherChoice);
  await guestContext.close(); pass('Guest one-to-one teacher selection survives original parent login and family loading without submitting an appointment');

  const layouts = [];
  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/pages/tab/courses', '/pages/edu/course?id=' + fixture.course.id + '&kind=REGULAR', '/pages/edu/login?returnTo=%2Fpages%2Fedu%2Fcohort%3Fid%3D' + fixture.regular[0].id]) {
      await page.goto(origin + '/#' + route); await page.locator('.edu-page').waitFor(); await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); assert(!overflow, width + 'px overflow on ' + route);
      layouts.push({ width, route, horizontalOverflow: false });
    }
  }
  pass('320/390/430/1440 browser widths have no whole-page horizontal overflow', { layouts });
  assert.deepEqual(report.errors, []); report.status = 'PASSED'; report.completedAt = new Date().toISOString(); save();
} catch (e) {
  report.status = 'FAILED'; report.error = e.message; save();
  await page.screenshot({ path: '.runtime/benchmark-ux-failure.png', animations: 'disabled' }).catch(() => {});
  throw e;
} finally { await browser.close(); }
