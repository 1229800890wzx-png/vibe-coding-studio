// Record real local UI using in-memory copies of the existing original member session. No fake API responses.
async (page) => {
  const output='C:/Users/12298/.codex/worktrees/vibe-edu/docs/screenshots';
  const context=await page.context().browser().newContext({viewport:{width:390,height:844},storageState:await page.context().storageState(),recordVideo:{dir:output,size:{width:390,height:844}}});
  const film=await context.newPage();
  const video=film.video();
  const check=(v,m)=>{if(!v)throw new Error(m)};
  try {
    await film.goto('http://127.0.0.1:5174/#/pages/edu/cart');
    await film.getByText('已选 2 项',{exact:true}).waitFor();
    await film.waitForTimeout(500);
    await film.getByText('确认课程',{exact:true}).click();
    await film.locator('.edu-page uni-button').filter({hasText:'选择可用满减券'}).click();
    await film.locator('.coupon-radio').first().click();
    await film.waitForTimeout(700);
    await film.locator('.confirm-btn').click();
    await film.getByText('费用已从 ¥100 更新为 ¥89.99，请核对后重新确认。',{exact:true}).waitFor();
    await film.waitForTimeout(1200);
    await film.goto('http://127.0.0.1:5174/#/pages/edu/assignment?id=1&studentId=1');
    await film.locator('textarea').waitFor();
    const initial=await film.locator('textarea').inputValue();
    const draft=initial+'\n录屏验收：解释预测，再检查边界。';
    await film.locator('textarea').fill(draft);
    await film.waitForTimeout(700);
    await film.reload();
    await film.locator('textarea').waitFor();
    await film.waitForFunction(text=>document.querySelector('textarea')?.value===text,draft);
    check(await film.getByText('local-project.js',{exact:true}).count()>0,'Original uploaded attachment retained');
    await film.waitForTimeout(1400);
    await film.locator('textarea').fill(initial);
    await film.waitForTimeout(450);
    await film.close();await context.close();
    await video.saveAs(output+'/flow-checkout-and-draft.webm');
    await page.evaluate(r=>{window.__vibeVideoReport=r},{status:'PASSED',video:'flow-checkout-and-draft.webm',checks:['Original two-child checkout and coupon repricing','Unsaved assignment text and uploaded attachment survive reload'],limitations:['Chromium H5 recording; no real WeChat payment invoked','Draft changes remained local to temporary browser context; no assignment submitted']});
  } finally { await context.close(); }
}
