---
title: Job scan and resume tailor
description: An agent-guided workflow that compares job postings with a source resume and builds selected DOCX/PDF resumes, a ranking report and a local review page.
kind: Personal software project
status: Complete, maintained as needed
tools: [Python, python-docx, LibreOffice, Playwright]
summary:
  role: "Specified the workflow for a personal job search; an AI agent compares postings with the source resume, and Python scripts build and check the documents."
  built_with: ["Python", "python-docx", "headless LibreOffice for PDF conversion", "pypdf", "an AI agent", "browser automation"]
  result: "A ranked report of every posting, tailored one-page resumes for the strongest matches and a local review page. A build fails on missing required details, listed banned terms or a second page."
updated: "September 24, 2026"
art: {src: assets/project-resume.svg, width: 600, height: 340}
---

# Job scan and resume tailor

Built for a personal job search, the tool reads job postings, compares each one with a source resume, ranks them, and builds a tailored one-page resume for the best matches. Everything lands on a local review page, and nothing goes out until I've read it.

An AI agent does the reading and comparing. Python scripts do the repeatable part: building the Word and PDF files and checking them against rules that can fail the build. What the documents say about the candidate comes only from the source resume.

## From job posting to application documents {#from-job-posting-to-application}

<figure class="architecture">
  <ol class="architecture-flow" role="list">
    <li><strong>Read and compare</strong><span>Source resume<br>Posting text and metadata<br>Agent applies the fit rubric</span><small>Profile + matches.json</small></li>
    <li><strong>Build and check</strong><span>Per-role content specification<br>DOCX generation and PDF conversion<br>Document and wording checks</span><small>Resumes + ranking report</small></li>
    <li><strong>Review locally</strong><span>HTML page with sibling documents<br>Reasons, gaps and file warnings<br>Manual review before use</span><small>No automatic applications</small></li>
  </ol>
  <figcaption>Every match goes into the ranking report; the strongest also get a resume.</figcaption>
</figure>

The agent reads postings in a signed-in browser, saves each full description and drops duplicates. I handle logins and verification prompts myself, and pasted or saved descriptions work when the browser isn't available.

It scores each posting with a written rubric: skills 35%, seniority 20%, certifications and education 15%, location 15% and role alignment 15%, minus penalties for screening risks. Scores of 70 and up are the strongest band, and up to 12 of those normally get a tailored resume. The scripts show and sort the agent's scores without recalculating them.

Each stage hands off through saved files:

| File | What it holds |
|---|---|
| Baseline profile | Experience, qualifications and search preferences from the source resume, with work kept separate from coursework |
| `raw/jd-NN.md` | Each posting's text, source, collection date and metadata |
| `matches.json` | Ranks, scores, reasons, gaps and the resume files for each match |
| `resume-spec.json` | The wording and sections for one tailored resume |
| `build_resume.py` | Builds the DOCX, converts it to PDF and runs the checks |
| `build_ranking_pdf.py`, `build_viewer.py` | The ranking report and the review page |

## Keeping the source resume separate

Each run writes into its own folder, one subfolder per selected role. The builder refuses to write over the master resume's file names or into the old `Variants` folder, and it cleans reserved characters out of file names.

## Checks that can fail a build {#document-generation}

`python-docx` builds the Word file, and LibreOffice runs headless with a temporary profile to make the PDF. Then the builder checks the result:

- Required details from the source resume, such as the counts, must appear, and listed banned terms must not.
- The PDF must exist and be exactly one page, counted with `pypdf`.
- Margins, the body font and the name line must match fixed values.
- Wording that still reads like filler after automatic substitutions stops the build for a rewrite.

Two cases only warn: page fill below the target, and a missing wording scanner, which prints `SLOP UNCHECKED` to flag that the document hasn't been screened. Bigger rewrites go through `apply_slop_fixes.py`, which rebuilds through the same checks and keeps a redlined DOCX of every change.

## Reviewing the output

The ranking report lists every posting with its reasons, gaps and tailoring notes. The review page puts each resume next to its comparison, escapes everything it displays, and shows a warning instead of an empty frame when a PDF is missing. The workflow never applies or sends messages; I check the wording, the fit and the documents myself.

## Tests and maintenance

### A numeric-token check that needed tightening

In July a required-number check could match a shorter number inside a longer one: a requirement of `12+` would pass on `112+`. The fix rejects a match that has another digit right before it:

```python
tok_low = token.lower()
if tok_low[:1].isdigit():
    return re.search(r"(?<![0-9])" + re.escape(tok_low), low_text) is not None
return tok_low in low_text
```

Also in July, long summaries and skills lists pushed first drafts onto two pages. The fix was shorter content, not smaller formatting.

### What was checked in this review

| Check on September 24, 2026 | Result |
|---|---|
| Fit-band regression script | Passed 14 boundary cases and both threshold constants |
| Wording scanner and automatic substitutions | All 10 tests passed, none skipped |
| Targeted checks | Numeric-token matching, file-name cleanup, HTML escaping, count correction, missing-file placeholders and warnings all passed |

## Limits {#limits-and-source-material}

- It's built around one person's resume and preferences, so the required terms and layout need review whenever that resume changes.
- Scores are the agent's reading of a posting. They compare it with the baseline profile; they don't predict interviews.
- Collection depends on browser access and on job-site page structure, which changes.
- The September 24 review didn't run the full builder, rewrite, ranking and viewer suites, LibreOffice conversion, a look at the finished documents, or a complete scan from start to finish.
- I haven't measured interview outcomes or time saved.

## Sources

This page draws on the private repository's skill instructions, collection and ranking playbooks, document builders, shared conversion and wording modules, regression tests and dated change history. The repository stays private because it holds resumes and job-search records.

[Professional experience](../experience/index.md) · [All projects](index.md)
