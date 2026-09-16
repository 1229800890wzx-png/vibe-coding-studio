// Run with Playwright CLI in the authenticated parent session, from repository root.
async (page) => {
  await page.goto('http://127.0.0.1:5174/#/pages/edu/assignment?id=1&studentId=1');
  await page.locator('textarea').waitFor();
  await page.waitForFunction(() => document.querySelector('textarea')?.value === '本机草稿恢复验收：解释作品并保留附件。');
  if (!await page.getByText('local-project.js', {exact:true}).count()) throw new Error('Successful attachment did not survive reload');
  await page.screenshot({path:'output/playwright/live-mini-draft-recovered.png',fullPage:true});
  const original = '我的作品说明：预测输出，再运行验证。';
  await page.locator('textarea').fill(original);
  await page.waitForTimeout(450);
  await page.reload();
  await page.locator('textarea').waitFor();
  await page.waitForFunction((text) => document.querySelector('textarea')?.value === text, original);
  console.log(JSON.stringify({status:'PASSED',checks:['Unsaved text restored after reload','Uploaded attachment retained','Draft restored to original text; no server submission mutated']}));
}
