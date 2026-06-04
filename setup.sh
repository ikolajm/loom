#!/bin/bash
# setup.sh — install picked Loom catalog atoms into a consuming project.
#
# Usage: ./setup.sh <project-dir>
#   Reads <project-dir>/loom-picks.json, resolves each picked atom's manifest
#   `dependencies` transitively, and copies only the resolved atoms (+ cn) into
#   <project-dir>/src/components/. Atoms are project-owned after install — edit
#   freely; re-run setup.sh to resync. Tokens ship separately as the substrate bundle.
set -euo pipefail

LOOM_ROOT="$(cd "$(dirname "$0")" && pwd)"
CATALOG="$LOOM_ROOT/catalog"
PROJECT="${1:?Usage: ./setup.sh <project-dir>}"
PICKS="$PROJECT/loom-picks.json"
DEST="$PROJECT/src/components"

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

echo "Done → $DEST"
