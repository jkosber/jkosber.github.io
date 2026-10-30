# Portfolio change record

## October 30, 2026 — checks on Linux

- The command table, README and verification skill run every Python command through a uv-made `.venv` (`uv venv --python 3.14`, `uv pip sync requirements.txt`), since the system interpreter on some distributions has no `pip`; `.venv/` is ignored and the project allow-list matches the venv commands. CI is unchanged.
- `run-check.js` launches Chromium from `PLAYWRIGHT_CHROMIUM_PATH` when set, so the Chromium run shares the system browser with the Playwright MCP and needs no browser download; `run-check.test.js` pins the launch options. WebKit runs on a machine with Playwright's WebKit build against the preview through an SSH reverse tunnel; the skill says how.
- Result wells on screens 480px wide and narrower use `.9375rem` text, 15px instead of 16px at the default size. At 390px with 200% text, the CyberOps page's Result split "recommendations." mid-word in the Playwright MCP's headed Chromium, whose 15px classic scrollbar left the well 268px for a 277px word. Headless Chromium draws no scrollbar, so `run-check.js` had not reported it.

Validation: 32 tests and the strict build passed, in this checkout and in a fresh clone set up with only `uv venv` and `uv pip sync`. The three `run-check.test.js` tests passed under `node --test`. On Linux, `run-check.js chromium` with the system Chromium exited 0 with `problems: []` across all 18 pages and the 404 page. In the Playwright MCP's headed Chromium, `check-site.js` reported no problems apart from the hover-lift check, which flaked once in three isolated re-runs and passed otherwise. WebKit: not yet run on 2026-10-30; the result will be added when it runs. A grep of `CLAUDE.md`, `README.md`, `.claude/` and this changelog for private host names and local paths found nothing. Screen readers, physical devices and Safari on iOS were not assessed.

## October 24, 2026 — visual upgrade

- Four surface layers (page, band, panel, raised) with an inset for Result wells and code, one spacing scale and one type scale. Flat fills; amber is limited to buttons, Result labels and bars, the footer email, the current nav item and the contents rail's current-item bar.
- Homepage: a hero band with the facts panel hanging over its edge, Proxmox and SSH Workbench as feature panels with their screenshots rising above the panel, the job-scan tool as a minor row with its illustration, the six classes as tiles in their own band, and the two roles as cards. Amber "Read the case study" buttons name their project for screen readers. Facts gained a `detail` line.
- Case studies and class pages: a header band with breadcrumbs, title, description, a Status, Updated and Source strip and the Result; the summary column is gone. My role and Built with sit in a panel, beside the Result on class pages. The contents are a sticky rail from 1100px and an "On this page" disclosure below it.
- Class pages: Strongest work comes before Labs, each item in a panel (two short items in a row sit side by side), and each lab module folds closed with its lab count. Lab rows stack on phones. Anchors are unchanged.
- Tool logos: 13 Simple Icons logos (16.35.0, CC0), stored locally and inlined beside tool names; tools without a logo show as text. Homepage feature panels read a new short `tools` list.
- Screenshots open in a lightbox above 760px from the image or its "Open full size" caption link, which is the screenshot's one keyboard stop (Escape, backdrop click and Close; focus returns to the link that opened it). On phones and without JavaScript the link opens the image file. Screenshots in the page body fit their column at every width.
- Class and job-scan illustrations come from the existing set until new ones are drawn. Experience and About use the card and table components; the Experience closing note links to Projects and Coursework.
- Motion: the intro entrance finishes by 0.48s, the hover lift also covers class tiles, the lightbox fades and scales in 0.2s. All of it is off with reduced motion, and print shows every element, including closed lab modules with JavaScript on or off.
- Checks: `check-site.js` gained `navCurrent`, `firstShot`, `coveredButtons`, `tileLift`, `pageHead`, `labModuleAnchor`, `lightbox`, `printModules`, `evidenceFit`, `railWidened`, `zoomTabStops`, `captionLightbox`, `noJsPrintLabs` and 200% text at 320px, and `classPages` now checks the section order, lab modules and the first Strongest work panel. Checks that encoded the summary column and the old row layout were replaced by the page head checks. New tests cover the tokens, the logo lookup and the class-page hook.
- `CLAUDE.md` and the verification skill describe the new tokens, components and checks.

Validation: 32 tests and the strict build passed. Rendered checks in Chromium and WebKit found no problems across all 18 pages and the 404 page at 320, 390, 768 and 1440px and the 36 named checks. Against the live site's checks, no shared count fell except the scroll fade-ups (8 to 5), because the case-study lead screenshots and the job-scan row no longer fade in; the page head checks replaced the summary column checks (13 pages each). Local Lighthouse runs on a strict build scored 100 for accessibility, best practices and SEO on the homepage, the Proxmox page, the Coursework index and NETI 109, on mobile and desktop. Performance was 100 on desktop, and 100 on mobile when served with gzip as GitHub Pages serves it. From an uncompressed server, mobile performance was 99 on the homepage, the Proxmox page and NETI 109 (100 on the Coursework index), where `main` scored 100, because the stylesheet and pages are larger; a 640px homepage screenshot did not change that score. The private-term scan found nothing beyond the known Proxmox anchor, and the anti-slop scanner's new hits are false positives in code (a media query, a Jinja loop, `handle_data` overrides and a test fixture). Screen readers, physical devices and Safari on iOS were not assessed.

## October 23, 2026 — site redesign

- Homepage: the name, today's intro and a facts column (latest role, certifications, education); Proxmox and SSH Workbench lead with real screenshots, the job-scan tool follows as a row, then a list of the six classes and both roles. The hero scene, project cards and filters are gone.
- Coursework section: an index table and six class pages (NETI 109, SVAD 111, CSIA 115, CSIA 210, CSIA 105, SDEV 120), written from the course repositories. Each says what the course provided and what Jadon did, lists every lab with work of his, and covers the strongest work, skills, limits and sources. Three new screenshots: the SDEV 120 quiz flowchart, the CSIA 210 Packet Too Big details and the CSIA 105 OpenPuff result. The four coursework case studies moved from Projects to Coursework.
- Case studies and class pages show a summary column (role, built with, result or term, source, contents) and a Result panel, from `summary` frontmatter.
- Experience is one page with both roles; the Vaco by Highspring contract at Verizon ran July to October 2026. About replaces About Jadon and Skills & focus, with one skills table and Credly links for Security+, A+ and Networking Basics.
- Retired addresses forward to their new pages: `/experience/ladd-dental/`, `/experience/verizon-conversions/`, `/career-paths/` and `/technical-labs/cisco-networking-analysis/`.
- Rewrote the Proxmox, job-scan and four coursework case studies in first person, each with one Limits section.
- Two-column tables stack into label and value on phones and keep their table roles. Motion: an entrance on the homepage intro, a fade-up tied to scroll on screenshots and rows, a 2px hover lift on rows; nothing over 0.5s, all of it off with reduced motion.
- A new link-preview card for jnkos.com replaces the one that still showed jkosber.github.io.
- Checks: `run-check.js` runs `check-site.js` in WebKit as well as Chromium. New checks cover the header, nav and footer, the homepage, both indexes, the class pages, the summary column, Experience, About and its Credly links, the forwarding addresses, motion limits, the type scale, words broken mid-word at 200% text, scroll fade-ups and the hover lift. The three scene-button and three filter-count checks were removed with those features. `tests/test_copy_voice.py` caps report vocabulary per page.

Validation: 10 tests and the strict build passed. Rendered checks in Chromium and WebKit covered all 19 pages and the 404 page at 320, 390, 768 and 1440px with no overflow, broken images, page errors or mid-word breaks, plus 200% text at 390px, every page with JavaScript disabled, reduced motion, print and the four forwarding addresses. Lighthouse scored 100 for performance, accessibility, best practices and SEO on the homepage, the Proxmox page and the Coursework index (local results). The anti-slop scanner and the private-term scan found nothing beyond the known Proxmox anchor. A fresh review of the whole branch found no critical issues; its important findings were fixed. Screen readers, physical devices and Safari on iOS were not assessed.

## October 23, 2026 — AdventureWorks search count

- AdventureWorks on AWS: a blank catalog search returned 304 products, not 504. Milestone 3C's blank-search screenshot and the final report both show "304 Results"; 504 is the `Production.Product` row count from Milestone 2B, which the page keeps.

Validation: five hook tests and the strict build passed; the private-term scan found no matches beyond the known Proxmox anchor. Rendered checks covered all 15 pages and the 404 page at 320, 390, 768 and 1440px with no problems, plus the mobile menu, filter counts (3/3/6), scene buttons, every page with JavaScript disabled and 14 print panels. The changed summary and table were reviewed at 390 and 1440px. Physical devices, screen readers and Safari were not assessed.

## October 23, 2026 — SSH Workbench 0.3.0

- Updated the SSH Workbench case study to version 0.3.0: five tagged releases, the 1,077 tests that passed in its Windows and Ubuntu CI, the status header and the layout that follows the terminal's size, and the 0.3.0 checks in Windows Terminal. A new limit notes that the layout was not checked in Linux or macOS terminals.
- Replaced the October 21 screenshot with the October 22 capture of the 0.3.0 look from the project's README (fictional machines, a stand-in status checker), shown at 900px so it fits the column on desktop.
- Skills & focus: the SSH Workbench test count is now 1,077.

Validation: five hook tests and the strict build passed; the anti-slop scanner found nothing on the changed pages, and the private-term scan found no matches beyond the known Proxmox anchor. Rendered checks covered all 15 pages and the 404 page at 320, 390, 768 and 1440px with no overflow, broken images, page errors, mid-word table breaks or scrolling two-column tables, plus the mobile menu, filter counts (3/3/6), scene buttons, every page with JavaScript disabled and 14 print panels. The changed page was reviewed at 390 and 1440px. Physical devices, screen readers and Safari were not assessed.

## October 23, 2026 — table word breaks

- Table cells now wrap only between words. They had inherited `overflow-wrap: anywhere` from the page, which let the browser shrink a column below its longest word: "Networking", "Monitoring" and "Development" broke mid-word in the Skills & focus tools table, as did "PostgreSQL" and "pgvector" on the Proxmox page and alert timestamps on the CyberOps page.
- `check-site.js` now fails on a table word broken mid-word, outside code, and on a two-column table that scrolls sideways.

Validation: the new check found six failures across three pages before the fix and none after. Five hook tests and the strict build passed. Rendered checks covered all 15 pages and the 404 page at 320, 390, 768 and 1440px with no overflow, broken images or page errors, plus the mobile menu, filter counts (3/3/6), scene buttons, every page with JavaScript disabled and 14 print panels. At 390px with 200% text no page overflows, but more two-column tables scroll sideways inside their regions instead of breaking words (four on the Proxmox page). Physical devices, screen readers and Safari were not assessed.

## October 23, 2026 — Proxmox homelab October update

- Updated the Proxmox homelab page from its September 22 snapshot to October 23: Proxmox VE 9.2.21, ten VMs and two containers (the new CT 111 Caddy pilot), the hidden NVMe drive and storage plan, and current service versions on VM 109 and CT 110.
- Added an October maintenance section: the certificate authority compromise response, updates on every host, the Watchtower replacement, Beszel and Uptime Kuma alerting, and the Homepage dashboard with per-panel credentials. Added the October 23 dashboard capture.
- Removed the Open issues section; the storage move, scheduled backups and an off-host alert stay under Next changes. The September guest-access gap moved to the health-check section as fixed.
- Skills & focus: the homelab line mentions patching and monitoring, and the tools table adds Portainer and a Monitoring row (Beszel, Uptime Kuma, Homepage).
- Re-pinned every JHomelab source link from `3dfd2fe` to `b5a5608` and added the October maintenance notes.
- Content rule: anything the public JHomelab repository publishes may appear on the site as published there (`CLAUDE.md`, verification skill).

Validation: five hook tests and the strict build passed. All five JHomelab source links returned HTTP 200. The anti-slop scanner found nothing on the page, and the private-term scan found no matches beyond the known `{#sources-and-artifacts}` anchor. Rendered checks covered all 15 pages and the 404 page at 320, 390, 768 and 1440px with no overflow, broken images or page errors, plus the mobile menu, filter counts (3/3/6), scene buttons, every page with JavaScript disabled and 14 print panels. The changed page was reviewed at 390 and 1440px. Physical devices, screen readers and Safari were not assessed.

## October 22, 2026 — design review fixes

- Homepage: a smaller name, a wider introduction and a capped illustration bring the credentials strip into the first screen at 1440×900. On phones the strip comes before the illustration.
- Experience entries show the job title in the heading color, larger than the dates, and "/ Verizon" no longer starts a line.
- Projects page: two projects per row from 1101px, with a smaller page heading, so two projects fit the first screen at 1440×900 instead of one. Index-page headings match the case-study size.
- SSH Workbench: the screenshot follows the evidence note instead of sitting below the first section.
- Phones: the floating back-to-top control no longer covers text (the footer copy remains); two-column tables fit without scrolling sideways; screenshots scale to the column, with the full-size link in each caption.
- Narrative lists in columns show their labels (Decision, Why and the like) once, in the first row; later rows keep them for screen readers.
- Coursework cards and chips show the date alone; personal projects keep their state.

Validation: five hook tests and the strict build passed. Sixteen rendered assertions written for the ten findings failed before the changes and pass after. An independent review found that filenames in two-column tables broke mid-word on phones and that narrow print pages picked up the phone table rules; both are fixed, each with a check that failed first. Rendered checks covered all 15 pages and the 404 page at 320, 390, 768 and 1440px with no overflow, broken images or page errors, plus the mobile menu, filter counts (3/3/6), scene buttons, every page with JavaScript disabled and 14 print panels. Five pages at 390px with 200% text had no overflow. The private-term scan found no matches. Changed pages were reviewed at 390 and 1440px. Physical devices, screen readers and Safari were not assessed.

## October 22, 2026 — SSH Workbench 0.2.2

- Updated the SSH Workbench case study to version 0.2.2: four tagged releases, the 1,046 tests that passed in its Windows and Ubuntu CI, and what 0.2.2 fixed.

Validation: five hook tests and the strict build passed. Rendered checks covered all 15 pages and the 404 page at 320, 390, 768 and 1440px with no overflow, broken images or page errors, plus the mobile menu, filter counts, scene buttons, every page with JavaScript disabled and 14 print panels. The changed page was reviewed at 390 and 1440px. Physical devices, screen readers and Safari were not assessed.

## October 21, 2026 — recruiter readiness and Claude Code workflow

- Added SSH Workbench as a personal software project: a case study, isometric card art and thumbnail, and a screenshot of the real app captured with fictional machines and simulated status results. It is the second project, so it joins Proxmox and AWS on the homepage; Networking stays on the Projects page.
- Added a summary block (My role, Built with, Result) to the five other primary case studies and shortened their opening evidence notes. Renamed five defensive headings, keeping their anchors, and cut repeated commentary about the historical record while keeping real limits.
- Added tool tags to project cards from a new `tools` frontmatter field.
- Homepage: the introduction names the role and SSH Workbench, the Software scene links to SSH Workbench, and the page carries Person structured data (JSON-LD).
- Skills & focus: added SSH Workbench and a table of tools, each row linked to its evidence.
- Added maintainer documentation in `CLAUDE.md`, project settings and a verification skill with a reusable browser check. The README is now a short overview. Deliberate `!important` rules carry a stated reason.

Validation: five hook tests and the strict build passed. Rendered checks covered all 15 pages and the 404 page at 320, 390, 768 and 1440px with no overflow, broken images or page errors, plus the mobile menu, filter counts (six projects: three personal, three coursework), scene buttons, every page with JavaScript disabled, and print colors. Local Lighthouse runs on the homepage and the SSH Workbench page scored 99 for performance and 100 for accessibility, best practices and SEO. Physical devices, screen readers and Safari were not assessed.

## October 9, 2026 — header initials

- Reused the favicon SVG for the shared header so its initials match the browser-tab icon.

Validation: five hook tests, strict build, matching image paths on all 15 generated pages, desktop/mobile header rendering and nested-route image loading passed.

## October 9, 2026 — work email

- Changed the shared contact link and print attribution to `Jadon@jnkos.com`.

## October 8, 2026 — custom domain

- Set `https://jnkos.com/` as the canonical site address and updated the printed website label.
- Added the generated site's `CNAME` file so future deployments retain the custom domain. GitHub Pages remains the host; Cloudflare manages DNS.
- Documented the apex and `www` DNS records, HTTPS and redirects.

Validation: five hook tests, dependency consistency, strict build, all 15 pages' domain metadata, 474 generated local references, the sitemap, CNAME and five excluded assets passed.

## September 27, 2026 — wording corrections

- Capitalized “Retail” in the homepage experience strip to match “Healthcare.”
- Shortened the homelab's final heading to “Sources” and used “file” for the recovered download in the security case study. The existing homelab section link is preserved.

Validation: five hook tests, strict build, 460 generated local references, excluded assets and affected desktop/mobile reading passed. Only the three intended HTML pages changed; all 15 pages were checked for the removed wording.

## September 27, 2026 — maintenance workflow

- Made validation depend on the affected content and behavior, while retaining release build, regression, privacy and cache checks. Full audit reports and build archives are optional. This changes maintenance guidance only; site content and runtime behavior are unchanged.

## September 27, 2026 — reading and navigation refinement

Publication of this revision was approved on September 27 after a fresh whole-site visual audit and local review.

- Corrected compounded code sizing so fenced examples use their intended block size on screen and in print.
- Preserved natural wrapping in table headings and code, keeping labels and subnet prefixes readable on screen and in print. Existing named horizontal-scroll regions retain access to wide tables on screen.
- Added keyboard-scrollable, full-size views and nearby image links to the two historical Proxmox figures. Original image bytes, dates and evidence limitations are preserved.
- Bounded the desktop width of Skills & focus descriptions while retaining the compact mobile presentation.
- Made narrative comparisons respond to their available width and text size, so enlarged text uses the existing stacked reading layout instead of cramped columns.
- Corrected final-section highlighting when the back-to-top link changes the footer height during an anchor scroll.
- Updated maintenance guidance for these reading layouts. The navy, blue and amber identity, homepage hierarchy, hero controls, project order, thumbnails and substantive case-study copy are unchanged.
- Set the deployment commit identity explicitly so generated Pages commits use Jadon Kosberg's name and email.

Verification covered all 15 routes, desktop and mobile reading, 41 print pages, Chromium/Firefox/Windows WebKit behavior, accessibility and contrast, native Chromium zoom, metadata and assets, loading and ordinary browser reload. The strict build reproduced all 89 audited output files. Private records retain the detailed evidence and release verification.

Windows WebKit ordinary-link Tab behavior and automated LinkedIn access remain limited. Physical devices, screen readers, native Safari/macOS, PDF accessibility and production field performance were not assessed.

## September 26, 2026 — hierarchy and artwork release

This release refines the homepage and project previews after the quality release. Publication of the reviewed changes was approved on September 26.

- Removed the shared and introductory “Get in touch” buttons. The compact Contact footer retains email, LinkedIn, GitHub, About and back-to-top navigation.
- Added a dedicated JK favicon with SVG, 16px/32px PNG, multi-size ICO and touch-icon variants, while preserving the header mark.
- Gave the Experience / Certifications / Education strip a distinct blue surface and direct links. Professional experience receives the first emphasis; the homepage section order remains unchanged.
- Kept Proxmox as the illustrated homepage feature and made AdventureWorks on AWS and Networking compact, aligned text entries. Their case-study artwork and project destinations remain intact.
- Added five simplified, consistently sized Projects-index thumbnails and moved each project action closer to its summary. Mobile project rows remain compact without image panels.
- Tightened mobile hero and section spacing while retaining the illustration, all three controls and existing body-text sizes.
- Added a clear underline to the current navigation item alongside its blue background.
- Fixed print heading specificity for homepage and index project titles, and prevented ordinary table labels from splitting mid-word. Code retains its wrapping behavior.
- Updated maintenance guidance for project-card presentations, thumbnail mappings and favicon variants.

Verification: all 15 routes received fresh desktop/mobile visual and print review. The final candidate passed 540 responsive browser cases across Chromium, Firefox and WebKit, 60 automated accessibility scans with no violations, contrast followup, 474 local reference checks, five hook tests, JavaScript syntax and strict builds. All 89 generated files matched a separate build using the pinned dependencies. Throttled mobile Lighthouse performance was 99–100, with zero measured layout shift on every route. A browser that first loaded the published version received the final candidate after an ordinary reload.

These are local lab checks. Physical devices, screen readers and production performance were not assessed. The Windows WebKit test port skips ordinary links during Tab traversal even in an isolated HTML fixture; Chromium and Firefox keyboard checks passed. LinkedIn blocked automated access.

The case-study and experience facts, historical limitations, course-provided attribution and original artwork are unchanged. Private source material and audit reports remain outside the public repository. The synthetic automation demonstration remains deferred.

## September 26, 2026 — quality audit release

This release applies the September 25 review of all 15 pages. Publication of the reviewed changes was approved on September 26.

- Improved narrow-screen heading wrapping, illustration-control legibility and project-filter sizing. Preserved the navy, blue and amber design, artwork, featured-project order and detailed case studies.
- Replaced generic table-region labels with unique names drawn from section headings, and gave keyboard-focusable code blocks an explicit group role. The new build hook preserves authored markup and code.
- Moved the back-to-top link into the footer layout when the footer appears, keeping contact and profile links unobscured. Reserved space for enhanced menu and filter controls to prevent loading shifts.
- Tightened summaries and repeated qualifications, clarified the two-server AWS arrangement and distinguished report dates from screenshot dates. Retained historical evidence limits and course-provided attribution.
- Updated the Verizon role to July 2026–Present and Ivy Tech Dean's List to 2025–2026, matching Jadon's confirmed current resume corrections.
- Added a 1200×630 social preview using the existing artwork, descriptive image metadata and a specific, non-indexed not-found page.
- Refined print typography, spacing, code wrapping and figure/table pagination. Printed pages retain contact attribution.
- Pinned the verified Python build dependencies and added accessibility-hook regression tests and strict validation to deployment.

Verification: 540 responsive browser cases passed across Chromium, Firefox and WebKit, with zero violations in 60 automated accessibility scans. Separate checks covered enlarged text, keyboard use, reduced motion, delayed loading and script failure. All 15 routes were rendered to PDF and visually inspected. The strict build, five hook tests, JavaScript syntax and 416 local references passed; an isolated build matched all 79 generated files. All 14 content pages scored 100 in the four Lighthouse categories, with zero layout shift in the fresh homepage and Projects runs. These are local lab results, not production or full assistive-technology certification. LinkedIn continued to block automated link checking.

The synthetic automation demonstration and new operational testing of historical projects remain separate work. Private audit reports and source evidence are excluded from the public repository.

## September 25, 2026 — returning-browser asset refresh

A returning-browser issue was found after deployment: the new HTML could reuse the previous unversioned stylesheet, restoring old project cards and omitting the new narrative layouts. Shared CSS and JavaScript URLs now receive automatic content hashes at build time, so a changed asset gets a new cache key. Release verification includes the browser session that reproduced the stale layout.

## September 24, 2026 — documentation overhaul and focused revision

The documentation overhaul and focused revision were developed on `portfolio-documentation-overhaul-20260924`. Source publication and deployment were approved on September 24. Further manual review of the wording, visual direction and featured-project emphasis remains pending.

### Documentation overhaul

| Area | Changes |
| --- | --- |
| AdventureWorks on AWS | Added architecture and connection paths, Linux SQL import adaptations, PHP integration, troubleshooting, recorded row counts and application results. Distinguished the course-provided application from deployment work and retained historical security and diagnostic limits. |
| Proxmox homelab | Reconciled the documented host, storage, guests, services, networking and firewall configuration with dated observations. Added two reviewed historical images. Separated configured controls and responding endpoints from demonstrated isolation, recovery and application operation. |
| Networking | Expanded subnet planning and client diagnoses. Preserved the recorded broadcast-address mistake and unresolved tests rather than rewriting the historical outcome. |
| IPv6 investigations | Added a supporting case study covering DHCPv6 fields, Router Advertisements, address lifetimes and remaining evidence gaps. Linked it from Networking. |
| CyberOps and Snort | Expanded the supplied traffic investigation and added a supporting Snort/firewall/HTTP-recovery case study. Distinguished alerts, installed rules, written results and response recommendations. |
| Job scan and resume tailor | Explained the workflow, source-resume boundaries, document generation, failure handling and bounded checks. Retained limits on end-to-end and outcome claims. |
| Shared presentation | Refined homepage positioning, compact project rows, reading hierarchy and footer. Added architecture figures, evidence notes and keyboard-scrollable tables/code. Five primary project groups remain; supporting labs do not increase filter counts. |
| Maintenance and privacy | Added case-study maintenance guidance. Removed five previously excluded raw screenshots/certificate files from the local publishable tree; exclusions remain. This does not erase existing public copies or Git history. |

### Focused revision after review

- Edited all seven case studies for a more direct voice. Consolidated repeated evidence qualifications while retaining historical dates, unresolved causes, incomplete retesting, course-provided material and unverified recovery, isolation and GPU operation.
- Converted AWS troubleshooting, Networking client diagnoses, automation failure handling and Skills & focus to semantic definition lists. One content source provides desktop rows and full-width mobile entries through the built-in `def_list` extension and shared CSS. Conventional inventories and subnet allocations remain tables.
- Added original historical crops of DHCPv6 address/lifetime fields and AdventureWorks product results. Each has explanatory text, useful alt text, a dated caption and a full-size link. Crops exclude surrounding browser/desktop content; exported pixels and metadata were inspected. Narrow views allow keyboard scrolling without shrinking screenshot text.
- Shortened the Projects introduction, reduced spacing before the first project and made shared summaries more specific. At the checked 390px width, the first project heading moved from approximately 817px to 673px down the page.
- Retained the current visual direction, featured-project order, professional-experience prominence and interactive illustration. The synthetic automation output demonstration is deferred to a separate task.

### Validation and limits

The strict MkDocs build and Git whitespace check passed. The generated site contains 15 HTML pages and passed 416 local link, anchor and asset checks. All pre-revision anchors were retained. Layout checks covered all 15 routes at 320, 390, 768 and 1440px, with no page overflow, broken images, heading-level jumps or JavaScript page errors observed. Desktop and mobile views were inspected visually.

Twenty-seven retained-behavior checks and nine additional narrative/evidence checks passed, covering keyboard access, filters, scene controls, reduced motion, no-JavaScript content, fallback navigation and image links/scrolling. Twenty-five of 26 external destinations returned HTTP 200; LinkedIn blocked automated access. Public-output inspection found no flagged private paths, tokens, keys or internal addresses, and the excluded raw assets were absent. This was scoped checking, not a complete secret or accessibility audit.

No new screen-reader, Safari/Firefox, field-performance or infrastructure-operational validation was performed. Historical missing traces, retest records and recovery/isolation/GPU evidence remain unresolved. Private source material and review records are not included in this repository.

See [README.md](README.md) for the current architecture, maintenance conventions, preview commands and publication boundary.
