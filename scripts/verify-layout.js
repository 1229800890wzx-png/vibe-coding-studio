async (page) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const routes = [
    ["/", "01-home"],
    ["/courses", "02-courses"],
    ["/method", "03-method"],
    ["/mentors", "04-mentors"],
    ["/projects", "05-projects"],
  ];
  const widths = [360, 390, 430, 768, 1024, 1440, 1920];
  const report = [];
  for (const [route, name] of routes) {
    await page.goto("http://127.0.0.1:4173" + route);
    await page.locator("h1").waitFor();
    await page.waitForLoadState("networkidle");
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      const layout = await page.evaluate(() => {
        const visible = (el) =>
          !!(
            el.getClientRects().length &&
            getComputedStyle(el).visibility !== "hidden" &&
            getComputedStyle(el).display !== "none"
          );
        const clipped = [
          ...document.querySelectorAll(
            "h1,h2,h3,button,input,select,.plant-detail strong,.main-nav a",
          ),
        ]
          .filter(visible)
          .filter(
            (el) => el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0,
          )
          .map((el) => ({
            text: el.textContent.trim().slice(0, 45),
            class: el.className,
            width: el.clientWidth,
            scrollWidth: el.scrollWidth,
          }));
        const screen = document.querySelector(".tablet-screen");
        const r = screen?.getBoundingClientRect();
        const outsideControls = r
          ? [...screen.querySelectorAll("button,a")]
              .filter(visible)
              .filter((el) => {
                const b = el.getBoundingClientRect();
                return (
                  b.left < r.left - 1 ||
                  b.right > r.right + 1 ||
                  b.top < r.top - 1 ||
                  b.bottom > r.bottom + 1
                );
              })
              .map(
                (el) => el.getAttribute("aria-label") || el.textContent.trim(),
              )
          : [];
        return {
          viewport: innerWidth,
          pageWidth: document.documentElement.scrollWidth,
          h1: document.querySelectorAll("h1").length,
          clipped,
          outsideControls,
          imagesFailed: document.querySelectorAll(".art-error").length,
        };
      });
      report.push({ route, width, ...layout });
      if (width === 390 || width === 1440) {
        await page.screenshot({
          path: `output/playwright/${name}-${width === 390 ? "mobile" : "desktop"}.png`,
          fullPage: true,
        });
        if (width === 390)
          await page.screenshot({
            path: `output/playwright/${name}-mobile-first-screen.png`,
          });
      }
    }
  }
  return { layouts: report, errors };
}

