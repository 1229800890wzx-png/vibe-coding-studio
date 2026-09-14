// Playwright CLI run-code. Requires a fresh browser authenticated through the real login page.
// No network interception, fixtures, account secrets or browser storage manipulation.
async (page) => {
  await page.setViewportSize({width:1440,height:1000});
  const origin='http://localhost:49090';
  const routes=['index','edu/course','edu/cohort','edu/session','edu/student','edu/enrollment','edu/trial','edu/assignment','edu/submission','edu/growth-report','edu/request','edu/work','edu/campus','edu/room','edu/teacher','edu/settings','edu/admission'];
  for(const route of routes){
    const expected=route==='edu/settings'?'/edu/settings/get':route==='edu/admission'?'/crm/clue/page':route==='index'?'/edu/dashboard/get':`/${route}/page`;
    const response=page.waitForResponse(r=>r.url().includes(expected)&&r.status()===200);
    await page.goto(`${origin}/${route}`);const data=await(await response).json();
    if(data.code!==0)throw new Error(`API failed for ${route}: ${data.msg}`);
    await page.locator(route==='edu/admission'?'.admission-page':'main').first().waitFor();await page.waitForTimeout(300);
    await page.screenshot({path:`C:/Users/12298/.codex/worktrees/vibe-edu/docs/screenshots/admin-${route.replaceAll('/','-')}.png`,fullPage:true,animations:'disabled'});
  }
  console.log(JSON.stringify({screenshots:routes.length,dataSource:'Live local MySQL/API; clearly labeled synthetic course fixtures',routes}));
}
