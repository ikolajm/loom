#!/bin/bash
# setup.sh — install picked Loom catalog atoms into a consuming project.
#
# Usage: ./setup.sh <project-dir>
#   Reads <project-dir>/loom-picks.json, resolves each picked atom's manifest
#   `dependencies` transitively, and copies only the resolved atoms (+ cn) into
#   <project-dir>/src/components/. Atoms are project-owned after install — edit
#   freely; re-run setup.sh to resync. The token substrate (tokens.css) is
#   generated fresh from spec/ and delivered to <project-dir>/src/tokens.css.
set -euo pipefail

LOOM_ROOT="$(cd "$(dirname "$0")" && pwd)"
CATALOG="$LOOM_ROOT/catalog"
PROJECT="${1:?Usage: ./setup.sh <project-dir>}"
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

echo "Picked + resolved atoms:"
for atom in $ATOMS; do
  cp "$CATALOG/$atom.tsx" "$DEST/$atom.tsx"
  [ -f "$CATALOG/$atom.manifest.json" ] && cp "$CATALOG/$atom.manifest.json" "$DEST/$atom.manifest.json"
  echo "  + $atom"
done

# cn — foundation utility, always installed
cp "$CATALOG/cn.ts" "$DEST/cn.ts"
echo "  + cn (utility)"

# Token substrate — generated fresh from spec/ so it's always current.
echo "Substrate:"
TOKENS_TMP="$(mktemp -d)"
trap 'rm -rf "$TOKENS_TMP"' EXIT
node "$LOOM_ROOT/scripts/code-templates/orchestrator.js" --only tokens --output "$TOKENS_TMP" >/dev/null
cp "$TOKENS_TMP/tokens.css" "$SRC/tokens.css"
echo "  + src/tokens.css"

echo "Done → $DEST"

# npm packages the picked atoms import — reported, not installed (consumer owns their lockfile).
NPM_DEPS="$(node "$LOOM_ROOT/scripts/resolve-picks.js" "$PICKS" "$CATALOG" --npm)"
echo ""
echo "Next step 1 — install the packages these atoms import (once):"
echo "  npm install $NPM_DEPS"
echo ""
echo "Next step 2 — wire the substrate into your global stylesheet (once):"
echo "  @import \"tailwindcss\";"
echo "  @import \"../tokens.css\";   /* from src/app/globals.css */"
echo "(requires Tailwind v4 + @tailwindcss/postcss; atoms are role-token utilities)"
