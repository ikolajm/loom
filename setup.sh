#!/bin/bash
# setup.sh — install picked Loom catalog atoms into a consuming project.
#
# Usage: ./setup.sh <project-dir> [--force]
#   Reads <project-dir>/loom-picks.json, resolves each picked atom's manifest
#   `dependencies` transitively, and copies only the resolved atoms (+ cn) into
#   <project-dir>/src/components/. Atoms are project-owned after install — edit
#   freely; re-run setup.sh to resync. The token substrate (tokens.css, loom.css,
#   loom.tailwind.css) is generated fresh from spec/ and delivered to <project-dir>/src/.
#
#   An atom you have edited locally is SKIPPED, not overwritten, and named in the
#   summary. --force overwrites it. "Edited" is decided by re-hashing the installed
#   file against the version its installed manifest records — see
#   scripts/check-local-edits.js. Skipping rather than prompting is deliberate: this
#   script runs unattended (the playground resync in `npm run generate`'s gate, CI),
#   and a [y/N] prompt there hangs the build instead of protecting anything.
set -euo pipefail

LOOM_ROOT="$(cd "$(dirname "$0")" && pwd)"
CATALOG="$LOOM_ROOT/catalog"
PROJECT=""
FORCE=0
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    *) [ -z "$PROJECT" ] && PROJECT="$arg" ;;
  esac
done
: "${PROJECT:?Usage: ./setup.sh <project-dir> [--force]}"
PICKS="$PROJECT/loom-picks.json"
SRC="$PROJECT/src"
DEST="$SRC/components"

[ -d "$CATALOG" ] || { echo "ERROR: catalog/ not found — run: node scripts/code-templates/orchestrator.js --only components"; exit 1; }
[ -f "$PICKS" ]   || { echo "ERROR: $PICKS not found"; exit 1; }

echo "=== Loom setup ==="
echo "Catalog: $CATALOG"
echo "Project: $PROJECT"

mkdir -p "$DEST"

ATOMS="$(node "$LOOM_ROOT/scripts/resolve-picks.js" "$PICKS" "$CATALOG")"

# Which installed atoms has the consumer edited? cn is checked with the rest — it is a
# delivered file with a manifest, and a consumer who patched it deserves the same care.
STATUS="$(node "$LOOM_ROOT/scripts/check-local-edits.js" "$DEST" "$CATALOG" $ATOMS cn)"
SKIPPED=""

echo "Picked + resolved atoms:"
for atom in $ATOMS; do
  state="$(printf '%s\n' "$STATUS" | awk -v a="$atom" '$2==a {print $1}')"
  # `unknown` is skipped too: the file is installed but carries no delivery record, so
  # "has the consumer edited it" is unanswerable — and answering it as "no" is the
  # silent overwrite this whole mechanism exists to stop.
  if { [ "$state" = "modified" ] || [ "$state" = "unknown" ]; } && [ "$FORCE" -eq 0 ]; then
    SKIPPED="$SKIPPED $atom"
    if [ "$state" = "unknown" ]; then
      echo "  ~ $atom (no manifest to compare against — skipped)"
    else
      echo "  ~ $atom (edited locally — skipped)"
    fi
    continue
  fi
  cp "$CATALOG/$atom.tsx" "$DEST/$atom.tsx"
  [ -f "$CATALOG/$atom.manifest.json" ] && cp "$CATALOG/$atom.manifest.json" "$DEST/$atom.manifest.json"
  echo "  + $atom"
done

# cn — foundation utility, always installed
cn_state="$(printf '%s\n' "$STATUS" | awk '$2=="cn" {print $1}')"
if { [ "$cn_state" = "modified" ] || [ "$cn_state" = "unknown" ]; } && [ "$FORCE" -eq 0 ]; then
  SKIPPED="$SKIPPED cn"
  echo "  ~ cn (edited locally or unrecorded — skipped)"
else
  cp "$CATALOG/cn.ts" "$DEST/cn.ts"
  [ -f "$CATALOG/cn.manifest.json" ] && cp "$CATALOG/cn.manifest.json" "$DEST/cn.manifest.json"
  echo "  + cn (utility)"
fi

# Token substrate — generated fresh from spec/ so it's always current.
echo "Substrate:"
TOKENS_TMP="$(mktemp -d)"
trap 'rm -rf "$TOKENS_TMP"' EXIT
node "$LOOM_ROOT/scripts/code-templates/orchestrator.js" --only tokens --output "$TOKENS_TMP" >/dev/null
for f in tokens.css loom.css loom.components.css loom.tailwind.css; do
  cp "$TOKENS_TMP/$f" "$SRC/$f"
  echo "  + src/$f"
done

echo "Done → $DEST"

if [ -n "$SKIPPED" ]; then
  echo ""
  echo "Kept your edits — these were NOT resynced:"
  for atom in $SKIPPED; do echo "  ~ $atom"; done
  echo ""
  echo "They still hold your changes and may be missing catalog fixes. To see what you'd"
  echo "be taking, diff against the catalog:"
  for atom in $SKIPPED; do
    ext="tsx"; [ "$atom" = "cn" ] && ext="ts"
    echo "  diff \"$DEST/$atom.$ext\" \"$CATALOG/$atom.$ext\""
  done
  echo ""
  echo "Then re-run with --force to take the catalog version, or move your change to the"
  echo "call site (className / prop / a wrapper), which survives every resync by design."
fi

# npm packages the picked atoms import — reported, not installed (consumer owns their lockfile).
NPM_DEPS="$(node "$LOOM_ROOT/scripts/resolve-picks.js" "$PICKS" "$CATALOG" --npm)"
echo ""
echo "Next — install the packages these atoms import (once):"
echo "  npm install $NPM_DEPS"
echo ""
echo "Note: the stylesheets are auto-wired into globals.css by init.sh — nothing to do."
echo "Only if you bootstrapped globals.css yourself, add (after the tailwindcss import):"
echo "  @import \"../tokens.css\";          /* values — plain CSS */"
echo "  @import \"../loom.css\";            /* primitives — plain CSS */"
echo "  @import \"../loom.components.css\"; /* named components — plain CSS */"
echo "  @import \"../loom.tailwind.css\";   /* Tailwind v4 only */"
