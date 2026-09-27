# Jadon Kosberg’s portfolio

A static portfolio of professional experience, selected personal projects, and completed coursework. Built with MkDocs and a custom Material theme layout.

## Local development

Use Python 3.14 with the pinned build dependencies (MkDocs 1.6.1 and Material 9.7.7). From the repository root:

```powershell
python -m pip install -r requirements.txt
python -m unittest discover -s tests
python -m mkdocs build --strict
python -m mkdocs serve --dev-addr 127.0.0.1:8000
```

Open the loopback URL in your browser. `site/` is generated and ignored by Git. All content and navigation remain available without JavaScript. A small local script adds the mobile menu, project filters, interactive homepage illustration, current-section highlighting and back-to-top control. Fonts, artwork and scripts are served locally.

`requirements.in` lists the direct build dependencies; `requirements.txt` pins their transitive dependencies for local and CI builds. Regenerate the latter with `uv pip compile requirements.in --python-version 3.14 --universal --no-header --no-annotate --output-file requirements.txt`, then rerun the checks and browser review. Deployment installs the versions in that file and stays on Python 3.14.

The script loads in the head and marks the enhanced layout before the first paint, then initializes controls when the document is ready. The enhanced mobile header reserves room for its hidden menu button so the brand stays aligned. Project filters also reserve their space before initialization; the initial count comes from the same build-time project list as the cards. If the script is unavailable or JavaScript is disabled, mobile navigation remains visible in normal document flow so it cannot cover the content on short screens. An enhanced mobile menu also closes when keyboard focus leaves the header. Section navigation starts collapsed at the 1200px reading-layout breakpoint. Its final-section tracking accounts for the measured footer growth when the back-to-top link enters normal flow; check final and preceding section links after smooth scrolling settles, including resizing near the footer. Printed pages retain the author's name, email and website.

## Content and layout

- `docs/`: publishable Markdown and assets. Existing case-study routes are retained.
- `overrides/main.html`: shared page layout, navigation, metadata and footer.
- `overrides/404.html`: not-found page using the same layout.
- `overrides/partials/`: shared project previews, experience entries, icons and homepage layout.
- `docs/stylesheets/portfolio.css`: tokens, responsive layouts and print styling.
- `docs/javascripts/portfolio.js`: mobile navigation, personal/coursework filters, illustration controls and reading-position controls.
- `hooks/asset_versions.py`: adds content hashes to the shared CSS and JavaScript URLs during each build, so updated pages request matching assets even when a visitor has an older version cached. No manual version bump is required.
- `hooks/reading_accessibility.py`: adds keyboard-accessible table regions and code groups, named with the preceding heading and a page-local number. It preserves the original content and works without JavaScript.
- `mkdocs.yml`: navigation, Markdown settings and explicit asset exclusions.

Frontmatter accepts `title`, `description`, `kind`, optional `status` and an optional docs-relative `visual` asset path. Project previews read those fields from their case-study pages. The first three projects after the index in the navigation appear on the homepage, with one illustrated lead feature above two compact text entries. Keep primary projects before supporting labs in the navigation. Supporting case studies use `detail: true`, remain in the MkDocs navigation, and are linked from their parent pages; they are excluded from project previews and filter counts. The project index uses compact rows with small desktop thumbnails and hides decorative artwork at mobile widths. The coursework filter uses `kind: Completed coursework`; other projects are personal. Experience entries read `role`, `organization` and `dates` from their pages, in navigation order.

`layout: home`, `layout: projects` and `layout: experience` select the corresponding index layouts. Other pages use the reading layout; `layout: wide` omits its section navigation. Keep case studies specific about professional, personal or academic context. Distinguish source code, reported outcomes and observed tests.

Illustrations are local SVGs and conceptual summaries, not screenshots or operational evidence. Reuse them through project `visual` metadata and case-study figures. Keep claims in the surrounding prose grounded in source material.

The shared project-card macro supports the default artwork, a text-only `summary` presentation and a `thumbnail` presentation. The project index maps each project symbol to a simplified 240×160 SVG in `docs/assets/thumbnails/`; the original 600×340 illustrations remain in the case studies and featured homepage project. When adding a primary project, extend the symbol/thumbnail mapping in `overrides/partials/components.html` and inspect the result at its displayed size.

The visual system uses deep navy surfaces, blue structure and warm amber emphasis. Blue defines links, technical surfaces and section navigation; amber marks primary actions, dates, workflow steps and the contact destination. The local illustrations carry the same cool/warm material contrast. The homepage retains its two-line name and exploded technical assembly, followed by selected work and professional experience. Reading pages use a quieter heading scale, comfortable line lengths and a dark palette; print styles use white backgrounds and dark text. Sora headings and Manrope body text are local Latin variable WOFF2 subsets from Google Fonts; their SIL Open Font License files are beside the fonts in `docs/assets/fonts/`. The two preloads in the shared template match the CSS font URLs. Other character sets use the system fallback.

Shared link previews use the local 1200×630 `docs/assets/social-preview.png`, with absolute Open Graph image URLs and a large-image Twitter card. Keep its alternative description in the shared template accurate when replacing the image. The not-found page is marked `noindex` and omits ordinary page-sharing metadata.

The dedicated JK favicon uses `docs/assets/favicon.svg`, 16px and 32px PNGs, a 16/32/48px ICO and a 180px Apple touch icon. Keep these variants consistent and check their legibility at native size, their appearance in a browser tab and loading on nested routes. The header continues to use the separate `mark.svg` brand artwork.

Print styles use an 11pt body, a consistent heading scale and compact paragraph spacing. Code wraps, table rows and evidence figures stay together where possible, and decorative art and interactive controls are omitted. Review actual printed output after substantial content changes; pagination depends on the selected paper and margins.

The homepage heading and `.intro-body` wrapper in `docs/index.md` form the left column; `overrides/partials/system-scene.html` supplies the decorative 720×620 SVG assembly on the right. It has separate compute, network and software groups, each in a positioning wrapper so CSS movement does not replace its base geometry. The three native buttons separate the corresponding layers, draw their circuit connections and show a related project link. `.scene-trace` paths use `pathLength="1"` for normalized drawing. Fine-pointer movement adds a bounded viewing-angle change to `.scene-art`; pointer exit, window blur or media-preference changes reset it. Touch devices retain the three buttons without pointer tilt. The illustration is conceptual, has no live system status, does not cycle automatically, and remains decorative to assistive technology. The default homelab link and every project remain accessible without JavaScript. Project art uses a 600×340 viewBox; `data-visual` selects supporting backgrounds in cards and case-study figures.

Motion consists of one finite assembly entrance and circuit draw, pointer-driven depth, layer selection, project artwork lift and native cross-document view transitions where supported. No animation loop runs while idle. Unsupported browsers retain ordinary navigation. CSS and JavaScript respect the [reduced-motion preference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion): transitions, trace drawing, pointer tilt and smooth scrolling are disabled while the scene controls remain functional. No content depends on an entrance observer, a scroll animation or a third-party animation library. Desktop and mobile use the same top navigation; wide case studies retain sticky section links.

Project artwork opens the same destination as its title and “View project” link. The artwork link is omitted from sequential keyboard navigation to avoid adding another duplicate tab stop; the visible text links remain keyboard accessible.

Private evidence maps, review notes, credentials and resume artifacts do not belong in this repository. Raw infrastructure screenshots and two course certificates containing campus-location details have been removed from the local publishable tree; their filenames remain excluded as a guard against accidental reintroduction. This does not remove existing public copies or Git-history exposure. Any remote cleanup or history rewrite requires separate owner approval. Keep personal location details out of page copy, shared templates and metadata.

## Case-study maintenance

Start with the original implementation artifacts or submissions. Keep the claim-to-source map outside this public repository. A previous summary or assignment instruction alone does not prove implementation or a passed test.

Use this checklist as an outline, adapting headings to the project:

- State the purpose, contribution, personal/academic/professional context and outcome in the opening. Date historical evidence separately from the page edit date.
- Explain components and connection paths before configuration detail. Label historical, conceptual and proposed diagrams; omit identifying network information.
- Include selected supported commands, settings, filters or queries and explain what each demonstrates. Distinguish supplied instructions from submitted execution evidence.
- For real troubleshooting, connect symptom, investigation, evidence, cause, change and verification. Leave the cause or outcome unresolved when the source does.
- Present observed results with their method/date and limits. Tests in source code are not proof they passed; agent-run checks are not personal historical achievements.
- Keep proposed improvements separate from completed work. Preserve strong specifics without inventing decisions or personal reflections.
- Link descriptive public artifacts near the relevant discussion. Never publish private notes, credentials or unreviewed original reports. Inspect screenshots and the complete generated output, including unlinked assets.
- Keep existing routes and useful anchors. A supporting lab needs a coherent investigation and a link from its parent, not another project count.

Use a short `<div class="evidence-note" markdown>` for evidence dates and scope. An accessible `<figure class="architecture">` with an ordered `.architecture-flow` list can show a simple sequential connection path; use a table or a purpose-built diagram for branching topology. Reviewed historical images use `.evidence-figure` with descriptive alt text and a dated caption. Export crops from original pixels, remove identifying metadata, and inspect the exported file. A focusable `.evidence-scroll` region preserves screenshot text size on narrow screens; provide a link to the crop and explain visible fields in ordinary text. Diagrams must remain understandable without JavaScript.

Keep ordinary Markdown tables for inventories and numeric comparisons. The reading-accessibility hook wraps them in uniquely named keyboard-accessible scroll regions and gives fenced code blocks a named group role and keyboard focus. Place each table or example after a descriptive heading so its accessible name explains the context. For paragraph-heavy comparisons, use a Markdown definition list inside `<div class="narrative-list" markdown>`: each term has two definitions with explicit bold labels, such as `: **Investigation.** ...` and `: **Result.** ...`. Add `narrative-list--pairs` when each term has only one definition, as on Skills & focus. The built-in `def_list` extension generates semantic `dl`/`dt`/`dd` elements. On screen, a font-relative container query stacks entries when their reading column is too narrow, including with enlarged text; the 760px mobile fallback remains. Paired descriptions have a bounded desktop width. Keep fenced code at its parent block's font size and allow table headings and code to wrap at natural boundaries rather than splitting labels or numeric tokens. Verify these treatments at normal and enlarged text sizes and in print.

## Validation and publication

Choose checks from the changed files and affected behavior. Keep a short record of what changed, what was checked and any remaining limits. Full audits, numerical scorecards and archived copies of every build are optional; use them when the scope or an explicit request warrants them. Dated release results do not establish that a later revision passes.

| Change | Relevant verification |
| --- | --- |
| Maintenance documentation outside the generated site | Review accuracy, links, examples and the final diff. A site build or browser audit is only needed if site inputs or behavior also change. |
| Page content or a local layout | Strict build, affected links/anchors, factual/privacy review and rendered desktop/mobile reading. Check relevant keyboard paths and print pagination for substantial content, tables or figures. |
| Shared CSS, templates or JavaScript | Hook regression tests, strict build, JavaScript syntax when changed, representative routes and content extremes across affected breakpoints. Check keyboard/focus, zoom, contrast and relevant automated accessibility results. Expand across all routes and available engines when the change affects them. |
| Build hooks, dependencies or deployment | Relevant full regression suite, dependency consistency, strict build and generated routes/assets. Inspect browser behavior when output or loading changes. |

For shared navigation or interaction changes, exercise menu open/close, Escape, focus leaving the menu, viewport changes, project filters/counts, all three illustration controls and destinations, section tracking and back-to-top focus as applicable. Check delayed initialization, script failure, JavaScript disabled and reduced motion when enhancement or loading behavior is affected. Illustration changes also need pointer exit/blur, touch, preference changes and repeated-selection checks. Loading changes need throttled mobile stability/performance checks; lab measurements do not establish real-user Core Web Vitals.

Inspect rendered visual changes before and after at comparable viewports/states. Include narrow, short and enlarged-text views where relevant. Wait for fonts and finite animations before captures; load lazy images before full-page screenshots. Review actual print output when print rules or substantial content change, including attribution and clipping. Keep useful evidence private and report unavailable checks honestly. Rerun affected checks after later edits.

Before an authorized site release, run the hook tests and strict build, check generated links and excluded/private assets (including unlinked files), and review the final diff. For changed shared assets, retain a browser session from before the change and verify the new content-hashed CSS/scripts, rendering and affected interactions after an ordinary reload. After deployment, verify the intended revision and affected live behavior. This release check does not require repeating a completed full audit of unchanged output.

[CHANGELOG.md](CHANGELOG.md) records meaningful changes and their validation scope. Publication requires authorization for the reviewed revision; an earlier release approval does not cover future work.

The existing GitHub Actions workflow publishes on a push to `main` or manual dispatch, after the hook regression checks, using `python -m mkdocs gh-deploy --strict --force`. It uses Python 3.14 and the same pinned requirements as local development. The deployment step sets `GIT_COMMITTER_NAME` and `GIT_COMMITTER_EMAIL` to Jadon's identity; ghp-import uses that identity for the generated commit's author and committer. GitHub Pages serves `gh-pages`. A public branch or pull request also exposes its content. Local preview is the review environment; publication requires the owner’s separate approval of the reviewed change.
