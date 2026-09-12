async (page) => {
  const base='http://127.0.0.1:4173/design-review/';
  const root='output/playwright/design-review-2026-09-10';
  const report=[];
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1120,height:680});
  for(const id of ['minecraft','tower','story','website','tool']) {
    await page.goto(base+'example-'+id+'.html?v=20260911');
    await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
    await page.screenshot({path:root+'/examples-'+id+'-ui.png',animations:'disabled'});
    report.push({id,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),images:await page.evaluate(()=>[...document.images].map(i=>({w:i.naturalWidth,h:i.naturalHeight})))});
  }
  await page.setViewportSize({width:640,height:640});
  for(const id of ['minecraft','story','website','tool']) {
    await page.goto(base+'example-thumb-'+id+'.html?v=20260911');
    await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
    await page.screenshot({path:root+'/examples-'+id+'-thumb.png',animations:'disabled'});
  }
  return {report,errors};
}
