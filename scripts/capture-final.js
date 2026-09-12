async (page) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:4173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'output/playwright/homepage-preview.png', animations: 'disabled' });
  await page.locator('body').ariaSnapshot();
  for (const [index, label] of ['小游戏', '互动故事', '个人网站', '实用工具'].entries()) {
    await page.getByRole('group', { name: '选择作品类型' }).getByRole('button', { name: label, exact: true }).click();
    await page.locator('.tablet-screen').screenshot({ path: `output/playwright/carousel-${index + 1}.png`, animations: 'disabled' });
  }
  await page.getByRole('group', { name: '选择作品类型' }).getByRole('button', { name: '小游戏', exact: true }).click();
  await page.locator('.nav-actions .button').click();
  await page.locator('dialog[open]').waitFor();
  await page.getByRole('dialog').screenshot({ path: 'output/playwright/reservation.png', animations: 'disabled' });
  await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await page.locator('dialog[open]').waitFor({ state: 'detached' });
  await page.goto('http://127.0.0.1:4173/');
  return { preview: 'output/playwright/homepage-preview.png', slides: 4, reservation: 'output/playwright/reservation.png' };
}
