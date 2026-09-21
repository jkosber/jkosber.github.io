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
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobile.matches) {
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

  const contents = document.querySelector('.contents details');
  if (contents) {
    if (window.matchMedia('(max-width: 1200px)').matches) contents.open = false;
    contents.dataset.ready = 'true';
  }

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
    const headerEdge = header.getBoundingClientRect().bottom;
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

  // A visitor can explore the illustration without a timer or automatic cycling.
  const scene = document.querySelector('.hero-visual');
  if (scene) {
    const controls = scene.querySelector('.scene-controls');
    const choices = [...controls.querySelectorAll('[data-scene-select]')];
    const details = [...scene.querySelectorAll('.scene-detail')];
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const stage = scene.querySelector('.scene-stage');
    const art = scene.querySelector('.scene-art');
    let pointerFrame = 0;
    let pointerPosition = null;
    let traceAnimations = [];
    const resetDepth = () => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      pointerPosition = null;
      art.style.removeProperty('--scene-x');
      art.style.removeProperty('--scene-y');
    };
    const syncMotion = () => {
      resetDepth();
      traceAnimations.forEach((animation) => animation.cancel());
      traceAnimations = [];
    };
    // One frame per pointer update; nothing runs continuously or on touch screens.
    stage.addEventListener('pointermove', (event) => {
      if (!motion.matches || !finePointer.matches || event.pointerType === 'touch') return;
      pointerPosition = { x: event.clientX, y: event.clientY };
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const bounds = stage.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (pointerPosition.x - bounds.left) / bounds.width));
        const y = Math.max(0, Math.min(1, (pointerPosition.y - bounds.top) / bounds.height));
        art.style.setProperty('--scene-x', `${(0.5 - y) * 7}deg`);
        art.style.setProperty('--scene-y', `${(x - 0.5) * 10}deg`);
      });
    });
    stage.addEventListener('pointerleave', resetDepth);
    window.addEventListener('blur', resetDepth);
    motion.addEventListener('change', syncMotion);
    finePointer.addEventListener('change', syncMotion);
    choices.forEach((choice) => choice.addEventListener('click', () => {
      const selected = choice.dataset.sceneSelect;
      scene.dataset.scene = selected;
      choices.forEach((button) => button.setAttribute('aria-pressed', String(button === choice)));
      details.forEach((detail) => { detail.hidden = detail.id !== `scene-${selected}`; });
      traceAnimations.forEach((animation) => animation.cancel());
      traceAnimations = [];
      if (motion.matches) {
        const layer = scene.querySelector(`.scene-layer--${selected}`);
        traceAnimations = [...layer.querySelectorAll('.scene-trace')].map((trace, index) =>
          trace.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
            duration: 950, delay: index * 35, easing: 'ease-out', fill: 'backwards'
          })
        );
      }
    }));
    scene.querySelector('.scene-overview').hidden = true;
    controls.hidden = false;
  }

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
});
