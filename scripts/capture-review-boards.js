async (page) => {
  const root='output/playwright/design-review-2026-09-10';
  const base='http://127.0.0.1:4173/design-review/';
  await page.setViewportSize({width:1840,height:1100});
  const report=[];
  for(const name of ['overview','comparison']) {
    await page.goto(base+name+'.html');
    await page.waitForLoadState('networkidle');
    await page.screenshot({path:`${root}/${name}.png`,fullPage:true,animations:'disabled'});
    report.push({name,...await page.evaluate(()=>({width:innerWidth,height:document.documentElement.scrollHeight,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}))});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'index.html');
  await page.waitForLoadState('networkidle');
  await page.locator('body').ariaSnapshot();
  for(const label of ['全部页面截图','课程表达','参考与判断','当前 / 建议']) {
    await page.getByRole('tab',{name:label,exact:true}).click();
    report.push({tab:label,selected:await page.getByRole('tab',{name:label,exact:true}).getAttribute('aria-selected')});
  }
  await page.getByRole('tab',{name:'全部页面截图',exact:true}).click();
  await page.locator('summary').click();
  const states=page.locator('.state img');
  for(let i=0;i<await states.count();i++) {
    await states.nth(i).scrollIntoViewIfNeeded();
    await states.nth(i).evaluate(image=>image.decode());
  }
  report.push({images:await page.evaluate(()=>({total:document.images.length,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),deferred:[...document.images].filter(i=>!i.complete).map(i=>i.src)}))});
  await page.getByRole('tab',{name:'当前 / 建议',exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,0));
  return report;
}
