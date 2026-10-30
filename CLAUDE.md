# jnkos.com portfolio

**Extends ~/.claude/CLAUDE.md**

Jadon Kosberg's public portfolio at [jnkos.com](https://jnkos.com/), written for recruiters and hiring managers: IT support experience, a Proxmox homelab, SSH Workbench and documented coursework. Static MkDocs site with a custom Material override layer, deployed to GitHub Pages; DNS in Cloudflare.

## Commands

| Task | Command |
|---|---|
| Create the environment | `uv venv --python 3.14` (once), then `uv pip sync --python .venv requirements.txt` (after cloning, and again whenever `requirements.txt` changes) |
| Hook tests | `.venv/bin/python -m unittest discover -s tests` |
| Strict build (links and anchors must resolve) | `.venv/bin/python -m mkdocs build --strict` |
| Local preview | `.venv/bin/python -m mkdocs serve --dev-addr 127.0.0.1:8765 --strict` |

Python 3.14 in a uv-made `.venv` (on Windows the interpreter is `.venv\Scripts\python`); the system interpreter has no `pip` on some distributions, so every command runs the venv's interpreter. MkDocs 1.6.1 and Material 9.7.7 are pinned in `requirements.txt`; regenerate it with `uv pip compile requirements.in --python-version 3.14 --universal --no-header --no-annotate --output-file requirements.txt`. CI installs the same pins with pip. `site/` and `.venv/` are generated and ignored.

## Where things live

| Path | Owns |
|---|---|
| `docs/**/*.md` | Page content. Frontmatter drives the page head, class pages, experience roles and layouts |
| `docs/technical-labs/` | Personal projects and the four coursework case studies. Project order in the `mkdocs.yml` nav sets row order |
| `docs/coursework/` | Coursework index and one page per class |
| `docs/experience/index.md` | Both roles, in `roles` frontmatter; the homepage reads the same data |
| `docs/credentials/index.md` | About: background, certifications with Credly links, education, the skills table, recognition |
| `docs/<old path>/index.html` | Redirect files for retired addresses: a meta refresh to the new page and section |
| `overrides/main.html` | Shared shell: head metadata, JSON-LD, header, the lightbox dialog, layouts (projects, coursework, experience, and the reading layout with the page head and contents rail), footer |
| `overrides/partials/components.html` | `icon`, `feature`, `minor_row`, `class_tile`, `role_card`, `role_panel`, `project_row` and `experience_entries` macros |
| `overrides/partials/home.html` | Homepage: hero band with the facts panel, projects (feature panels for those with a `screenshot`, a minor row for the rest), the coursework band of class tiles, role cards |
| `docs/stylesheets/portfolio.css` | All styles: tokens, components, breakpoints, motion, reduced motion, print. `tests/test_stylesheet.py` pins the tokens and forbids raw hex outside `:root`, print and forced colors |
| `docs/javascripts/portfolio.js` | Mobile menu, the "On this page" contents and section tracking, back-to-top, the screenshot lightbox, opening lab modules before printing, keeping table and screenshot wrappers focusable regions only while they scroll (a `ResizeObserver` restores `role`, `tabindex` and `aria-label`) |
| `hooks/asset_versions.py` | Content-hash query strings on the CSS/JS URLs, so returning browsers never mix old CSS with new HTML |
| `hooks/tool_icons.py`, `hooks/tool_icons.json` | `tool_icon(name)` Jinja global: matches a tool name to a Simple Icons logo (16.35.0, CC0) and inlines it as an 18 px SVG, or nothing when no logo matches |
| `hooks/class_sections.py` | Class pages: wraps each Strongest work item in a panel (two adjacent one- or two-paragraph items sit side by side; the first is never brief) and folds each lab module under Labs into a closed `details.lab-module` |
| `hooks/reading_accessibility.py` | Wraps tables and code in named, keyboard-scrollable regions named from the preceding heading (`portfolio.js` keeps a table's region only while it scrolls); gives two-column tables explicit table roles so they can stack on phones |
| `tests/` | Hook tests, and the copy voice test that caps report vocabulary per page |
| `.claude/skills/verifying-portfolio-changes/` | The verification skill, `check-site.js` (rendered checks) and `run-check.js` (runs them in Chromium or WebKit) |

## Frontmatter

| Field | Effect |
|---|---|
| `title`, `description` | Page title, meta description, the line under a case study's title, row text |
| `summary` | `role`, `built_with`, `result`, optional `source: {label, url}`. `result` shows in the page head; `role` and `built_with` in the My role panel; `source` in the strip |
| `screenshot` | `src`, `width`, `height`, `alt`, `caption` (with its date). The lead capture on a case study and beside the project on the homepage |
| `tools` | Up to four short names for the homepage feature panel's tool list; without it the first four `built_with` entries show |
| `art` | `src`, `width`, `height`: an isometric illustration. Class pages (header art and tile) and the job-scan project (minor row) |
| `status`, `updated` | Status and Updated items in the page head strip; status also shows on project rows |
| `detail: true` | Coursework case study: listed under its class on the Coursework index, not on Projects |
| `class_page`, `class_name` | A case study's class, for the breadcrumb and the index |
| `code`, `course`, `term`, `items`, `repo` | Class pages: the Coursework index table and the page head strip |
| `layout` | `home`, `projects`, `coursework`, `experience` or `wide`; omitted means the reading layout |
| `roles` | Experience: `id`, `title`, `organization`, `dates`, `image`, `icon`, `summary`, `intro`, `bullets` |
| `facts` | Homepage facts panel: `label`, `text` (the linked title), `detail` (the muted line beneath), optional `href` |

`kind` and `visual` remain on some pages, but no template reads them.

## Content rules

The site is public and recruiters read it. These hold for every edit:

- Every claim traces to a source: the project repositories, coursework submissions, Jadon's resume or his project notes. Never invent work, tests, outcomes or habits. Label coursework as coursework.
- First person, plain and specific. Lead with what was built and what happened; keep real limits in one short Limits section instead of hedging each sentence.
- Case studies and class pages keep their summary in frontmatter; the template renders it in the page head and the My role panel. Don't repeat the summary in the body.
- A class page says what the course provided and what Jadon did, puts strongest work first, then lists every lab with work of his in tables (one closed module per `###` heading), then skills, limits and sources linking files on `main`. Leave blank or empty files out and say so in Limits.
- Report vocabulary (evidence, recorded, supplied, historical, established) stays at three or fewer per page; `tests/test_copy_voice.py` enforces it.
- AI coding agents are credited only in SSH Workbench's "How I worked"; a product that runs an agent, like the job-scan tool, can say so.
- Dates are local time, not UTC, in copy, filenames and the changelog.
- Describe Jadon's role with verbs that are true for the work: defined, planned, configured, tested, shipped.
- Never publish personal location, phone numbers, private host names, IP addresses, paths, credentials or resumes. Use documentation ranges (`192.0.2.0/24`) and `example.com` in examples. `mkdocs.yml` excludes five raw assets as a guard; keep them out.
- Exception: anything the public [JHomelab](https://github.com/jkosber/JHomelab) repository publishes may appear as it appears there, including its host name, local addresses with the last octet shown as `X` and its screenshots. Full addresses stay out.
- Don't use the word "artifacts" in visible copy.
- Renaming a heading keeps its anchor: `## New heading {#old-id}`.

## Page components

| Component | Markup | Use for |
|---|---|---|
| Feature panel | `feature` macro: `article.feature` (`--flip` alternates sides) with a `figure.shot` and `.feature-copy` (h3, description, `.result`, `ul.tools`, `.button`) | Homepage projects with a `screenshot`. The screenshot rises `--overhang` above the panel. No hover lift |
| Minor row | `minor_row` macro: `article.minor` with title, description, `art` and Result | A homepage project with no screenshot |
| Class tiles | `class_tile` macro: `li > a.tile.lift` with art, code, name and term | Homepage coursework band. Compact rows under 760 px |
| Role cards | `role_card` macro: `article.role-card` with art, h3, organization, dates, summary | Homepage experience |
| Page head | `.page-head` band in `main.html`: `nav.crumbs`, h1, `.dek`, `dl.strip` (Status, Updated, Source or Class), `.head-result`; `.page-head--shot` overlaps the lead screenshot, `.head-art` holds a class illustration | Case studies and class pages. Needs `summary` |
| Summary pair | `.summary-pair` with the My role `role_panel` beside a `.panel--result` | Class pages, under the page head |
| Contents | `details.contents`: a sticky right rail at 1100 px and up, an inline closed "On this page" below; it opens or closes when the window crosses 1100 px | Pages with h2 sections |
| Strongest work panels | `section.work` per h3 item, `.work-pair` for two adjacent brief items; made by `hooks/class_sections.py`, so authors write plain Markdown | Class pages |
| Lab modules | `details.lab-module` with `.lab-count` (left out when a module has no lab rows; a space in the summary keeps it a separate word for screen readers) and `.lab-table`; closed by default, printed open with or without JavaScript; stacks with a visible `.did-label` on phones | Class pages' Labs section |
| Lightbox | `a.zoom` (`tabindex="-1"`) around a template screenshot and the "Open full size" caption link of any figure, which is the screenshot's one keyboard stop; one `dialog.lightbox` in `main.html` | Enlarging a screenshot above 760 px; focus returns to the link that opened it. Below that, and without JavaScript, the link opens the image file |
| Tool list | `ul.tools` (`role="list"`, `aria-label="Built with"`), each `li` a `tool_icon(name)` plus the visible name | Feature panels and My role panels |
| Result | `.result` well with a 3 px amber bar; `.panel--result` on class pages | Every Result, styled the same |
| Architecture flow | `<figure class="architecture">` with an `<ol class="architecture-flow">` | A simple left-to-right path. Use a table for branching topology |
| Evidence figure | `<figure class="evidence-figure">` with a `.evidence-scroll` region (`role="region"`, `tabindex="0"`, `aria-label`, focusable only while it scrolls), a dated caption and a full-size link. The screenshot fits its column at every width | Screenshots |
| Narrative list | A definition list inside `<div class="narrative-list" markdown>`, each term with `: **Label.** ...` definitions; add `narrative-list--pairs` for one definition per term | Paragraph-length comparisons |
| Table | Plain Markdown after a descriptive heading; the hook names its scroll region from that heading, a focusable region only while it scrolls. Two-column tables stack into label and value on phones | Inventories and numbers |
| Terminal run | A `text` code block with the prompt shortened to `$` | A run whose screenshot carries a username or host name |

## Adding a project

| Step | Detail |
|---|---|
| Sources | Read the project's repo (README, changelog, CI results) and Jadon's project note. For coursework, separate what Jadon did from what the course provided |
| Page | `docs/technical-labs/<slug>.md`, modeled on `ssh-workbench.md`: `summary` frontmatter, intro, sections, `## Limits`, `## Sources`, footer links. A coursework case study also sets `detail: true`, `class_page` and `class_name`, and its class page links to it |
| Nav | Personal projects go in the `mkdocs.yml` Projects list, in display order. A project with a `screenshot` becomes a homepage feature panel (add `tools`); one without becomes the minor row (add `art`). Coursework case studies go under Coursework after the class pages |
| Screenshots | Real captures with fictional or cropped data, WebP, no metadata. Set `width`/`height` to the display size (half the pixels for a 2x capture), or it overflows the column on desktop |
| Links | The About skills table, related case-study footers, and the class page for coursework |
| Check | `verifying-portfolio-changes` skill, then a CHANGELOG entry |

## Design system

Dark navy in four layers, blue structure, amber emphasis; flat fills, no gradients. Print styles switch to white. Tokens live in `:root` in `portfolio.css`.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#091827` | Page |
| `--band` | `#0f2b48` | Header, footer, hero, page head, coursework band |
| `--surface` | `#15365a` | Panels, tiles, role cards, tables, lab groups |
| `--raised` | `#1d4570` | Tile hover, table header row |
| `--inset` | `#0b2238` | Result wells, the job-scan row, code chips, art wells |
| `--line`, `--line-strong` | `#2c5379`, `#4a7aa6` | Dividers, control borders |
| `--text`, `--heading`, `--muted` | `#d1deed`, `#f2f7ff`, `#afc2d8` | Body, headings, secondary text |
| `--accent` | `#80c5ff` | Links, tool logos, focus ring |
| `--warm`, `--on-warm` | `#ffc36b`, `#10233a` | Amber and the text on it |

- Spacing `--s1` to `--s7` (.5, 1, 1.5, 2.5, 4, 6, 9 rem): 1 to 3 inside a group, 4 to 7 between groups and sections. Type `--t-small` to `--t-name` (.875 to 4.5 rem); page titles and the homepage name also take a `cqi` cap that binds only with enlarged text, so no title word splits at 200%. Radii `--r-s`, `--r-m`, `--r-l` (6, 12, 20 px), `--overhang` 3.5 rem (2.5 rem at 760 px and below). Named derived tokens (`--warm-hover`, `--shadow-lift`, `--backdrop` and others) cover shadows and hover tints.
- Amber appears only on amber buttons, Result labels and bars, the footer email, the current nav item's underline and the contents rail's current-item bar.
- Breakpoints: 1100 px (feature panels and the page head go to one column; the contents rail becomes a disclosure), 960 px (hero, facts, role/result pair and role cards stack; tiles go to two columns), 760 px (compact tiles, phone spacing; the phone menu switches at 960 px in `portfolio.js`).
- Sora for headings, Manrope for body text, both local WOFF2 subsets. No external fonts, scripts or runtime dependencies. Tool logos are Simple Icons (16.35.0, CC0) stored locally as single-color SVG, each beside its visible tool name.
- Real captures lead: the homepage and case studies open on screenshots. Isometric illustrations (`docs/assets/roles/`, `docs/assets/thumbnails/`, and `docs/assets/project-terminal.svg` and `project-resume.svg` for CSIA 105 and the job-scan row) may appear on class tiles, the job-scan row, class page headers and the homepage role cards. They stay conceptual, use `alt=""`, and never replace a real capture on a project or case study.
- Real screenshots go in `docs/assets/evidence/<project>/` with a date in the filename, sanitized, with descriptive alt text and a dated caption.
- Motion: a 0.4 s rise of 10 px on the homepage intro (delays 0, 0.04 s, 0.08 s); a 12 px fade-up tied to scroll on screenshots and list rows (`.reveal`); a 2 px hover lift on whole-row and whole-card links (`.lift`, using `translate`), never on containers that aren't links; a 0.2 s fade and scale on the lightbox; 0.18 s menu and page transitions. Nothing over 0.5 s, nothing loops, only `transform`, `translate`, `opacity` and color animate, and `prefers-reduced-motion` turns it all off. Hidden starting states sit inside `@supports (animation-timeline: view())` or `@starting-style`, and print shows every element. Every page works without JavaScript.
- `!important` appears only where marked `anti-slop-allow` with its reason.

## Verification and publishing

- Before any commit that changes the site: the tests and a strict build. Before asking to publish: the `verifying-portfolio-changes` skill, in Chromium and in WebKit (`run-check.js` with `PLAYWRIGHT_MODULE` set).
- Retiring or renaming a page: add a redirect file and a `REDIRECTS` entry in `check-site.js`.
- Work on a branch. A push to `main` deploys through `.github/workflows/deploy.yml` (`mkdocs gh-deploy` to `gh-pages`), so push, merge or deploy only with Jadon's approval of that specific change.
- Record meaningful changes in `CHANGELOG.md` with what was checked.

## Skills and tools

| Need | Use |
|---|---|
| Plan a feature or redesign | `superpowers:brainstorming`, then `superpowers:writing-plans` |
| Check a change before committing or publishing | `verifying-portfolio-changes` skill |
| Layout and visual design | `frontend-design` plugin, enabled for this project in `.claude/settings.json` |
| Keep this file current | `claude-md-management` plugin: its improver skill audits CLAUDE.md; `/revise-claude-md` captures session learnings |
| Review copy for filler and cliches | `anti-slop:slop-check` |
| Rendered checks | `check-site.js` through the Playwright MCP or `run-check.js`; close the browser when done |
| MkDocs or Material documentation | context7 |

## Private context

Owner preferences, private paths and planning notes live in a `CLAUDE.md` in the private folder that contains this checkout. Claude Code loads it automatically; it is never committed here.
