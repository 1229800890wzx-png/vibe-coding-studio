async (page) => {
  const report = [];
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('body').ariaSnapshot();
  for (const width of [360, 390, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (let i = 0; i < 4; i++) {
      await page.locator('.tablet-screen').scrollIntoViewIfNeeded();
      await page.evaluate(() => new Promise(requestAnimationFrame));
      const result = await page.locator('.tablet-screen').evaluate(screen => {
        const r = screen.getBoundingClientRect();
        const controls = [...screen.querySelectorAll('button,a')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        return controls.map(el => { const b = el.getBoundingClientRect(); const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return { label: el.getAttribute('aria-label') || el.textContent.trim(), width: Math.round(b.width), height: Math.round(b.height), contained: b.left >= r.left - 1 && b.right <= r.right + 1 && b.top >= r.top - 1 && b.bottom <= r.bottom + 1, hit: !!top && (el === top || el.contains(top)) }; });
      });
      report.push({ width, slide: await page.locator('.slide').getAttribute('aria-label'), controls: result });
      await page.getByRole('button', { name: '下一个作品', exact: true }).click();
    }
  }
  return report;
}

