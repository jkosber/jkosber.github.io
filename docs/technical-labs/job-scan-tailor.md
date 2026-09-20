---
title: Job scan and resume tailor
description: A job-search workflow that compares openings against my resume, ranks suitable roles and produces consistent DOCX and PDF application documents.
kind: Personal software project
status: Complete, maintained as needed
visual: assets/project-resume.svg
---

# Job scan and resume tailor

I put this project together to make my job search easier to manage. It starts with my existing resume, compares job requirements with that experience, and prepares tailored documents for suitable openings. The employment history stays the same; the emphasis changes to fit the role.

The project combines instructions for reviewing postings with Python and JavaScript utilities for generating, checking and organizing the documents. It produces a ranked list of matches, individual one-page resumes and a local review page.

<figure class="case-visual">
  <img src="../../assets/project-resume.svg" width="600" height="340" alt="Job postings, resume preparation and document review shown in sequence." loading="lazy">
  <figcaption>Postings are compared with the source resume, then selected applications move through document generation and review.</figcaption>
</figure>

## From job posting to application

<div class="workflow-steps" markdown>
1. **Establish the resume facts.** Read the source resume and record the employment history, qualifications and experience available for tailoring. Separate professional responsibilities from coursework and lab knowledge.
2. **Review and rank openings.** Collect the posting's requirements, compare them with the profile, and record both the match and the gaps. Select the suitable roles for resume preparation.
3. **Generate the documents.** Put the selected content into a structured specification. Build the DOCX and PDF resume for that opening, along with the ranked-matches report for the search.
4. **Check and review.** Run the content and document checks, then bring the generated files together in a local HTML page for review.
</div>

The ranking instructions consider skills, certifications and education, seniority, role type, and practical requirements such as working arrangement and travel. Each match includes an explanation of why the role fits and where my experience falls short. The score is a way to compare postings; it is not a prediction that an employer will interview or hire me.

## Keeping the source resume separate

The project keeps the original resume apart from generated variants. Each variant has a JSON specification containing its sections and selected text. The document builder reads that specification and applies the resume layout, so changing the wording does not require rebuilding the formatting by hand.

Some information is required in every version. The builder checks for those facts and a defined list of terms that should not appear. It also protects canonical resume destinations from being used as output paths. That makes the source resume the starting point for the next application, rather than letting one tailored version replace it.

## Document generation

Python creates the Word document with `python-docx`. LibreOffice converts it to PDF, and the builder checks that the result exists and is exactly one page. A separate layout check reopens the DOCX and verifies its margins and fonts.

The PDF check is a required part of the build. If conversion fails or the PDF cannot be inspected, the builder reports the failure instead of calling the document complete. An underfilled page produces a warning so the content can be reviewed without changing the required layout.

JavaScript utilities screen wording for known clichés and overstatement. Simple substitutions can be applied automatically. Remaining findings stop the resume build for review and correction. If the scanner is unavailable, the output reports that it was not checked.

## Reviewing the output

The ranking report lists the openings in order, with the reasons for each match and the gaps to consider. The local HTML viewer brings the ranked results and generated resume files together, with links to the DOCX and PDF versions.

The viewer handles incomplete output too. A missing PDF gets a placeholder and warning; a missing DOCX is left out of the download links. The reporting scripts recalculate match and tailored-entry counts from the input entries instead of relying only on the stated totals.

These checks address known content and formatting problems. A required-fact check cannot establish that every sentence is accurate, so the workflow still ends with review of the wording and its fit for the specific job.

## Tests and maintenance

The source includes regression tests for the resume builder, ranking report, viewer and wording utilities. They cover missing required facts, prohibited terms, layout changes, multi-page PDFs, missing files and unavailable checks.

The project is complete and maintained as needed. Its repository stays private because it includes personal resume material and job-search records. The public description covers the workflow and implementation without exposing those documents.

[Professional experience](../experience/index.md) · [All projects](index.md)
