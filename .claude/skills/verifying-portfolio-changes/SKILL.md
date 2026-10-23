---
name: verifying-portfolio-changes
description: Use when a change to the jnkos.com portfolio (pages, frontmatter, templates, CSS, JavaScript, hooks, images, dependencies) is about to be committed, pushed or published, or when asked whether the site is ready to show or deploy.
---

# Verifying portfolio changes

## Overview

A strict build proves links and anchors resolve. It does not prove a page renders, the menu opens, filter counts match, or a screenshot is free of private data. Run the checks that match the change, and report what passed with numbers and what you did not check.

## Always

| Check | Command | Pass |
|---|---|---|
| Hook tests | `python -m unittest discover -s tests` | `OK` |
| Strict build | `python -m mkdocs build --strict` (add `-d <temp folder>` when the check must not touch `site/`) | No `WARNING` or `ERROR` lines |
| Diff review | `git status --short` and `git diff` | Only intended files; no debug leftovers, no `.env`, nothing from the parent workspace |
| Private data | Grep `docs/` and `overrides/` for `artifact`, `192\.168\.\d+\.\d+`, `\b10\.\d+\.\d+\.\d+`, and for the private terms listed in the workspace `CLAUDE.md` (search without printing them) | No hits in visible copy. `192.0.2.x`, `example.com` and what the public JHomelab repo publishes (its host name, addresses ending in `.X`) are allowed |

## Rendered checks

1. Check port 8765 is free, then start the preview in the background: `python -m mkdocs serve --dev-addr 127.0.0.1:8765 --strict`.
2. Run `check-site.js` (next to this file) with the Playwright MCP tool `browser_run_code_unsafe`, passing its absolute path as `filename`. It reads the routes from `/sitemap.xml` and returns JSON covering:
   - every route plus a missing page at 320, 390, 768 and 1440 px: HTTP status, horizontal overflow, broken images, page errors, table words broken mid-word (outside code) and two-column tables that scroll sideways;
   - mobile menu open and Escape;
   - project filter counts against visible cards;
   - the three hero scene buttons;
   - every route with JavaScript disabled at 320 px;
   - print colors of every summary and evidence panel on the case studies.
3. `problems: []` is a pass. Treat anything else as a defect.
4. Look at the pages you changed. A file `docs/<path>.md` is served at `/<path>/`, and `index.md` at its folder. Take screenshots at 390 and 1440 px and read them: hierarchy, spacing, wrapping, image crops. Automated checks miss visual regressions.
5. New or changed images: open each one and confirm it shows no real host names, addresses, usernames or paths. The `width`/`height` attributes must match the intended display size.
6. Close the browser with `browser_close` and stop the preview server you started.

## Extra checks by change

| Changed | Also check |
|---|---|
| `portfolio.js` | `node --check docs/javascripts/portfolio.js`; reduced motion (`page.emulateMedia({ reducedMotion: 'reduce' })`) still lets the scene buttons work |
| CSS or templates | Enlarged text: at 390 px run `document.documentElement.style.fontSize = '200%'`, then check overflow on the homepage and a case study |
| Hooks or `requirements.txt` | Compare the list of files in `site/` before and after the change |
| Shared CSS or JS before publishing | The `?v=` value in `site/index.html` differs from `git show main:docs/stylesheets/portfolio.css \| sha256sum \| cut -c1-12` (same for the JS), so returning visitors get the new files |
| Performance or accessibility claims | `npx -y lighthouse@12 http://127.0.0.1:8765/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=<temp>/lh.json --quiet --chrome-flags="--headless=new"` (uses the installed Chrome); report scores as local lab results |

## Report

List each check with its result and evidence (counts, routes, widths). Then list what was not checked: physical devices, screen readers, Safari/WebKit, and live production after deploy. Never call the site ready without the rendered checks.
