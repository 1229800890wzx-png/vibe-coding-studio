async (page) => {
 const base='http://127.0.0.1:4173';const report=[];const errors=[];
 const assert=(ok,message)=>{if(!ok)throw new Error(message)};
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(base+'/?test=carousel');
 await page.mouse.move(0,0);
 const current=()=>page.locator('.showcase-slide').getAttribute('aria-label');
 const first=await current();
 assert(await page.getByRole('button',{name:'暂停自动轮播',exact:true}).count()===1,'Autoplay must start by default');
 await page.waitForTimeout(6800);
 assert(await current()!==first,'Autoplay did not change slide');
 const second=await current();await page.locator('.refined-screen').hover();
 await page.waitForTimeout(6800);
 assert(await current()===second,'Hover did not pause autoplay');
 await page.getByRole('button',{name:'下一个作品',exact:true}).focus();await page.mouse.move(0,0);
 await page.waitForTimeout(6800);
 assert(await current()===second,'Keyboard focus pause was overwritten by mouse leave');
 report.push({autoplay:true,hoverPause:true,focusPause:true});
 await page.getByRole('button',{name:'下一个作品',exact:true}).click();
 assert(await page.getByRole('button',{name:'开始自动轮播',exact:true}).count()===1,'Manual navigation should stop autoplay');
 await page.emulateMedia({reducedMotion:'reduce'});
 assert(await page.getByRole('button',{name:'已按系统偏好停用自动轮播',exact:true}).isDisabled(),'Reduced motion must disable autoplay');
 for(const label of ['MOD 工坊','花园塔防','互动故事','品牌网站','实用工具']){
   await page.getByRole('button',{name:label,exact:true}).click();
   await page.locator('.refined-screen').screenshot({path:'output/playwright/release-2026-09-12/slide-'+label+'.png',animations:'disabled'});
 }
 for(const route of ['/','/courses','/method','/mentors','/projects']){
   await page.goto(base+route+'?test=release');
   await page.evaluate(()=>Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()})));
   assert(await page.locator('h1').count()===1,'Missing page heading '+route);
   assert(await page.locator('.art.has-error,.showcase-image-error').count()===0,'Failed image '+route);
   report.push({route,images:'decoded'});
 }
 await page.goto(base+'/projects?category=game&project=minecraft#gallery');
 let dialog=page.getByRole('dialog');await dialog.waitFor();
 await dialog.getByRole('button',{name:'＋ 添加模组',exact:true}).click();
 await dialog.getByRole('button',{name:'飞行背包 ＋',exact:true}).click();
 assert(await dialog.getByRole('checkbox').count()===4,'Mod was not added');
 assert(await dialog.getByRole('button',{name:'飞行背包 已添加',exact:true}).isDisabled(),'Duplicate add not disabled');
 await dialog.getByRole('checkbox',{name:'启用自动农场',exact:true}).uncheck();
 const modDownload=page.waitForEvent('download');await dialog.getByRole('button',{name:/导出教学配置/}).click();
 const modFile=await modDownload;await modFile.saveAs('output/playwright/release-2026-09-12/mod-config.json');
 report.push({modDownload:modFile.suggestedFilename()});
 await page.keyboard.press('Escape');assert(!await dialog.count(),'Escape did not close dialog');
 assert(page.url().includes('category=game'),'Close removed category');
 await page.goto(base+'/projects?project=museum#gallery');dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:/靠近星图，寻找线索/}).click();
 assert((await dialog.locator('.ex-story-status').textContent()).includes('钟楼星图'),'Story inventory missing');
 await dialog.getByRole('button',{name:'回到起点',exact:true}).click();
 assert(!(await dialog.locator('.ex-story-status').textContent()).includes('钟楼星图'),'Story reset failed');
 await page.goto(base+'/projects?project=tower#gallery');dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:'阳光花 资源生产 · 50',exact:true}).click();
 assert((await dialog.locator('.ex-tower-rule').textContent()).includes('生产阳光'),'Tower role did not update');
 await page.goto(base+'/projects?project=mono#gallery');dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:'探索材质',exact:true}).click();await page.keyboard.press('Escape');
 assert(await dialog.count()===1,'Inner Escape closed project dialog');
 assert(await dialog.locator('.xp-mono-material-panel').isHidden(),'Inner Escape did not close material');
 await dialog.getByRole('button',{name:'炭黑配色概念',exact:true}).click();
 assert((await dialog.locator('.xp-mono-footer').textContent()).includes('仍展示雾银'),'Concept photo explanation missing');
 await page.goto(base+'/projects?project=notes#gallery');dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:'来源 03',exact:true}).click();
 assert((await dialog.locator('.xp-source-active').textContent()).includes('光越强'),'Source navigation failed');
 await dialog.locator('.xp-card-question').fill('我的验证问题');await dialog.locator('.xp-card-answer').fill('这是导出验证的当前答案。');
 await dialog.getByRole('button',{name:'新建知识卡',exact:true}).click();
 assert(await dialog.locator('.xp-knowledge-card').count()===2,'New knowledge card missing');
 const notesDownload=page.waitForEvent('download');await dialog.getByRole('button',{name:'导出笔记',exact:true}).click();
 const notesFile=await notesDownload;await notesFile.saveAs('output/playwright/release-2026-09-12/study-notes.md');
 report.push({notesDownload:notesFile.suggestedFilename(),experiences:5});
 await page.goto(base+'/projects?project=fox');assert((await page.getByRole('dialog').getByRole('heading',{level:2}).first().textContent()).includes('午夜博物馆'),'Old project deep link failed');
 for(const width of [360,390,768,1440,1920]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/?test=width-'+width);
  const geometry=await page.evaluate(()=>{const f=document.querySelector('.refined-screen').getBoundingClientRect(),c=document.querySelector('.refined-controls').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,controlsInside:c.left>=f.left-1&&c.right<=f.right+1&&c.bottom<=f.bottom+1}});
  assert(!geometry.overflow&&geometry.controlsInside,'Carousel geometry failed at '+width);report.push({width,...geometry});
 }
 await page.setViewportSize({width:390,height:844});
 for(const id of ['minecraft','museum','tower','mono','notes']){
  await page.goto(base+'/projects?project='+id+'#gallery');dialog=page.getByRole('dialog');await dialog.waitFor();
  assert(await dialog.evaluate(d=>d.scrollWidth<=d.clientWidth+1),'Dialog overflow '+id);
  await page.screenshot({path:'output/playwright/release-2026-09-12/mobile-'+id+'.png',animations:'disabled'});
 }
 assert(errors.length===0,errors.join('\n'));
 return {report,errors};
}
