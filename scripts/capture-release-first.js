async (page) => {
 await page.setViewportSize({width:1440,height:1000});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4173/?release=20260912');
 await page.evaluate(()=>Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()})));
 await page.screenshot({path:'output/playwright/release-2026-09-12/home-desktop.png',fullPage:true,animations:'disabled'});
 await page.locator('.home-hero').screenshot({path:'output/playwright/release-2026-09-12/hero-desktop.png',animations:'disabled'});
 await page.goto('http://127.0.0.1:4173/projects?project=notes#gallery');
 await page.getByRole('dialog').waitFor();
 await page.screenshot({path:'output/playwright/release-2026-09-12/notes-desktop.png',animations:'disabled'});
 await page.getByRole('button',{name:'关闭弹窗',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4173/?release=20260912-mobile');
 await page.evaluate(()=>Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()})));
 await page.screenshot({path:'output/playwright/release-2026-09-12/home-mobile.png',fullPage:true,animations:'disabled'});
 await page.locator('.home-hero').screenshot({path:'output/playwright/release-2026-09-12/hero-mobile.png',animations:'disabled'});
 return {mobileOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),slides:await page.locator('.refined-controls .carousel-categories button').count(),images:await page.locator('.showcase-direction-grid img').count()};
}
