# jnkos.com portfolio

**Extends ~/.claude/CLAUDE.md**

Jadon Kosberg's public portfolio at [jnkos.com](https://jnkos.com/), written for recruiters and hiring managers: IT support experience, a Proxmox homelab, SSH Workbench and documented coursework. Static MkDocs site with a custom Material override layer, deployed to GitHub Pages; DNS in Cloudflare.

## Commands

| Task | Command |
|---|---|
| Install pinned dependencies | `python -m pip install -r requirements.txt` |
| Hook tests | `python -m unittest discover -s tests` |
| Strict build (links and anchors must resolve) | `python -m mkdocs build --strict` |
| Local preview | `python -m mkdocs serve --dev-addr 127.0.0.1:8765 --strict` |

Python 3.14. MkDocs 1.6.1 and Material 9.7.7 are pinned in `requirements.txt`; regenerate it with `uv pip compile requirements.in --python-version 3.14 --universal --no-header --no-annotate --output-file requirements.txt`. `site/` is generated and ignored.

## Where things live

| Path | Owns |
|---|---|
| `docs/**/*.md` | Page content. Frontmatter drives the summary column, class pages, experience roles and layouts |
| `docs/technical-labs/` | Personal projects and the four coursework case studies. Project order in the `mkdocs.yml` nav sets row order |
| `docs/coursework/` | Coursework index and one page per class |
| `docs/experience/index.md` | Both roles, in `roles` frontmatter; the homepage reads the same data |
| `docs/credentials/index.md` | About: background, certifications with Credly links, education, the skills table, recognition |
| `docs/<old path>/index.html` | Redirect files for retired addresses: a meta refresh to the new page and section |
| `overrides/main.html` | Shared shell: head metadata, JSON-LD, header, layouts (projects, coursework, experience, and the reading layout with the summary column), footer |
| `overrides/partials/components.html` | `icon`, `project_showcase`, `project_row` and `experience_entries` macros |
| `overrides/partials/home.html` | Homepage: intro and facts, projects with a `screenshot` as showcases and the rest as rows, the class list, experience |
| `docs/stylesheets/portfolio.css` | All styles: tokens, components, breakpoints, motion, reduced motion, print |
| `docs/javascripts/portfolio.js` | Mobile menu, the "On this page" contents and section tracking, back-to-top |
| `hooks/asset_versions.py` | Content-hash query strings on the CSS/JS URLs, so returning browsers never mix old CSS with new HTML |
| `hooks/reading_accessibility.py` | Wraps tables and code in named, keyboard-scrollable regions named from the preceding heading; gives two-column tables explicit table roles so they can stack on phones |
| `tests/` | Hook tests, and the copy voice test that caps report vocabulary per page |
| `.claude/skills/verifying-portfolio-changes/` | The verification skill, `check-site.js` (rendered checks) and `run-check.js` (runs them in Chromium or WebKit) |

## Frontmatter

| Field | Effect |
|---|---|
| `title`, `description` | Page title, meta description, the line under a case study's title, row text |
| `summary` | `role`, `built_with`, `result`, optional `source: {label, url}`. Renders the summary column and the Result panel |
| `screenshot` | `src`, `width`, `height`, `alt`, `caption` (with its date). The lead capture on a case study and its homepage showcase |
| `status`, `updated` | Status and Updated rows in the summary column; status also shows on project rows |
| `detail: true` | Coursework case study: listed under its class on the Coursework index, not on Projects |
| `class_page`, `class_name` | A case study's class, for the breadcrumb and the index |
| `code`, `course`, `term`, `items`, `repo` | Class pages: the Coursework index table and the summary column |
| `layout` | `home`, `projects`, `coursework`, `experience` or `wide`; omitted means the reading layout |
| `roles` | Experience: `id`, `title`, `organization`, `dates`, `image`, `icon`, `summary`, `intro`, `bullets` |
| `facts` | Homepage facts column: `label`, `text`, optional `href` |

`kind`, `tools` and `visual` remain on some pages, but no template reads them.

## Content rules

The site is public and recruiters read it. These hold for every edit:

- Every claim traces to a source: the project repositories, coursework submissions, Jadon's resume or his project notes. Never invent work, tests, outcomes or habits. Label coursework as coursework.
- First person, plain and specific. Lead with what was built and what happened; keep real limits in one short Limits section instead of hedging each sentence.
- Case studies and class pages keep their summary in frontmatter; the template renders the summary column and the Result panel. Don't repeat the summary in the body.
- A class page says what the course provided and what Jadon did, lists every lab with work of his in tables, then strongest work, skills, limits and sources linking files on `main`. Leave blank or empty files out and say so in Limits.
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
| Architecture flow | `<figure class="architecture">` with an `<ol class="architecture-flow">` | A simple left-to-right path. Use a table for branching topology |
| Evidence figure | `<figure class="evidence-figure">` with a focusable `.evidence-scroll` region (`role="region"`, `tabindex="0"`, `aria-label`), a dated caption and a full-size link | Screenshots |
| Narrative list | A definition list inside `<div class="narrative-list" markdown>`, each term with `: **Label.** ...` definitions; add `narrative-list--pairs` for one definition per term | Paragraph-length comparisons |
| Table | Plain Markdown after a descriptive heading; the hook names its scroll region from that heading. Two-column tables stack into label and value on phones | Inventories and numbers |
| Terminal run | A `text` code block with the prompt shortened to `$` | A run whose screenshot carries a username or host name |

## Adding a project

| Step | Detail |
|---|---|
| Sources | Read the project's repo (README, changelog, CI results) and Jadon's project note. For coursework, separate what Jadon did from what the course provided |
| Page | `docs/technical-labs/<slug>.md`, modeled on `ssh-workbench.md`: `summary` frontmatter, intro, sections, `## Limits`, `## Sources`, footer links. A coursework case study also sets `detail: true`, `class_page` and `class_name`, and its class page links to it |
| Nav | Personal projects go in the `mkdocs.yml` Projects list, in display order. A project with a `screenshot` becomes a homepage showcase; the rest are rows. Coursework case studies go under Coursework after the class pages |
| Screenshots | Real captures with fictional or cropped data, WebP, no metadata. Set `width`/`height` to the display size (half the pixels for a 2x capture), or it overflows the column on desktop |
| Links | The About skills table, related case-study footers, and the class page for coursework |
| Check | `verifying-portfolio-changes` skill, then a CHANGELOG entry |

## Design system

Dark navy, blue structure, amber emphasis; print styles switch to white. Tokens live in `:root` in `portfolio.css`.

| Token | Value | Use |
|---|---|---|
| `--background` | `#091827` | Page |
| `--surface` | `#142a40` | Panels, the Result panel, certification cards |
| `--accent` | `#80c5ff` | Links and technical structure |
| `--warm` | `#ffc36b` | Primary actions, dates, the Result label |
| `--heading` | `#f2f7ff` | Headings |
| `--muted` | `#afc2d8` | Secondary text |

- Sora for headings, Manrope for body text, both local WOFF2 subsets. No external fonts, scripts or runtime dependencies.
- Real captures lead: the homepage and case studies open on screenshots, not illustrations. The only illustrations are the two 240×160 isometric role SVGs in `docs/assets/roles/`, conceptual and never presented as evidence.
- Real screenshots go in `docs/assets/evidence/<project>/` with a date in the filename, sanitized, with descriptive alt text and a dated caption.
- Motion: a 0.4 s entrance on the homepage intro; a 12 px fade-up tied to scroll on screenshots and list rows (`.reveal`); a 2 px hover lift on whole-row links (`.lift`, using `translate` so the fade-up can't cancel it); 0.18 s menu and page transitions. Nothing over 0.5 s, nothing loops, and `prefers-reduced-motion` turns it all off. Every page works without JavaScript.
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
