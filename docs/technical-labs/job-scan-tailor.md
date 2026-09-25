---
title: Job scan and resume tailor
description: An agent-guided workflow that ranks postings against a source resume and generates selected DOCX/PDF resumes, a comparison report and a local review page with file warnings.
kind: Personal software project
status: Complete, maintained as needed
visual: assets/project-resume.svg
---

# Job scan and resume tailor

This personal project turns job postings and my existing resume into a ranked comparison, selected one-page resumes and a local document-review page. It separates the work of interpreting a posting from the repeatable work of formatting files and checking known constraints.

My original resume is the source of the background claims. The workflow I requested uses an agent to compare that background with postings and prepare tailored content; Python and JavaScript utilities generate and check the documents. Browser tooling, `python-docx`, LibreOffice and the external wording scanner supply capabilities the project builds on.

<div class="evidence-note" markdown>
**Status and evidence:** complete, maintained as needed. This case study describes the private source version reviewed on September 24, 2026. Targeted checks are reported below; the review did not collect jobs, generate application documents or submit applications.
</div>

## From job posting to application

<figure class="architecture">
  <ol class="architecture-flow">
    <li><strong>Read and compare</strong><span>Source resume<br>Posting text and metadata<br>Agent applies the fit rubric</span><small>Profile + matches.json</small></li>
    <li><strong>Build and check</strong><span>Per-role content specification<br>DOCX generation and PDF conversion<br>Document and wording checks</span><small>Resumes + ranking report</small></li>
    <li><strong>Review locally</strong><span>HTML page with sibling documents<br>Reasons, gaps and file warnings<br>Human review before use</span><small>No automatic application submission</small></li>
  </ol>
  <figcaption>Implementation overview. The agent supplies the comparison and wording; the document utilities consume saved records. The ranking report includes all recorded matches, while selected matches receive resumes.</figcaption>
</figure>

The collection playbook uses a signed-in browser to read postings, save their full descriptions and deduplicate job identifiers. Login and verification challenges stay with the user. Pasted or saved job descriptions are an alternative input, so an unavailable browser does not prevent work on already-collected material.

Saved records provide the handoff between stages:

| Record or component | Responsibility |
|---|---|
| Baseline profile | Holds resume-supported experience, qualifications and search preferences; keeps professional work separate from coursework and labs. |
| `raw/jd-NN.md` | Preserves each posting's text, source, collection date and metadata for later comparison. |
| `matches.json` | Stores the agent's ranks, scores, sub-scores, reasons, gaps and references to selected resume files. |
| `resume-spec.json` | Supplies the selected wording and section content for one tailored document. |
| `build_resume.py` | Builds a DOCX, requests PDF conversion and applies the document and wording checks. |
| `build_ranking_pdf.py` / `build_viewer.py` | Produce the full ranking report and the local review page from the match records. |

The written scoring rubric weights skills at 35%, certification and education alignment at 15%, seniority at 20%, location at 15% and role alignment at 15%, then applies screening-risk penalties. Scores of 70 or more enter the strongest band; the instructions normally select up to 12 eligible matches for tailoring and retain the rest in the ranking.

The agent applies the rubric; the reporting scripts display those scores and sort by the supplied rank without recalculating them. Scores compare postings against the profile, rather than estimating interview probability.

## Keeping the source resume separate

The source resume stays separate from scan output. Each selected role receives its own specification and generated files in a run folder. Section types in the specification include bullets, skills, roles and education. The builder owns their formatting, so a content revision does not need a new document-generation script.

Before creating an output directory, the builder refuses reserved master-resume basenames and paths containing a `Variants` directory. It also replaces reserved filename characters in the output basename. Other output paths remain the user's responsibility.

This synthetic fragment shows how a match points to its documents. It is an interface example, not a real posting, result or complete input file:

```json
{
  "rank": 1,
  "company": "Example Organization",
  "role": "Support Technician",
  "why_it_fits": "Example explanation tied to source-resume evidence.",
  "gaps": "Example requirement not supported by the profile.",
  "resume_folder": "01 - Example Organization - Support Technician",
  "resume_pdf": "Example Resume.pdf"
}
```

## Document generation

`python-docx` creates the Word document. A shared conversion helper starts LibreOffice headlessly with a temporary user profile, waits for the process and checks for the resulting PDF. The resume builder then reopens the DOCX for content and layout checks and uses `pypdf` to count PDF pages.

Failure handling depends on which check failed:

<div class="narrative-list" markdown>

Required content and prohibited terms
: **Behavior.** Missing required tokens or listed prohibited terms fail the resume build.
: **Scope.** Detects known omissions and terms, not every possible false statement.

Resume PDF
: **Behavior.** Missing conversion output, unavailable page-count dependency or a page count other than one fails the build.
: **Scope.** Applies to the tailored resume.

Locked layout
: **Behavior.** Rechecks margins, the normal body font and the name line against independent constants.
: **Scope.** Does not inspect every text run or establish visual quality.

Page fill
: **Behavior.** Warns when estimated text coverage is below the target.
: **Scope.** Advisory estimate from text baselines, not a visual inspection.

Residual wording findings
: **Behavior.** Stops the resume build for a rewrite after simple substitutions.
: **Scope.** Screens the summary and role/project bullets.

Unavailable wording scanner
: **Behavior.** Emits `SLOP UNCHECKED`; the document build may still exit successfully.
: **Scope.** Requires attention before presenting the document as reviewed.

Reduced wording rules
: **Behavior.** Warns when only the resume-specific rules could load.
: **Scope.** A partial scan has less coverage than the full ruleset.

Ranking-report PDF
: **Behavior.** Warns if conversion fails and retains the DOCX.
: **Scope.** This report path does not enforce the resume's fatal PDF requirement.

</div>

Simple wording substitutions update the specification before rendering. More involved rewrites go through `apply_slop_fixes.py`, which requires each requested text match to exist and applies it to every matching prose field. It then rebuilds through the document checks. Before-and-after records and a redlined DOCX make those edits inspectable; a failed rebuild retains the files for diagnosis.

Human review still checks factual accuracy and document appearance, beyond the mechanical checks above.

## Reviewing the output

The ranking report includes reasons, gaps and tailoring notes alongside every recorded match. The HTML viewer loads that report and selected resumes from relative file paths, placing each resume beside its comparison. Its styles are contained in the HTML file; the PDF and DOCX files remain separate siblings in the scan folder.

The viewer escapes displayed text and URL-encodes file paths. When a PDF is absent, it renders a placeholder and warning instead of an empty document frame. A missing DOCX is omitted from the download links.

Both reporting scripts recompute totals from the matches array and warn when declared totals differ. Their “tailored” count includes records with both a resume-folder and a PDF-name field. The viewer checks file existence separately; neither count nor file presence confirms a successful build.

The workflow ends with a person checking the wording, role fit and documents. The collection instructions prohibit automatic applications and messages.

## Tests and maintenance

### A numeric-token check that needed tightening

The July 4, 2026 change history records a weakness in required-number matching: a shorter number could be found inside a longer one. For example, a synthetic requirement of `12+` would be present as a substring of `112+`, even though the counts differ.

The correction added a digit boundary before numeric tokens. This selected implementation fragment rejects a match immediately preceded by another digit:

```python
tok_low = token.lower()
if tok_low[:1].isdigit():
    return re.search(r"(?<![0-9])" + re.escape(tok_low), low_text) is not None
return tok_low in low_text
```

A targeted check on September 24, 2026 confirmed that the intended token passes and the longer-number example fails. The check tests the match boundary; the number's meaning still needs human review.

### What was checked in this review

| Check on September 24, 2026 | Result |
|---|---|
| Fit-band regression script | Passed 14 boundary cases and both threshold constants. |
| JavaScript wording scanner and automatic substitutions | All 10 tests passed, with no skips. The deliberately missing-scanner test reported the expected reduced-coverage state. |
| Targeted in-memory checks | Passed numeric-token matching, filename cleanup, HTML escaping, count correction, missing-file placeholders, omitted links and warning checks. |

The September 24 checks ran against the source without generating resumes or changing it. Broader document-builder, rewrite-helper, ranking and viewer suites were not run. LibreOffice conversion, document appearance, live collection and the complete scan-to-document workflow remain untested in that review, as do the skill's separate manual evaluation scenarios.

## Limits and source material

The project is tailored to one person's resume and preferences. Its required terms, section layout and selection policies need review when that source material changes. Scoring depends on the agent's reading of the evidence, posting collection depends on browser access and changing page structure, and the input loaders do not enforce a complete schema for every record.

Maintenance records from July 20 describe long summaries and skills causing initial two-page documents. The recorded response was to shorten the selected content while retaining the locked formatting. They also document changing browser selectors and checking posting-body details against result cards. Those are historical observations, not claims about today's job-site behavior.

This account draws on the private source's skill instructions, collection and ranking playbooks, document builders, shared conversion and wording modules, regression tests and dated change history. The repository stays private because it contains resumes and job-search records. The public examples above describe the implementation; interview outcomes and time savings have not been measured.

[Professional experience](../experience/index.md) · [All projects](index.md)
