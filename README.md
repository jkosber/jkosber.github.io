# Jadon Kosberg's portfolio

Source for [jnkos.com](https://jnkos.com/): professional IT experience, personal projects and completed coursework. Built with MkDocs and a custom layout over the Material theme, hosted on GitHub Pages with DNS in Cloudflare.

## Local development

Python 3.14, with build dependencies pinned in `requirements.txt` (MkDocs 1.6.1, Material 9.7.7).

```bash
uv venv --python 3.14   # once
uv pip sync --python .venv requirements.txt   # after cloning and whenever requirements.txt changes
.venv/bin/python -m unittest discover -s tests
.venv/bin/python -m mkdocs build --strict
.venv/bin/python -m mkdocs serve --dev-addr 127.0.0.1:8765 --strict
```

On Windows the interpreter is `.venv\Scripts\python`.

`site/` is generated and ignored. `requirements.in` lists the direct dependencies; regenerate the pins with `uv pip compile requirements.in --python-version 3.14 --universal --no-header --no-annotate --output-file requirements.txt`, then sync the venv and rerun the checks.

## Structure

| Path | Contents |
|---|---|
| `docs/` | Markdown pages, assets, `portfolio.css` and `portfolio.js` |
| `docs/technical-labs/` | Personal projects and the four coursework case studies |
| `docs/coursework/` | Coursework index and one page per class |
| `overrides/` | Page shell, homepage, 404 page and shared macros |
| `hooks/` | Build hooks: asset cache-busting, tool logos, class page panels and lab modules, and accessible tables and code |
| `tests/` | Unit tests for the hooks, the stylesheet's tokens and rules, class page order and copy vocabulary |
| `.claude/` | Claude Code project settings and skills |
| `CLAUDE.md` | Maintenance rules: content, privacy, design system, verification |

Project rows, the homepage feature panels, class tiles and the Coursework index are built from page frontmatter and the `mkdocs.yml` nav order. [CLAUDE.md](CLAUDE.md) documents the fields.

## How the site behaves

| Area | Behavior |
|---|---|
| Without JavaScript | All content and navigation work. The script adds the mobile menu, the "On this page" contents and section tracking, back-to-top, the screenshot lightbox and opening lab modules before printing, and keeps table and screenshot wrappers focusable only while they scroll |
| Layout stability | The script loads in the head and marks the page before first paint; the menu button's space is reserved so nothing shifts |
| Caching | `hooks/asset_versions.py` adds content hashes to the CSS and JS URLs, so a returning visitor never pairs new HTML with an old stylesheet |
| Tables and code | `hooks/reading_accessibility.py` makes them keyboard-scrollable and names them after the preceding heading |
| Motion | A short rise on the homepage intro, a fade-up on homepage screenshots and project rows as they scroll in, a 2 px lift on hovered project rows and class tiles, and lightbox, menu and page transitions; nothing loops or runs past half a second, and `prefers-reduced-motion` turns it all off |
| Print | White background, compact type, author name, email and site on every page; the header, footer, contents, buttons and the class page and role illustrations are hidden, and folded lab modules print open |
| Assets | Fonts, artwork and scripts are local. No third-party requests |

## Privacy

Personal location, phone numbers, private host names, addresses and resumes stay out of this repository. `mkdocs.yml` excludes five raw files that were removed from the publishable tree; older copies remain in Git history, and removing them from history would need a separate, approved rewrite.

## Deployment

A push to `main` runs `.github/workflows/deploy.yml`: it installs the pinned dependencies, runs the tests and publishes with `mkdocs gh-deploy --strict --force`. GitHub Pages serves the `gh-pages` branch. Changes are reviewed locally on a branch and published only with the owner's approval.

### Custom domain

`mkdocs.yml` sets `https://jnkos.com/` as the canonical URL, and `docs/CNAME` keeps the custom domain across deployments. Cloudflare holds four DNS-only apex A records for GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and a DNS-only `www` CNAME to `jkosber.github.io`. GitHub Pages issues the certificate, enforces HTTPS and redirects `www` and the old Pages address to the apex.

## Change history

[CHANGELOG.md](CHANGELOG.md) records each meaningful change and what was checked.
