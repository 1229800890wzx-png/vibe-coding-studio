// Browser acceptance against real isolated services. Never intercept or fabricate API responses.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const cache = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
const modulePath = fs.readdirSync(cache).map(name => path.join(cache, name, 'node_modules/playwright')).find(dir => fs.existsSync(path.join(dir, 'package.json')));
assert(modulePath, 'Cached Playwright must exist');
const { chromium } = require(modulePath);
const sharp = require(path.join(root, 'node_modules/sharp'));
const output = path.join(root, '.runtime/unified/browser');
fs.mkdirSync(output, { recursive: true });
const reportPath = path.join(root, '.runtime/unified/browser-report.json');
const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')) : { startedAt: new Date().toISOString(), checks: [], screenshots: [], pageErrors: [], httpFailures: [] };
if (report.error || (report.status === 'FAILED' && (report.pageErrors.length || report.apiFailures?.length))) report.previousAttempts = [...(report.previousAttempts || []), { error: report.error, pageErrors: report.pageErrors, apiFailures: report.apiFailures, updatedAt: report.updatedAt }];
report.pageErrors = []; report.httpFailures = []; report.apiFailures = [];
const save = () => fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
const pass = (name, details = {}) => { report.checks.push({ name, status: 'PASSED', ...details }); save(); console.log('PASS ' + name); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
async function createPage(viewport) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  page.on('pageerror', error => report.pageErrors.push({ url: page.url(), message: error.message, stack: error.stack }));
  page.on('response', async response => {
    if (response.status() >= 400) report.httpFailures.push({ url: response.url(), status: response.status() });
    if (response.url().includes('/admin-api/') || response.url().includes('/app-api/')) {
      try { const result = await response.json(); if (result.code && result.code !== 0) report.apiFailures.push({ path: new URL(response.url()).pathname, code: result.code, msg: result.msg }); } catch {}
    }
  });
  return page;
}
async function settled(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.body.scrollHeight; y += 650) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(100);
}
async function pixels(a, b) {
  const left = await sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const right = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (left.info.width !== right.info.width || left.info.height !== right.info.height) return { sameSize: false, baseline: left.info, integrated: right.info };
  let changed = 0, absolute = 0, max = 0;
  for (let i = 0; i < left.data.length; i += 4) {
    let delta = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(left.data[i + c] - right.data[i + c]); delta = Math.max(delta, d); absolute += d; max = Math.max(max, d); }
    if (delta > 2) changed++;
  }
  return { sameSize: true, width: left.info.width, height: left.info.height, changedPixels: changed, changedFraction: changed / (left.info.width * left.info.height), meanChannelDifference: absolute / (left.info.width * left.info.height * 3), maximumChannelDifference: max };
}
async function liveFlows() {
  const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').split(/\r?\n/).filter(x => x && !x.startsWith('#')).map(x => { const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1)]; }));
  const fixtures = JSON.parse(fs.readFileSync(path.join(root, '.runtime/unified/api-report.json'), 'utf8')).fixtures;
  const key = Date.now().toString(36);
  const website = await createPage({ width: 1365, height: 900 });
  const admin = await createPage({ width: 1440, height: 1000 });
  async function expectApi(promise) {
    const response = await promise;
    const result = await response.json();
    assert.equal(result.code, 0, `${new URL(response.url()).pathname}: ${result.msg}`);
    return { result: result.data, sent: response.request().postDataJSON() };
  }
  async function login(page, username) {
    await page.goto('http://127.0.0.1:49091/login');
    await page.getByRole('textbox', { name: '请输入租户名称', exact: true }).fill('VIBE CODING');
    await page.getByRole('textbox', { name: '请输入用户名', exact: true }).fill(username);
    await page.getByRole('textbox', { name: '请输入密码', exact: true }).fill(env.VIBE_ADMIN_PASSWORD);
    const response = page.waitForResponse(r => r.url().endsWith('/system/auth/login') && r.request().method() === 'POST');
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await expectApi(response);
    await page.waitForURL(url => !url.pathname.includes('/login'));
    await page.goto('http://127.0.0.1:49091/edu/website');
    await page.getByRole('tab', { name: '课程管理', exact: true }).waitFor();
  }
  async function screenshot(page, name) {
    const destination = path.join(output, name + '.png');
    await page.screenshot({ path: destination, fullPage: true, animations: 'disabled' });
    report.screenshots.push(path.relative(root, destination).replaceAll('\\', '/'));
    save();
  }
  try {
    await website.goto('http://127.0.0.1:4175/');
    await settled(website);
    await website.getByRole('button', { name: '预约体验', exact: true }).first().click();
    const form = website.getByRole('dialog');
    const submit = form.getByRole('button', { name: '同意并提交体验意向', exact: true });
    await submit.waitFor({ state: 'visible' });
    await submit.click();
    await form.getByRole('alert').waitFor();
    assert.equal(await form.locator('.reservation-success').count(), 0);
    const name = `TEST 浏览器家长 ${key}`;
    const contact = `browser-${key}@example.com`;
    await form.locator('input[name="name"]').fill(name);
    await form.locator('input[name="contact"]').fill(contact);
    await form.locator('select[name="experience"]').selectOption('接触过 AI 创作');
    await form.locator('select[name="interest"]').selectOption('AI 基础与新知');
    await screenshot(website, 'reservation-before-submit');
    const create = website.waitForResponse(r => r.url().includes('/edu/website-admission/create') && r.request().method() === 'POST');
    await submit.click();
    const admission = await expectApi(create);
    assert.equal(admission.result.status, 'ACCEPTED'); assert(admission.result.receipt);
    assert.equal(admission.sent.contactConsent, true); assert.equal(admission.sent.contactType, 'EMAIL');
    await form.getByRole('heading', { name: '体验意向已提交', exact: true }).waitFor();
    await screenshot(website, 'reservation-success');
    const download = website.waitForEvent('download');
    await form.getByRole('button', { name: '下载意向单', exact: true }).click();
    const downloaded = await download; const downloadPath = await downloaded.path();
    assert(fs.readFileSync(downloadPath, 'utf8').includes(admission.result.receipt));
    report.liveFixture = { contactName: name, contact, receipt: admission.result.receipt };
    pass('Live website reservation validates input, records consent, returns actual receipt and downloads the same receipt');

    await login(admin, fixtures.operator.username);
    await admin.getByRole('button', { name: '新增课程', exact: true }).click();
    let dialog = admin.getByRole('dialog');
    await dialog.getByLabel('标识（小写英文、数字或连字符；创建后不可修改）').fill(`ui-${key}`);
    let title = `TEST 浏览器课程 ${key}`;
    await dialog.getByLabel('课程名称', { exact: true }).fill(title);
    await dialog.getByLabel('简介', { exact: true }).fill('TEST 从基础理论到 AI 创作的真实管理表单验收');
    await dialog.getByLabel('内容大纲（每行一项）', { exact: true }).fill('基础理论\nAI 概念\n独立创作');
    const courseCreate = admin.waitForResponse(r => r.url().includes('/edu/website-offering/create') && r.request().method() === 'POST');
    await dialog.getByRole('button', { name: '保存课程', exact: true }).click();
    const created = (await expectApi(courseCreate)).result;
    assert.equal(created.published, false);
    let row = admin.getByRole('row').filter({ hasText: title });
    await row.waitFor();
    assert((await row.innerText()).includes('草稿'));
    await row.getByRole('button', { name: '编辑', exact: true }).click();
    dialog = admin.getByRole('dialog');
    assert(await dialog.getByLabel('标识（小写英文、数字或连字符；创建后不可修改）').isDisabled());
    title += ' 已编辑';
    await dialog.getByLabel('课程名称', { exact: true }).fill(title);
    const courseUpdate = admin.waitForResponse(r => r.url().includes('/edu/website-offering/update') && r.request().method() === 'PUT');
    await dialog.getByRole('button', { name: '保存课程', exact: true }).click();
    const updated = (await expectApi(courseUpdate)).result;
    assert.equal(updated.title, title); assert(updated.revision > created.revision);
    row = admin.getByRole('row').filter({ hasText: title });
    const publish = admin.waitForResponse(r => r.url().includes('/edu/website-offering/publish') && r.request().method() === 'POST');
    await row.getByRole('button', { name: '发布', exact: true }).click();
    assert.equal((await expectApi(publish)).result.published, true);
    await website.goto('http://127.0.0.1:4175/courses');
    await website.getByRole('heading', { name: title, exact: true }).waitFor();
    await screenshot(admin, 'admin-course-published');
    const unpublish = admin.waitForResponse(r => r.url().includes('/edu/website-offering/publish') && r.request().method() === 'POST');
    await row.getByRole('button', { name: '撤下', exact: true }).click();
    assert.equal((await expectApi(unpublish)).result.published, false);
    await website.reload(); await settled(website);
    assert.equal(await website.getByRole('heading', { name: title, exact: true }).count(), 0);
    report.liveFixture.courseId = created.id;
    pass('Live admin creates draft, edits immutable-slug course, publishes it on the website and withdraws it without modifying approved courses');
    await admin.close();

    const owner = await createPage({ width: 1440, height: 1000 });
    await login(owner, fixtures.owner.username);
    await owner.getByRole('tab', { name: '咨询跟进', exact: true }).click();
    const inquiryRow = owner.getByRole('row').filter({ hasText: name });
    await inquiryRow.waitFor();
    const inquiryGet = owner.waitForResponse(r => r.url().includes('/edu/website-admission/get?'));
    await inquiryRow.getByRole('button', { name: '查看与跟进', exact: true }).click();
    const actualInquiry = (await expectApi(inquiryGet)).result;
    assert.equal(actualInquiry.contactName, name); assert.equal(actualInquiry.email, contact);
    dialog = owner.getByRole('dialog');
    await dialog.locator('.el-form-item').filter({ hasText: '跟进状态' }).locator('.el-select__wrapper').click();
    await owner.getByRole('option', { name: '已联系', exact: true }).click();
    const note = `TEST 浏览器跟进验收 ${key}，没有发送外部消息。`;
    await dialog.getByLabel('内部备注', { exact: true }).fill(note);
    await screenshot(owner, 'admin-inquiry-detail');
    const follow = owner.waitForResponse(r => r.url().includes('/edu/website-admission/update') && r.request().method() === 'PUT');
    await dialog.getByRole('button', { name: '保存跟进', exact: true }).click();
    await expectApi(follow);
    await inquiryRow.getByText('已联系', { exact: true }).waitFor();
    const reread = owner.waitForResponse(r => r.url().includes('/edu/website-admission/get?'));
    await inquiryRow.getByRole('button', { name: '查看与跟进', exact: true }).click();
    const persisted = (await expectApi(reread)).result;
    assert.equal(persisted.status, 'CONTACTED'); assert.equal(persisted.note, note);
    await owner.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click();
    await screenshot(owner, 'admin-inquiry-persisted');
    report.liveFixture.clueId = actualInquiry.id;
    pass('Live owner admin reads the website-submitted CRM inquiry and persists status plus internal note through migrated UI');
    await owner.close();
  } finally { await website.close(); if (!admin.isClosed()) await admin.close(); }
}
async function permissionRefresh() {
  const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').split(/\r?\n/).filter(x => x && !x.startsWith('#')).map(x => { const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1)]; }));
  const fixtures = JSON.parse(fs.readFileSync(path.join(root, '.runtime/unified/api-report.json'), 'utf8')).fixtures;
  for (const [role, fixture] of [['operator', fixtures.operator], ['owner', fixtures.owner]]) {
    const page = await createPage({ width: 1440, height: 1000 });
    const requests = [];
    page.on('request', request => { if (request.url().includes('/edu/website-admission/')) requests.push(new URL(request.url()).pathname); });
    await page.goto('http://127.0.0.1:49091/login');
    await page.getByRole('textbox', { name: '请输入租户名称', exact: true }).fill('VIBE CODING');
    await page.getByRole('textbox', { name: '请输入用户名', exact: true }).fill(fixture.username);
    await page.getByRole('textbox', { name: '请输入密码', exact: true }).fill(env.VIBE_ADMIN_PASSWORD);
    const auth = page.waitForResponse(r => r.url().endsWith('/system/auth/login') && r.request().method() === 'POST');
    await page.getByRole('button', { name: '登录', exact: true }).click();
    assert.equal((await (await auth).json()).code, 0);
    await page.waitForURL(url => !url.pathname.includes('/login'));
    await page.goto('http://127.0.0.1:49091/edu/website');
    await page.getByRole('tab', { name: '课程管理', exact: true }).waitFor();
    await page.waitForLoadState('networkidle');
    if (role === 'operator') {
      assert.deepEqual(requests, [], 'A course-only operator must not request CRM data');
      assert.equal(await page.getByRole('tab', { name: '咨询跟进', exact: true }).count(), 0);
      assert(await page.getByRole('button', { name: '新增课程', exact: true }).isVisible());
    } else {
      await page.getByRole('tab', { name: '咨询跟进', exact: true }).click();
      await page.getByRole('row').filter({ hasText: report.liveFixture.contactName }).waitFor();
      assert.equal(await page.getByRole('button', { name: '新增课程', exact: true }).count(), 0);
    }
    const destination = path.join(output, `admin-${role}-permissions.png`);
    await page.screenshot({ path: destination, fullPage: true, animations: 'disabled' });
    report.screenshots.push(path.relative(root, destination).replaceAll('\\', '/'));
    pass(`Permission-aware ${role} UI exposes allowed tabs/actions and makes no unauthorized request`);
    await page.close();
  }
}
async function targetedRegressions() {
  for (const [name, viewport] of [['desktop', { width: 1365, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await createPage(viewport);
    await page.goto('http://127.0.0.1:4175/courses#start');
    await page.locator('#start').waitFor();
    await page.waitForLoadState('networkidle');
    for (let n = 0; n < 2; n++) {
      if (n) { await page.reload(); await page.locator('#start').waitFor(); await page.waitForLoadState('networkidle'); }
      const position = await page.locator('#start').evaluate(element => ({ top: element.getBoundingClientRect().top, scroll: window.scrollY, margin: parseFloat(getComputedStyle(element).scrollMarginTop) || 0, padding: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0 }));
      assert(position.scroll > 200, `${name} anchor must scroll beyond the hero`);
      assert(Math.abs(position.top - position.margin - position.padding) < 4, `${name} asynchronous course anchor must settle at its intended scroll margin and root padding: ${JSON.stringify(position)}`);
    }
    pass(`Async course anchor ${name} opens and reloads at the requested course after data arrives`);
    await page.close();
  }
  const page = await createPage({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4175/'); await page.waitForLoadState('networkidle');
  const optionsLoaded = page.waitForResponse(response => response.url().includes('/edu/website-admission/options'));
  await page.getByRole('button', { name: '预约体验', exact: true }).first().click();
  const loadedOptions = await (await optionsLoaded).json(); assert.equal(loadedOptions.code, 0);
  const dialog = page.getByRole('dialog');
  await dialog.locator('.reservation-notice').filter({ hasText: loadedOptions.data.consentText }).waitFor();
  const submit = dialog.getByRole('button', { name: '同意并提交体验意向', exact: true });
  await submit.waitFor();
  const key = Date.now().toString(36);
  const name = `TEST 移动端 ${key}`;
  const contact = `mobile-${key}@example.com`;
  await dialog.locator('input[name="name"]').fill(name);
  await dialog.locator('input[name="contact"]').fill(contact);
  const session = await page.context().newCDPSession(page);
  await session.send('Network.enable');
  // Real browser network latency, not interception or a fabricated response.
  await session.send('Network.emulateNetworkConditions', { offline: false, latency: 600, downloadThroughput: 1_000_000, uploadThroughput: 1_000_000 });
  const created = page.waitForResponse(response => response.url().includes('/edu/website-admission/create') && response.request().method() === 'POST');
  await submit.click();
  for (const field of ['input[name="name"]', 'input[name="contact"]', 'select[name="experience"]', 'select[name="interest"]']) assert(await dialog.locator(field).isDisabled(), `${field} must lock the submitted snapshot`);
  assert(await dialog.getByRole('button', { name: '正在提交…', exact: true }).isDisabled());
  const response = await created; const receipt = await response.json();
  assert.equal(receipt.code, 0, receipt.msg); assert.equal(response.request().postDataJSON().contact, contact);
  await dialog.getByRole('heading', { name: '体验意向已提交', exact: true }).waitFor();
  const downloadEvent = page.waitForEvent('download');
  await dialog.getByRole('button', { name: '下载意向单', exact: true }).click();
  const download = await downloadEvent;
  const saved = fs.readFileSync(await download.path(), 'utf8');
  assert(saved.includes(name)); assert(saved.includes(contact)); assert(saved.includes(receipt.data.receipt));
  await session.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const destination = path.join(output, 'mobile-reservation-success.png');
  await page.screenshot({ path: destination, fullPage: true, animations: 'disabled' });
  report.screenshots.push(path.relative(root, destination).replaceAll('\\', '/'));
  pass('Mobile reservation locks four fields while a real delayed request is pending and downloads the confirmed submitted snapshot');
  await page.close();
}
try {
  if (!process.argv.some(arg => ['--flows-only', '--permissions-only', '--regressions-only'].includes(arg))) {
    report.checks = report.checks.filter(x => !x.name.startsWith('Visual ') && !x.name.startsWith('Carousel'));
    for (const [size, viewport] of [['desktop', { width: 1365, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
      for (const route of ['/', '/courses', '/method', '/mentors', '/projects']) {
        const name = route === '/' ? 'home' : route.slice(1);
        const pages = await Promise.all([createPage(viewport), createPage(viewport)]);
        const paths = [path.join(output, `${size}-${name}-baseline.png`), path.join(output, `${size}-${name}-integrated.png`)];
        await Promise.all(pages.map((page, index) => page.goto(`http://127.0.0.1:${index === 0 ? 4176 : 4175}${route}`)));
        await Promise.all(pages.map(settled));
        for (const page of pages) {
          assert.equal(await page.locator('.art.has-error').count(), 0, `${size} ${route}: art failures`);
          const failed = await page.locator('img').evaluateAll(imgs => imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src));
          assert.deepEqual(failed, [], `${size} ${route}: broken images`);
        }
        await Promise.all(pages.map((page, index) => page.screenshot({ path: paths[index], fullPage: true, animations: 'disabled' })));
        const comparison = await pixels(...paths);
        report.screenshots.push(...paths.map(p => path.relative(root, p).replaceAll('\\', '/')));
        const baselineText = await pages[0].locator('main').innerText();
        const integratedText = await pages[1].locator('main').innerText();
        const sameText = baselineText === integratedText;
        if (!comparison.sameSize || comparison.changedFraction > 0.001 || !sameText) {
          report.checks.push({ name: `Visual ${size} ${route}`, status: 'FAILED', comparison, sameText, ...(sameText ? {} : { baselineText, integratedText }) });
          console.log(`FAIL Visual ${size} ${route}: ${JSON.stringify(comparison)}, sameText=${sameText}`);
          save();
        } else pass(`Visual ${size} ${route}`, { comparison, sameText });
        if (route === '/') {
          const screen = pages[1].getByRole('region', { name: '平板作品轮播' });
          const initialCount = await screen.locator('.carousel-count').innerText();
          assert.match(initialCount, /^01 \/ 0[4-9]$/);
          await screen.getByRole('button', { name: '下一个作品', exact: true }).click();
          assert.equal(await screen.locator('.carousel-count').innerText(), initialCount.replace(/^01/, '02'));
          await screen.getByRole('button', { name: '上一个作品', exact: true }).click();
          assert.equal(await screen.locator('.carousel-count').innerText(), initialCount);
          assert(await screen.getByRole('button', { name: '已按系统偏好停用自动轮播' }).isDisabled());
          pass(`Carousel ${size}: next, previous, reduced-motion preference`);
        }
        await Promise.all(pages.map(page => page.close()));
      }
    }
  }
  if (process.argv.includes('--flows-only') || process.argv.includes('--all')) await liveFlows();
  if (process.argv.includes('--permissions-only')) await permissionRefresh();
  if (process.argv.includes('--regressions-only')) await targetedRegressions();
  delete report.error;
  report.screenshots = [...new Set(report.screenshots)];
  report.checks = [...new Map(report.checks.map(check => [check.name, check])).values()];
  report.status = report.checks.some(x => x.status === 'FAILED') || report.pageErrors.length || report.httpFailures.length || report.apiFailures.length ? 'FAILED' : report.checks.some(x => x.name.startsWith('Live owner')) ? 'PASSED' : 'VISUAL_PASSED';
  if (report.status === 'FAILED') process.exitCode = 1;
  report.updatedAt = new Date().toISOString(); save();
} catch (error) {
  report.failurePages = [];
  for (const page of browser.contexts().flatMap(context => context.pages())) {
    const destination = path.join(output, `failure-${report.failurePages.length}.png`);
    try {
      await page.screenshot({ path: destination, fullPage: true, animations: 'disabled' });
      report.failurePages.push({ url: page.url(), alerts: await page.getByRole('alert').allTextContents(), screenshot: path.relative(root, destination).replaceAll('\\', '/') });
    } catch {}
  }
  report.status = 'FAILED'; report.error = error.stack; save(); console.error(error.stack); process.exitCode = 1;
} finally { await browser.close(); }
