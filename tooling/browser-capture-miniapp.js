// Live local API only. Run in an original-member-authenticated Playwright CLI session.
async (page) => {
  const output='C:/Users/12298/.codex/worktrees/vibe-edu/docs/screenshots';
  const routes=[
    ['home','tab/home','/edu/course/page'],['courses','tab/courses','/edu/course/page'],
    ['learning','tab/learning','/edu/learning/dashboard'],['me','tab/me','/edu/config/get'],
    ['course','edu/course?id=7','/edu/cohort/list'],['cohort','edu/cohort?id=2','/edu/cohort/get'],
    ['campuses','edu/campuses','/edu/campus/list'],['children','edu/children','/edu/student/list'],
    ['trials','edu/trials','/edu/trial/list'],['cart','edu/cart','/trade/cart/list'],
    ['orders','edu/orders','/trade/order/page'],['refunds','edu/refunds','/trade/after-sale/page'],
    ['calendar','edu/learning-list?type=calendar','/edu/session/list'],
    ['assignments','edu/learning-list?type=assignments','/edu/assignment/list'],
    ['materials','edu/learning-list?type=materials','/edu/material/list'],
    ['reviews','edu/learning-list?type=reviews','/edu/review/list'],
    ['reports','edu/learning-list?type=reports','/edu/report/list'],
    ['session','edu/session?id=9&studentId=1','/edu/session/get'],
    ['assignment','edu/assignment?id=1&studentId=1','/edu/assignment/get'],
    ['works','edu/works','/edu/work/list'],['public-works','edu/works?public=1','/edu/work/public-page'],
    ['request-history','edu/learning-list?type=requests','/edu/request/list'],['requests','edu/requests?enrollmentId=19&courseId=17&studentId=24','/edu/cohort/list'],['messages','edu/messages','/edu/notification/page'],['consultation','edu/consultation','/edu/admission/options'],['order-detail','edu/orders?id=18','/trade/order/get-detail'],['payment-result','pay/result?id=21','/pay/order/get'],['payment-refunded','pay/result?id=22','/pay/order/get'],['payment-closed','pay/index?id=23','/pay/order/get'],
  ];
  await page.setViewportSize({width:390,height:844});
  for (const [name,route,endpoint] of routes) {
    await page.goto('about:blank');
    const request = page.waitForResponse(r=>r.url().includes(endpoint)&&r.status()===200,{timeout:15000});
    await page.goto('http://127.0.0.1:5174/#/pages/'+route);
    const body=await(await request).json();if(body.code!==0)throw new Error(`${name}: API rejected ${body.msg}`);
    await page.waitForLoadState('networkidle',{timeout:10000}).catch(()=>{});await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(100);
    await page.screenshot({path:`${output}/mini-${name}.png`,fullPage:true,animations:'disabled'});
  }
  for (const width of [320,375,430]) {
    await page.setViewportSize({width,height:844});
    await page.goto('about:blank');await page.goto('http://127.0.0.1:5174/#/pages/tab/home');await page.locator('.course-card').first().waitFor({timeout:15000});
    await page.getByText('一个好奇心。',{exact:false}).first().waitFor();
    await page.waitForLoadState('networkidle',{timeout:10000}).catch(()=>{});await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(100);
    await page.screenshot({path:`${output}/mini-home-${width}.png`,fullPage:true,animations:'disabled'});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
    if(overflow)throw new Error(`Horizontal page overflow at ${width}px`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(r=>{window.__vibeScreenshotReport=r},{status:'PASSED',screenshots:routes.length+3,routes:routes.map(r=>r[0]),dataSource:'Live local API/MySQL; synthetic TEST records only'});
}
