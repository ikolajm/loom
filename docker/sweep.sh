#!/usr/bin/env bash
# sweep.sh — differential token sweep.
#
# Generates the same catalog several times, changing exactly one answer key each
# time, and compares the results. It exists to catch the one class of defect a
# single generation cannot see: a value that is supposed to be a token but is
# actually a literal in an atom. Such a value looks correct in any one run and
# only reveals itself by NOT moving when the brand moves.
#
# Runs in a container because it mutates the working tree. `catalog/` is tracked
# and its output path is fixed (generate-components.js resolves CATALOG_DIR to
# <repo>/catalog regardless of --output), so every variant overwrites it. On a
# developer machine that dirties tracked files; here the checkout is disposable.
set -euo pipefail

ROOT=${LOOM_ROOT:-/loom}
OUT=${SWEEP_OUT:-/tmp/sweep}
KEEP=${KEEP:-0}
KEEP_DIR=${KEEP_DIR:-$ROOT/generated/docker}

cd "$ROOT"
rm -rf "$OUT"; mkdir -p "$OUT"

# --- variant construction -------------------------------------------------
# Each variant is answers.example.json with one group of keys overridden, so a
# difference between two variants is attributable to those keys and nothing else.
# Comparing against the committed default set instead would confound the brand
# with every other answer the example file happens to set.
variant() {
  local name=$1 patch=$2
  rm -rf spec/config/local
  node -e '
    const fs = require("fs");
    const base = JSON.parse(fs.readFileSync("spec/answers.example.json", "utf8"));
    fs.writeFileSync("spec/answers.json", JSON.stringify(Object.assign(base, JSON.parse(process.argv[1])), null, 2));
  ' "$patch"
  node scripts/generate-configs/index.js --input spec/answers.json > "$OUT/$name.configs.log" 2>&1
  node scripts/code-templates/orchestrator.js --output "$OUT/$name" > "$OUT/$name.generate.log" 2>&1
  # CATALOG_DIR is fixed, so the catalog has to be collected after the fact.
  cp -r catalog "$OUT/$name/catalog"
  echo "  built: $name"
}

echo "=== building variants ==="
variant base   '{}'
variant color  '{"primary":"#0A7D2B","secondary":"#7D0A2B","accent":"#2B0A7D"}'
variant font   '{"heading":"Inter","body":"Inter"}'
variant height '{"controlHeight":"touch"}'
variant edges  '{"edges":"sharp"}'

# --- comparison helpers ---------------------------------------------------
atoms_differ() { diff -rq "$OUT/$1/catalog" "$OUT/$2/catalog" 2>/dev/null | head -20; }
tokens_differ() { ! diff -q "$OUT/$1/tokens.css" "$OUT/$2/tokens.css" >/dev/null 2>&1; }

FAILED=0
fail() { echo "  FAIL: $*"; FAILED=1; }
pass() { echo "  ok:   $*"; }

echo
echo "=== assertions ==="

# Atoms reference tokens by name, so a pure value change must not reach their
# source. An atom that moves here is holding a literal — the defect this exists
# to find. Both directions matter: the paired tokens.css assertion below proves
# the variant did something, so an inert generator cannot pass by emitting a
# constant catalog.
for v in color font; do
  d=$(atoms_differ base "$v")
  if [ -n "$d" ]; then
    fail "catalog moved when only $v changed — these atoms hold literals:"
    printf '        %s\n' "$d"
  else
    pass "catalog is invariant under a $v change"
  fi
  if tokens_differ base "$v"; then
    pass "tokens.css responded to the $v change"
  else
    fail "tokens.css did NOT change for $v — the variant was inert, so the check above proves nothing"
  fi
done

# controlHeight and edges are REPORTED, not asserted. Whether they are expected
# to move atom source or only token values depends on whether the generator
# emits a role name or a resolved class, and that has not been established on a
# real run. Encoding a guess as an assertion would make this harness lie in
# whichever direction the guess was wrong. Establish it, then promote to above.
echo
echo "=== reported, not asserted ==="
for v in height edges; do
  d=$(atoms_differ base "$v")
  n=$(printf '%s' "$d" | grep -c . || true)
  if [ "$n" -gt 0 ]; then
    echo "  $v: catalog moved in $n file(s)"
  else
    echo "  $v: catalog unchanged (all variance landed in tokens)"
  fi
  tokens_differ base "$v" && echo "  $v: tokens.css changed" || echo "  $v: tokens.css UNCHANGED — suspicious, the key may not be wired"
done

if [ "$KEEP" = "1" ]; then
  mkdir -p "$KEEP_DIR"
  cp -r "$OUT/." "$KEEP_DIR/"
  echo
  echo "kept: $KEEP_DIR (gitignored via generated/)"
fi

echo
[ "$FAILED" = "0" ] && echo "=== sweep clean ===" || echo "=== sweep FAILED ==="
exit "$FAILED"
