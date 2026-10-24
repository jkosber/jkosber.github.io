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
  if (navTexts.join('|') !== 'Projects|Coursework|Experience|About') fail(`nav: expected Projects, Coursework, Experience, About, got ${navTexts.join(', ')}`);

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
  const expectedClasses = ['NETI 109', 'SVAD 111', 'CSIA 115', 'CSIA 210', 'CSIA 105', 'SDEV 120'];
  if (classes.map((row) => row.name.slice(0, 8)).join('|') !== expectedClasses.join('|')) fail(`courseworkIndex: rows ${classes.map((row) => row.name).join(', ')}`);
  const expectedDepth = { 'SVAD 111': ['AdventureWorks on AWS'], 'CSIA 115': ['CyberOps & traffic investigation', 'Snort and firewall lab'], 'CSIA 210': ['IPv6 packet investigations'] };
  for (const row of classes) {
    if (!row.href) { fail(`courseworkIndex: ${row.name} has no link`); continue; }
    const status = (await page.request.get(BASE + row.href)).status();
    if (status !== 200) fail(`courseworkIndex: ${row.href} returns ${status}`);
    const want = expectedDepth[row.name.slice(0, 8)];
    if (want && want.some((title) => !row.depth.includes(title))) fail(`courseworkIndex: ${row.name} in depth ${row.depth.join(', ')}`);
  }

  // Class pages: the same sections everywhere, a link to the course repo; case studies link back to their class.
  result.checks.classPages = 0;
  for (const row of classes.filter((item) => item.href)) {
    await page.goto(BASE + row.href);
    const shape = await page.evaluate(() => ({
      anchors: [...document.querySelectorAll('main h2[id]')].map((heading) => heading.id),
      repo: [...document.querySelectorAll('main a')].some((link) => /^https:\/\/github\.com\/jkosber\/[^/]+\/?$/.test(link.href)),
    }));
    result.checks.classPages += 1;
    for (const id of ['what-the-course-provided', 'labs', 'strongest-work', 'skills', 'limits', 'sources']) {
      if (!shape.anchors.includes(id)) fail(`classPages ${row.href}: missing #${id}`);
    }
    if (!shape.repo) fail(`classPages ${row.href}: no link to the course repository`);
  }
  for (const [study, classHref] of [['/technical-labs/aws-linux-infrastructure/', '/coursework/svad-111/'], ['/technical-labs/soc-threat-detection/', '/coursework/csia-115/'], ['/technical-labs/snort-firewall-lab/', '/coursework/csia-115/'], ['/technical-labs/ipv6-packet-investigations/', '/coursework/csia-210/']]) {
    await page.goto(BASE + study);
    const back = await page.evaluate((target) => [...document.querySelectorAll('.breadcrumbs a')].some((link) => new URL(link.href).pathname === target), classHref);
    if (!back) fail(`classPages ${study}: no breadcrumb link back to ${classHref}`);
  }

  // Case studies and class pages: a summary column beside the text on wide screens; on phones
  // the title, description, summary and closed contents come before the article.
  const summaryPages = {
    role: ['/technical-labs/proxmox-virtualization/', '/technical-labs/ssh-workbench/', '/technical-labs/job-scan-tailor/',
      '/technical-labs/aws-linux-infrastructure/', '/technical-labs/soc-threat-detection/', '/technical-labs/snort-firewall-lab/',
      '/technical-labs/ipv6-packet-investigations/'],
    term: ['/coursework/neti-109/', '/coursework/svad-111/', '/coursework/csia-115/', '/coursework/csia-210/', '/coursework/csia-105/', '/coursework/sdev-120/'],
  };
  result.checks.summaryColumn = 0;
  for (const [kind, list] of Object.entries(summaryPages)) {
    for (const route of list) {
      await page.setViewportSize({ width: 1440, height: 900 });
      if ((await page.goto(BASE + route)).status() !== 200) continue;
      const wide = await page.evaluate((needed) => {
        const spec = document.querySelector('aside.spec');
        const article = document.querySelector('main article');
        if (!spec || !article) return { missing: true };
        const labels = [...spec.querySelectorAll('dt')].map((term) => term.textContent.trim());
        return { left: spec.getBoundingClientRect().right <= article.getBoundingClientRect().left, sticky: getComputedStyle(spec).position === 'sticky', hasLabel: labels.includes(needed) };
      }, kind === 'role' ? 'My role' : 'Term');
      result.checks.summaryColumn += 1;
      if (wide.missing) { fail(`summaryColumn ${route}: no aside.spec beside the article`); continue; }
      if (!wide.left) fail(`summaryColumn ${route} @1440: the summary is not left of the article`);
      if (!wide.sticky) fail(`summaryColumn ${route} @1440: the summary is not sticky`);
      if (!wide.hasLabel) fail(`summaryColumn ${route}: the summary has no ${kind === 'role' ? 'My role' : 'Term'} row`);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(BASE + route);
      const narrow = await page.evaluate(() => {
        const items = ['.breadcrumbs', 'main h1', '.dek', 'aside.spec', 'details.toc', 'main article'].map((selector) => [selector, document.querySelector(selector)]);
        const missing = items.filter(([, element]) => !element).map(([selector]) => selector);
        const outOfOrder = items.filter(([, element]) => element).some(([, element], index, list) => index && (list[index - 1][1].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) === 0);
        const toc = document.querySelector('details.toc');
        return { missing, outOfOrder, tocOpen: toc ? toc.open : false };
      });
      if (narrow.missing.length) fail(`summaryColumn ${route} @390: missing ${narrow.missing.join(', ')}`);
      if (narrow.outOfOrder) fail(`summaryColumn ${route} @390: title, description, summary, contents and article are out of order`);
      if (narrow.tocOpen) fail(`summaryColumn ${route} @390: On this page starts open`);
    }
  }

  // Experience: both roles on one page, Ladd Dental in the gate 2 wording plus the master resume's
  // points (Oct 23), the Verizon contract ending October 2026, and the homepage linking each role
  // with its one-line summary.
  const LADD_BULLETS = [
    'Handled 20+ tickets a week: workstations, printers, peripherals, network problems and the clinical software, through Level RMM or onsite',
    'Wrote up each ticket in ClickUp: symptoms, what I tried, the fix and any follow-up',
    'Set up 30+ new workstations, from hardware setup, software installs and network configuration to domain join',
    "Retired 50+ workstations that couldn't run Windows 11, so every office stayed on a supported OS: wiped, degaussed or crushed the drives under HIPAA-aligned procedures and kept a chain-of-custody record",
    'Ran HDMI to 7 operatory rooms to replace VGA, building the keystone outlets myself',
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

  // Role illustrations load and are decorative.
  result.checks.roleArt = roles.filter((role) => role.image && role.image.loaded).length;
  for (const role of roles) {
    if (!role.image || !role.image.loaded) fail(`roleArt #${role.id}: image did not load`);
    else if (role.image.alt !== '') fail(`roleArt #${role.id}: alt is "${role.image.alt}", expected ""`);
  }

  await page.goto(BASE + '/');
  const homeRoles = await page.evaluate(() => [...document.querySelectorAll('.home-experience .experience-entry')].map((entry) => ({
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

  // Enlarged text: 200% at 390 px never widens the page, and words never break mid-word in the name,
  // the summary column, the Result panel, the coursework table or stacked tables (code excepted).
  await page.setViewportSize({ width: 390, height: 844 });
  result.checks.text200 = 0;
  for (const route of routes) {
    await page.goto(BASE + route);
    const state = await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%';
      await new Promise((done) => setTimeout(done, 150));
      const split = [];
      for (const block of document.querySelectorAll('.home-intro h1, aside.spec, .prose .result, .coursework-index, .table-scroll[data-columns="2"]')) {
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (node.parentElement.closest('code')) continue;
          // A line break after a hyphen is normal; a break inside a word part is the defect.
          for (const match of node.data.matchAll(/[^\s-]+/g)) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            if (new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size > 1) split.push(match[0]);
          }
        }
      }
      // Two-column tables stack instead of scrolling, and the hook marks them for that.
      const pairs = [...document.querySelectorAll('.table-scroll')].filter((region) => !region.querySelector('tr > :nth-child(3)'));
      const classTable = document.querySelector('.coursework-index .table-scroll');
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        classTableScroll: classTable ? classTable.scrollWidth - classTable.clientWidth : 0,
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
    if (state.classTableScroll > 0) fail(`text200 ${route}: the coursework table scrolls ${state.classTableScroll}px sideways`);
    if (state.split.length) fail(`text200 ${route}: words broken mid-word: ${[...new Set(state.split)].join(', ')}`);
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
    const panels = await page.evaluate(() => [...document.querySelectorAll('.spec, .result')].map((panel) => {
      const text = panel.querySelector('dd') || panel;
      return { background: getComputedStyle(panel).backgroundColor, color: getComputedStyle(text).color };
    }));
    result.print.checked += panels.length;
    for (const panel of panels) {
      if (panel.background !== 'rgb(255, 255, 255)' || panel.color !== 'rgb(0, 0, 0)') result.problems.push(`print ${route}: panel ${panel.background} / ${panel.color}`);
    }
  }
  if (result.print.checked < 14) fail(`print: only ${result.print.checked} summary panels checked`);
  await page.emulateMedia({ media: 'screen' });

  if (pageErrors.length) result.problems.push(...pageErrors);
  return result;
}
