/* Navigation and filtering enhance an otherwise complete, static site. */
// Run this small file in the head so enhanced layout is reserved before paint.
// If it cannot load, the ordinary navigation remains visible and usable.
document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#site-menu');
  const header = document.querySelector('.site-header');
  const mobile = window.matchMedia('(max-width: 960px)');

  // Keep anchor targets clear of a wrapped or enlarged sticky header.
  const updateHeaderOffset = () => {
    const height = getComputedStyle(header).position === 'sticky' ? header.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--header-height', `${height}px`);
  };

  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.hidden = mobile.matches && !open;
      // Focus can leave the menu before ResizeObserver reports its new height.
      updateHeaderOffset();
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
    // Listen on the document: Safari does not focus a button on click, so focus may not be in the header.
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobile.matches && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    header.addEventListener('focusout', (event) => {
      if (mobile.matches && event.relatedTarget && !header.contains(event.relatedTarget)) {
        setOpen(false);
      }
    });
    mobile.addEventListener('change', syncViewport);
    syncViewport();
    menu.dataset.ready = 'true';
  }

  if ('ResizeObserver' in window) new ResizeObserver(updateHeaderOffset).observe(header);
  window.addEventListener('resize', updateHeaderOffset);
  updateHeaderOffset();

  // Case studies and class pages use details.contents; the plain reading layout still nests its
  // details inside aside.contents.
  const contents = document.querySelector('details.contents, aside.contents details');
  if (contents) {
    // The contents list starts closed where it sits above the article instead of beside it.
    const stacked = contents.classList.contains('contents') ? '(max-width: 1100px)' : '(max-width: 1200px)';
    if (window.matchMedia(stacked).matches) contents.open = false;
    contents.dataset.ready = 'true';
  }

  // Follow the reading position without moving focus or changing the URL.
  const sectionLinks = [...document.querySelectorAll('details.contents nav a, aside.contents nav a')];
  const sections = sectionLinks.map((link) => ({
    link,
    heading: document.getElementById(decodeURIComponent(link.hash.slice(1)))
  })).filter(({ heading }) => heading);
  const backToTop = document.querySelector('.back-to-top');
  const footer = document.querySelector('.site-footer');
  let scrollQueued = false;
  let footerScrollAllowance = 0;
  const updateReadingPosition = () => {
    scrollQueued = false;
    if (backToTop) {
      const footerBefore = footer.getBoundingClientRect();
      const inFooter = footerBefore.top < window.innerHeight;
      backToTop.classList.toggle('back-to-top--in-footer', inFooter);
      backToTop.hidden = window.scrollY < 600 && document.activeElement !== backToTop;
      // Moving the control into flow can add a wrapped footer row during an anchor scroll.
      footerScrollAllowance = inFooter && !backToTop.hidden
        ? Math.max(footerScrollAllowance, footer.getBoundingClientRect().height - footerBefore.height)
        : 0;
    }
    const anchorInset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const headerEdge = header.getBoundingClientRect().bottom;
    const topEdge = Math.max(anchorInset, headerEdge) + 16;
    let current = null;
    for (const section of sections) {
      if (section.heading.getBoundingClientRect().top <= topEdge) current = section;
    }
    const lastSection = sections[sections.length - 1];
    const endTolerance = Math.ceil(footerScrollAllowance) + 2;
    if (lastSection && window.scrollY > 0 && lastSection.heading.getBoundingClientRect().top < window.innerHeight
        && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - endTolerance) {
      current = lastSection;
    }
    for (const section of sections) {
      if (section === current) section.link.setAttribute('aria-current', 'location');
      else section.link.removeAttribute('aria-current');
    }
  };
  const queueReadingUpdate = () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateReadingPosition);
    }
  };
  window.addEventListener('scroll', queueReadingUpdate, { passive: true });
  window.addEventListener('resize', () => {
    footerScrollAllowance = 0;
    queueReadingUpdate();
  });
  window.addEventListener('load', queueReadingUpdate);
  if (backToTop) {
    backToTop.addEventListener('blur', queueReadingUpdate);
    backToTop.addEventListener('click', () => document.querySelector('#main').focus({ preventScroll: true }));
  }
  updateReadingPosition();
});
