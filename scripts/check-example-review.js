async (page) => {
  const base='http://127.0.0.1:4173/design-review/';
  const root='output/playwright/design-review-2026-09-10';
  const report=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'examples.html?v=20260911-final');
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  await page.screenshot({path:root+'/examples-section.png',fullPage:true,animations:'disabled'});
  for(const id of ['minecraft','tower','story','website','tool']){
    await page.locator('[data-preview="'+id+'"]').first().click();
    const panel=page.locator('[data-preview-panel="'+id+'"]');
    if(!await panel.isVisible()) throw new Error('Preview not visible: '+id);
    if(id==='minecraft'){
      await panel.getByRole('button',{name:'＋ 添加模组',exact:true}).click();
      await panel.locator('[data-new-mod="飞行背包"]').click();
      report.push({mods:await panel.locator('[data-mod-count]').textContent(),added:await panel.locator('[data-mod-badges]').textContent()});
      await panel.getByRole('checkbox',{name:'启用自动农场',exact:true}).uncheck();
      report.push({modDisabled:await panel.locator('[data-mod-count]').textContent()});
    }
    if(id==='tower'){
      await panel.locator('[data-unit="sun"]').click();
      report.push({towerRole:await panel.locator('[data-unit-name]').textContent()});
    }
    if(id==='story'){
      await panel.locator('[data-story-choice="star"]').click();
      report.push({storyBranch:await panel.locator('[data-story-chapter]').textContent(),inventory:await panel.locator('[data-story-inventory]').textContent()});
      await panel.locator('[data-story-reset]').click();
      report.push({storyReset:await panel.locator('[data-story-chapter]').textContent()});
    }
    if(id==='website'){
      await panel.locator('[data-xp-material]').click();
      report.push({materialVisible:await panel.locator('[data-xp-material-panel]').isVisible()});
      await panel.locator('[data-xp-close-material]').click();
    }
    if(id==='tool'){
      await panel.locator('[data-xp-source="3"]').click();
      report.push({sourceLocated:await panel.locator('[data-xp-paragraph="3"]').getAttribute('class')});
      await panel.locator('[data-xp-add-card]').click();
      report.push({cards:await panel.locator('.xp-knowledge-card').count()});
      const download=page.waitForEvent('download');await panel.locator('[data-xp-export]').click();
      report.push({exportName:(await download).suggestedFilename()});
    }
    await page.locator('.ex-close').click();
  }
  await page.goto(base+'examples-home.html?v=20260911-final');
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  await page.screenshot({path:root+'/examples-home.png',fullPage:true,animations:'disabled'});
  await page.locator('.ex-grid').screenshot({path:root+'/examples-home-cards.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'examples.html?v=20260911-mobile');
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  report.push({mobileOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  await page.screenshot({path:root+'/examples-mobile.png',fullPage:true,animations:'disabled'});
  for(const id of ['minecraft','story','website','tool']){
    await page.locator('[data-preview="'+id+'"]').first().click();
    report.push({id,mobileDialog:await page.locator('.ex-dialog').evaluate(n=>({scroll:n.scrollWidth,width:n.clientWidth}))});
    await page.locator('.ex-close').click();
  }
  await page.setViewportSize({width:1440,height:1000});
  return {report,errors};
}
