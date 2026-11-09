// Rendered checks for the portfolio preview. Run through the Playwright MCP tool
// browser_run_code_unsafe with this file as `filename`; it returns a JSON summary.
// Expects `mkdocs serve` on 127.0.0.1:8765. Routes come from the sitemap.
async (page) => {
  const BASE = 'http://127.0.0.1:8765';
  const WIDTHS = [320, 390, 768, 1440];
  const MISSING = '/a-missing-page/';
  const result = { routes: [], problems: [], checks: {}, menu: {}, print: null };
  // Each named check block below records how much it covered in result.checks.
  const fail = (message) => result.problems.push(message);

  const sitemap = await (await page.request.get(BASE + '/sitemap.xml')).text();
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  routes.push(MISSING);
  result.routes = routes;
  result.checks.routes = routes.length;

  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(`${page.url()}: ${error.message}`));

  const settle = (target = page) => target.evaluate(async () => {
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

  // Table and screenshot wrappers are named, focusable regions only while they scroll sideways, so a
  // wrapper that fits adds no tab stop or landmark. Without JavaScript the build-time markup keeps
  // every one a region. A wrapper inside a closed module is neither shown nor reachable, so it is
  // left out. `wait` gives the page's ResizeObserver two frames to follow the last layout change.
  const regionState = (target, wait) => target.evaluate(async (frames) => {
    if (frames) await new Promise((done) => { requestAnimationFrame(() => requestAnimationFrame(done)); setTimeout(done, 250); });
    return [...document.querySelectorAll('.table-scroll, .evidence-scroll')].map((region, index) => ({
      name: `${region.classList[0]} ${index + 1}`,
      closed: Boolean(region.closest('details:not([open])')),
      scrolls: region.scrollWidth > region.clientWidth,
      role: region.getAttribute('role'),
      tabindex: region.getAttribute('tabindex'),
      label: region.getAttribute('aria-label'),
    }));
  }, wait);
  const isRegion = (region) => region.role === 'region' && region.tabindex === '0' && Boolean(region.label && region.label.trim());
  const regionProblems = (regions) => regions.filter((region) => !region.closed).flatMap((region) => {
    if (region.scrolls && !isRegion(region)) return [`${region.name} scrolls sideways but has role ${region.role}, tabindex ${region.tabindex}, aria-label "${region.label}"`];
    if (!region.scrolls && (region.role !== null || region.tabindex !== null || region.label !== null)) return [`${region.name} fits but keeps role ${region.role}, tabindex ${region.tabindex}, aria-label "${region.label}"`];
    return [];
  });
  const regionCounts = (regions) => {
    const shown = regions.filter((region) => !region.closed);
    const scrolling = shown.filter((region) => region.scrolls).length;
    return { scrolling, fitting: shown.length - scrolling, closed: regions.length - shown.length };
  };
  const addCounts = (total, counts) => {
    for (const [key, value] of Object.entries(counts)) total[key] = (total[key] || 0) + value;
    return total;
  };
  result.checks.scrollRegions = { load: {} };

  // A label that CSS sets on its own line, or a value beside it, still needs whitespace between
  // them in the markup, or a screen reader may run them together ("ResultEight tagged releases").
  const labelSpacing = (target) => target.evaluate(() => {
    const following = (node) => {
      const range = document.createRange();
      range.setStartAfter(node);
      range.setEndAfter(node.parentNode.lastChild);
      return range.toString();
    };
    const labels = [
      ...document.querySelectorAll('.result-label, .panel-title, dl.strip dt, dl.facts dt, details.lab-module > summary > h3, .study-class'),
      ...[...document.querySelectorAll('dl.facts .detail')].map((detail) => detail.previousSibling).filter(Boolean),
    ];
    const glued = labels.map((node) => [node.textContent, following(node)])
      .filter(([text, next]) => /\S$/.test(text) && /^\S/.test(next))
      .map(([text, next]) => `"${text.trim().slice(-30)}" runs into "${next.trim().slice(0, 30)}"`);
    return { checked: labels.length, glued };
  });
  result.checks.labelSpacing = 0;

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
      const regions = await regionState(page, true);
      result.checks.scrollRegions.load[width] = addCounts(result.checks.scrollRegions.load[width] || {}, regionCounts(regions));
      for (const problem of regionProblems(regions)) fail(`scrollRegions ${route} @${width}: ${problem}`);
      if (width === 1440) {
        const spacing = await labelSpacing(page);
        result.checks.labelSpacing += spacing.checked;
        for (const glued of spacing.glued) fail(`labelSpacing ${route}: ${glued}`);
      }
    }
  }

  // Body screenshots fit their column on desktops, beside the contents rail or inside a panel;
  // none is cropped behind a sideways scroll.
  result.checks.evidenceFit = 0;
  for (const [width, height] of [[1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    for (const route of routes) {
      await page.goto(BASE + route);
      const regions = await page.evaluate(async () => {
        for (const image of document.querySelectorAll('.evidence-scroll img')) {
          image.loading = 'eager';
          if (!image.complete) await new Promise((done) => { image.addEventListener('load', done, { once: true }); image.addEventListener('error', done, { once: true }); });
        }
        return [...document.querySelectorAll('.evidence-scroll')].map((region) => ({
          label: (region.getAttribute('aria-label') || '').split(';')[0],
          hidden: region.scrollWidth - region.clientWidth,
        }));
      });
      result.checks.evidenceFit += regions.length;
      for (const region of regions) if (region.hidden > 1) fail(`evidenceFit ${route} @${width}: "${region.label}" hides ${region.hidden}px behind a sideways scroll`);
    }
  }

  // After load the regions follow the layout: narrowing the window gives a table that starts to
  // scroll its tab stop back, widening takes it away again, larger text does the same as narrowing,
  // and a lab module opened at 200% text on a phone makes its table a region if it scrolls.
  result.checks.scrollRegions.resized = [];
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + '/technical-labs/proxmox-virtualization/');
  for (const width of [1440, 320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const regions = await regionState(page, true);
    const counts = regionCounts(regions);
    result.checks.scrollRegions.resized.push({ width, ...counts });
    for (const problem of regionProblems(regions)) fail(`scrollRegions /technical-labs/proxmox-virtualization/ resized to ${width}: ${problem}`);
    if (width === 320 && !counts.scrolling) fail('scrollRegions: no region scrolls on the Proxmox page after narrowing to 320, so the resize proves nothing');
  }
  // Doubling the text size at 1440 px widens tables past their column without resizing the window.
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  {
    const regions = await regionState(page, true);
    const counts = regionCounts(regions);
    result.checks.scrollRegions.textSize = counts;
    for (const problem of regionProblems(regions)) fail(`scrollRegions /technical-labs/proxmox-virtualization/ @1440 at 200% text: ${problem}`);
    if (!counts.scrolling) fail('scrollRegions: no region scrolls on the Proxmox page at 1440 with 200% text, so the text size change proves nothing');
  }
  // A region with keyboard focus keeps its tab stop while the window widens, so focus never drops
  // to the page; once focus leaves, the region follows the layout again.
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(BASE + '/technical-labs/proxmox-virtualization/');
  {
    const index = await page.evaluate(() => {
      const regions = [...document.querySelectorAll('.table-scroll, .evidence-scroll')];
      const region = regions.find((item) => item.scrollWidth > item.clientWidth && item.getAttribute('tabindex') === '0');
      if (region) region.focus();
      return region ? regions.indexOf(region) : -1;
    });
    if (index === -1) fail('scrollRegions: no focusable scrolling region on the Proxmox page at 320 to focus');
    else {
      await page.setViewportSize({ width: 1440, height: 900 });
      const focused = (await regionState(page, true))[index];
      const kept = await page.evaluate((i) => document.activeElement === document.querySelectorAll('.table-scroll, .evidence-scroll')[i], index);
      await page.evaluate(() => document.activeElement.blur());
      const left = (await regionState(page, true))[index];
      result.checks.scrollRegions.focusKept = { region: focused.name, scrollsAt1440: focused.scrolls, focusKept: kept, tabindex: focused.tabindex, tabindexAfterBlur: left.tabindex };
      const where = `scrollRegions /technical-labs/proxmox-virtualization/ ${focused.name} focused at 320 then widened to 1440`;
      if (focused.scrolls) fail(`${where}: it still scrolls, so the check proves nothing`);
      if (!kept) fail(`${where}: focus left it`);
      if (!isRegion(focused)) fail(`${where}: it lost its role, tabindex or aria-label while focused (role ${focused.role}, tabindex ${focused.tabindex})`);
      if (left.role !== null || left.tabindex !== null || left.label !== null) fail(`${where}: after focus left it keeps role ${left.role}, tabindex ${left.tabindex}`);
    }
  }
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(BASE + '/coursework/neti-109/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.waitForTimeout(150);
  await page.evaluate(() => { for (const module of document.querySelectorAll('details.lab-module')) module.open = true; });
  {
    const regions = await regionState(page, true);
    result.checks.scrollRegions.opened = regionCounts(regions);
    if (!regions.length) fail('scrollRegions: no wrappers on /coursework/neti-109/');
    for (const problem of regionProblems(regions)) fail(`scrollRegions /coursework/neti-109/ @320 at 200% text with every module open: ${problem}`);
  }

  // Scroll cues follow the layout like the regions do: with JavaScript on, a table's hint below it
  // (650 px and narrower) and its right-edge shade (760 px and narrower) show only while the table
  // scrolls sideways, and a table that fits shows neither. A region with no hint after it (the lab
  // tables, whose hint the class page hook removes) is checked for its shade alone. A region inside
  // a closed module is left out. Without JavaScript the build-time cues stay; the no-JS block checks
  // the wrappers' region attributes, not the cues.
  result.checks.scrollCues = {};
  for (const width of [600, 640, 700, 760]) {
    await page.setViewportSize({ width, height: 900 });
    const counts = { scrolling: 0, fitting: 0, wideFitting: 0, closed: 0, hints: 0, shades: 0 };
    for (const route of ['/technical-labs/proxmox-virtualization/', '/technical-labs/soc-threat-detection/', '/credentials/', '/coursework/neti-109/']) {
      await page.goto(BASE + route);
      await page.waitForSelector('#site-menu[data-ready]', { state: 'attached' });
      const regions = await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((done) => { requestAnimationFrame(() => requestAnimationFrame(done)); setTimeout(done, 250); });
        return [...document.querySelectorAll('.table-scroll')].map((region, index) => {
          const next = region.nextElementSibling;
          const hint = next && next.matches('.table-hint') ? next : null;
          return {
            name: `table-scroll ${index + 1}`,
            closed: Boolean(region.closest('details:not([open])')),
            wide: Boolean(region.querySelector('tr > :nth-child(3)')),
            scrolls: region.scrollWidth > region.clientWidth,
            hint: hint ? getComputedStyle(hint).display !== 'none' : null,
            shade: getComputedStyle(region).backgroundImage !== 'none',
          };
        });
      });
      for (const region of regions) {
        if (region.closed) { counts.closed += 1; continue; }
        counts[region.scrolls ? 'scrolling' : 'fitting'] += 1;
        if (region.wide && !region.scrolls) counts.wideFitting += 1;
        if (region.hint) counts.hints += 1;
        if (region.shade) counts.shades += 1;
        const where = `scrollCues ${route} @${width}: ${region.name}`;
        if (!region.scrolls && region.hint) fail(`${where} fits but shows the scroll hint`);
        if (!region.scrolls && region.shade) fail(`${where} fits but paints the edge shade`);
        if (region.scrolls && width <= 650 && region.hint === false) fail(`${where} scrolls sideways but its scroll hint is hidden`);
        if (region.scrolls && width <= 760 && !region.shade) fail(`${where} scrolls sideways but paints no edge shade`);
      }
    }
    result.checks.scrollCues[width] = counts;
  }
  if (!result.checks.scrollCues[600].scrolling) fail('scrollCues: no table scrolls at 600, so the scrolling cues go unchecked');
  if (!result.checks.scrollCues[640].wideFitting) fail('scrollCues: no table of three or more columns fits at 640, so the fitting cues go unchecked');

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
  if (navTexts.join('|') !== 'Projects|Coursework|Experience|About') fail(`nav: expected Projects, Coursework, Experience, About, got ${navTexts.join(', ')}`);

  // Current page: the nav item carries an amber underline, not just a color, and keeps it in forced colors.
  // Forced-colors emulation may be missing in some engines; record that instead of failing.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + '/technical-labs/proxmox-virtualization/');
  const currentNav = () => page.evaluate(() => {
    const link = document.querySelector('.main-nav a[aria-current]');
    if (!link) return null;
    const style = getComputedStyle(link);
    return { line: style.textDecorationLine, color: style.textDecorationColor };
  });
  const navCurrent = await currentNav();
  result.checks.navCurrent = navCurrent ? { ...navCurrent } : { missing: true };
  if (!navCurrent) fail('navCurrent: no .main-nav a[aria-current] on the Proxmox page');
  else {
    if (!navCurrent.line.includes('underline')) fail(`navCurrent: text-decoration-line is "${navCurrent.line}", expected underline`);
    if (navCurrent.color !== 'rgb(255, 195, 107)') fail(`navCurrent: text-decoration-color is ${navCurrent.color}, expected rgb(255, 195, 107)`);
    let forcedColors = true;
    try { await page.emulateMedia({ forcedColors: 'active' }); } catch { forcedColors = false; }
    if (forcedColors) {
      const forced = await currentNav();
      await page.emulateMedia({ forcedColors: 'none' });
      result.checks.navCurrent.forcedColors = forced.line;
      if (!forced.line.includes('underline')) fail(`navCurrent: in forced colors text-decoration-line is "${forced.line}", expected underline`);
    } else {
      result.checks.navCurrent.forcedColors = 'unsupported';
    }
  }

  // Footer: email, both profiles, the site's source; no duplicate About link.
  const footer = await page.$$eval('.site-footer a', (links) => links.map((link) => ({ text: link.textContent.trim(), href: link.getAttribute('href') })));
  result.checks.footer = footer.length;
  for (const [text, href] of [['Jadon@jnkos.com', 'mailto:Jadon@jnkos.com'], ['LinkedIn', 'https://www.linkedin.com/in/jadon-kosberg'], ['GitHub', 'https://github.com/jkosber']]) {
    if (!footer.some((link) => link.text === text && link.href === href)) fail(`footer: missing ${text} link`);
  }
  if (!footer.some((link) => link.href === 'https://github.com/jkosber/jkosber.github.io')) fail('footer: missing the site source link');
  if (footer.some((link) => link.text === 'About me')) fail('footer: still has the About me link');

  // Projects index: one row per project in nav order, no filters or card art (filters removed, approved Oct 23).
  result.checks.projectsIndex = {};
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(BASE + '/technical-labs/');
    const index = await page.evaluate(() => ({
      rows: [...document.querySelectorAll('main .project-row-title')].map((title) => title.textContent.trim()),
      leftovers: document.querySelectorAll('main .project-toolbar, main [data-filter], main .card-art, main .project-card').length,
      courseworkLink: [...document.querySelectorAll('main .page-heading a')].some((link) => new URL(link.href).pathname === '/coursework/'),
      height: document.documentElement.scrollHeight,
    }));
    result.checks.projectsIndex[width] = index.rows;
    if (index.rows.join('|') !== 'Proxmox homelab|SSH Workbench|Job scan and resume tailor') fail(`projectsIndex @${width}: rows ${index.rows.join(', ')}`);
    if (!index.courseworkLink) fail(`projectsIndex @${width}: the intro does not link to /coursework/`);
    if (width === 1440 && index.height > 1400) fail(`projectsIndex @1440: page is ${index.height}px tall`);
    if (index.leftovers) fail(`projectsIndex @${width}: ${index.leftovers} filter, toolbar or card element(s) remain`);
  }

  // Homepage: a hero band with the name and three facts (certifications first), the two lead projects
  // as feature panels with real captures, the job-scan row, a "Coursework case studies" list of the
  // three featured case studies, one compact row of class links without illustrations and a card per role.
  // The hero scene is gone (approved Oct 23).
  const expectedClasses = ['NETI 109', 'SVAD 111', 'CSIA 115', 'CSIA 210', 'CSIA 105', 'SDEV 120'];
  const FACT_TITLES = ['CompTIA Security+ and A+', 'IT Support Contractor', 'B.S. in Informatics, Indiana University'];
  // Each featured case study and its class label, in nav order (the Snort lab is not featured).
  const STUDIES = [
    ['/technical-labs/aws-linux-infrastructure/', 'SVAD 111 Linux and Virtualization Technologies'],
    ['/technical-labs/soc-threat-detection/', 'CSIA 115 Cyber Ops'],
    ['/technical-labs/ipv6-packet-investigations/', 'CSIA 210 Network Protocol Analysis'],
  ];
  result.checks.home = {};
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(BASE + '/');
    const home = await page.evaluate(async () => {
      const main = document.querySelector('main');
      const text = (element) => (element ? element.textContent.replace(/\s+/g, ' ').trim() : '');
      const features = [...main.querySelectorAll('.feature')];
      const firstImage = features[0] && features[0].querySelector('img');
      // Text after the class label up to the end of its item: it must start with whitespace.
      const afterLabel = (label) => {
        const range = document.createRange();
        range.setStartAfter(label);
        range.setEndAfter(label.parentNode.lastChild);
        return range.toString();
      };
      const studyLists = main.querySelectorAll('ul[aria-label="Coursework case studies"]');
      return {
        name: text(main.querySelector('h1')),
        facts: [...main.querySelectorAll('.facts > div')].map((cell) => ({ title: text(cell.querySelector('a')), detail: text(cell.querySelector('.detail')) })),
        features: features.map((feature) => {
          const button = feature.querySelector('a.button');
          return {
            title: text(feature.querySelector('h3')),
            result: Boolean(feature.querySelector('.result')),
            tools: feature.querySelectorAll('ul.tools[role="list"] li').length,
            button: button ? { text: text(button), sr: text(button.querySelector('.sr')) } : null,
          };
        }),
        firstImage: firstImage ? { src: firstImage.getAttribute('src'), width: firstImage.getAttribute('width'), height: firstImage.getAttribute('height') } : null,
        liftedFeatures: main.querySelectorAll('.feature.lift').length,
        minor: text(main.querySelector('.minor h3')),
        classLinks: main.querySelectorAll('ul.classes > li > a[href]').length,
        codes: [...main.querySelectorAll('ul.classes .tile-code')].map(text),
        classImages: main.querySelectorAll('ul.classes img').length,
        studyLists: studyLists.length,
        studies: studyLists.length ? [...studyLists[0].children].map((item) => {
          const label = item.querySelector('.study-class');
          const link = item.querySelector('h3 a[href]');
          return {
            href: link ? new URL(link.href).pathname : null,
            label: label ? text(label) : null,
            spaced: label ? /^\s/.test(afterLabel(label)) : false,
          };
        }) : [],
        roles: [...main.querySelectorAll('.home-experience .role-card')].map((card) => {
          const image = card.querySelector('img');
          return image ? { src: image.getAttribute('src'), alt: image.getAttribute('alt') } : null;
        }),
        scene: main.querySelectorAll('.hero-visual, .scene-art, [data-scene-select]').length,
        reveals: main.querySelectorAll('.reveal').length,
      };
    });
    result.checks.home[width] = { features: home.features.map((feature) => feature.title), studies: home.studies.length, classes: home.classLinks, roles: home.roles.length, reveals: home.reveals };
    const where = `home @${width}`;
    if (home.name !== 'Jadon Kosberg') fail(`${where}: h1 is "${home.name}"`);
    if (home.facts.length !== 3) fail(`${where}: ${home.facts.length} facts, expected 3`);
    if (home.facts.map((fact) => fact.title).join('|') !== FACT_TITLES.join('|')) fail(`${where}: fact links ${home.facts.map((fact) => fact.title).join(', ')}`);
    home.facts.forEach((fact, index) => { if (!fact.detail) fail(`${where}: fact ${index + 1} has no .detail`); });
    if (home.features.map((feature) => feature.title).join('|') !== 'Proxmox homelab|SSH Workbench') fail(`${where}: features ${home.features.map((feature) => feature.title).join(', ')}`);
    if (!home.firstImage || !home.firstImage.src.endsWith('homepage-dashboard-2026-10-23.webp') || !home.firstImage.width || !home.firstImage.height) fail(`${where}: first feature image ${JSON.stringify(home.firstImage)}`);
    for (const feature of home.features) {
      if (!feature.result) fail(`${where}: feature ${feature.title} has no .result`);
      if (feature.tools < 3) fail(`${where}: feature ${feature.title} lists ${feature.tools} tools, expected at least 3`);
      if (!feature.button) fail(`${where}: feature ${feature.title} has no a.button`);
      else {
        if (!feature.button.text.startsWith('Read the case study')) fail(`${where}: feature ${feature.title} button reads "${feature.button.text}"`);
        if (!feature.button.sr.includes(feature.title)) fail(`${where}: feature ${feature.title} button's .sr text is "${feature.button.sr}"`);
      }
    }
    if (home.liftedFeatures) fail(`${where}: ${home.liftedFeatures} feature panel(s) carry .lift`);
    if (home.minor !== 'Job scan and resume tailor') fail(`${where}: .minor h3 is "${home.minor}"`);
    if (home.studyLists !== 1) fail(`${where}: ${home.studyLists} lists named "Coursework case studies", expected 1`);
    if (home.studies.length !== 3) fail(`${where}: ${home.studies.length} items in "Coursework case studies", expected 3`);
    if (home.studies.map((study) => study.href).join('|') !== STUDIES.map(([href]) => href).join('|')) fail(`${where}: case studies link to ${home.studies.map((study) => study.href).join(', ')}`);
    home.studies.forEach((study, index) => {
      const expected = STUDIES[index] ? STUDIES[index][1] : null;
      if (!study.label) fail(`${where}: case study ${index + 1} has no .study-class label`);
      else if (study.label !== expected) fail(`${where}: case study ${index + 1} label is "${study.label}", expected "${expected}"`);
      else if (!study.spaced) fail(`${where}: case study ${index + 1} label "${study.label}" runs into the title with no whitespace`);
    });
    if (home.classLinks !== 6) fail(`${where}: ${home.classLinks} class links in ul.classes, expected 6`);
    if (home.codes.join('|') !== expectedClasses.join('|')) fail(`${where}: class codes ${home.codes.join(', ')}`);
    if (home.classImages) fail(`${where}: ${home.classImages} image(s) in the class row, expected none`);
    if (home.roles.length !== 2) fail(`${where}: ${home.roles.length} role cards, expected 2`);
    home.roles.forEach((image, index) => {
      if (!image || !image.src.includes('assets/roles/') || image.alt !== '') fail(`${where}: role card ${index + 1} image ${JSON.stringify(image)}`);
    });
    if (home.scene) fail(`${where}: the hero scene is still on the page`);
    if (home.reveals < 2) fail(`${where}: ${home.reveals} .reveal targets, expected at least 2`);
  }

  // A real screenshot shows in the first screen on desktops.
  result.checks.firstShot = {};
  for (const [width, height] of [[1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await page.goto(BASE + '/');
    const top = await page.evaluate(() => { const image = document.querySelector('.feature img'); return image ? Math.round(image.getBoundingClientRect().top) : null; });
    result.checks.firstShot[`${width}x${height}`] = top;
    if (top === null || top > 740) fail(`firstShot ${width}x${height}: the first feature screenshot starts at ${top}px, expected 740 or less`);
  }

  // A laptop's first screen holds the whole hero and the top of the lead project's screenshot.
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(BASE + '/');
  const firstScreen = await page.evaluate(async () => {
    await document.fonts.ready;
    const image = document.querySelector('.feature .shot img');
    const facts = document.querySelector('.facts');
    return {
      shot: image ? Math.round(image.getBoundingClientRect().top) : null,
      facts: facts ? Math.round(facts.getBoundingClientRect().bottom) : null,
    };
  });
  result.checks.firstScreen = firstScreen;
  if (firstScreen.shot === null || firstScreen.shot > 660) fail(`firstScreen / @1366x768: the first feature screenshot starts at ${firstScreen.shot}px, expected 660 or less`);
  if (firstScreen.facts === null || firstScreen.facts > 768) fail(`firstScreen / @1366x768: the facts strip ends at ${firstScreen.facts}px, expected 768 or less`);

  // Nothing covers a feature's button where the screenshot overhangs the panel on tablets.
  result.checks.coveredButtons = 0;
  for (const [width, height] of [[768, 1024], [1024, 768]]) {
    await page.setViewportSize({ width, height });
    await page.goto(BASE + '/');
    const buttons = await page.evaluate(() => [...document.querySelectorAll('.feature a.button')].map((button) => {
      button.scrollIntoView({ block: 'center', behavior: 'instant' });
      const box = button.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return { text: button.textContent.replace(/\s+/g, ' ').trim(), covered: !hit || !button.contains(hit), by: hit ? `${hit.tagName.toLowerCase()}.${hit.className}` : null };
    }));
    result.checks.coveredButtons += buttons.length;
    if (buttons.length !== 2) fail(`coveredButtons @${width}: ${buttons.length} feature buttons, expected 2`);
    for (const button of buttons) if (button.covered) fail(`coveredButtons @${width}: "${button.text}" is covered by ${button.by}`);
  }

  // Coursework index: one table row per class in nav order, each linking to a live class page,
  // with the in-depth case studies listed beside their class.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + '/coursework/');
  const classes = await page.evaluate(() => [...document.querySelectorAll('main table tbody tr')].map((row) => ({
    name: row.cells[0].textContent.replace(/\s+/g, ' ').trim(),
    href: row.cells[0].querySelector('a') ? new URL(row.cells[0].querySelector('a').href).pathname : null,
    depth: [...row.cells[row.cells.length - 1].querySelectorAll('a')].map((link) => link.textContent.trim()),
  })));
  result.checks.courseworkIndex = classes.map((row) => row.name);
  if (classes.map((row) => row.name.slice(0, 8)).join('|') !== expectedClasses.join('|')) fail(`courseworkIndex: rows ${classes.map((row) => row.name).join(', ')}`);
  const expectedDepth = { 'SVAD 111': ['AdventureWorks on AWS'], 'CSIA 115': ['Pushdo malware investigation in Security Onion', 'Snort, firewall rules & HTTP recovery'], 'CSIA 210': ['IPv6 packet investigations'] };
  for (const row of classes) {
    if (!row.href) { fail(`courseworkIndex: ${row.name} has no link`); continue; }
    const status = (await page.request.get(BASE + row.href)).status();
    if (status !== 200) fail(`courseworkIndex: ${row.href} returns ${status}`);
    const want = expectedDepth[row.name.slice(0, 8)];
    if (want && want.some((title) => !row.depth.includes(title))) fail(`courseworkIndex: ${row.name} in depth ${row.depth.join(', ')}`);
  }

  // Class pages: the same sections everywhere, a link to the course repo; case studies link back to their class.
  // Strongest work comes before the labs and opens on a full panel; the labs fold into one closed
  // module per course module, and a module's rows stack on phones instead of scrolling sideways.
  const LAB_MODULES = { '/coursework/neti-109/': 4, '/coursework/svad-111/': 4, '/coursework/csia-115/': 6, '/coursework/csia-210/': 4, '/coursework/csia-105/': 4, '/coursework/sdev-120/': 4 };
  result.checks.classPages = 0;
  result.checks.labModules = {};
  for (const row of classes.filter((item) => item.href)) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE + row.href);
    const shape = await page.evaluate(() => {
      const strongest = document.querySelector('main h2#strongest-work');
      let firstWork = null;
      for (let node = strongest && strongest.nextElementSibling; node && node.tagName !== 'H2'; node = node.nextElementSibling) {
        if (node.matches('section.work, .work-pair')) { firstWork = node; break; }
      }
      return {
        anchors: [...document.querySelectorAll('main h2[id]')].map((heading) => heading.id),
        repo: [...document.querySelectorAll('main a')].some((link) => /^https:\/\/github\.com\/jkosber\/[^/]+\/?$/.test(link.href)),
        modules: document.querySelectorAll('main details.lab-module').length,
        openModules: document.querySelectorAll('main details.lab-module[open]').length,
        firstWork: firstWork ? { plain: firstWork.matches('section.work:not(.work--brief)'), name: `${firstWork.tagName.toLowerCase()}.${firstWork.className.trim().split(/\s+/).join('.')}` } : null,
        labCounts: [...document.querySelectorAll('main details.lab-module .lab-count')].map((count) => parseInt(count.textContent, 10)),
      };
    });
    result.checks.classPages += 1;
    result.checks.labModules[row.href] = shape.labCounts;
    for (const id of ['what-the-course-provided', 'labs', 'strongest-work', 'skills', 'limits', 'sources']) {
      if (!shape.anchors.includes(id)) fail(`classPages ${row.href}: missing #${id}`);
    }
    if (!shape.repo) fail(`classPages ${row.href}: no link to the course repository`);
    const strongestAt = shape.anchors.indexOf('strongest-work');
    const labsAt = shape.anchors.indexOf('labs');
    if (strongestAt !== -1 && labsAt !== -1 && strongestAt > labsAt) fail(`classPages ${row.href}: strongest-work after labs`);
    if (shape.modules !== LAB_MODULES[row.href]) fail(`classPages ${row.href}: ${shape.modules} details.lab-module, expected ${LAB_MODULES[row.href]}`);
    if (shape.openModules) fail(`classPages ${row.href}: ${shape.openModules} lab module(s) open at load`);
    if (!shape.firstWork) fail(`classPages ${row.href}: no section.work or .work-pair after #strongest-work`);
    else if (!shape.firstWork.plain) fail(`classPages ${row.href}: the first item after #strongest-work is ${shape.firstWork.name}, expected a plain section.work`);
    if (row.href === '/coursework/neti-109/') {
      const labs = shape.labCounts.reduce((sum, count) => sum + count, 0);
      if (labs !== 36) fail(`classPages ${row.href}: lab counts sum to ${labs}, expected 36`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + row.href);
    const summary = page.locator('main details.lab-module > summary').first();
    if (await summary.count() === 0) continue;
    await summary.click();
    const phone = await page.evaluate(() => {
      const first = document.querySelector('main details.lab-module');
      const table = first.querySelector('.lab-table');
      const firstRow = table && table.querySelector('tbody tr');
      return {
        open: first.open,
        overflow: table ? table.scrollWidth - table.clientWidth : null,
        display: firstRow ? getComputedStyle(firstRow).display : null,
      };
    });
    if (!phone.open) fail(`classPages ${row.href} @390: clicking the first module's summary does not open it`);
    if (phone.overflow === null) fail(`classPages ${row.href} @390: the first module has no .lab-table`);
    else if (phone.overflow > 0) fail(`classPages ${row.href} @390: the first module's .lab-table scrolls ${phone.overflow}px sideways`);
    if (phone.display !== 'block') fail(`classPages ${row.href} @390: the first lab row is display ${phone.display}, expected block`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  // Arriving at a closed lab module by its heading's own id lands on that heading (Review Focus 1).
  await page.goto(BASE + '/coursework/neti-109/');
  const moduleId = await page.evaluate(() => { const heading = document.querySelector('details.lab-module h3[id]'); return heading ? heading.id : null; });
  if (!moduleId) fail('labModuleAnchor: no details.lab-module h3 with an id on /coursework/neti-109/');
  else {
    await page.goto('about:blank');
    await page.goto(`${BASE}/coursework/neti-109/#${moduleId}`);
    // The page scrolls smoothly to the fragment; wait on the Node side until it stops.
    let lastY = null;
    for (let tries = 0; tries < 30; tries += 1) {
      const y = await page.evaluate(() => scrollY);
      if (y === lastY) break;
      lastY = y;
      await page.waitForTimeout(100);
    }
    const box = await page.evaluate((id) => {
      const rect = document.getElementById(id).getBoundingClientRect();
      return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), viewport: innerHeight };
    }, moduleId);
    result.checks.labModuleAnchor = { id: moduleId, ...box };
    if (box.top < 0 || box.bottom > box.viewport) fail(`labModuleAnchor: #${moduleId} sits at ${box.top} to ${box.bottom}px, outside the ${box.viewport}px viewport`);
  }
  for (const [study, classHref] of [['/technical-labs/aws-linux-infrastructure/', '/coursework/svad-111/'], ['/technical-labs/soc-threat-detection/', '/coursework/csia-115/'], ['/technical-labs/snort-firewall-lab/', '/coursework/csia-115/'], ['/technical-labs/ipv6-packet-investigations/', '/coursework/csia-210/']]) {
    await page.goto(BASE + study);
    const back = await page.evaluate((target) => [...document.querySelectorAll('.crumbs a')].some((link) => new URL(link.href).pathname === target), classHref);
    if (!back) fail(`classPages ${study}: no breadcrumb link back to ${classHref}`);
  }

  // Case studies and class pages: a header band with the title, description and a strip of facts.
  // Case studies show the Result beside the title and the Role panel at the top of the body; class pages
  // put the role and result pair under the band. The contents sit sticky beside the body on wide
  // screens; on phones the header, the summary and the closed contents come before the body.
  const headPages = {
    case: ['/technical-labs/proxmox-virtualization/', '/technical-labs/ssh-workbench/', '/technical-labs/job-scan-tailor/',
      '/technical-labs/aws-linux-infrastructure/', '/technical-labs/soc-threat-detection/', '/technical-labs/snort-firewall-lab/',
      '/technical-labs/ipv6-packet-investigations/'],
    class: ['/coursework/neti-109/', '/coursework/svad-111/', '/coursework/csia-115/', '/coursework/csia-210/', '/coursework/csia-105/', '/coursework/sdev-120/'],
  };
  // Every case study above has a summary.result; only these two have a screenshot.
  const SHOT_PAGES = ['/technical-labs/proxmox-virtualization/', '/technical-labs/ssh-workbench/'];
  result.checks.pageHead = 0;
  for (const [kind, list] of Object.entries(headPages)) {
    for (const route of list) {
      await page.setViewportSize({ width: 1440, height: 900 });
      if ((await page.goto(BASE + route)).status() !== 200) continue;
      const wide = await page.evaluate(async () => {
        const find = (selector) => document.querySelector(selector);
        const strip = find('dl.strip');
        if (!find('.page-head h1') || !strip) return { missing: true };
        const art = find('.head-art');
        if (art && !art.complete) await new Promise((done) => { art.addEventListener('load', done, { once: true }); art.addEventListener('error', done, { once: true }); });
        const headResult = find('.head-result');
        const shot = find('.lead-shot img');
        const role = find('.body .role-panel');
        const contents = find('details.contents');
        const body = find('.body');
        return {
          labels: [...strip.querySelectorAll('dt')].map((term) => term.textContent.trim()),
          unpaired: [...strip.querySelectorAll('dt')].filter((term) => !(term.nextElementSibling && term.nextElementSibling.matches('dd'))).map((term) => term.textContent.trim()),
          emptyValues: [...strip.querySelectorAll('dd')].filter((value) => !value.textContent.trim()).length,
          resultBottom: headResult ? Math.round(headResult.getBoundingClientRect().bottom) : null,
          shotTop: shot ? Math.round(shot.getBoundingClientRect().top) : null,
          leadShot: Boolean(find('.lead-shot')),
          shotHead: Boolean(find('.page-head--shot')),
          role: role ? { title: (role.querySelector('.panel-title') || { textContent: '' }).textContent.trim(), tools: role.querySelectorAll('ul.tools li').length } : null,
          pairResult: Boolean(find('.summary-pair .panel--result')),
          art: art ? { alt: art.getAttribute('alt'), loaded: art.naturalWidth > 0 } : null,
          contents: contents && body ? { open: contents.open, beside: contents.getBoundingClientRect().left >= body.getBoundingClientRect().right, position: getComputedStyle(contents).position } : null,
          spec: document.querySelectorAll('aside.spec').length,
        };
      });
      result.checks.pageHead += 1;
      const where = `pageHead ${route} @1440`;
      if (wide.missing) fail(`${where}: no .page-head h1 or dl.strip`);
      else {
        if (wide.unpaired.length) fail(`${where}: strip label(s) without a value: ${wide.unpaired.join(', ')}`);
        if (wide.emptyValues) fail(`${where}: ${wide.emptyValues} empty dd in the strip`);
        if (kind === 'case' && !wide.labels.some((label) => label === 'Updated' || label === 'Status')) fail(`${where}: the strip has no Updated or Status (${wide.labels.join(', ')})`);
        if (kind === 'class' && !wide.labels.includes('Term')) fail(`${where}: the strip has no Term (${wide.labels.join(', ')})`);
        if (kind === 'case') {
          if (wide.resultBottom === null) fail(`${where}: no .head-result`);
          else if (wide.resultBottom > 900) fail(`${where}: .head-result ends at ${wide.resultBottom}px, expected 900 or less`);
          if (!wide.role) fail(`${where}: no .body .role-panel`);
          else {
            if (wide.role.title !== 'Role') fail(`${where}: the role panel title is "${wide.role.title}", expected "Role"`);
            if (!wide.role.tools) fail(`${where}: the role panel has no ul.tools items`);
          }
        }
        if (SHOT_PAGES.includes(route)) {
          if (wide.shotTop === null) fail(`${where}: no .lead-shot img`);
          else if (wide.shotTop > 620) fail(`${where}: the lead screenshot starts at ${wide.shotTop}px, expected 620 or less`);
        }
        if (route === '/technical-labs/job-scan-tailor/' && (wide.leadShot || wide.shotHead)) fail(`${where}: a page without a screenshot has .lead-shot or .page-head--shot`);
        if (kind === 'class') {
          if (!wide.pairResult) fail(`${where}: no .summary-pair .panel--result`);
          if (!wide.art) fail(`${where}: no .head-art`);
          else if (wide.art.alt !== '' || !wide.art.loaded) fail(`${where}: .head-art ${JSON.stringify(wide.art)}`);
        }
        if (!wide.contents) fail(`${where}: no details.contents and .body`);
        else {
          if (!wide.contents.open) fail(`${where}: On this page starts closed`);
          if (!wide.contents.beside) fail(`${where}: the contents are not right of the body`);
          if (wide.contents.position !== 'sticky') fail(`${where}: the contents are ${wide.contents.position}, not sticky`);
        }
      }
      if (wide.spec) fail(`${where}: aside.spec is still on the page`);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(BASE + route);
      const narrow = await page.evaluate((summary) => {
        const items = ['.crumbs', 'main h1', '.dek', 'dl.strip', summary, 'details.contents', '.body'].map((selector) => [selector, document.querySelector(selector)]);
        const missing = items.filter(([, element]) => !element).map(([selector]) => selector);
        const outOfOrder = items.filter(([, element]) => element).some(([, element], index, list) => index && (list[index - 1][1].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) === 0);
        const contents = document.querySelector('details.contents');
        return { missing, outOfOrder, contentsOpen: contents ? contents.open : false };
      }, kind === 'class' ? '.summary-pair' : '.head-result');
      if (narrow.missing.length) fail(`pageHead ${route} @390: missing ${narrow.missing.join(', ')}`);
      if (narrow.outOfOrder) fail(`pageHead ${route} @390: breadcrumbs, title, description, strip, summary, contents and body are out of order`);
      if (narrow.contentsOpen) fail(`pageHead ${route} @390: On this page starts open`);
    }
  }

  // The contents rail opens again when the window widens past 1100 px, as when a tablet rotates.
  await page.setViewportSize({ width: 1024, height: 1366 });
  await page.goto(BASE + '/technical-labs/proxmox-virtualization/');
  {
    const railState = () => page.evaluate(() => {
      const contents = document.querySelector('details.contents');
      const link = contents && contents.querySelector('nav a');
      const box = link ? link.getBoundingClientRect() : null;
      return {
        open: contents ? contents.open : null,
        linkVisible: Boolean(link && box.width > 0 && box.height > 0 && (!link.checkVisibility || link.checkVisibility())),
      };
    });
    const narrow = await railState();
    await page.setViewportSize({ width: 1366, height: 1024 });
    await page.waitForTimeout(200);
    const widened = await railState();
    result.checks.railWidened = { narrow, widened };
    if (narrow.open !== false) fail(`railWidened: On this page is ${narrow.open === null ? 'missing' : 'open'} at 1024x1366, expected closed`);
    if (!widened.open) fail('railWidened: On this page stays closed after widening from 1024 to 1366');
    if (!widened.linkVisible) fail('railWidened: the first contents link is not visible after widening from 1024 to 1366');
  }

  // Experience: both roles on one page, Ladd Dental in the gate 2 wording plus the master resume's
  // points (Oct 23), the Verizon contract ending October 2026, and the homepage linking each role
  // with its one-line summary.
  const LADD_BULLETS = [
    'Handled 20+ tickets a week: workstations, printers, peripherals, network problems and the clinical software, through Level RMM or onsite',
    'Wrote up each ticket in ClickUp: symptoms, steps tried, the fix and any follow-up',
    'Set up 30+ new workstations, from hardware setup, software installs and network configuration to domain join',
    "Retired 50+ workstations that couldn't run Windows 11, so every office stayed on a supported OS: wiped, degaussed or crushed the drives under HIPAA-aligned procedures and kept a chain-of-custody record",
    'Ran HDMI to 7 operatory rooms to replace VGA and built the keystone outlets',
    'Pulled, terminated and tested an Ethernet run between switches in two offices, extending an existing fiber uplink',
    'Fixed a dead wall jack by toning it back to the patch panel and repunching the keystone',
    'Set up accounts and roles in the clinical software and installed it on workstations',
    'Reinforced secure habits with staff: workstation handling, password hygiene and protecting patient information',
  ];
  const ROLE_DATES = { 'verizon-conversions': 'July 2026 to October 2026', 'ladd-dental': 'November 2025 to May 2026' };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + '/experience/');
  const roles = await page.evaluate(async () => {
    const articles = [...document.querySelectorAll('main article.role')];
    for (const image of document.querySelectorAll('main article.role img')) {
      image.scrollIntoView({ behavior: 'instant' });
      if (!image.complete) await new Promise((done) => { image.addEventListener('load', done, { once: true }); image.addEventListener('error', done, { once: true }); });
    }
    const text = (element) => (element ? element.textContent.replace(/\s+/g, ' ').trim() : '');
    return articles.map((role) => {
      const image = role.querySelector('img');
      return {
        id: role.id,
        title: text(role.querySelector('h2')),
        organization: text(role.querySelector('.role-org')),
        dates: text(role.querySelector('.role-dates')),
        image: image ? { src: image.getAttribute('src'), loaded: image.naturalWidth > 0, alt: image.getAttribute('alt') } : null,
        bullets: [...role.querySelectorAll('li')].map(text),
      };
    });
  });
  result.checks.experience = roles.map((role) => `${role.id}: ${role.bullets.length} bullets`);
  if (roles.map((role) => role.id).join('|') !== 'verizon-conversions|ladd-dental') fail(`experience: roles ${roles.map((role) => role.id).join(', ')}`);
  for (const role of roles) {
    for (const field of ['title', 'organization', 'dates']) if (!role[field]) fail(`experience #${role.id}: no ${field}`);
    if (ROLE_DATES[role.id] && role.dates !== ROLE_DATES[role.id]) fail(`experience #${role.id}: dates "${role.dates}", expected "${ROLE_DATES[role.id]}"`);
    if (!role.image || !role.image.src.includes('assets/roles/')) fail(`experience #${role.id}: image ${JSON.stringify(role.image)}`);
    if (role.bullets.length < 4) fail(`experience #${role.id}: ${role.bullets.length} bullets`);
  }
  const ladd = roles.find((role) => role.id === 'ladd-dental');
  if (ladd && ladd.bullets.join('\n') !== LADD_BULLETS.join('\n')) fail('experience #ladd-dental: bullets differ from the approved wording');

  // The page closes on one plain paragraph linking to both Projects and Coursework; the oversized
  // section note it replaced is gone.
  const closing = await page.evaluate(() => {
    const note = document.querySelector('main p.related-link');
    return {
      sectionNotes: document.querySelectorAll('main .section-note').length,
      links: note ? [...note.querySelectorAll('a')].map((link) => new URL(link.href).pathname) : null,
    };
  });
  result.checks.experienceClosing = closing.links;
  if (closing.sectionNotes) fail(`experience: closing note: ${closing.sectionNotes} .section-note element(s) remain`);
  if (!closing.links) fail('experience: closing note: no p.related-link');
  else for (const target of ['/technical-labs/', '/coursework/']) if (!closing.links.includes(target)) fail(`experience: closing note does not link to ${target}`);

  // Role illustrations load and are decorative.
  result.checks.roleArt = roles.filter((role) => role.image && role.image.loaded).length;
  for (const role of roles) {
    if (!role.image || !role.image.loaded) fail(`roleArt #${role.id}: image did not load`);
    else if (role.image.alt !== '') fail(`roleArt #${role.id}: alt is "${role.image.alt}", expected ""`);
  }

  await page.goto(BASE + '/');
  const homeRoles = await page.evaluate(() => [...document.querySelectorAll('.home-experience .role-card')].map((entry) => ({
    link: [...entry.querySelectorAll('a')].map((link) => { const url = new URL(link.href); return url.pathname + url.hash; }),
    summary: (entry.querySelector('.role-summary') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(),
  })));
  ['/experience/#verizon-conversions', '/experience/#ladd-dental'].forEach((target, index) => {
    const entry = homeRoles[index];
    if (!entry || !entry.link.includes(target)) fail(`experience: homepage role ${index + 1} does not link to ${target}`);
    else if (entry.summary.split(' ').length < 8) fail(`experience: homepage role ${index + 1} summary is "${entry.summary}"`);
  });

  // About: one page with certifications, education and a single skills table. Both certifications
  // share one look, and each links to its public Credly badge.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + '/credentials/');
  const about = await page.evaluate(() => {
    const main = document.querySelector('main');
    const skills = main.querySelector('h2#skills');
    let tables = 0;
    for (let node = skills && skills.nextElementSibling; node && node.tagName !== 'H2'; node = node.nextElementSibling) tables += node.matches('table') ? 1 : node.querySelectorAll('table').length;
    const credentials = [...main.querySelectorAll('.credential')].map((card) => {
      const style = getComputedStyle(card);
      return {
        name: (card.querySelector('h3') || { textContent: '' }).textContent.trim(),
        look: [style.backgroundColor, style.borderTopColor, style.borderLeftColor, style.color].join(' '),
        credly: [...card.querySelectorAll('a')].map((link) => link.href).filter((href) => href.includes('credly')),
      };
    });
    return {
      h1: (main.querySelector('h1') || { textContent: '' }).textContent.trim(),
      anchors: [...main.querySelectorAll('h2[id]')].map((heading) => heading.id),
      tables,
      credentials,
    };
  });
  result.checks.about = about.credentials.map((card) => `${card.name}: ${card.credly.length} Credly link(s)`);
  if (about.h1 !== 'About') fail(`about: h1 is "${about.h1}"`);
  for (const id of ['certifications', 'education', 'skills']) if (!about.anchors.includes(id)) fail(`about: missing #${id}`);
  if (about.tables !== 1) fail(`about: ${about.tables} tables under Skills, expected 1`);
  if (about.credentials.map((card) => card.name).join('|') !== 'CompTIA Security+|CompTIA A+') fail(`about: certifications ${about.credentials.map((card) => card.name).join(', ')}`);
  if (new Set(about.credentials.map((card) => card.look)).size !== 1) fail(`about: the certifications look different (${about.credentials.map((card) => card.look).join(' / ')})`);
  for (const card of about.credentials) {
    if (card.credly.length !== 1) { fail(`about: ${card.name} has ${card.credly.length} Credly links`); continue; }
    if (!card.credly[0].startsWith('https://www.credly.com/')) fail(`about: ${card.name} links to ${card.credly[0]}`);
    const status = (await page.request.get(card.credly[0])).status();
    if (status !== 200) fail(`about: ${card.name} Credly link returns ${status}`);
  }

  // Moved pages: the old address answers with a refresh to the new page and lands on the right section.
  const REDIRECTS = [
    ['/technical-labs/cisco-networking-analysis/', '/coursework/neti-109/', '#strongest-work'],
    ['/experience/ladd-dental/', '/experience/', '#ladd-dental'],
    ['/experience/verizon-conversions/', '/experience/', '#verizon-conversions'],
    ['/career-paths/', '/credentials/', '#skills'],
  ];
  result.checks.redirects = 0;
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [from, to, hash] of REDIRECTS) {
    const response = await page.request.get(BASE + from);
    const body = response.status() === 200 ? await response.text() : '';
    result.checks.redirects += 1;
    if (!/http-equiv="refresh"/.test(body)) { fail(`redirects ${from}: no refresh (HTTP ${response.status()})`); continue; }
    await page.goto(BASE + from);
    await page.waitForURL((url) => url.pathname === to, { timeout: 5000 }).catch(() => {});
    const landed = new URL(page.url());
    if (landed.pathname !== to || landed.hash !== hash) fail(`redirects ${from}: landed on ${landed.pathname}${landed.hash}, expected ${to}${hash}`);
  }

  // Keyboard order on a phone follows what you see, top to bottom (deferred minor a), on the
  // homepage, a case study and a class page (Review Focus 5).
  await page.setViewportSize({ width: 390, height: 844 });
  result.checks.domOrder = 0;
  for (const route of ['/', '/technical-labs/proxmox-virtualization/', '/coursework/neti-109/']) {
    await page.goto(BASE + route);
    const tabOrder = await page.evaluate(() => [...document.querySelectorAll('main a[href], main button, main [tabindex="0"]')]
      .filter((element) => element.offsetParent !== null && !element.closest('[hidden]'))
      .map((element) => ({ text: (element.textContent || element.getAttribute('aria-label') || '').trim().slice(0, 40), top: Math.round(element.getBoundingClientRect().top + scrollY) })));
    result.checks.domOrder += tabOrder.length;
    tabOrder.forEach((item, index) => { if (index && item.top < tabOrder[index - 1].top - 2) fail(`domOrder ${route}: "${item.text}" (y ${item.top}) comes after "${tabOrder[index - 1].text}" (y ${tabOrder[index - 1].top})`); });
  }

  // The facts column fits a laptop's first screen (deferred minor d).
  for (const [width, height] of [[1366, 768], [1440, 790]]) {
    await page.setViewportSize({ width, height });
    await page.goto(BASE + '/');
    const bottom = await page.evaluate(() => { const facts = document.querySelector('.facts'); return facts ? Math.round(facts.getBoundingClientRect().bottom) : null; });
    result.checks.factsFit = { ...(result.checks.factsFit || {}), [`${width}x${height}`]: bottom };
    if (bottom === null || bottom > height) fail(`factsFit ${width}x${height}: facts end at ${bottom}px`);
  }

  // Motion limits: nothing over 0.5 s, delay included, nothing infinite, no transition on `all`;
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
          // A delayed entrance still has to finish by 0.5 s.
          const delays = seconds(style.animationDelay);
          seconds(style.animationDuration).forEach((duration, index) => {
            const delay = delays[index % delays.length];
            if (delay + duration > 0.5) issues.push(`${name}: animation ${style.animationName} ends at ${(delay + duration).toFixed(2)}s (delay ${delay}s)`);
          });
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

  // Words broken mid-word inside the blocks `selector` matches, outside code: how many blocks matched
  // and the split words. A line break after a hyphen is normal; a break inside a word part is the defect.
  const splitWords = (selector) => page.evaluate((blockSelector) => {
    const blocks = document.querySelectorAll(blockSelector);
    const split = [];
    for (const block of blocks) {
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement.closest('code')) continue;
        for (const match of node.data.matchAll(/[^\s-]+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          if (new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size > 1) split.push(match[0]);
        }
      }
    }
    return { blocks: blocks.length, split };
  }, selector);
  // Page titles, the homepage name among them, keep every word whole at 200% text at 390 and 320 px,
  // and the description under a title is never set larger than the title.
  result.checks.titleWrap = { 390: 0, 320: 0 };
  const titleWrap = async (route, width) => {
    const titles = await splitWords('h1');
    result.checks.titleWrap[width] += titles.blocks;
    if (titles.split.length) fail(`titleWrap ${route} @${width}: title words broken mid-word at 200% text: ${[...new Set(titles.split)].join(', ')}`);
    const sizes = await page.evaluate(() => {
      const size = (element) => (element ? parseFloat(getComputedStyle(element).fontSize) : null);
      return { title: size(document.querySelector('h1')), description: size(document.querySelector('.dek, .page-heading > p')) };
    });
    if (sizes.title && sizes.description > sizes.title) fail(`titleWrap ${route} @${width}: the description (${sizes.description}px) is larger than the title (${sizes.title}px) at 200% text`);
  };

  // Enlarged text: 200% at 390 px never widens the page, and words never break mid-word in the
  // header strip, the Role panel, Result panels, the coursework table or stacked tables (code excepted).
  await page.setViewportSize({ width: 390, height: 844 });
  result.checks.text200 = 0;
  for (const route of routes) {
    await page.goto(BASE + route);
    const state = await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%';
      await new Promise((done) => setTimeout(done, 150));
      // Two-column tables stack instead of scrolling, and the hook marks them for that.
      const pairs = [...document.querySelectorAll('.table-scroll')].filter((region) => !region.querySelector('tr > :nth-child(3)'));
      const classTable = document.querySelector('.coursework-index .table-scroll');
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        classTableScroll: classTable ? classTable.scrollWidth - classTable.clientWidth : 0,
        pairs: pairs.length,
        scrollingPairs: pairs.filter((region) => region.scrollWidth > region.clientWidth).length,
        unmarkedPairs: pairs.filter((region) => region.dataset.columns !== '2').length,
      };
    });
    result.checks.text200 += 1;
    const words = await splitWords('.strip, .role-panel, .result, .coursework-index, .table-scroll[data-columns="2"]');
    await titleWrap(route, 390);
    const enlarged = await regionState(page, true);
    result.checks.scrollRegions.text200 = addCounts(result.checks.scrollRegions.text200 || {}, regionCounts(enlarged));
    for (const problem of regionProblems(enlarged)) fail(`scrollRegions ${route} @390 at 200% text: ${problem}`);
    result.checks.stackedPairs = (result.checks.stackedPairs || 0) + state.pairs;
    if (state.scrollingPairs) fail(`stackedPairs ${route}: ${state.scrollingPairs} two-column table(s) scroll sideways at 200% text`);
    if (state.unmarkedPairs) fail(`stackedPairs ${route}: ${state.unmarkedPairs} two-column table(s) lack data-columns="2"`);
    if (state.overflow > 0) fail(`text200 ${route}: ${state.overflow}px horizontal overflow`);
    if (state.classTableScroll > 0) fail(`text200 ${route}: the coursework table scrolls ${state.classTableScroll}px sideways`);
    if (words.split.length) fail(`text200 ${route}: words broken mid-word: ${[...new Set(words.split)].join(', ')}`);
  }

  // At the narrowest width, 200% text still never widens the page or splits a title word.
  await page.setViewportSize({ width: 320, height: 800 });
  result.checks.text200narrow = 0;
  for (const route of routes) {
    await page.goto(BASE + route);
    const overflow = await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%';
      await new Promise((done) => setTimeout(done, 150));
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    result.checks.text200narrow += 1;
    if (overflow > 0) fail(`text200 ${route} @320: ${overflow}px horizontal overflow`);
    await titleWrap(route, 320);
  }

  // At 320 px with default text, every page title, the homepage name among them, also keeps each word
  // whole: a long word can fill the column at the default size while the 200% passes above stay clean.
  await page.setViewportSize({ width: 320, height: 800 });
  result.checks.titleWrapDefaultText = 0;
  for (const route of routes) {
    await page.goto(BASE + route);
    await page.evaluate(async () => { await document.fonts.ready; });
    const titles = await splitWords('h1');
    result.checks.titleWrapDefaultText += titles.blocks;
    if (titles.split.length) fail(`titleWrapDefaultText ${route} @320: title words broken mid-word at default text: ${[...new Set(titles.split)].join(', ')}`);
  }

  // Section headings, buttons and the homepage panels keep every word whole at 200% text at 390 and 320 px,
  // and at 1440 px the contents rail never grows wider than the body beside it. Like splitWords, but a line
  // break may follow a hyphen: a typed one, a soft hyphen, or one hyphens: auto draws. A drawn hyphen is a box
  // of its own that the letters on both sides of the break report, so the last letter before the break spans
  // more of its line than the letter alone measures. A break with no hyphen is the defect; each one is
  // reported with a slash where the line breaks, after the hyphen when there is one.
  const unhyphenatedSplits = (selector) => page.evaluate((blockSelector) => {
    const blocks = document.querySelectorAll(blockSelector);
    const seen = new Set();
    const split = [];
    const pen = document.createElement('canvas').getContext('2d');
    const rectsOf = (node, start, end) => {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      return [...range.getClientRects()].filter((rect) => rect.width > 0);
    };
    for (const block of blocks) {
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (seen.has(node) || node.parentElement.closest('code')) continue;
        seen.add(node);
        const style = getComputedStyle(node.parentElement);
        pen.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        pen.letterSpacing = style.letterSpacing;
        for (const match of node.data.matchAll(/[^\s-]+/g)) {
          const end = match.index + match[0].length;
          if (new Set(rectsOf(node, match.index, end).map((rect) => Math.round(rect.top))).size < 2) continue;
          let rendered = '';
          let last = null;
          let broken = false;
          for (let offset = match.index; offset < end; offset += 1) {
            const rects = rectsOf(node, offset, offset + 1);
            if (rects.length) {
              // The letter's own box comes last; a drawn hyphen's box can come before it.
              const line = Math.round(rects[rects.length - 1].top);
              if (last && line !== last.line) {
                const before = [...last.rects, ...rects].filter((rect) => Math.round(rect.top) === last.line);
                const span = Math.max(...before.map((rect) => rect.right)) - Math.min(...before.map((rect) => rect.left));
                const hyphen = /[­‐–—]/.test(last.char) || span - pen.measureText(last.char).width > parseFloat(style.fontSize) * 0.15;
                if (!hyphen) broken = true;
                rendered += hyphen ? '-/' : '/';
              }
              last = { char: node.data[offset], rects, line };
            }
            rendered += node.data[offset];
          }
          if (broken) split.push(rendered);
        }
      }
    }
    return { blocks: blocks.length, split };
  }, selector);
  result.checks.headingWrap200 = { 390: 0, 320: 0 };
  for (const [width, height] of [[390, 844], [320, 700]]) {
    await page.setViewportSize({ width, height });
    for (const route of routes) {
      await page.goto(BASE + route);
      await page.evaluate(async () => {
        document.documentElement.style.fontSize = '200%';
        await document.fonts.ready;
        await new Promise((done) => setTimeout(done, 150));
      });
      const words = await unhyphenatedSplits('h2, h3, .button, .feature, .minor, .role-card');
      result.checks.headingWrap200[width] += words.blocks;
      if (words.split.length) fail(`headingWrap200 ${route} @${width}: words broken mid-word with no hyphen at 200% text: ${[...new Set(words.split)].join(', ')}`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  result.checks.railAt200 = 0;
  for (const route of routes) {
    await page.goto(BASE + route);
    const columns = await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%';
      await new Promise((done) => setTimeout(done, 150));
      const article = document.querySelector('.article:has(> .contents)');
      return article ? getComputedStyle(article).gridTemplateColumns.split(' ').map(parseFloat) : null;
    });
    if (!columns) continue;
    result.checks.railAt200 += 1;
    if (columns.length !== 2 || columns[1] > columns[0]) fail(`railAt200 ${route} @1440: the article grid is ${columns.map((size) => `${size}px`).join(' ')} at 200% text; the contents rail must sit beside the body and be no wider`);
  }

  // Target size: the name in the header, the On this page summary and every footer link are at least
  // 44 px each way at default text, on a phone and on a desktop. Inline links in body text are not
  // part of this. A summary or link that is not shown at that width is left out.
  result.checks.targetSizes = { 390: 0, 1440: 0 };
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    for (const route of routes) {
      await page.goto(BASE + route);
      const targets = await page.evaluate(async () => {
        await document.fonts.ready;
        const footerName = (link) => (link.classList.length
          ? `.site-footer a.${[...link.classList].join('.')}`
          : `.site-footer .${[...link.parentElement.classList].join('.')} a "${link.textContent.trim()}"`);
        return [
          ...[...document.querySelectorAll('.site-header a.brand')].map((element) => ['.site-header a.brand', element]),
          ...[...document.querySelectorAll('details.contents summary')].map((element) => ['details.contents summary', element]),
          ...[...document.querySelectorAll('.site-footer a')].map((element) => [footerName(element), element]),
        ].map(([selector, element]) => {
          const box = element.getBoundingClientRect();
          return { selector, width: box.width, height: box.height, shown: box.width > 0 && box.height > 0 && (!element.checkVisibility || element.checkVisibility()) };
        }).filter((target) => target.shown);
      });
      result.checks.targetSizes[width] += targets.length;
      for (const target of targets) {
        if (target.width < 44 || target.height < 44) fail(`targetSizes ${route} @${width}: ${target.selector} is ${target.width.toFixed(1)}x${target.height.toFixed(1)}px, expected at least 44x44`);
      }
    }
  }

  // Screenshots never draw larger than their file: a figure image that is shown is at most 1 px wider
  // than its natural width, and an evidence figure's width and height attributes never ask for more
  // than the file's size. Attributes do not change with the window, so they are checked once, at 1440.
  result.checks.imageScale = { 1440: 0, 390: 0, attributes: 0 };
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    for (const route of routes) {
      await page.goto(BASE + route);
      const images = await page.evaluate(async () => {
        const found = [...document.querySelectorAll('.evidence-figure img, .shot img, figure img')];
        for (const image of found) {
          image.loading = 'eager';
          if (!image.complete) await new Promise((done) => { image.addEventListener('load', done, { once: true }); image.addEventListener('error', done, { once: true }); });
        }
        return found.filter((image) => image.naturalWidth > 0).map((image) => {
          const box = image.getBoundingClientRect();
          const sized = image.closest('.evidence-figure') && image.hasAttribute('width') && image.hasAttribute('height');
          return {
            file: (image.getAttribute('src') || '').split('/').pop(),
            natural: [image.naturalWidth, image.naturalHeight],
            rendered: [box.width, box.height],
            attributes: sized ? [Number(image.getAttribute('width')), Number(image.getAttribute('height'))] : null,
          };
        });
      });
      for (const image of images) {
        const natural = `${image.natural[0]}x${image.natural[1]}`;
        if (image.rendered[0] > 0) {
          result.checks.imageScale[width] += 1;
          if (image.rendered[0] > image.natural[0] + 1) fail(`imageScale ${route} @${width}: ${image.file} draws at ${image.rendered[0].toFixed(1)}x${image.rendered[1].toFixed(1)}px, larger than its ${natural}px file`);
        }
        if (width === 1440 && image.attributes) {
          result.checks.imageScale.attributes += 1;
          const [w, h] = image.attributes;
          if (w > image.natural[0] || h > image.natural[1]) fail(`imageScale ${route}: ${image.file} has width="${w}" height="${h}", larger than its ${natural}px file`);
        }
      }
    }
  }

  // Hover: whole-row links lift 2 px under a mouse, even after their scroll fade-up has run.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + '/technical-labs/');
  {
    const row = page.locator('.project-row.lift').first();
    await row.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await row.hover();
    await page.waitForTimeout(300);
    const lifted = await row.evaluate((element) => {
      const style = getComputedStyle(element);
      const shift = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform).m42;
      const translate = style.translate === 'none' ? 0 : parseFloat(style.translate.split(' ')[1] || '0');
      return shift + translate;
    });
    result.checks.hoverLift = lifted;
    if (lifted > -1.5) fail(`hoverLift: a hovered project row moves ${lifted}px, expected about -2px`);
  }

  // Hover: class tiles are whole-card links and lift the same 2 px.
  await page.goto(BASE + '/');
  if (await page.locator('.tile.lift').count() === 0) fail('tileLift: no .tile.lift on the homepage');
  else {
    const tile = page.locator('.tile.lift').first();
    await tile.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await tile.hover();
    await page.waitForTimeout(300);
    const lifted = await tile.evaluate((element) => {
      const style = getComputedStyle(element);
      const shift = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform).m42;
      const translate = style.translate === 'none' ? 0 : parseFloat(style.translate.split(' ')[1] || '0');
      return shift + translate;
    });
    result.checks.tileLift = lifted;
    if (lifted > -1.5) fail(`tileLift: a hovered class tile moves ${lifted}px, expected about -2px`);
  }

  // Lightbox: on desktops a screenshot opens full size in a named dialog, focus moves into it,
  // Escape closes it and focus returns to the screenshot link. On phones the link opens the
  // image file itself, so pinch zoom works.
  result.checks.lightbox = {};
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + '/');
  if (await page.locator('.feature a.zoom').count() === 0) fail('lightbox: no .feature a.zoom on the homepage');
  else {
    await page.locator('.feature a.zoom').first().click();
    await page.waitForTimeout(300);
    const opened = await page.evaluate(() => {
      const box = document.querySelector('dialog.lightbox[open]');
      const image = box && box.querySelector('img');
      return {
        open: Boolean(box),
        name: box ? (box.getAttribute('aria-label') || '').trim() : '',
        src: image ? image.src : null,
        focusInside: Boolean(box && box.contains(document.activeElement)),
      };
    });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closed = await page.evaluate(() => ({
      open: Boolean(document.querySelector('dialog.lightbox[open]')),
      focusOnLink: document.activeElement === document.querySelector('.feature a.zoom'),
    }));
    result.checks.lightbox.desktop = { ...opened, closedOpen: closed.open, focusOnLink: closed.focusOnLink };
    if (!opened.open) fail('lightbox @1440: clicking the first .feature a.zoom opens no dialog.lightbox');
    else {
      if (!opened.name) fail('lightbox @1440: the dialog has no accessible name');
      if (!opened.src || !opened.src.endsWith('homepage-dashboard-2026-10-23.webp')) fail(`lightbox @1440: the dialog image is ${opened.src}, expected homepage-dashboard-2026-10-23.webp`);
      if (!opened.focusInside) fail('lightbox @1440: focus is not inside the open dialog');
      if (closed.open) fail('lightbox @1440: Escape leaves the dialog open');
      if (!closed.focusOnLink) fail('lightbox @1440: focus does not return to the screenshot link after Escape');
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + '/');
    await page.locator('.feature a.zoom').first().click();
    await page.waitForURL(/\.webp$/, { timeout: 5000 }).catch(() => {});
    const phoneUrl = page.url();
    const phoneDialog = phoneUrl.endsWith('.webp') ? false : await page.evaluate(() => Boolean(document.querySelector('dialog.lightbox[open]')));
    result.checks.lightbox.phone = { url: phoneUrl, dialog: phoneDialog };
    if (phoneDialog) fail('lightbox @390: clicking a screenshot opens the dialog instead of the image file');
    if (!phoneUrl.endsWith('.webp')) fail(`lightbox @390: clicking a screenshot stays on ${phoneUrl}, expected the .webp file`);
    if (phoneUrl.endsWith('.webp')) await page.goBack();
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  // A screenshot has one keyboard stop, its caption's "Open full size" link; the image link stays
  // clickable but leaves the tab order.
  result.checks.zoomTabStops = 0;
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of ['/', '/technical-labs/proxmox-virtualization/']) {
    await page.goto(BASE + route);
    const links = await page.evaluate(() => [...document.querySelectorAll('a.zoom')].map((link) => ({
      tabindex: link.getAttribute('tabindex'),
      caption: Boolean(link.closest('figure') && link.closest('figure').querySelector('figcaption a[href]')),
    })));
    result.checks.zoomTabStops += links.length;
    if (!links.length) fail(`zoomTabStops ${route}: no a.zoom`);
    links.forEach((link, index) => {
      if (link.tabindex !== '-1') fail(`zoomTabStops ${route}: a.zoom ${index + 1} has tabindex ${link.tabindex}, expected -1`);
      if (!link.caption) fail(`zoomTabStops ${route}: a.zoom ${index + 1} has no caption link`);
    });
  }

  // On desktops the caption link opens the same lightbox as the image link, in body screenshots and
  // template ones, and focus returns to the caption link on close.
  result.checks.captionLightbox = {};
  for (const [route, selector] of [['/coursework/csia-105/', '.evidence-figure figcaption a'], ['/', '.feature figcaption a']]) {
    await page.goto(BASE + route);
    const where = `captionLightbox ${route} @1440`;
    const link = page.locator(selector).first();
    if (await link.count() === 0) { fail(`${where}: no ${selector}`); continue; }
    const file = (await link.getAttribute('href')).split('/').pop();
    await link.click();
    await page.waitForTimeout(300);
    const opened = await page.evaluate(() => {
      const box = document.querySelector('dialog.lightbox[open]');
      const image = box && box.querySelector('img');
      return { url: location.pathname, open: Boolean(box), src: image ? image.src : null };
    });
    let focusOnLink = false;
    if (opened.open) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      focusOnLink = await page.evaluate((target) => document.activeElement === document.querySelector(target), selector);
    }
    result.checks.captionLightbox[route] = { ...opened, focusOnLink };
    if (!opened.open) fail(`${where}: clicking ${selector} opens no dialog.lightbox (now on ${opened.url})`);
    else {
      if (!opened.src || !opened.src.endsWith(file)) fail(`${where}: the dialog image is ${opened.src}, expected ${file}`);
      if (!focusOnLink) fail(`${where}: focus does not return to the caption link after Escape`);
    }
  }

  // Scroll fade-up targets end fully visible once they are in view.
  // Waits happen on the Node side: in-page timers can stall with JavaScript disabled.
  const revealOpacities = async (target) => {
    const values = [];
    const count = await target.evaluate(() => document.querySelectorAll('.reveal').length);
    for (let index = 0; index < count; index += 1) {
      await target.evaluate((i) => document.querySelectorAll('.reveal')[i].scrollIntoView({ block: 'center', behavior: 'instant' }), index);
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
  let noJsTables = 0;
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
    const plainRegions = await regionState(plain, false);
    result.checks.scrollRegions.noJs = (result.checks.scrollRegions.noJs || 0) + plainRegions.length;
    noJsTables += plainRegions.filter((region) => region.name.startsWith('table-scroll') && isRegion(region)).length;
    for (const region of plainRegions.filter((item) => !isRegion(item))) fail(`no-JS ${route}: ${region.name} lost its build-time role, tabindex or aria-label`);
  }
  if (!noJsTables) fail('no-JS: no .table-scroll keeps role="region", tabindex="0" and an aria-label');
  // Printing without JavaScript still prints the lab rows inside the closed modules. Chromium lays
  // out a hidden table when script measures it, so the module's own height beside its summary and
  // the table's visibility are what show whether the rows print.
  await plain.setViewportSize({ width: 1440, height: 900 });
  await plain.emulateMedia({ media: 'print' });
  await plain.goto(BASE + '/coursework/neti-109/');
  const printedLabs = await plain.evaluate(() => {
    const module = document.querySelector('details.lab-module');
    const table = module && module.querySelector('.lab-table table');
    if (!table) return null;
    return {
      table: Math.round(table.getBoundingClientRect().height),
      belowSummary: Math.round(module.getBoundingClientRect().height - module.querySelector('summary').getBoundingClientRect().height),
      visible: table.checkVisibility ? table.checkVisibility() : true,
    };
  });
  await plain.emulateMedia({ media: null });
  result.checks.noJsPrintLabs = printedLabs;
  if (!printedLabs) fail('no-JS print: no details.lab-module .lab-table table on /coursework/neti-109/');
  else {
    if (printedLabs.table <= 0) fail(`no-JS print: the first lab module's table is ${printedLabs.table}px tall`);
    if (printedLabs.belowSummary < printedLabs.table) fail(`no-JS print: the first lab module is ${printedLabs.belowSummary}px taller than its summary, so its ${printedLabs.table}px table does not print`);
    if (!printedLabs.visible) fail('no-JS print: the first lab module\'s table is hidden');
  }
  await noJs.close();

  // Phones: every route again in device-emulated contexts. The window resizes above ignore the
  // viewport meta, never fire touch and render at 1x; a phone profile does all three. Profiles copy
  // Playwright 1.59.1's `devices`: Android phones in Chromium. The first route's measurements are
  // recorded per profile; every route is checked against the profile.
  const PHONES = {
    chromium: {
      'Pixel 7': { viewport: { width: 412, height: 839 }, screen: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Mobile Safari/537.36' },
      'Galaxy S24': { viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Mobile Safari/537.36' },
      'Pixel 7 landscape': { viewport: { width: 863, height: 360 }, screen: { width: 915, height: 412 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Mobile Safari/537.36' },
    },
  };
  const engine = page.context().browser().browserType().name();
  if (!PHONES[engine]) {
    result.checks.mobileDevices = { engine, skipped: true };
    fail(`mobileDevices: no phone profiles for engine ${engine}`);
  } else {
    result.checks.mobileDevices = { engine, profiles: {} };
    for (const [name, profile] of Object.entries(PHONES[engine])) {
      const counts = { routes: 0, taps: 0, layoutWidth: null, dpr: null, scale: null, coarse: null, regions: {} };
      result.checks.mobileDevices.profiles[name] = counts;
      const ctx = await page.context().browser().newContext({ ...profile });
      try {
        const phone = await ctx.newPage();
        phone.on('pageerror', (error) => fail(`mobile ${name} ${phone.url()}: ${error.message}`));
        for (const route of routes) {
          const where = `mobile ${name} ${route}`;
          const response = await phone.goto(BASE + route);
          counts.routes += 1;
          if (route === MISSING) {
            if (response.status() !== 404) fail(`${where}: status ${response.status()}`);
            continue;
          }
          if (response.status() !== 200) fail(`${where}: status ${response.status()}`);
          const state = await settle(phone);
          if (state.overflow > 0) fail(`${where}: ${state.overflow}px horizontal overflow`);
          for (const src of state.broken) fail(`${where}: broken image ${src}`);
          for (const word of state.splitWords) fail(`${where}: table word split: ${word}`);
          const device = await phone.evaluate(() => ({
            layoutWidth: document.documentElement.clientWidth,
            dpr: window.devicePixelRatio,
            scale: window.visualViewport ? window.visualViewport.scale : 1,
            coarse: matchMedia('(pointer: coarse)').matches,
          }));
          if (counts.layoutWidth === null) Object.assign(counts, device);
          if (device.layoutWidth !== profile.viewport.width) fail(`${where}: layout viewport is ${device.layoutWidth}px, expected ${profile.viewport.width} (viewport meta not honoured)`);
          if (Math.abs(device.dpr - profile.deviceScaleFactor) > 0.01) fail(`${where}: devicePixelRatio ${device.dpr}, expected ${profile.deviceScaleFactor} (device emulation is off)`);
          if (device.scale !== 1) fail(`${where}: page starts zoomed to ${device.scale}`);
          const regions = await regionState(phone, true);
          addCounts(counts.regions, regionCounts(regions));
          for (const problem of regionProblems(regions)) fail(`${where}: ${problem}`);
        }

        // Taps go through the touchscreen, so a handler that ignores touch fails here. Playwright's
        // tap can return before the page handles it, so each check waits up to 2 s for the state it
        // expects; a tap that finds nothing to tap fails its check instead of the run.
        const tap = (selector) => phone.tap(selector, { timeout: 5000 }).catch(() => {});
        const until = (selector) => phone.waitForSelector(selector, { state: 'attached', timeout: 2000 }).catch(() => {});
        const menuState = () => phone.evaluate(() => {
          const toggle = document.querySelector('.menu-toggle');
          return {
            expanded: toggle && toggle.getAttribute('aria-expanded'),
            links: [...document.querySelectorAll('.main-nav a')].filter((link) => link.offsetParent !== null).length,
          };
        });
        await phone.goto(BASE + '/');
        await tap('.menu-toggle');
        await until('.menu-toggle[aria-expanded="true"]');
        const opened = await menuState();
        await tap('.menu-toggle');
        await until('.menu-toggle[aria-expanded="false"]');
        const closed = await menuState();
        counts.taps += 1;
        if (opened.expanded !== 'true' || opened.links !== 4) fail(`mobile ${name}: tapping the menu toggle does not open the menu`);
        if (closed.expanded !== 'false') fail(`mobile ${name}: a second tap leaves the menu open`);

        await phone.goto(BASE + '/coursework/neti-109/');
        await tap('main details.lab-module > summary >> nth=0');
        await until('main details.lab-module[open]');
        const lab = await phone.evaluate(() => {
          const first = document.querySelector('main details.lab-module');
          const table = first && first.querySelector('.lab-table');
          return { open: Boolean(first && first.open), sideways: table ? table.scrollWidth - table.clientWidth : null };
        });
        counts.taps += 1;
        if (!lab.open) fail(`mobile ${name} /coursework/neti-109/: the first lab module does not open on a tap`);
        if (lab.sideways === null) fail(`mobile ${name} /coursework/neti-109/: the first lab module has no .lab-table`);
        else if (lab.sideways > 0) fail(`mobile ${name} /coursework/neti-109/: the first lab module scrolls ${lab.sideways}px sideways`);

        // A landscape phone is wider than the lightbox's phone breakpoint, so its screenshot opens the dialog.
        if (profile.viewport.width > profile.viewport.height) counts.skipped = 'landscape';
        else {
          await phone.goto(BASE + '/');
          await tap('.feature a.zoom >> nth=0');
          // waitForURL also waits for the load state of the page it lands on.
          await phone.waitForURL(/\.webp$/, { timeout: 5000 }).catch(() => {});
          const url = phone.url();
          const dialog = url.endsWith('.webp') ? false : await phone.evaluate(() => Boolean(document.querySelector('dialog.lightbox[open]')));
          counts.taps += 1;
          if (dialog) fail(`mobile ${name}: tapping a screenshot opens the dialog instead of the image file`);
          if (!url.endsWith('.webp')) fail(`mobile ${name}: tapping a screenshot stays on ${url}, expected the .webp file`);
        }
      } finally {
        await ctx.close();
      }
    }
  }

  // Print: every Result and Role panel switches to white with dark text.
  await page.emulateMedia({ media: 'print' });
  result.print = { checked: 0 };
  for (const route of routes.filter((r) => r.startsWith('/technical-labs/') && r !== '/technical-labs/')) {
    await page.goto(BASE + route);
    const panels = await page.evaluate(() => [...document.querySelectorAll('.result, .role-panel')].map((panel) => {
      const style = getComputedStyle(panel);
      return { background: style.backgroundColor, color: style.color };
    }));
    result.print.checked += panels.length;
    for (const panel of panels) {
      if (panel.background !== 'rgb(255, 255, 255)' || panel.color !== 'rgb(0, 0, 0)') result.problems.push(`print ${route}: panel ${panel.background} / ${panel.color}`);
    }
  }
  if (result.print.checked < 14) fail(`print: only ${result.print.checked} summary panels checked`);
  await page.emulateMedia({ media: 'screen' });

  // Print: a class page prints every lab. Printing opens the folded lab modules, and afterwards
  // closes only the ones it opened, so a module the reader opened stays open.
  await page.goto(BASE + '/coursework/neti-109/');
  {
    const moduleState = () => page.evaluate(() => [...document.querySelectorAll('details.lab-module')].map((module) => module.open));
    const before = await moduleState();
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    const printing = await moduleState();
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    const after = await moduleState();
    await page.evaluate(() => { const first = document.querySelector('details.lab-module'); if (first) first.open = true; });
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    const kept = await moduleState();
    result.checks.printModules = { modules: before.length, before, printing, after, kept };
    if (!before.length) fail('printModules: no details.lab-module on /coursework/neti-109/');
    if (printing.some((open) => !open)) fail(`printModules: ${printing.filter((open) => !open).length} lab module(s) stay closed after beforeprint`);
    if (after.some((open) => open)) fail(`printModules: ${after.filter((open) => open).length} lab module(s) stay open after afterprint`);
    if (kept.length && (!kept[0] || kept.slice(1).some((open) => open))) fail(`printModules: after printing with the first module open, modules are ${kept.join(', ')}, expected only the first open`);
  }

  if (pageErrors.length) result.problems.push(...pageErrors);
  return result;
}
