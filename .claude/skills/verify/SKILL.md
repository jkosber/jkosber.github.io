---
name: verify
description: Run the jnkos.com repo's fast checks before every commit that changes the site, including a commit that only changes Markdown under docs/ (those pages are the published site, not documentation), or when asked to check a change here - the unit tests, a strict build into a temp folder, script syntax and the check runner's tests. About 4 seconds, no browser; --rendered adds the browser suite. The full pre-publish pass is verifying-portfolio-changes.
---

# verify (jnkos.com)

Run the script from the repo root and act on its exit code:

```bash
.claude/skills/verify/verify.sh              # before a commit, about 4 s
.claude/skills/verify/verify.sh --rendered   # adds the browser suite, about 77 s
```

It writes nothing in the repo: the build goes to a temp folder, so `site/` is untouched.

| Line | What it checks |
| --- | --- |
| `tests` | `unittest discover -s tests`: the hooks, the stylesheet's tokens, class page order, copy vocabulary and the pronoun scopes |
| `strict-build` | `mkdocs build --strict`: every link and anchor resolves and the frontmatter checks pass |
| `scripts` | `node --check` on `docs/javascripts/portfolio.js`, and the `run-check.js` tests |
| `claude-md` | `CLAUDE.md` is under the 30,000-character cap |
| `rendered` (only with `--rendered`) | Starts the preview on port 8765, runs `run-check.js chromium` (every check in `check-site.js`) and stops the preview. Skipped when a line above failed. `PLAYWRIGHT_MODULE` names a Node Playwright install when `playwright` does not resolve on its own; `PLAYWRIGHT_CHROMIUM_PATH` names the browser; when it is unset the script uses `/usr/bin/google-chrome-stable`, or `/usr/bin/chromium` where Chrome is not installed. A run that breaks before it reports (no Playwright, a browser that will not start) fails the line with the runner's own error |

| Exit | Meaning | Do |
| --- | --- | --- |
| 0 | Every line reads `OK` | Report the last line and carry on |
| 1 | A line reads `FAIL`, with the detail indented below it | Fix the page, hook, style or script, then run it again. Never change a test or a check to get a pass: the global Testing rules apply, and a test that looks wrong is a question for Jadon |
| 2 | It could not run (no `.venv`, an unknown argument) | Set up the environment from the `CLAUDE.md` command table |

## When

- Before each commit that changes the site. Claude Code's commit instructions call a project skill named `verify` before a commit, except for changes to docs or tests. That exception does not cover `docs/` here: the Markdown under it is the site itself, so run this for a copy-only commit too.
- On a failing-tests-first checkpoint (a commit of tests or `check-site.js` expectations only, which the global Testing rules require before the implementation) a `FAIL` is the expected result, not a gate. Run it and confirm that only the new tests fail, for the reason they were written; a new `check-site.js` expectation shows only with `--rendered`. Then commit the checkpoint with that `FAIL` standing.
- With `--rendered` when a change could alter what a page renders and the automated answer is wanted before the full pre-publish pass.

## What it does not cover

- How a page looks, new images, the private-data greps and the private-term scan, the extra checks by kind of change, and the report: `verifying-portfolio-changes`, before asking to publish.
- Breaks that depend on scrollbar width: headless Chromium draws no scrollbar, so only the Playwright MCP's headed run shows them.
- WebKit, physical devices and screen readers.
