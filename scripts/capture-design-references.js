async (page) => {
  const root='output/playwright/design-review-2026-09-10';
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  const report=[];
  for(const [name,url] of [['apple','https://www.apple.com.cn/ipad-pro/'],['linear','https://linear.app/'],['stripe','https://stripe.com/payments']]) {
    try {
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
      await page.locator('h1').first().waitFor({timeout:15000});
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:`${root}/reference-${name}.png`,animations:'disabled'});
      report.push({name,url:page.url(),headings:await page.locator('h1,h2').allTextContents(),file:`reference-${name}.png`});
    } catch(error) {
      report.push({name,url,error:error.message.slice(0,200)});
    }
  }
  return report;
}
