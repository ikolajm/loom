/**
 * Generates init.sh — the one-time project bootstrap for the Loom app shell + token
 * substrate. Deliberately atom-agnostic: it installs only what does NOT depend on a
 * specific atom (ThemeProvider, globals, root layout, tokens.css, core deps).
 *
 * Atoms are a separate, repeatable step — the catalog sync at the repo root
 * (`./setup.sh <project>`), which resolves loom-picks.json. Two commands, two jobs:
 *   init.sh  → app shell + substrate (once)
 *   setup.sh → picked atoms + token refresh (repeatable)
 */

function generate() {
  // Core deps — atom-agnostic. Per-atom Radix deps come with their atoms (sync side).
  // tailwind-merge is pinned ^3: the generated cn() registers token scales via v3's
  // `theme` keys (radius/spacing), which v2 silently ignores — a hard minimum, not a preference.
  const coreDeps = [
    'class-variance-authority',
    'clsx',
    'lucide-react',
    'tailwind-merge@^3',
  ].sort();
  const depString = coreDeps.join(' ');

  return `#!/bin/bash
# init.sh — bootstrap the Loom app shell + token substrate into a Next.js + Tailwind v4 project.
#
# This is the one-time INIT step: theme mechanism, global stylesheet, root layout,
# token substrate, and core deps — everything that does NOT depend on a specific atom.
# Add atoms separately with the catalog sync: from the loom repo, run
#   ./setup.sh <this-project-dir>
#
# Usage: ./scaffold/init.sh <frontend-dir>
# Run from the generated/ directory. Idempotent.

set -euo pipefail

FRONTEND_DIR="\${1:?Usage: init.sh <frontend-dir>}"
SRC_DIR="$FRONTEND_DIR/src"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GEN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Loom init (app shell + substrate) ==="
echo "Source: $GEN_DIR"
echo "Target: $FRONTEND_DIR"
echo ""

# --- Validate ---
[ -f "$GEN_DIR/tokens.css" ] || { echo "ERROR: tokens.css not found in $GEN_DIR — run the orchestrator first."; exit 1; }
[ -d "$SRC_DIR/app" ]        || { echo "ERROR: $SRC_DIR/app not found — is this a Next.js project with src/?"; exit 1; }

# --- Step 1: App-shell directories (atoms land separately via setup.sh) ---
echo "[1/7] Creating app-shell directories..."
mkdir -p "$SRC_DIR/components/providers"

# --- Step 2: Token substrate ---
echo "[2/7] Copying tokens.css..."
cp "$GEN_DIR/tokens.css" "$SRC_DIR/tokens.css"

# --- Step 3: globals.css ---
echo "[3/7] Writing globals.css..."
cp "$SCRIPT_DIR/globals.css" "$SRC_DIR/app/globals.css"

# --- Step 4: Theme mechanism + root layout (atom-independent) ---
echo "[4/7] Writing ThemeProvider + layout..."
cp "$SCRIPT_DIR/ThemeProvider.tsx" "$SRC_DIR/components/providers/ThemeProvider.tsx"
cp "$SCRIPT_DIR/layout.tsx" "$SRC_DIR/app/layout.tsx"

# --- Step 5: Foundation preview route (one-time, consumer-owned) ---
# A /preview route rendering the token substrate (colors, type, spacing, radius)
# so the consumer can confirm their brand landed. Atom-agnostic. Never overwrites.
echo "[5/7] Writing /preview route..."
if [ ! -f "$SRC_DIR/app/preview/page.tsx" ]; then
  mkdir -p "$SRC_DIR/app/preview"
  cp "$SCRIPT_DIR/preview-page.tsx" "$SRC_DIR/app/preview/page.tsx"
  echo "  created src/app/preview/page.tsx (visit /preview to verify tokens; delete when done)"
else
  echo "  src/app/preview/page.tsx already exists — left as-is"
fi

# --- Step 6: Core dependencies (atom-agnostic) ---
# --prefix installs into the target without changing cwd, so every path in this
# script stays relative to the loom repo — no ordering landmine around a cd.
echo "[6/7] Installing core dependencies..."
npm install --prefix "$FRONTEND_DIR" ${depString}
echo "  ${coreDeps.length} core packages installed"

# --- Step 7: Starter loom-picks.json (the input setup.sh reads) ---
echo "[7/7] Writing starter loom-picks.json..."
if [ ! -f "$FRONTEND_DIR/loom-picks.json" ]; then
  cat > "$FRONTEND_DIR/loom-picks.json" <<'PICKS'
{
  "$schema": "Loom picker — list the atom names you want; setup.sh resolves their dependencies and copies them into src/components/. The full list of valid names is catalog/atoms.json in the Loom repo.",
  "loom": {
    "picks": ["button", "card"]
  }
}
PICKS
  echo "  created loom-picks.json (edit the picks, then run setup.sh)"
else
  echo "  loom-picks.json already exists — left as-is"
fi

echo ""
echo "=== App shell ready ==="
echo ""
echo "Next — edit loom-picks.json to pick your atoms, then sync (from the loom repo):"
echo "  ./setup.sh $FRONTEND_DIR"
`;
}

module.exports = { generate };
