# Jadon Kosberg’s portfolio

A static portfolio of professional experience, selected personal projects, and completed coursework. Built with MkDocs and a custom Material theme layout.

## Local development

The existing build uses Python, MkDocs 1.6.1 and Material 9.7.7. With those installed:

```powershell
python -m mkdocs build --strict
python -m mkdocs serve --dev-addr 127.0.0.1:8000
```

Open the loopback URL in your browser. `site/` is generated and ignored by Git. All content and navigation remain available without JavaScript. A small local script adds the mobile menu, project filters, current-section highlighting and back-to-top control; no external fonts or scripts are requested.

## Content and layout

- `docs/`: publishable Markdown and assets. Existing case-study routes are retained.
- `overrides/main.html`: shared page layout, navigation, metadata and footer.
- `overrides/404.html`: not-found page using the same layout.
- `overrides/partials/`: shared project previews, experience entries, icons and homepage layout.
- `docs/stylesheets/portfolio.css`: tokens, responsive layouts and print styling.
- `docs/javascripts/portfolio.js`: mobile navigation, personal/coursework filters and reading-position controls.
- `mkdocs.yml`: navigation, Markdown settings and explicit asset exclusions.

Frontmatter accepts `title`, `description`, `kind`, optional `status` and an optional docs-relative `visual` asset path. Project previews read those fields from their case-study pages. The first three projects after the index in the navigation appear on the homepage, with the first featured. The coursework filter uses `kind: Completed coursework`; other projects are personal. Experience entries read `role`, `organization` and `dates` from their pages, in navigation order.

`layout: home`, `layout: projects` and `layout: experience` select the corresponding index layouts. Other pages use the reading layout; `layout: wide` omits its section navigation. Keep case studies specific about professional, personal or academic context. Distinguish source code, reported outcomes and observed tests.

Illustrations are local SVGs and conceptual summaries, not screenshots or operational evidence. Reuse them through project `visual` metadata and case-study figures. Keep claims in the surrounding prose grounded in source material.

The homepage pairs a decorative systems-workbench illustration with the introduction, followed by the background summary. The first project is a horizontal feature on desktop; the next two sit beneath it. Cards and case-study figures use `data-visual` to select a small set of supporting accent colors. Project art uses a 600×340 viewBox, with a separate 720×520 hero. Keep factual text readable outside the illustrations and preserve their conceptual framing.

Project artwork opens the same destination as its title and “View project” link. The artwork link is omitted from sequential keyboard navigation to avoid adding another duplicate tab stop; the visible text links remain keyboard accessible.

Private evidence maps, review notes, credentials and resume artifacts do not belong in this repository. The original infrastructure screenshots and two course certificates containing campus-location details are excluded from the generated site; that exclusion does not remove their existing Git history or public-repository exposure. Keep personal location details out of page copy, shared templates and metadata.

## Validation and publication

Run a strict build, check generated links and excluded assets, then inspect desktop and mobile layouts and keyboard navigation. Check menu open/close, Escape, viewport changes, project filtering, current-section tracking and back-to-top focus. Verify reduced motion disables hover movement and all content remains available with JavaScript disabled. Review the full diff before publishing.

The existing GitHub Actions workflow publishes on a push to `main` or manual dispatch, using `mkdocs gh-deploy --force`. GitHub Pages serves `gh-pages`. A public branch or pull request also exposes its content. Local preview is the review environment; publication requires the owner’s separate approval of the reviewed change.
