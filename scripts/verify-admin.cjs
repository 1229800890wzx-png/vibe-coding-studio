async (page) => {
 await page.goto('http://127.0.0.1:4180/education/manage');
 await page.getByRole('button',{name:'新增课程',exact:true}).waitFor({timeout:30000});
 await page.screenshot({path:'output/playwright/education-admin-courses.png',fullPage:true});
 await page.getByRole('tab',{name:'咨询跟进'}).click();
 await page.getByRole('button',{name:'刷新咨询'}).waitFor();
 const testRow=page.getByRole('row').filter({hasText:'browser-qa@example.invalid'});
 if(await testRow.count()){
   await testRow.getByRole('button',{name:'查看与跟进'}).click();
   await page.getByRole('dialog').getByRole('textbox').fill('浏览器验收：已查看并跟进');
   await page.getByRole('button',{name:'保存跟进',exact:true}).click();
   await page.getByRole('dialog').waitFor({state:'hidden'});
 }
 await page.screenshot({path:'output/playwright/education-admin-inquiries.png',fullPage:true});
}
