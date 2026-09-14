/** Read-only, independent H5 observation with real original member form login. No request interception. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
const require = createRequire(import.meta.url);
const cache = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
const runtime = fs.readdirSync(cache).map(name => path.join(cache, name, 'node_modules/playwright')).find(dir => fs.existsSync(path.join(dir, 'package.json')));
if (!runtime) throw Error('Cached Playwright runtime unavailable');
const { chromium } = require(runtime);
const env = Object.fromEntries(fs.readFileSync('.runtime/foundation.env', 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }));
const report = { startedAt: new Date().toISOString(), scope: 'Independent Chromium H5 context. Original member form login; read-only visits to home, course discovery, me and children. No route interception, mocked responses or changed production configuration.', checks: [], collectorRequests: [], pageErrors: [], observedRequests: [], limitations: ['Bounded H5 browser observation, not a WeChat device network capture.'] };
const previousPath = '.runtime/education-privacy-ui-report.json';
if (fs.existsSync(previousPath)) {
  const previous = JSON.parse(fs.readFileSync(previousPath, 'utf8'));
  report.previousFailures = [...(previous.previousFailures || []), ...(previous.status === 'FAILED' ? [{ startedAt: previous.startedAt, failure: previous.failure, collectorRequests: previous.collectorRequests, manifestSha256: previous.manifestSha256 }] : [])];
}
report.retestContext = '5174 development service restarted after the previous runtime still auto-imported @dcloudio/uni-stat despite manifest flags. No source change by this test.';
const manifestBytes = fs.readFileSync('apps/miniapp/manifest.json');
report.manifestSha256 = crypto.createHash('sha256').update(manifestBytes).digest('hex');
report.manifestStatistics = { global: JSON.parse(manifestBytes).uniStatistics, h5: JSON.parse(manifestBytes).h5.uniStatistics, mpWeixin: JSON.parse(manifestBytes)['mp-weixin'].uniStatistics };
const save = () => fs.writeFileSync('.runtime/education-privacy-ui-report.json', JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
let phase = 'login';
page.on('request', request => {
  const url = new URL(request.url()); const item = { phase, method: request.method(), hostname: url.hostname, pathname: url.pathname };
  report.observedRequests.push(item); // Never record tokens, query values, request bodies or credentials.
  if (/tongji-collector\.dcloud\.net\.cn|tongji\.dcloud\.(io|net\.cn)|WebTrack\.gif/i.test(request.url())) report.collectorRequests.push(item);
});
page.on('pageerror', error => report.pageErrors.push(error.message));
try {
  await page.goto('http://127.0.0.1:5174/#/pages/edu/login');
  await page.locator('.login-form').waitFor(); await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'docs/screenshots/mini-login-live.png', fullPage: true, animations: 'disabled' });
  await page.getByText('密码登录', { exact: true }).click();
  await page.locator('input').nth(0).fill('13900000001');
  await page.locator('input').nth(1).fill(env.VIBE_MEMBER_PASSWORD);
  await page.locator('.checkrow').click();
  const loginResponse = page.waitForResponse(response => response.url().endsWith('/member/auth/login'));
  await page.getByText('登录 / 注册', { exact: true }).click();
  assert.equal((await (await loginResponse).json()).code, 0);
  await page.waitForURL(url => !url.hash.includes('/edu/login'));
  for (const [route, label] of [['tab/home', '首页'], ['tab/courses', '选课'], ['tab/me', '我的'], ['edu/children', '孩子']]) {
    phase = label;
    await page.goto('about:blank');
    await page.goto(`http://127.0.0.1:5174/#/pages/${route}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    assert(page.url().includes(`/pages/${route}`), `${label} unexpectedly redirected`);
    assert.equal(report.collectorRequests.length, 0, `${label}: statistics collector requested`);
    const requests = report.observedRequests.filter(request => request.phase === label);
    assert(requests.some(request => request.pathname.startsWith('/app-api/')), `${label}: no real business API reads were observed`);
    report.checks.push({ page: label, route, collectorRequestCount: 0, observedRequestCount: requests.length });
    save(); console.log(`PASS: ${label} authenticated live visit; no statistics collector requests`);
  }
  report.screenshots = ['docs/screenshots/mini-login-live.png'];
  for (const width of [320, 375, 390, 430]) {
    phase = `首页截图-${width}`;
    await page.setViewportSize({ width, height: 844 });
    await page.goto('about:blank');
    await page.goto('http://127.0.0.1:5174/#/pages/tab/home');
    await page.locator('.course-card').first().waitFor();
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    const file = `docs/screenshots/mini-home-${width}.png`;
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    report.screenshots.push(file);
    if (width === 390) { fs.copyFileSync(file, 'docs/screenshots/mini-home.png'); report.screenshots.push('docs/screenshots/mini-home.png'); }
    console.log(`Captured final live home at ${width}px after real course cards and network idle`);
  }
  await page.waitForTimeout(2000);
  assert.equal(report.collectorRequests.length, 0); assert.deepEqual(report.pageErrors, []);
  report.status = 'PASSED'; report.completedAt = new Date().toISOString(); report.collectorRequestCount = 0;
  report.observedHosts = [...new Set(report.observedRequests.map(request => request.hostname))];
  report.limitations.push('Only the specified Uni statistics collectors are asserted absent. Other observed hosts, including development-injected SDK resources, remain listed; this is not a zero-external-request claim.'); save();
} catch (error) { report.status = 'FAILED'; report.failure = error.message; save(); throw error; }
finally { await browser.close(); }
