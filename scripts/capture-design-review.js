async (page) => {
  const root = 'output/playwright/design-review-2026-09-10';
  const routes = [['01-home','/'],['02-courses','/courses'],['03-method','/method'],['04-mentors','/mentors'],['05-projects','/projects']];
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [device, width, height] of [['desktop',1440,1000],['mobile',390,844]]) {
    await page.setViewportSize({width,height});
    for (const [name,route] of routes) {
      await page.goto('http://127.0.0.1:4173'+route);
      await page.locator('h1').waitFor();
      await page.waitForLoadState('networkidle');
      await page.locator('.art:not(.is-loaded)').waitFor({state:'detached'});
      const file = `${name}${device==='mobile'?'-mobile':''}.png`;
      await page.screenshot({path:`${root}/${file}`,fullPage:true,animations:'disabled'});
      if(device==='mobile') await page.screenshot({path:`${root}/${name}-mobile-first.png`,animations:'disabled'});
      results.push({file,route,device,...await page.evaluate(()=>({width:innerWidth,height:document.documentElement.scrollHeight,images:document.querySelectorAll('.art.is-loaded').length}))});
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({path:`${root}/home-first-screen.png`,animations:'disabled'});
  for(const [i,label] of ['小游戏','互动故事','个人网站','实用工具'].entries()) {
    await page.getByRole('group',{name:'选择作品类型'}).getByRole('button',{name:label,exact:true}).click();
    await page.locator('.art:not(.is-loaded)').waitFor({state:'detached'});
    await page.locator('.desk-stage').screenshot({path:`${root}/carousel-${i+1}.png`,animations:'disabled'});
    results.push({file:`carousel-${i+1}.png`,state:label});
  }
  await page.locator('.nav-actions .button').click();
  await page.locator('dialog[open]').waitFor();
  await page.getByRole('dialog').screenshot({path:`${root}/reservation.png`,animations:'disabled'});
  results.push({file:'reservation.png',state:'预约意向'});
  for(const id of ['island','fox','space','plant','classify','question']) {
    await page.goto('http://127.0.0.1:4173/projects?project='+id+'#gallery');
    await page.locator('dialog[open]').waitFor();
    await page.waitForLoadState('networkidle');
    await page.getByRole('dialog').screenshot({path:`${root}/project-${id}.png`,animations:'disabled'});
    results.push({file:`project-${id}.png`,state:id});
  }
  await page.goto('http://127.0.0.1:4173/');
  return results;
}
