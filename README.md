# Jadon Kosberg’s portfolio

A static portfolio of professional experience, selected personal projects, and completed coursework. Built with MkDocs and a custom Material theme layout.

## Local development

The existing build uses Python, MkDocs 1.6.1 and Material 9.7.7. With those installed:

```powershell
python -m mkdocs build --strict
python -m mkdocs serve --dev-addr 127.0.0.1:8000
```

Open the loopback URL in your browser. `site/` is generated and ignored by Git. All content and navigation remain available without JavaScript. A small local script adds the mobile menu, project filters, interactive homepage illustration, current-section highlighting and back-to-top control. Fonts, artwork and scripts are served locally.

The script loads in the head and marks the enhanced layout before the first paint, then initializes controls when the document is ready. This prevents the mobile navigation from flashing open and shifting the page. If the script is unavailable or JavaScript is disabled, mobile navigation remains visible in normal document flow so it cannot cover the content on short screens. An enhanced mobile menu also closes when keyboard focus leaves the header. Section navigation starts collapsed at the 1200px reading-layout breakpoint. Printed pages retain the author's name, email and website.

## Content and layout

- `docs/`: publishable Markdown and assets. Existing case-study routes are retained.
- `overrides/main.html`: shared page layout, navigation, metadata and footer.
- `overrides/404.html`: not-found page using the same layout.
- `overrides/partials/`: shared project previews, experience entries, icons and homepage layout.
- `docs/stylesheets/portfolio.css`: tokens, responsive layouts and print styling.
- `docs/javascripts/portfolio.js`: mobile navigation, personal/coursework filters, illustration controls and reading-position controls.
- `mkdocs.yml`: navigation, Markdown settings and explicit asset exclusions.

Frontmatter accepts `title`, `description`, `kind`, optional `status` and an optional docs-relative `visual` asset path. Project previews read those fields from their case-study pages. The first three projects after the index in the navigation appear on the homepage, with one lead feature above two paired entries. The collection uses the same hierarchy for all projects. The coursework filter uses `kind: Completed coursework`; other projects are personal. Experience entries read `role`, `organization` and `dates` from their pages, in navigation order.

`layout: home`, `layout: projects` and `layout: experience` select the corresponding index layouts. Other pages use the reading layout; `layout: wide` omits its section navigation. Keep case studies specific about professional, personal or academic context. Distinguish source code, reported outcomes and observed tests.

Illustrations are local SVGs and conceptual summaries, not screenshots or operational evidence. Reuse them through project `visual` metadata and case-study figures. Keep claims in the surrounding prose grounded in source material.

The visual system uses deep navy surfaces, electric blue structure and warm amber emphasis. Blue defines links, technical surfaces and section navigation; amber marks primary actions, dates, workflow steps and the contact destination. The local illustrations carry the same cool/warm material contrast. The homepage pairs a two-line name with a large exploded technical assembly. A broad lead project, staggered secondary projects, professional timeline and oversized contact footer establish the page hierarchy. Reading pages retain comfortable line lengths and a dark palette; print styles use white backgrounds and dark text. Sora headings and Manrope body text are local Latin variable WOFF2 subsets from Google Fonts; their SIL Open Font License files are beside the fonts in `docs/assets/fonts/`. The two preloads in the shared template match the CSS font URLs. Other character sets use the system fallback.

The homepage heading and `.intro-body` wrapper in `docs/index.md` form the left column; `overrides/partials/system-scene.html` supplies the decorative 720×620 SVG assembly on the right. It has separate compute, network and software groups, each in a positioning wrapper so CSS movement does not replace its base geometry. The three native buttons separate the corresponding layers, draw their circuit connections and show a related project link. `.scene-trace` paths use `pathLength="1"` for normalized drawing. Fine-pointer movement adds a bounded viewing-angle change to `.scene-art`; pointer exit, window blur or media-preference changes reset it. Touch devices retain the three buttons without pointer tilt. The illustration is conceptual, has no live system status, does not cycle automatically, and remains decorative to assistive technology. The default homelab link and every project remain accessible without JavaScript. Project art uses a 600×340 viewBox; `data-visual` selects supporting backgrounds in cards and case-study figures.

Motion consists of one finite assembly entrance and circuit draw, pointer-driven depth, layer selection, project artwork lift and native cross-document view transitions where supported. No animation loop runs while idle. Unsupported browsers retain ordinary navigation. CSS and JavaScript respect the [reduced-motion preference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion): transitions, trace drawing, pointer tilt and smooth scrolling are disabled while the scene controls remain functional. No content depends on an entrance observer, a scroll animation or a third-party animation library. Desktop and mobile use the same top navigation; wide case studies retain sticky section links.

Project artwork opens the same destination as its title and “View project” link. The artwork link is omitted from sequential keyboard navigation to avoid adding another duplicate tab stop; the visible text links remain keyboard accessible.

Private evidence maps, review notes, credentials and resume artifacts do not belong in this repository. The original infrastructure screenshots and two course certificates containing campus-location details are excluded from the generated site; that exclusion does not remove their existing Git history or public-repository exposure. Keep personal location details out of page copy, shared templates and metadata.

## Validation and publication

Run a strict build, check generated links and excluded assets, then inspect desktop and mobile layouts and keyboard navigation. Check menu open/close, Escape, viewport changes, project filtering, all three illustration controls and destinations, current-section tracking and back-to-top focus. Verify reduced motion disables entrance/hover/illustration movement and all content remains available with JavaScript disabled. Wait for fonts and finite animations before visual captures; load offscreen lazy images before a full-page screenshot. Review the full diff before publishing.

Include short landscape/zoom viewports, enlarged text, tabbing out of an open mobile menu, a failed script request and printed case-study attribution. Verify pointer tilt resets after exit/blur, touch does not tilt, changing reduced-motion preference cancels active trace animations, and repeated scene selection leaves no ongoing animations. Check throttled mobile loading for layout shift and loading performance; lab measurements do not establish real-user Core Web Vitals.

The existing GitHub Actions workflow publishes on a push to `main` or manual dispatch, using `mkdocs gh-deploy --force`. GitHub Pages serves `gh-pages`. A public branch or pull request also exposes its content. Local preview is the review environment; publication requires the owner’s separate approval of the reviewed change.
