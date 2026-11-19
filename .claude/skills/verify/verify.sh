#!/usr/bin/env bash
# Fast checks for the jnkos.com repo.
# usage: verify.sh [--rendered]
# exit 0: every line reads OK; 1: a line reads FAIL; 2: it could not run.
set -u

rendered=0
case "${1:-}" in
  "") ;;
  --rendered) rendered=1 ;;
  *) echo "usage: verify.sh [--rendered]"; exit 2 ;;
esac

cd "$(dirname "$0")/../../.." || exit 2
if [ ! -f mkdocs.yml ] || [ ! -x .venv/bin/python ]; then
  echo "verify: no mkdocs.yml or .venv here; set up the environment from the CLAUDE.md command table"
  exit 2
fi

tmp=$(mktemp -d) || exit 2
server=""
cleanup() {
  if [ -n "$server" ]; then kill "$server" 2>/dev/null; wait "$server" 2>/dev/null; fi
  rm -rf "$tmp"
}
trap cleanup EXIT

fail=0
ok() { echo "OK    $1${2:+  ($2)}"; }
bad() { echo "FAIL  $1"; [ -f "${2:-}" ] && tail -n 40 "$2" | sed 's/^/      /'; fail=1; }
port_open() { (exec 3<>/dev/tcp/127.0.0.1/8765) 2>/dev/null; }

if .venv/bin/python -m unittest discover -s tests >"$tmp/tests" 2>&1; then
  ok tests "$(grep -E '^Ran [0-9]+ tests' "$tmp/tests")"
else
  bad tests "$tmp/tests"
fi

if .venv/bin/python -m mkdocs build --strict -d "$tmp/site" >"$tmp/build" 2>&1; then
  ok strict-build "$(find "$tmp/site" -name index.html | wc -l) pages, site/ untouched"
else
  bad strict-build "$tmp/build"
fi

if ! command -v node >/dev/null; then
  echo "node not found" >"$tmp/node"; bad scripts "$tmp/node"
elif node --check docs/javascripts/portfolio.js >"$tmp/node" 2>&1 \
  && node --test .claude/skills/verifying-portfolio-changes/run-check.test.js >>"$tmp/node" 2>&1; then
  ok scripts "portfolio.js parses, run-check tests pass"
else
  bad scripts "$tmp/node"
fi

chars=$(wc -m <CLAUDE.md)
if [ "$chars" -le 30000 ]; then
  ok claude-md "$chars characters"
else
  echo "CLAUDE.md is $chars characters; the cap is 30,000" >"$tmp/cap"; bad claude-md "$tmp/cap"
fi

if [ "$rendered" -eq 1 ]; then
  if [ "$fail" -ne 0 ]; then
    echo "SKIP  rendered  (fix the lines above first)"
  elif port_open; then
    echo "port 8765 is in use; stop the preview that holds it and run this again" >"$tmp/port"; bad rendered "$tmp/port"
  else
    .venv/bin/python -m mkdocs serve --dev-addr 127.0.0.1:8765 --strict >"$tmp/serve" 2>&1 &
    server=$!
    for _ in $(seq 1 60); do port_open && break; sleep 0.5; done
    # The system Chromium, when the environment names none. PLAYWRIGHT_MODULE comes from the environment.
    if [ -z "${PLAYWRIGHT_CHROMIUM_PATH:-}" ] && [ -x /usr/bin/chromium ]; then
      export PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium
    fi
    if ! port_open; then
      bad rendered "$tmp/serve"
    else
      node .claude/skills/verifying-portfolio-changes/run-check.js chromium >"$tmp/check.json" 2>"$tmp/check.err"
      rc=$?
      # One summary line, then one line per problem. No readable result means the run itself broke.
      if .venv/bin/python -c 'import json,sys; d=json.load(open(sys.argv[1])); print(len(d["routes"]), "routes,", len(d["checks"]), "check groups, problems:", len(d["problems"])); [print(p) for p in d["problems"]]' "$tmp/check.json" >"$tmp/result" 2>/dev/null; then
        if [ "$rc" -eq 0 ]; then ok rendered "$(head -n 1 "$tmp/result")"; else cat "$tmp/check.err" >>"$tmp/result"; bad rendered "$tmp/result"; fi
      else
        { echo "run-check.js exited $rc without a readable result:"; cat "$tmp/check.err"; } >"$tmp/broken"
        bad rendered "$tmp/broken"
      fi
    fi
  fi
fi

if [ "$fail" -eq 0 ]; then echo "verify: all OK"; else echo "verify: FAILED"; fi
exit "$fail"
