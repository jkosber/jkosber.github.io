**Extends ~/.claude/CLAUDE.md**

# jnkos.com portfolio

Jadon Kosberg's public portfolio at [jnkos.com](https://jnkos.com/), written for recruiters and hiring managers. Owner preferences, private paths and planning notes live in the private `CLAUDE.md` in the parent folder, which also loads; nothing from it is committed here.

## Commands

| Task | Command |
|---|---|
| Environment | `uv venv --python 3.14` once, then `uv pip sync --python .venv requirements.txt` after cloning and whenever `requirements.txt` changes |
| Tests | `.venv/bin/python -m unittest discover -s tests` |
| Strict build (links and anchors must resolve) | `.venv/bin/python -m mkdocs build --strict` |
| Preview | `.venv/bin/python -m mkdocs serve --dev-addr 127.0.0.1:8765 --strict` |
| Regenerate `requirements.txt` | `uv pip compile requirements.in --python-version 3.14 --universal --no-header --no-annotate --output-file requirements.txt` |
| Mutation tests of `hooks/` (by hand, Linux) | `uvx --from mutmut --with-requirements requirements.txt mutmut run` (config in `pyproject.toml`) |

Python commands run the venv's interpreter (`.venv\Scripts\python` on Windows); the system interpreter has no `pip` on some distributions. Material's boxed MkDocs 2.0 notice in build output is not a `WARNING` line and does not fail `--strict`.

## Non-obvious structure

| Path | Note |
|---|---|
| `hooks/` | Authors write plain Markdown: `class_sections.py` builds the Strongest work panels and closed lab modules, `reading_accessibility.py` the scroll regions around tables and code. `frontmatter_checks.py` fails the build on a bad `class_page` or `class_name`, an `art` or `screenshot` without `src`, or a role without `image` |
| `docs/experience/index.md` | Both roles, in `roles` frontmatter; the homepage reads the same data |
| `tests/` | `test_copy_voice.py` (report vocabulary, "artifact"), `test_stylesheet.py` (pinned tokens; no raw hex outside `:root`, print and forced colors; `!important` only with an `anti-slop-allow:` reason) |

## Frontmatter

| Field | Effect |
|---|---|
| `summary` | `role`, `built_with`, `result`, optional `source: {label, url}`: `result` in the page head, `role` and `built_with` in the Role panel, `source` in the strip |
| `screenshot` | `src`, `width`, `height`, `alt`, `caption` (with its date): the lead capture on a case study and beside the project on the homepage |
| `tools` | Up to four short names for the homepage feature panel's tool list, only on a project with a `screenshot`; without it the first four `built_with` entries show |
| `art` | `src`, `width`, `height`: an isometric illustration for class pages (header and tile) and the job-scan minor row |
| `detail: true`, `class_page`, `class_name` | Coursework case study: listed under its class on the Coursework index, not on Projects; the class sets the breadcrumb |
| `voice: personal` | A first-person page, such as a future post: first person on the whole page, frontmatter included (third person stays forbidden). For one passage on a page without `summary`, use the `<!-- voice: personal -->` ... `<!-- /voice -->` markers |

Nothing reads `kind` or `roles[].icon`.

## Content rules

The site is public and recruiters read it. These hold for every edit:

- Every claim traces to a source: the project repositories, coursework submissions, Jadon's resume or his project notes. Never invent work, tests, outcomes or habits. Label coursework as coursework.
- Voice (2026-10-31; `tests/test_first_person.py` enforces the pronoun scopes): first person where Jadon is the actor, resume style everywhere else, never he, his, him or she.
  - First person, wrapped in `<!-- voice: personal -->` ... `<!-- /voice -->`: the homepage intro, About's background and the Coursework index paragraph.
  - Case studies and class pages (pages with `summary`): body prose and headings make the system or the work the subject for what the system does. Where Jadon did the work, say "I", at most once a sentence and only when the work-led form isn't natural; never an agentless passive for his own actions ("In October I patched every host", not "every host was patched"). Passives whose actor is the system, the course or irrelevant may stay.
  - No pronoun at all in frontmatter (title, description, `summary`, `roles`, `facts`, screenshot alt and caption), table rows, alt text, templates or metadata: resume lines start with a past-tense verb, metadata are noun phrases. Role lines (`summary.role`, experience summaries and bullets) read like a resume: no subject, and a past-tense verb that is true for the work: defined, planned, configured, tested, shipped, wrote, documented, investigated.
  - Jadon's name appears only as a fact (the homepage title, metadata and JSON-LD, the header and footer, his name in output), never as a sentence subject.
- Case studies and class pages keep their summary in frontmatter; don't repeat it in the body.
- A class page says what the course provided and what Jadon did, puts strongest work first, then lists every lab with work of his in tables (one closed module per `###` heading), then skills, limits and sources linking files on `main`. Leave blank or empty files out and say so in Limits.
- Report vocabulary (evidence, recorded, supplied, historical, established): three or fewer per page.
- AI coding agents are credited only in SSH Workbench's "How it was developed"; a product that runs an agent, like the job-scan tool, can say so.
- Never publish personal location, phone numbers, private host names, IP addresses, paths, credentials or resumes. Use documentation ranges (`192.0.2.0/24`) and `example.com` in examples. `mkdocs.yml` excludes five raw assets as a guard; keep them out.
- Exception: anything the public [JHomelab](https://github.com/jkosber/JHomelab) repository publishes may appear as it appears there, including its host name, local addresses with the last octet shown as `X` and its screenshots. Full addresses stay out.
- Don't use the word "artifacts" in visible copy.
- Dates are local time, not UTC, in copy, filenames and the changelog.
- Renaming a heading keeps its anchor: `## New heading {#old-id}`. Retiring or renaming a page adds a redirect file (`docs/<old path>/index.html`, a meta refresh to the new page and section) and a `REDIRECTS` entry in `check-site.js`.

## Authoring patterns

| Content | Markup |
|---|---|
| A simple left-to-right path | `<figure class="architecture">` with an `<ol class="architecture-flow">`; branching topology goes in a table |
| A screenshot in the body | `<figure class="evidence-figure">` with a `.evidence-scroll` region (`role="region"`, `tabindex="0"`, `aria-label`), a dated caption and a full-size link; copy an existing one |
| Paragraph-length comparisons | A definition list in `<div class="narrative-list" markdown>`, each term with `: **Label.** ...` definitions; add `narrative-list--pairs` for one definition per term |
| Inventories and numbers | A plain Markdown table after a descriptive heading, which names its scroll region |
| A run whose screenshot carries a username or host name | A `text` code block with the prompt shortened to `$` |

## Adding a project

| Step | Detail |
|---|---|
| Sources | Read the project's repo (README, changelog, CI results) and Jadon's project note. For coursework, separate what Jadon did from what the course provided |
| Page | `docs/technical-labs/<slug>.md`, modeled on `ssh-workbench.md`: `summary` frontmatter, intro, sections, `## Limits`, `## Sources`, footer links. A coursework case study also sets `detail: true`, `class_page` and `class_name`, and its class page links to it |
| Nav | Personal projects go in the `mkdocs.yml` Projects list, whose order sets row order. A project with a `screenshot` becomes a homepage feature panel (add `tools`); one without becomes the minor row (add `art`). Coursework case studies go under Coursework after the class pages. Nav entries are part of this task; other `mkdocs.yml` changes stay under the global protected-config rule |
| Screenshots | Real captures with fictional or cropped data, WebP, no metadata. Set `width`/`height` to the display size (half the pixels for a 2x capture), or it overflows the column on desktop |
| Links | The About skills table, related case-study footers, and the class page for coursework |
| Check | `verifying-portfolio-changes` skill, then a `CHANGELOG.md` entry |

## Design rules

Dark navy in four layers, blue structure, amber emphasis; flat fills, and the table scroll edge shade (`--edge-shade`) is the only gradient.

- Amber appears only on amber buttons, Result labels and bars, the footer email, the current nav item's underline and the contents rail's current-item bar.
- No external fonts, scripts or runtime dependencies; tool logos are Simple Icons 16.35.0 (CC0). Every page works without JavaScript.
- Real captures lead: the homepage and case studies open on screenshots. Isometric illustrations may appear on class tiles, the job-scan row, class page headers and the homepage role cards. They stay conceptual, use `alt=""`, and never replace a real capture on a project or case study.
- Real screenshots go in `docs/assets/evidence/<project>/` with a date in the filename, sanitized, with descriptive alt text and a dated caption.
- Motion: nothing over 0.5 s, nothing loops, only `transform`, `translate`, `opacity` and color animate, and `prefers-reduced-motion` turns it all off. The hover lift (`.lift`) goes on whole-row and whole-card links, never on containers that aren't links. Hidden starting states sit inside `@supports (animation-timeline: view())` or `@starting-style`, and print shows every element.

## Verification and publishing

- Before any commit that changes the site: the tests and a strict build. Before asking to publish: the `verifying-portfolio-changes` skill (`node .claude/skills/verifying-portfolio-changes/run-check.js chromium` with `PLAYWRIGHT_MODULE` set).
- Work on a branch. A push to `main` deploys through `.github/workflows/deploy.yml`, so push, merge or deploy only with Jadon's approval of that specific change.
- Each branch merged to `main` adds a dated `CHANGELOG.md` entry with what was checked.
- Review new or changed copy for filler and cliches with `anti-slop:slop-check`.
