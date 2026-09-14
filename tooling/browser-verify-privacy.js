// Observe only: no interception. The platform's statistics switch should prevent any collector request.
async (page) => {
  const context=await page.context().browser().newContext({viewport:{width:390,height:844},storageState:await page.context().storageState()});
  const browserPage=await context.newPage(), collectors=[];
  browserPage.on('request',request=>{if(/tongji-collector\.dcloud\.net\.cn|tongji\.dcloud\.(io|net\.cn)|WebTrack\.gif/.test(request.url()))collectors.push(new URL(request.url()).hostname)});
  try {
    for(const route of ['tab/home','tab/courses','tab/me','edu/children']){
      await browserPage.goto('about:blank');
      await browserPage.goto('http://127.0.0.1:5174/#/pages/'+route);
      await browserPage.waitForLoadState('networkidle');
    }
    await browserPage.waitForTimeout(1200);
    if(collectors.length)throw new Error(`Statistics collector requested ${collectors.length} times`);
    const report={status:'PASSED',timestamp:new Date().toISOString(),checks:['Fresh original-member browser visited home, discovery, profile and children without external statistics requests'],collectorRequests:collectors.length,scope:'Chromium H5 observation; manifest disables statistics globally, H5 and mp-weixin. No request was intercepted.'};
    await page.evaluate(r=>{window.__vibePrivacyReport=r},report);
  } finally { await context.close(); }
}
