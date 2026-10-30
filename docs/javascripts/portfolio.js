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

  // The contents list starts closed where it sits above the article instead of beside it, and
  // follows the layout when the window crosses that width, as when a tablet rotates.
  const contents = document.querySelector('details.contents');
  if (contents) {
    const stacked = window.matchMedia('(max-width: 1100px)');
    if (stacked.matches) contents.open = false;
    stacked.addEventListener('change', () => { contents.open = !stacked.matches; });
    contents.dataset.ready = 'true';
  }

  // Follow the reading position without moving focus or changing the URL.
  const sectionLinks = [...document.querySelectorAll('details.contents nav a')];
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

  // Screenshots open full size in a dialog on wide screens, from the image link or from the
  // caption's "Open full size" link. On phones the link opens the image file, so pinch zoom works;
  // a modified click still opens it in a new tab or window.
  const lightbox = document.querySelector('dialog.lightbox');
  if (lightbox && lightbox.showModal) {
    const wide = window.matchMedia('(min-width: 761px)');
    // The image joins the dialog on first use, so no page carries an image without a source.
    const image = document.createElement('img');
    let opener = null;
    // A caption link takes part only when it links its own figure's screenshot.
    const openers = [...document.querySelectorAll('a.zoom, figure figcaption a')]
      .filter((link) => link.matches('.zoom') || link.href === link.closest('figure').querySelector('img')?.src);
    for (const link of openers) {
      const shot = link.querySelector('img') || link.closest('figure').querySelector('img');
      link.addEventListener('click', (event) => {
        if (!wide.matches || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = link;
        // Drop the last screenshot first, so it never shows while the next one loads.
        image.removeAttribute('src');
        image.src = link.href;
        image.alt = shot?.alt || '';
        if (!image.isConnected) lightbox.append(image);
        lightbox.showModal();
      });
    }
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox || event.target.closest('.lightbox-close')) lightbox.close();
    });
    // Safari doesn't focus a link on click, so return focus here rather than rely on the browser.
    lightbox.addEventListener('close', () => opener?.focus());
  }

  // An image file can't take part in a page transition; skip it rather than leave Chromium to
  // report the skipped transition as an error on the image.
  window.addEventListener('pageswap', (event) => {
    const destination = event.activation?.entry?.url;
    if (!event.viewTransition || !destination || !/\.(?!html?$)\w+$/i.test(new URL(destination).pathname)) return;
    event.viewTransition.ready.catch(() => {});
    event.viewTransition.skipTransition();
  });

  // A table or screenshot wrapper is a named, focusable region only while it scrolls sideways, so
  // one that fits adds no tab stop or landmark. The markup carries the attributes, so without
  // JavaScript every wrapper stays reachable. Watching the content as well as the wrapper catches
  // a font loading or the text size changing, which can widen a table without resizing its wrapper.
  const scrollers = [...document.querySelectorAll('.table-scroll, .evidence-scroll')];
  if (scrollers.length && 'ResizeObserver' in window) {
    const built = new Map(scrollers.map((region) => [region,
      ['role', 'tabindex', 'aria-label'].map((name) => [name, region.getAttribute(name)]).filter(([, value]) => value !== null)]));
    const updateRegion = (region) => {
      const scrolls = region.scrollWidth > region.clientWidth;
      for (const [name, value] of built.get(region)) {
        if (scrolls) region.setAttribute(name, value);
        else region.removeAttribute(name);
      }
    };
    const regionObserver = new ResizeObserver((entries) => {
      for (const entry of entries) updateRegion(entry.target.closest('.table-scroll, .evidence-scroll'));
    });
    for (const region of scrollers) {
      updateRegion(region);
      regionObserver.observe(region);
      if (region.firstElementChild) regionObserver.observe(region.firstElementChild);
    }
  }

  // Print every lab: open the folded modules, then close only the ones printing opened.
  const labModules = [...document.querySelectorAll('details.lab-module')];
  if (labModules.length) {
    let openedForPrint = [];
    window.addEventListener('beforeprint', () => {
      for (const details of labModules) {
        if (details.open) continue;
        details.open = true;
        openedForPrint.push(details);
      }
    });
    window.addEventListener('afterprint', () => {
      for (const details of openedForPrint) details.open = false;
      openedForPrint = [];
    });
  }
});
