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
| `docs/**/*.md` | Page content. Frontmatter drives cards, experience entries and layouts |
| `docs/technical-labs/` | Project case studies. Their order in the `mkdocs.yml` nav sets card order |
| `overrides/main.html` | Shared shell: head metadata, homepage JSON-LD, header, page layouts, footer |
| `overrides/partials/components.html` | `icon`, `project_card` and `experience_entries` macros; the URL-to-symbol chain and symbol-to-thumbnail map |
| `overrides/partials/home.html` | Homepage. Features the Projects nav children `[1:4]`; the first keeps its artwork |
| `overrides/partials/system-scene.html` | Decorative hero SVG driven by the three scene buttons |
| `docs/stylesheets/portfolio.css` | All styles: tokens, components, breakpoints, reduced motion, print |
| `docs/javascripts/portfolio.js` | Mobile menu, project filters, hero scene, section tracking, back-to-top |
| `hooks/asset_versions.py` | Content-hash query strings on the CSS/JS URLs, so returning browsers never mix old CSS with new HTML |
| `hooks/reading_accessibility.py` | Wraps tables and code in named, keyboard-scrollable regions, named from the preceding heading |
| `tests/` | Unit tests for the reading-accessibility hook |

## Frontmatter

| Field | Effect |
|---|---|
| `title`, `description` | Page title, meta description, card text |
| `kind` | Card label. `Completed coursework` puts a project under the Coursework filter; any other value is Personal |
| `status` | Card footer and the chip above a case study's title |
| `visual` | 600×340 SVG for card art; also selects the card tint via `data-visual` |
| `tools` | Card tags; the first four show |
| `detail: true` | Supporting lab: stays in the nav, excluded from cards and counts, linked from its parent page |
| `layout` | `home`, `projects`, `experience` or `wide`; omitted means the reading layout with "On this page" |
| `role`, `organization`, `dates` | Experience entries |

## Content rules

The site is public and recruiters read it. These hold for every edit:

- Every claim traces to a source: the project repositories, coursework submissions, Jadon's resume or his project notes. Never invent work, tests, outcomes or habits. Label coursework as coursework.
- First person, plain and specific. Lead with what was built and what happened; keep real limits in one short Limits section instead of hedging each sentence.
- A primary case study opens with its intro, a `.glance` block (My role / Built with / Result) and a one-line `.evidence-note` with the date and source. Supporting labs (`detail: true`) skip the glance and `tools`.
- Dates are local time, not UTC, in copy, filenames and the changelog.
- Describe Jadon's role with verbs that are true for the work: defined, planned, configured, tested, shipped.
- Never publish personal location, phone numbers, private host names, IP addresses, paths, credentials or resumes. Use documentation ranges (`192.0.2.0/24`) and `example.com` in examples. `mkdocs.yml` excludes five raw assets as a guard; keep them out.
- Don't use the word "artifacts" in visible copy.
- Renaming a heading keeps its anchor: `## New heading {#old-id}`.

## Page components

| Component | Markup | Use for |
|---|---|---|
| Glance | `<div class="glance" markdown>` around a definition list: My role, Built with, Result | Summary under a case study's intro |
| Evidence note | `<div class="evidence-note" markdown>` | One line with the date and source |
| Architecture flow | `<figure class="architecture">` with an `<ol class="architecture-flow">` | A simple left-to-right path. Use a table for branching topology |
| Evidence figure | `<figure class="evidence-figure">` with a focusable `.evidence-scroll` region (`role="region"`, `tabindex="0"`, `aria-label`), a dated caption and a full-size link | Screenshots |
| Narrative list | A definition list inside `<div class="narrative-list" markdown>`, each term with `: **Label.** ...` definitions; add `narrative-list--pairs` for one definition per term | Paragraph-length comparisons |
| Table | Plain Markdown after a descriptive heading; the hook names its scroll region from that heading | Inventories and numbers |

## Adding a project

| Step | Detail |
|---|---|
| Sources | Read the project's repo (README, changelog, CI results) and Jadon's project note. For coursework, separate what Jadon did from what the course supplied |
| Page | `docs/technical-labs/<slug>.md`, modeled on `ssh-workbench.md`: intro, glance, evidence note, sections, `## Limits`, `## Sources`, footer links |
| Nav | Add to the `mkdocs.yml` Projects list before the supporting labs. Position decides the homepage features (children `[1:4]`) |
| Artwork | New subject: `docs/assets/project-<name>.svg` (600×340) and `docs/assets/thumbnails/<name>.svg` (240×160) in the existing isometric style; extend the symbol chain and thumbnail map in `components.html`, add an `icon()` case and a `[data-visual$='project-<name>.svg']` tint in `portfolio.css`. Otherwise the card falls back to the security icon |
| Screenshots | Real captures with fictional or cropped data, WebP, no metadata. Set `width`/`height` to the display size (half the pixels for a 2x capture), or it overflows the column on desktop |
| Links | Projects index intro, Skills & focus, related case-study footers; the hero's scene links if relevant |
| Check | `verifying-portfolio-changes` skill, then a CHANGELOG entry |

## Design system

Dark navy, blue structure, amber emphasis; print styles switch to white. Tokens live in `:root` in `portfolio.css`.

| Token | Value | Use |
|---|---|---|
| `--background` | `#091827` | Page |
| `--surface` | `#142a40` | Panels, glance blocks |
| `--accent` | `#80c5ff` | Links and technical structure |
| `--warm` | `#ffc36b` | Primary actions, dates, glance labels |
| `--heading` | `#f2f7ff` | Headings |
| `--muted` | `#afc2d8` | Secondary text |

- Sora for headings, Manrope for body text, both local WOFF2 subsets. No external fonts, scripts or runtime dependencies.
- Illustrations are local isometric SVGs in the palette: 600×340 card art and 240×160 thumbnails. They are conceptual and never presented as evidence.
- Real screenshots go in `docs/assets/evidence/<project>/` with a date in the filename, sanitized, with descriptive alt text and a dated caption.
- Motion: one finite hero entrance plus interaction-driven changes; `prefers-reduced-motion` turns it off. Every page works without JavaScript.
- `!important` appears only where marked `anti-slop-allow` with its reason.

## Verification and publishing

- Before any commit that changes the site: hook tests and a strict build. Before asking to publish: the `verifying-portfolio-changes` skill.
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
| Rendered checks | Playwright MCP; close the browser when done |
| MkDocs or Material documentation | context7 |

## Private context

Owner preferences, private paths and planning notes live in a `CLAUDE.md` in the private folder that contains this checkout. Claude Code loads it automatically; it is never committed here.
