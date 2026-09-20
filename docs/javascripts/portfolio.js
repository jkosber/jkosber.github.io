/* Navigation and filtering enhance an otherwise complete, static site. */
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#site-menu');
  const mobile = window.matchMedia('(max-width: 960px)');

  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.hidden = mobile.matches && !open;
    };
    const syncViewport = () => {
      if (mobile.matches && menu.contains(document.activeElement)) {
        toggle.hidden = false;
        toggle.focus();
      }
      if (!mobile.matches && document.activeElement === toggle) {
        document.querySelector('.brand').focus();
      }
      toggle.hidden = !mobile.matches;
      setOpen(false);
    };
    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.querySelector('.site-header').addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobile.matches) {
        setOpen(false);
        toggle.focus();
      }
    });
    mobile.addEventListener('change', syncViewport);
    syncViewport();
  }

  const contents = document.querySelector('.contents details');
  if (contents && mobile.matches) contents.open = false;

  // Follow the reading position without moving focus or changing the URL.
  const sectionLinks = [...document.querySelectorAll('.contents nav a')];
  const sections = sectionLinks.map((link) => ({
    link,
    heading: document.getElementById(decodeURIComponent(link.hash.slice(1)))
  })).filter(({ heading }) => heading);
  const backToTop = document.querySelector('.back-to-top');
  let scrollQueued = false;
  const updateReadingPosition = () => {
    scrollQueued = false;
    const anchorInset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const headerEdge = mobile.matches ? document.querySelector('.site-header').getBoundingClientRect().bottom : 0;
    const topEdge = Math.max(anchorInset, headerEdge) + 16;
    let current = null;
    for (const section of sections) {
      if (section.heading.getBoundingClientRect().top <= topEdge) current = section;
    }
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }
    for (const section of sections) {
      if (section === current) section.link.setAttribute('aria-current', 'location');
      else section.link.removeAttribute('aria-current');
    }
    if (backToTop) {
      backToTop.hidden = window.scrollY < 600 && document.activeElement !== backToTop;
    }
  };
  const queueReadingUpdate = () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateReadingPosition);
    }
  };
  window.addEventListener('scroll', queueReadingUpdate, { passive: true });
  window.addEventListener('resize', queueReadingUpdate);
  window.addEventListener('load', queueReadingUpdate);
  if (backToTop) {
    backToTop.addEventListener('blur', queueReadingUpdate);
    backToTop.addEventListener('click', () => document.querySelector('#main').focus({ preventScroll: true }));
  }
  updateReadingPosition();

  const browser = document.querySelector('.project-browser');
  if (browser) {
    const toolbar = browser.querySelector('.project-toolbar');
    const buttons = [...browser.querySelectorAll('[data-filter]')];
    const projects = [...browser.querySelectorAll('[data-category]')];
    const count = browser.querySelector('.project-count');
    const filterProjects = (filter) => {
      let visible = 0;
      for (const project of projects) {
        project.hidden = filter !== 'all' && project.dataset.category !== filter;
        if (!project.hidden) visible += 1;
      }
      for (const button of buttons) {
        button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
      }
      count.textContent = `${visible} ${visible === 1 ? 'project' : 'projects'}`;
    };
    buttons.forEach((button) => button.addEventListener('click', () => filterProjects(button.dataset.filter)));
    toolbar.hidden = false;
    filterProjects('all');
  }
})();
