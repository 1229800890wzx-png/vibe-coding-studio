// Playwright CLI run-code. Start with an original-member-authenticated session and the documented two-child cart fixture.
async (page) => {
  const out='C:/Users/12298/.codex/worktrees/vibe-edu/docs/screenshots';
  const check=(v,m)=>{if(!v)throw new Error(m)};
  const report={checks:[],timestamp:new Date().toISOString()};
  await page.goto('about:blank');
  await page.goto('http://127.0.0.1:5174/#/pages/edu/cart');
  await page.getByText('已选 2 项',{exact:true}).waitFor();
  check(await page.locator('.child-group').count()>=2,'Cart must present independent child groups');
  await page.getByText('确认课程',{exact:true}).click();
  await page.getByText('选择可用满减券',{exact:false}).waitFor();
  await page.locator('.checkrow').click();
  check(await page.locator('.dock .btn[disabled]').count()===0,'Review agreement should enable submission before new quote');
  await page.locator('.edu-page uni-button').filter({hasText:'选择可用满减券'}).click();
  await page.locator('.coupon-radio').first().click();
  await page.screenshot({animations:'disabled',path:out+'/mini-coupon-selector.png'});
  const quoted=page.waitForResponse(r=>r.url().includes('/trade/order/settlement'));
  await page.locator('.confirm-btn').click();
  const quote=(await(await quoted).json()).data;
  check(quote.price.payPrice===8999&&quote.price.couponPrice===1001,'Original quote must apply exact odd-cent coupon');
  await page.getByText('费用已从 ¥100 更新为 ¥89.99，请核对后重新确认。',{exact:true}).waitFor();
  check(await page.locator('.dock .btn[disabled]').count()===1,'Changed quote must require agreement again');
  report.checks.push('Original quote applies ¥10.01 across two children; persistent price change notice and agreement reset');
  await page.screenshot({path:out+'/mini-checkout-coupon.png',fullPage:true,animations:'disabled'});
  await page.locator('.edu-page uni-button').filter({hasText:'已选择 · 更换'}).click();
  await page.locator('.no-coupon').click();
  await page.locator('.close-icon').click();
  check(await page.getByText('¥89.99',{exact:true}).count()>=1,'Cancel must keep committed coupon');
  report.checks.push('Closing coupon editor discards temporary changes and keeps original selection');
  await page.locator('.edu-page uni-button').filter({hasText:'已选择 · 更换'}).click();
  await page.locator('.no-coupon').click();
  const cleared=page.waitForResponse(r=>r.url().includes('/trade/order/settlement'));
  await page.locator('.confirm-btn').click();
  check((await(await cleared).json()).data.price.payPrice===10000,'Clear coupon must recompute through original price service');
  await page.getByText('费用已从 ¥89.99 更新为 ¥100，请核对后重新确认。',{exact:true}).waitFor();
  report.checks.push('Explicitly clearing coupon restores original ¥100 quote without placing an order');
  report.status='PASSED';
  await page.evaluate(r=>{window.__vibeCouponReport=r},report);
}
