// Rendered checks for the portfolio preview. Run through the Playwright MCP tool
// browser_run_code_unsafe with this file as `filename`; it returns a JSON summary.
// Expects `mkdocs serve` on 127.0.0.1:8765. Routes come from the sitemap.
async (page) => {
  const BASE = 'http://127.0.0.1:8765';
  const WIDTHS = [320, 390, 768, 1440];
  const MISSING = '/a-missing-page/';
  const result = { routes: [], problems: [], filters: {}, menu: {}, scene: {}, print: null };

  const sitemap = await (await page.request.get(BASE + '/sitemap.xml')).text();
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  routes.push(MISSING);
  result.routes = routes;

  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(`${page.url()}: ${error.message}`));

  const settle = () => page.evaluate(async () => {
    await document.fonts.ready;
    for (const img of document.images) {
      img.loading = 'eager';
      if (!img.complete) await new Promise((done) => { img.onload = img.onerror = done; });
    }
    // A table word split across lines, outside code (code wrapping has its own rules).
    const splitWords = [];
    for (const cell of document.querySelectorAll('.prose th, .prose td')) {
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement.closest('code')) continue;
        for (const match of node.data.matchAll(/[^\s/\-–—]+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          if (new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size > 1) splitWords.push(match[0]);
        }
      }
    }
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      broken: [...document.images].filter((img) => !img.naturalWidth).map((img) => img.getAttribute('src')),
      splitWords,
      // Two-column tables fit the column; wider tables may scroll.
      scrollingPairs: [...document.querySelectorAll('.table-scroll')]
        .filter((region) => !region.querySelector('tr > :nth-child(3)') && region.scrollWidth > region.clientWidth).length,
    };
  });

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(BASE + route);
      const expected = route === MISSING ? 404 : 200;
      if (response.status() !== expected) result.problems.push(`${route} @${width}: HTTP ${response.status()}`);
      const state = await settle();
      if (state.overflow > 0) result.problems.push(`${route} @${width}: ${state.overflow}px horizontal overflow`);
      if (state.broken.length) result.problems.push(`${route} @${width}: broken images ${state.broken.join(', ')}`);
      if (state.splitWords.length) result.problems.push(`${route} @${width}: table words broken mid-word: ${state.splitWords.join(', ')}`);
      if (state.scrollingPairs) result.problems.push(`${route} @${width}: ${state.scrollingPairs} two-column table(s) scroll sideways`);
    }
  }

  // Mobile menu: opens, then Escape closes it.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + '/');
  await page.click('.menu-toggle');
  result.menu.opened = await page.getAttribute('.menu-toggle', 'aria-expanded');
  await page.keyboard.press('Escape');
  result.menu.afterEscape = await page.getAttribute('.menu-toggle', 'aria-expanded');

  // Project filters: the count text and the number of visible cards must agree.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + '/technical-labs/');
  for (const filter of ['personal', 'coursework', 'all']) {
    await page.click(`[data-filter="${filter}"]`);
    const count = await page.textContent('.project-count');
    const visible = await page.locator('.project-card:visible').count();
    result.filters[filter] = { count, visible };
    if (parseInt(count, 10) !== visible) result.problems.push(`filter ${filter}: says "${count}", shows ${visible}`);
  }

  // Hero scene buttons each reveal their own detail link.
  await page.goto(BASE + '/');
  for (const scene of ['compute', 'network', 'software']) {
    await page.click(`[data-scene-select="${scene}"]`);
    result.scene[scene] = await page.locator(`#scene-${scene} a`).isVisible()
      ? await page.getAttribute(`#scene-${scene} a`, 'href')
      : 'NOT VISIBLE';
    if (result.scene[scene] === 'NOT VISIBLE') result.problems.push(`scene ${scene}: detail link hidden`);
  }

  // Without JavaScript: content and navigation stay usable at the narrowest width.
  const noJs = await page.context().browser().newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });
  const plain = await noJs.newPage();
  for (const route of routes.filter((r) => r !== MISSING)) {
    await plain.goto(BASE + route);
    const state = await plain.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      navLinks: [...document.querySelectorAll('.main-nav a')].filter((a) => a.offsetParent !== null).length,
    }));
    if (state.overflow > 0) result.problems.push(`no-JS ${route}: ${state.overflow}px horizontal overflow`);
    if (state.navLinks === 0) result.problems.push(`no-JS ${route}: navigation hidden`);
  }
  await noJs.close();

  // Print: every summary and evidence panel switches to white with dark text.
  await page.emulateMedia({ media: 'print' });
  result.print = { checked: 0 };
  for (const route of routes.filter((r) => r.startsWith('/technical-labs/') && r !== '/technical-labs/')) {
    await page.goto(BASE + route);
    const panels = await page.evaluate(() => [...document.querySelectorAll('.glance dl, .evidence-note')].map((panel) => {
      const text = panel.querySelector('dd') || panel;
      return { background: getComputedStyle(panel).backgroundColor, color: getComputedStyle(text).color };
    }));
    result.print.checked += panels.length;
    for (const panel of panels) {
      if (panel.background !== 'rgb(255, 255, 255)' || panel.color !== 'rgb(0, 0, 0)') result.problems.push(`print ${route}: panel ${panel.background} / ${panel.color}`);
    }
  }
  await page.emulateMedia({ media: 'screen' });

  if (pageErrors.length) result.problems.push(...pageErrors);
  return result;
}
