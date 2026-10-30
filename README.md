# Jadon Kosberg's portfolio

Source for [jnkos.com](https://jnkos.com/): professional IT experience, personal projects and completed coursework. Built with MkDocs and a custom layout over the Material theme, hosted on GitHub Pages with DNS in Cloudflare.

## Local development

Python 3.14, with build dependencies pinned in `requirements.txt` (MkDocs 1.6.1, Material 9.7.7).

```bash
uv venv --python 3.14
uv pip sync requirements.txt
.venv/bin/python -m unittest discover -s tests
.venv/bin/python -m mkdocs build --strict
.venv/bin/python -m mkdocs serve --dev-addr 127.0.0.1:8765 --strict
```

On Windows the interpreter is `.venv\Scripts\python`.

`site/` is generated and ignored. `requirements.in` lists the direct dependencies; regenerate the pins with `uv pip compile requirements.in --python-version 3.14 --universal --no-header --no-annotate --output-file requirements.txt`, then rerun the checks.

## Structure

| Path | Contents |
|---|---|
| `docs/` | Markdown pages, assets, `portfolio.css` and `portfolio.js` |
| `docs/technical-labs/` | Project case studies |
| `overrides/` | Page shell, homepage, 404 page and shared macros |
| `hooks/` | Build hooks: asset cache-busting and accessible table/code regions |
| `tests/` | Hook unit tests |
| `.claude/` | Claude Code project settings and skills |
| `CLAUDE.md` | Maintenance rules: content, privacy, design system, verification |

Project cards, filters and the homepage feature list are built from page frontmatter and the `mkdocs.yml` nav order. [CLAUDE.md](CLAUDE.md) documents the fields.

## How the site behaves

| Area | Behavior |
|---|---|
| Without JavaScript | All content and navigation work. The script adds the mobile menu, project filters, hero scene controls, section highlighting and back-to-top |
| Layout stability | The script loads in the head and marks the page before first paint; menu and filter space is reserved so nothing shifts |
| Caching | `hooks/asset_versions.py` adds content hashes to the CSS and JS URLs, so a returning visitor never pairs new HTML with an old stylesheet |
| Tables and code | `hooks/reading_accessibility.py` wraps them in keyboard-scrollable regions named after the preceding heading |
| Motion | One finite hero entrance and interaction-driven changes, all off under `prefers-reduced-motion` |
| Print | White background, compact type, author name, email and site on every page; decorative art and controls are hidden |
| Assets | Fonts, artwork and scripts are local. No third-party requests |

## Privacy

Personal location, phone numbers, private host names, addresses and resumes stay out of this repository. `mkdocs.yml` excludes five raw files that were removed from the publishable tree; older copies remain in Git history, and removing them from history would need a separate, approved rewrite.

## Deployment

A push to `main` runs `.github/workflows/deploy.yml`: it installs the pinned dependencies, runs the hook tests and publishes with `mkdocs gh-deploy --strict --force`. GitHub Pages serves the `gh-pages` branch. Changes are reviewed locally on a branch and published only with the owner's approval.

### Custom domain

`mkdocs.yml` sets `https://jnkos.com/` as the canonical URL, and `docs/CNAME` keeps the custom domain across deployments. Cloudflare holds four DNS-only apex A records for GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and a DNS-only `www` CNAME to `jkosber.github.io`. GitHub Pages issues the certificate, enforces HTTPS and redirects `www` and the old Pages address to the apex.

## Change history

[CHANGELOG.md](CHANGELOG.md) records each meaningful change and what was checked.
