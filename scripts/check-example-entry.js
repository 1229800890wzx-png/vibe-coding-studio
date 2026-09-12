async (page) => {
  await page.goto('http://127.0.0.1:4173/design-review/index.html?v=20260911-examples-v3#examples');
  const img=page.locator('#examples img');
  await img.evaluate(i=>i.decode());
  const review={selected:await page.getByRole('tab',{name:'作品示例精修',exact:true}).getAttribute('aria-selected'),visiblePanels:await page.locator('[role=tabpanel]:visible').count(),image:await img.evaluate(i=>({w:i.naturalWidth,h:i.naturalHeight}))};
  await page.goto('http://127.0.0.1:4173/design-review/examples-home.html?v=20260911-v3');
  const cards=await page.locator('.ex-card-media img').evaluateAll(list=>list.map(i=>({width:Math.round(i.getBoundingClientRect().width),height:Math.round(i.getBoundingClientRect().height),loaded:i.complete&&i.naturalWidth>0})));
  return {review,cards};
}
