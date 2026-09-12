async (page) => {
  const results = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/', '/courses', '/method', '/mentors', '/projects']) {
      await page.goto('http://127.0.0.1:4173' + route);
      await page.locator('h1').waitFor();
      await page.waitForLoadState('networkidle');
      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
      const result = await page.evaluate(async () => {
        const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
        return { violations: r.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), incomplete: r.incomplete.map(i => i.id), passes: r.passes.length };
      });
      results.push({ route, width, ...result });
    }
  }
  return results;
}

