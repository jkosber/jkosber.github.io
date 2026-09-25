# Portfolio change record

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
