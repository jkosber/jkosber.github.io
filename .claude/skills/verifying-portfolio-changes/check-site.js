// Rendered checks for the portfolio preview. Run through the Playwright MCP tool
// browser_run_code_unsafe with this file as `filename`; it returns a JSON summary.
// Expects `mkdocs serve` on 127.0.0.1:8765. Routes come from the sitemap.
async (page) => {
  const BASE = 'http://127.0.0.1:8765';
  const WIDTHS = [320, 390, 768, 1440];
  const MISSING = '/a-missing-page/';
  const result = { routes: [], problems: [], checks: {}, filters: {}, menu: {}, print: null };
  // Each named check block below records how much it covered in result.checks.
  const fail = (message) => result.problems.push(message);

  const sitemap = await (await page.request.get(BASE + '/sitemap.xml')).text();
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  routes.push(MISSING);
  result.routes = routes;
  result.checks.routes = routes.length;

  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(`${page.url()}: ${error.message}`));

  const settle = () => page.evaluate(async () => {
    await document.fonts.ready;
    for (const img of document.images) {
      img.loading = 'eager';
      if (!img.complete) await new Promise((done) => { img.onload = img.onerror = done; });
    }
    // A table word split across lines, outside code (code wrapping has its own rules).
    // WebKit adds a zero-width box at the end of the previous line before a wrapped word; ignore it.
    const splitWords = [];
    for (const cell of document.querySelectorAll('.prose th, .prose td')) {
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement.closest('code')) continue;
        for (const match of node.data.matchAll(/[^\s/\-–—]+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          if (new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size > 1) splitWords.push(match[0]);
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

  // Header: GitHub and LinkedIn stay visible beside the name with the menu closed.
  const SOCIAL = [
    ['GitHub profile', 'https://github.com/jkosber'],
    ['LinkedIn profile', 'https://www.linkedin.com/in/jadon-kosberg'],
  ];
  const socialState = (target) => target.evaluate((social) => {
    const header = document.querySelector('.site-header');
    const missing = social.filter(([label, href]) => {
      const link = header && header.querySelector(`a[aria-label="${label}"][href="${href}"]`);
      if (!link || link.offsetParent === null) return true;
      const box = link.getBoundingClientRect();
      return box.width < 40 || box.height < 40;
    }).map(([label]) => label);
    return { missing, overflow: header ? header.scrollWidth - header.clientWidth : 0 };
  }, SOCIAL);
  result.checks.header = 0;

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(BASE + route);
      const expected = route === MISSING ? 404 : 200;
      if (response.status() !== expected) result.problems.push(`${route} @${width}: HTTP ${response.status()}`);
      const header = await socialState(page);
      result.checks.header += 1;
      if (header.missing.length) fail(`header ${route} @${width}: missing or under 40px: ${header.missing.join(', ')}`);
      if (header.overflow > 0) fail(`header ${route} @${width}: header overflows by ${header.overflow}px`);
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
  const navTexts = await page.$$eval('.main-nav a', (links) => links.map((link) => link.textContent.trim()));
  await page.keyboard.press('Escape');
  result.menu.afterEscape = await page.getAttribute('.menu-toggle', 'aria-expanded');
  if (result.menu.opened !== 'true') fail('menu: the toggle does not open the menu');
  if (result.menu.afterEscape !== 'false') fail('menu: Escape leaves the menu open');

  // Main nav: no Home item (the name links home); sections keep their order.
  result.checks.nav = navTexts;
  if (navTexts.includes('Home')) fail(`nav: still lists Home (${navTexts.join(', ')})`);
  const order = ['Projects', 'Experience', 'About'].map((title) => navTexts.indexOf(title));
  if (order.includes(-1) || order.some((position, index) => index && position < order[index - 1])) fail(`nav: expected Projects, Experience, About in order, got ${navTexts.join(', ')}`);

  // Footer: email, both profiles, the site's source; no duplicate About link.
  const footer = await page.$$eval('.site-footer a', (links) => links.map((link) => ({ text: link.textContent.trim(), href: link.getAttribute('href') })));
  result.checks.footer = footer.length;
  for (const [text, href] of [['Jadon@jnkos.com', 'mailto:Jadon@jnkos.com'], ['LinkedIn', 'https://www.linkedin.com/in/jadon-kosberg'], ['GitHub', 'https://github.com/jkosber']]) {
    if (!footer.some((link) => link.text === text && link.href === href)) fail(`footer: missing ${text} link`);
  }
  if (!footer.some((link) => link.href === 'https://github.com/jkosber/jkosber.github.io')) fail('footer: missing the site source link');
  if (footer.some((link) => link.text === 'About me')) fail('footer: still has the About me link');

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

  // Homepage: intro with facts, real captures for the lead projects, rows for the rest,
  // the classes (once Coursework exists) and both roles. The hero scene is gone (approved Oct 23).
  result.checks.home = {};
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(BASE + '/');
    const home = await page.evaluate(() => {
      const main = document.querySelector('main');
      const showcases = [...main.querySelectorAll('.showcase')];
      const firstImage = showcases[0] && showcases[0].querySelector('img');
      const navTitles = [...document.querySelectorAll('.main-nav a')].map((link) => link.textContent.trim());
      return {
        name: (main.querySelector('h1') || {}).textContent?.replace(/\s+/g, ' ').trim(),
        facts: main.querySelectorAll('.facts > div').length,
        showcases: showcases.map((item) => item.querySelector('h3').textContent.trim()),
        firstImage: firstImage ? { src: firstImage.getAttribute('src'), width: firstImage.getAttribute('width'), height: firstImage.getAttribute('height') } : null,
        rows: main.querySelectorAll('.project-row').length,
        hasCoursework: navTitles.includes('Coursework'),
        classes: main.querySelectorAll('.class-list li').length,
        roles: main.querySelectorAll('.home-experience .experience-entry').length,
        scene: main.querySelectorAll('.hero-visual, .scene-art, [data-scene-select]').length,
        reveals: main.querySelectorAll('.reveal').length,
      };
    });
    result.checks.home[width] = home;
    const where = `home @${width}`;
    if (home.name !== 'Jadon Kosberg') fail(`${where}: h1 is "${home.name}"`);
    if (home.facts !== 3) fail(`${where}: ${home.facts} facts, expected 3`);
    if (home.showcases.length !== 2 || home.showcases[0] !== 'Proxmox homelab') fail(`${where}: showcases ${home.showcases.join(', ')}`);
    if (!home.firstImage || !home.firstImage.src.endsWith('homepage-dashboard-2026-10-23.webp') || !home.firstImage.width || !home.firstImage.height) fail(`${where}: first showcase image ${JSON.stringify(home.firstImage)}`);
    if (home.rows < 1) fail(`${where}: no project rows after the showcases`);
    if (home.hasCoursework && home.classes !== 6) fail(`${where}: coursework lists ${home.classes} classes, expected 6`);
    if (home.roles !== 2) fail(`${where}: ${home.roles} roles, expected 2`);
    if (home.scene) fail(`${where}: the hero scene is still on the page`);
    if (home.reveals < 2) fail(`${where}: ${home.reveals} .reveal targets, expected at least 2`);
  }

  // Keyboard order on a phone follows what you see, top to bottom (deferred minor a).
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + '/');
  const tabOrder = await page.evaluate(() => [...document.querySelectorAll('main a[href], main button, main [tabindex="0"]')]
    .filter((element) => element.offsetParent !== null && !element.closest('[hidden]'))
    .map((element) => ({ text: (element.textContent || element.getAttribute('aria-label') || '').trim().slice(0, 40), top: Math.round(element.getBoundingClientRect().top + scrollY) })));
  result.checks.domOrder = tabOrder.length;
  tabOrder.forEach((item, index) => { if (index && item.top < tabOrder[index - 1].top - 2) fail(`domOrder: "${item.text}" (y ${item.top}) comes after "${tabOrder[index - 1].text}" (y ${tabOrder[index - 1].top})`); });

  // The facts column fits a laptop's first screen (deferred minor d).
  for (const [width, height] of [[1366, 768], [1440, 790]]) {
    await page.setViewportSize({ width, height });
    await page.goto(BASE + '/');
    const bottom = await page.evaluate(() => { const facts = document.querySelector('.facts'); return facts ? Math.round(facts.getBoundingClientRect().bottom) : null; });
    result.checks.factsFit = { ...(result.checks.factsFit || {}), [`${width}x${height}`]: bottom };
    if (bottom === null || bottom > height) fail(`factsFit ${width}x${height}: facts end at ${bottom}px`);
  }

  // Motion limits: nothing over 0.5 s, nothing infinite, no transition on `all`;
  // with reduced motion, no animations at all.
  const motionState = () => page.evaluate(() => {
    const seconds = (value) => value.split(',').map((part) => {
      const text = part.trim();
      return text.endsWith('ms') ? parseFloat(text) / 1000 : parseFloat(text);
    });
    const issues = [];
    let checked = 0;
    for (const element of document.querySelectorAll('*')) {
      for (const pseudo of [null, '::before', '::after']) {
        const style = getComputedStyle(element, pseudo);
        const name = `${element.tagName.toLowerCase()}${element.className && typeof element.className === 'string' ? '.' + element.className.trim().split(/\s+/).join('.') : ''}${pseudo || ''}`;
        checked += 1;
        const durations = seconds(style.transitionDuration);
        const properties = style.transitionProperty.split(',').map((item) => item.trim());
        properties.forEach((property, index) => {
          const duration = durations[index % durations.length];
          if (duration > 0.5) issues.push(`${name}: transition ${property} ${duration}s`);
          if (property === 'all' && duration > 0) issues.push(`${name}: transition on all`);
        });
        if (style.animationName !== 'none') {
          if (seconds(style.animationDuration).some((value) => value > 0.5)) issues.push(`${name}: animation ${style.animationName} ${style.animationDuration}`);
          if (style.animationIterationCount.split(',').some((value) => value.trim() === 'infinite')) issues.push(`${name}: infinite animation ${style.animationName}`);
        }
      }
    }
    const animated = [...document.querySelectorAll('*')].filter((element) => getComputedStyle(element).animationName !== 'none').length;
    return { issues, checked, animated };
  });
  result.checks.motion = 0;
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of ['/', '/technical-labs/proxmox-virtualization/']) {
    await page.goto(BASE + route);
    const state = await motionState();
    result.checks.motion += state.checked;
    for (const issue of [...new Set(state.issues)]) fail(`motion ${route}: ${issue}`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(BASE + route);
    const reduced = await motionState();
    if (reduced.animated) fail(`motion ${route}: ${reduced.animated} element(s) animate with reduced motion`);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }

  // Type scale: the name keeps its size across the 960 px layout switch.
  const nameSize = async (width) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(BASE + '/');
    return page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('h1')).fontSize));
  };
  const narrowName = await nameSize(959);
  const wideName = await nameSize(961);
  result.checks.typeScale = { 959: narrowName, 961: wideName };
  if (Math.abs(narrowName - wideName) > 4) fail(`typeScale: name is ${narrowName}px at 959 and ${wideName}px at 961`);

  // Enlarged text: 200% at 390 px never widens the page, and the name never breaks mid-word.
  await page.setViewportSize({ width: 390, height: 844 });
  result.checks.text200 = 0;
  for (const route of routes) {
    await page.goto(BASE + route);
    const state = await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%';
      await new Promise((done) => setTimeout(done, 150));
      const split = [];
      const heading = document.querySelector('.home-intro h1');
      if (heading) {
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          for (const match of node.data.matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            if (new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size > 1) split.push(match[0]);
          }
        }
      }
      // Two-column tables stack instead of scrolling, and the hook marks them for that.
      const pairs = [...document.querySelectorAll('.table-scroll')].filter((region) => !region.querySelector('tr > :nth-child(3)'));
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        split,
        pairs: pairs.length,
        scrollingPairs: pairs.filter((region) => region.scrollWidth > region.clientWidth).length,
        unmarkedPairs: pairs.filter((region) => region.dataset.columns !== '2').length,
      };
    });
    result.checks.text200 += 1;
    result.checks.stackedPairs = (result.checks.stackedPairs || 0) + state.pairs;
    if (state.scrollingPairs) fail(`stackedPairs ${route}: ${state.scrollingPairs} two-column table(s) scroll sideways at 200% text`);
    if (state.unmarkedPairs) fail(`stackedPairs ${route}: ${state.unmarkedPairs} two-column table(s) lack data-columns="2"`);
    if (state.overflow > 0) fail(`text200 ${route}: ${state.overflow}px horizontal overflow`);
    if (state.split.length) fail(`text200 ${route}: name broken mid-word: ${state.split.join(', ')}`);
  }

  // Scroll fade-up targets end fully visible once they are in view.
  // Waits happen on the Node side: in-page timers can stall with JavaScript disabled.
  const revealOpacities = async (target) => {
    const values = [];
    const count = await target.evaluate(() => document.querySelectorAll('.reveal').length);
    for (let index = 0; index < count; index += 1) {
      await target.evaluate((i) => document.querySelectorAll('.reveal')[i].scrollIntoView({ block: 'center' }), index);
      await target.waitForTimeout(200);
      values.push(await target.evaluate((i) => parseFloat(getComputedStyle(document.querySelectorAll('.reveal')[i]).opacity), index));
    }
    return values;
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  result.checks.revealSettles = 0;
  for (const route of routes.filter((r) => r !== MISSING)) {
    await page.goto(BASE + route);
    const values = await revealOpacities(page);
    result.checks.revealSettles += values.length;
    values.forEach((value, index) => { if (value < 0.99) fail(`revealSettles ${route}: .reveal ${index + 1} stays at opacity ${value}`); });
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
    const plainHeader = await socialState(plain);
    if (plainHeader.missing.length) fail(`no-JS ${route}: header missing ${plainHeader.missing.join(', ')}`);
    const hidden = (await revealOpacities(plain)).filter((value) => value < 0.99).length;
    if (hidden) fail(`no-JS ${route}: ${hidden} .reveal element(s) stay hidden in view`);
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
