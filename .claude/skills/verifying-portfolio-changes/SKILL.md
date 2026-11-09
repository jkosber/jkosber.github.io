---
name: verifying-portfolio-changes
description: Use when a change to the jnkos.com portfolio (pages, frontmatter, templates, CSS, JavaScript, hooks, images, dependencies) is about to be committed, pushed or published, or when asked whether the site is ready to show or deploy.
---

# Verifying portfolio changes

## Overview

A strict build proves links and anchors resolve. It does not prove a page renders, the menu opens, an old address still forwards, or a screenshot is free of private data. Run the checks that match the change, and report what passed with numbers and what you did not check.

## Always

| Check | Command | Pass |
|---|---|---|
| Hook tests | `.venv/bin/python -m unittest discover -s tests` | `OK` |
| Strict build | `.venv/bin/python -m mkdocs build --strict` (add `-d <temp folder>` when the check must not touch `site/`) | No `WARNING` or `ERROR` lines |
| Diff review | `git status --short` and `git diff` | Only intended files; no debug leftovers, no `.env`, nothing from the parent workspace |
| Private data | Grep `docs/`, `overrides/` and `.claude/` for `artifact`, `192\.168\.\d+\.\d+`, `\b10\.\d+\.\d+\.\d+`, `\b172\.(1[6-9]\|2\d\|3[01])\.\d+\.\d+`, `\bf[cd][0-9a-f]{2}:`, `Users[/\\]`, and for the private terms listed in the workspace `CLAUDE.md` (search without printing them) | No hits in visible copy or tracked files. `192.0.2.x`, `198.51.100.x`, `2001:db8::`, `example.com` and what the public JHomelab repo publishes (its host name, addresses ending in `.X`) are allowed |

## Rendered checks

1. Check port 8765 is free, then start the preview in the background: `.venv/bin/python -m mkdocs serve --dev-addr 127.0.0.1:8765 --strict`. The environment comes from the `CLAUDE.md` command table.
2. Run `check-site.js` (next to this file) with the Playwright MCP tool `browser_run_code_unsafe`, passing its absolute path as `filename`. It reads the routes from `/sitemap.xml` and returns JSON covering:
   - every route plus a missing page at 320, 390, 768 and 1440 px: HTTP status, horizontal overflow, broken images, page errors, table words broken mid-word (outside code) and two-column tables that scroll sideways;
   - header icons, main nav, footer links, and the mobile menu opening and closing on Escape;
   - the homepage, the Projects and Coursework indexes, the six class pages, the case-study page head, Experience, the role illustrations and About (including each Credly link answering);
   - `navCurrent`: the current nav item underlined in amber, also in forced colors where the browser can emulate them;
   - `firstShot`: the first feature screenshot starts within 740 px of the top at 1440x900 and wider;
   - `coveredButtons`: both feature "Read the case study" buttons are reachable and not covered by the overhanging screenshot;
   - `tileLift`: a hovered class tile moves up about 2 px;
   - `pageHead`: each case study and class page has breadcrumbs, title, description, strip and Result in order, the Role panel, and at 390 px a closed "On this page";
   - `classPages`: anchors, the course repository link, Strongest work before Labs, the lab module count, all modules closed at load, a plain first Strongest work panel, 36 labs on NETI 109, and stacked lab rows without sideways scroll at 390 px;
   - `labModuleAnchor`: a link to a module's id lands inside the viewport;
   - `evidenceFit`: no body screenshot hides part of itself behind a sideways scroll at 1440x900 or 1920x1080;
   - `railWidened`: "On this page" opens again as a rail after the window widens from 1024 to 1366 px;
   - `lightbox`: at 1440 px a screenshot opens a named dialog with the full image, Escape closes it and focus returns to the link; at 390 px the link opens the image file;
   - `zoomTabStops` and `captionLightbox`: image links stay out of the tab order, and at 1440 px a caption's "Open full size" link opens the same dialog, with focus returning to it;
   - `printModules`: `beforeprint` opens every lab module and `afterprint` restores the ones that were open;
   - `labelSpacing`: on every route, whitespace separates each Result label, panel title, strip and facts term and lab module heading from the text after it, and each facts detail from the text before it, so a screen reader never runs them together;
   - `scrollRegions`: on every route at each width, a table or screenshot wrapper that scrolls sideways is a named region with `tabindex="0"` and one that fits has no `role`, `tabindex` or `aria-label` (wrappers in closed modules aside); the same holds after the Proxmox page narrows from 1440 to 320 px and widens again, after its text doubles at 1440 px, on every route at 200% text at 390 px, and on NETI 109 with every module opened at 320 px and 200% text; a Proxmox region focused at 320 px keeps its tab stop and focus as the window widens to 1440 px, and drops the tab stop once focus leaves; without JavaScript every wrapper keeps its build-time attributes;
   - every old address in `REDIRECTS` landing on its new page and section;
   - `titleWrap`: every page title, the homepage name among them, keeps each word whole at 200% text at 320 and 390 px, and no description under a title is larger than the title;
   - `titleWrapDefaultText`: every page title keeps each word whole at 320 px at default text;
   - `headingWrap200` and `railAt200`: on every route at 390 and 320 px, headings, buttons and homepage panels keep words whole at 200% text, and at 1440 px the contents rail stays no wider than the body column;
   - `targetSizes`: on every route at 390 and 1440 px, the header name, the contents summary and every footer link measure at least 44 px each way;
   - `imageScale`: on every route at 1440 and 390 px, no figure or lead screenshot draws larger than its file, and no `width`/`height` attribute exceeds the file;
   - `scrollCues`: at 600, 640, 700 and 760 px on the Proxmox, Pushdo, About and NETI 109 pages, a table's "Scroll horizontally" hint and right-edge shade show only while it scrolls, and a table that fits shows neither;
   - `mobileDevices`: every route under phone profiles with touch, the device scale and the viewport meta honoured (Pixel 7, Galaxy S24 and Pixel 7 landscape in Chromium): status, overflow, images, page errors, split table words, scroll regions, the layout viewport equal to the device width and the device pixel ratio equal to the profile's; by tap, the menu opens and closes, the first NETI 109 lab module opens without a sideways scroll, and in portrait a homepage screenshot opens the image file;
   - motion limits, the type scale, 200% text at 390 px (overflow and words broken mid-word) and at 320 px (overflow), scroll fade-ups ending visible and the row hover lift;
   - every route with JavaScript disabled at 320 px, lab rows printing with JavaScript disabled (`noJsPrintLabs`), and print colors of the Role and Result panels.
3. `problems: []` is a pass. Treat anything else as a defect. `node .claude/skills/verifying-portfolio-changes/run-check.js chromium` runs the same checks outside the MCP and exits 1 when `problems` is not empty. `PLAYWRIGHT_MODULE` points at a Node Playwright install; `PLAYWRIGHT_CHROMIUM_PATH` names a Chromium executable to use instead of Playwright's download. Headless Chromium draws no scrollbar, so the Playwright MCP's headed run is the one that catches breaks that depend on scrollbar width. The phone profiles emulate devices; no physical phone is checked.
4. Look at the pages you changed. A file `docs/<path>.md` is served at `/<path>/`, and `index.md` at its folder. Take screenshots at 390 and 1440 px and read them: hierarchy, spacing, wrapping, image crops. Automated checks miss visual regressions.
5. New or changed images: open each one and confirm it shows no real host names, addresses, usernames or paths. The `width`/`height` attributes must match the intended display size.
6. Close the browser with `browser_close` and stop the preview server you started.

## Extra checks by change

| Changed | Also check |
|---|---|
| `portfolio.js` | `node --check docs/javascripts/portfolio.js`; with reduced motion (`page.emulateMedia({ reducedMotion: 'reduce' })`) the menu and the contents list still open and close |
| `run-check.js` | `node --test .claude/skills/verifying-portfolio-changes/run-check.test.js` passes |
| CSS or templates | Look at a case study and a class page at 390 px with `document.documentElement.style.fontSize = '200%'`; the checks cover overflow and split words, not how the page reads |
| Hooks or `requirements.txt` | Sync the venv (`uv pip sync --python .venv requirements.txt`), then compare the list of files in `site/` before and after the change |
| Moved or renamed pages | Add a redirect file (`docs/<old path>/index.html` with a meta refresh) and a `REDIRECTS` entry in `check-site.js`; keep renamed headings' anchors with `{#old-id}` |
| Tokens or raw colors | `tests/test_stylesheet.py` passes (listed tokens pinned, no raw hex outside `:root`, print and forced colors, `!important` only with an `anti-slop-allow:` reason) |
| Tool names in `built_with` or `tools` | `tests/test_tool_icons.py` passes; a name with no logo shows as text, which is fine |
| Shared CSS or JS before publishing | The `?v=` value in `site/index.html` differs from `git show main:docs/stylesheets/portfolio.css \| sha256sum \| cut -c1-12` (same for the JS), so returning visitors get the new files |
| Performance or accessibility claims | `npx -y lighthouse@12 http://127.0.0.1:8765/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=<temp>/lh.json --quiet --chrome-flags="--headless=new"` (uses the installed Chrome or Chromium; set `CHROME_PATH` when neither is on `PATH`); report scores as local lab results |

## Report

List each check with its result and evidence (counts, routes, widths). Then list what was not checked: physical devices, screen readers, Safari and WebKit, and live production after deploy. Never call the site ready without the rendered checks.
