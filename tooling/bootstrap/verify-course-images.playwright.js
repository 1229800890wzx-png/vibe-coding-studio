// Read-only live UI verification. No credentials, mutated business records, or fabricated API data.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const cache = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
const runtime = fs.readdirSync(cache).map(name => path.join(cache, name, 'node_modules/playwright')).find(dir => fs.existsSync(path.join(dir, 'package.json')));
if (!runtime) throw Error('Cached Playwright runtime is required.');
const { chromium } = require(runtime);
const base = 'http://127.0.0.1:5174';
const expectedAsset = { STORY: 'story', GAME: 'game', WEB: 'web', WEBSITE: 'web', TOOL: 'tools', AI: 'ai', AI_CREATION: 'ai', PRODUCT: 'product', PROJECT: 'product' };
const report = {
  startedAt: new Date().toISOString(),
  provenance: 'Independent Edge browser; guest session; live local education APIs. AI-generated course creation illustrations, not real students or photographs of actual teaching. Existing TEST course text and immutable API cover values are preserved.',
  normalScenario: 'No interception; all screenshots use normal live API and asset requests.',
  checks: [], screenshots: [], errors: [],
};
const save = () => fs.writeFileSync('.runtime/course-image-ui-report.json', JSON.stringify(report, null, 2) + '\n');
const pass = (name, details = {}) => { report.checks.push({ name, status: 'PASS', ...details }); save(); console.log(`PASS: ${name}`); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', error => report.errors.push(error.message));
fs.mkdirSync('docs/screenshots', { recursive: true });

async function loadCoursePage(target) {
  const response = page.waitForResponse(response => response.url().includes('/edu/course/page') && response.request().method() === 'GET');
  await page.goto(base + target);
  const received = await response;
  assert(received.ok(), `Live course API returned HTTP ${received.status()}`);
  const body = await received.json();
  assert.equal(body.code, 0, body.msg);
  await page.locator('.course-card').first().waitFor();
  await page.waitForFunction(() => {
    const cards = [...document.querySelectorAll('.course-card')];
    return cards.length > 0 && cards.every(card => {
      const image = card.querySelector('.cover img');
      return image && image.complete && image.naturalWidth > 0;
    });
  });
  return body.data.list;
}

async function checkCards(label, courses) {
  const cards = await page.locator('.course-card').evaluateAll(nodes => nodes.map(node => {
    const image = node.querySelector('.cover img');
    const box = node.querySelector('.course-visual').getBoundingClientRect();
    return {
      name: node.querySelector('.course-title').textContent.trim(),
      src: image.currentSrc || image.src,
      naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
      width: box.width, height: box.height,
      illustrationLabel: node.querySelector('.cover-caption')?.textContent.trim(),
    };
  }));
  for (const card of cards) {
    const course = courses.find(item => item.name === card.name);
    assert(course, 'Visible course must match a live API record');
    assert(!/mono\.webp|notes\.webp|course-placeholder/.test(card.src), 'No legacy placeholder may be rendered');
    assert.equal(new URL(card.src).pathname, `/static/edu/courses/${expectedAsset[course.direction] || 'product'}.jpg`);
    assert(card.naturalWidth > 0 && card.naturalHeight > 0);
    assert(Math.abs(card.width / card.height - 16 / 9) < 0.03, 'Course wrapper must retain 16:9 at the current viewport');
    assert.equal(card.illustrationLabel, '创作示意');
    card.courseId = course.id; card.direction = course.direction; card.originalCoverUrl = course.coverUrl;
  }
  const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth }));
  assert(dimensions.scrollWidth <= dimensions.width + 1 && dimensions.bodyScrollWidth <= dimensions.width + 1, 'Page must not overflow horizontally');
  pass(label, { dimensions, cards });
  return cards;
}

async function screenshot(file, locator) {
  const screenshotPath = 'docs/screenshots/' + file;
  if (locator) {
    // Align the crop above the real fixed tab bar; do not hide or modify any app elements.
    await locator.evaluate(node => node.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -88));
    await locator.screenshot({ path: screenshotPath, animations: 'disabled' });
  }
  else await page.screenshot({ path: screenshotPath, animations: 'disabled' });
  report.screenshots.push(screenshotPath); save();
}

try {
  let courses = await loadCoursePage('/#/');
  await checkCards('Desktop home: live course covers match their directions, load fully, and fit 1440px', courses);
  await screenshot('course-images-home-desktop.png', page.locator('.course-grid').first());

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('about:blank');
  courses = await loadCoursePage('/#/');
  const mobileCards = await checkCards('Mobile home: all covers load without horizontal overflow at 390px', courses);
  const firstCard = page.locator('.course-card').first();
  await firstCard.scrollIntoViewIfNeeded();
  await screenshot('course-images-home-mobile.png', firstCard);

  const detailResponse = page.waitForResponse(response => response.url().includes('/edu/course/get') && response.request().method() === 'GET');
  await firstCard.click();
  const detail = await (await detailResponse).json(); assert.equal(detail.code, 0, detail.msg);
  assert.equal(detail.data.id, mobileCards[0].courseId);
  await page.waitForFunction(() => {
    const image = document.querySelector('.course-cover img');
    return image?.complete && image.naturalWidth > 0;
  });
  const detailImage = await page.locator('.course-cover img').evaluate(image => ({ src: image.currentSrc || image.src, width: image.naturalWidth, height: image.naturalHeight }));
  assert.equal(new URL(detailImage.src).pathname, `/static/edu/courses/${expectedAsset[detail.data.direction] || 'product'}.jpg`);
  const detailDimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert(detailDimensions.scrollWidth <= detailDimensions.width + 1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await screenshot('course-images-detail-mobile.png');
  pass('Mobile detail opens the actual selected course and displays its fully loaded matching illustration', { courseId: detail.data.id, originalCoverUrl: detail.data.coverUrl, detailImage, dimensions: detailDimensions });

  await page.goto('about:blank');
  courses = await loadCoursePage('/#/pages/tab/courses');
  await checkCards('Course selection: the complete first page uses direction-specific loaded covers at 390px', courses);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await checkCards('Course selection: loaded covers and 16:9 wrappers fit 1440px', courses);

  // Clearly isolated fault injection. The normal screenshots above are unaffected.
  const failureContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const failurePage = await failureContext.newPage();
  let toolsRequests = 0, aborted = 0;
  await failurePage.route('**/static/edu/courses/tools.jpg', async route => {
    toolsRequests++;
    if (!aborted) { aborted++; await route.abort('failed'); }
    else await route.continue();
  });
  await failurePage.goto(base + '/#/');
  await failurePage.locator('.course-card .course-symbol').first().waitFor();
  await failurePage.waitForTimeout(700);
  const afterSettled = toolsRequests;
  await failurePage.waitForTimeout(700);
  assert.equal(toolsRequests, afterSettled, 'Asset failure must not trigger an infinite retry loop');
  assert.equal(aborted, 1);
  const fallbackCount = await failurePage.locator('.course-card .course-symbol').count();
  assert(fallbackCount > 0);
  pass('Isolated injection: one aborted tools.jpg request falls back visibly without an image retry loop', { injectedFailure: true, normalScreenshotsUnaffected: true, aborted, toolsRequests, fallbackCount });
  await failureContext.close();

  assert.deepEqual(report.errors, [], 'Normal scenarios must not generate uncaught page errors');
  report.status = 'PASSED'; report.completedAt = new Date().toISOString(); save();
} catch (error) {
  report.status = 'FAILED'; report.error = error.stack || String(error); report.completedAt = new Date().toISOString(); save();
  throw error;
} finally { await browser.close(); }
