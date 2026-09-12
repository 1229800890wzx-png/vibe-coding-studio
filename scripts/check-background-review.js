async (page) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4173/design-review/index.html?v=20260911-photo1#background');
  const picture = page.locator('#background img');
  await picture.evaluate(image => image.decode());
  const report = {
    selected: await page.getByRole('tab', {name:'首屏背景精修',exact:true}).getAttribute('aria-selected'),
    visiblePanels: await page.locator('[role=tabpanel]:visible').count(),
    image: await picture.evaluate(image => ({width:image.naturalWidth,height:image.naturalHeight})),
  };
  await page.getByRole('tab', {name:'当前 / 建议',exact:true}).click();
  report.previousComparisonAvailable = await page.locator('#compare').isVisible();
  await page.getByRole('tab', {name:'首屏背景精修',exact:true}).click();
  await page.screenshot({path:'output/design-review-2026-09-11/review-page.png',fullPage:true,animations:'disabled'});
  return report;
}
