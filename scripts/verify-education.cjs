async (page) => {
  const results = [];
  const check = (name, ok) => { results.push({name, passed:ok}); if (!ok) throw new Error(name); };
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('.edu-course').first().waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'打开导航菜单'}).click();
  check('mobile navigation', await page.getByRole('navigation',{name:'主导航'}).isVisible());
  await page.getByRole('button',{name:'关闭导航菜单'}).click();
  await page.getByRole('button',{name:'初次接触',exact:true}).click();
  check('stage filters to one course', await page.locator('.edu-course').count()===1);
  await page.getByRole('textbox',{name:'搜索课程'}).fill('不存在的课程');
  check('search empty state',await page.getByRole('heading',{name:'暂未找到匹配课程'}).isVisible());
  await page.getByRole('button',{name:'清除筛选'}).click();
  check('reset restores courses', await page.locator('.edu-course').count()===3);
  await page.getByRole('button',{name:'咨询课程',exact:true}).first().click();
  check('consultation dialog opens',await page.getByRole('dialog').isVisible());
  await page.getByLabel('家长称呼',{exact:true}).fill('浏览器自动验收');
  await page.getByLabel('手机号或邮箱',{exact:true}).fill('browser-qa@example.invalid');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'提交课程咨询',exact:true}).click();
  await page.getByRole('heading',{name:'已提交至课程咨询后台'}).waitFor();
  check('real submission acknowledged',await page.getByRole('heading',{name:'已提交至课程咨询后台'}).isVisible());
  await page.keyboard.press('Escape');
  check('escape closes dialog',await page.getByRole('dialog').count()===0);
  for(const width of [375,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    check(`no horizontal overflow ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'output/playwright/education-home-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'output/playwright/education-home-mobile.png',fullPage:true});
  for (const route of ['/courses','/method','/mentors','/projects']) {
    await page.goto(`http://127.0.0.1:4173${route}`);
    check(`route ${route}`, await page.locator('h1').count()>0);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4173/');
  console.log(JSON.stringify(results));
}
