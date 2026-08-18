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

const { applyPins } = require('../npm-pins');

// The starter pick-list. Two atoms, enough to prove the sync works; the consumer edits
// from there. It used to be seeded from the productType archetype's curated list —
// that supplier was cut with productType, and a seed nobody could predict was worth
// less than a pair anyone can read.
const STARTER_PICKS = ['button', 'card'];

function generate() {
  const picksBlock = STARTER_PICKS.map((p) => `      "${p}"`).join(',\n');
  const picksNote = 'A starter pair. Add the atoms you need.';

  // Core deps — atom-agnostic. Per-atom Radix deps come with their atoms (sync side).
  // Pins come from npm-pins.js, the same map setup.sh's printed line resolves through;
  // the two install surfaces disagreed on tailwind-merge while each held its own literal.
  const coreDeps = applyPins([
    'class-variance-authority',
    'clsx',
    'lucide-react',
    'tailwind-merge',
  ]);
  const depString = coreDeps.join(' ');

  return `#!/bin/bash
# init.sh — bootstrap the Loom app shell + token substrate into a Next.js + Tailwind v4 project.
#
# This is the one-time INIT step: theme mechanism, global stylesheet, root layout,
# token substrate, and core deps — everything that does NOT depend on a specific atom.
# Add atoms separately with the catalog sync: from the loom repo, run
#   ./setup.sh <this-project-dir>
#
# Usage: ./scaffold/init.sh <frontend-dir> [--tokens]
#   (default)  catalog tier — app shell + substrate + core deps + starter picker
#   --tokens   tokens tier  — tokens.css + tokens.json and nothing else
# Run from the generated/ directory. Idempotent.

set -euo pipefail

FRONTEND_DIR=""
TIER="catalog"
for arg in "$@"; do
  case "$arg" in
    --tokens) TIER="tokens" ;;
    *) [ -z "$FRONTEND_DIR" ] && FRONTEND_DIR="$arg" ;;
  esac
done
: "\${FRONTEND_DIR:?Usage: init.sh <frontend-dir> [--tokens]}"
SRC_DIR="$FRONTEND_DIR/src"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GEN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ "$TIER" = "tokens" ]; then
  echo "=== Loom init — tokens tier ==="
else
  echo "=== Loom init — catalog tier (app shell + substrate) ==="
fi
echo "Source: $GEN_DIR"
echo "Target: $FRONTEND_DIR"
echo ""

# --- Validate ---
# The tokens tier writes two files into src/ and touches nothing else, so it does not
# require src/app/ — it does not assume Next.js, or a React app at all.
[ -f "$GEN_DIR/tokens.css" ] || { echo "ERROR: tokens.css not found in $GEN_DIR — run the orchestrator first."; exit 1; }
if [ "$TIER" = "tokens" ]; then
  [ -d "$SRC_DIR" ] || { echo "ERROR: $SRC_DIR not found — expected a project with a src/ directory."; exit 1; }
else
  [ -d "$SRC_DIR/app" ] || { echo "ERROR: $SRC_DIR/app not found — is this a Next.js project with src/?"; exit 1; }
fi

# --- Tokens tier: the substrate, and stop ---------------------------------
# Everything below this block is the catalog tier: it writes a stylesheet, a layout, a
# provider and a route, and installs four packages. A consumer who wants Loom's design
# decisions as values and owns their own components should get none of that.
if [ "$TIER" = "tokens" ]; then
  echo "[1/2] Copying tokens.css..."
  cp "$GEN_DIR/tokens.css" "$SRC_DIR/tokens.css"

  echo "[2/2] Copying tokens.json..."
  if [ -f "$GEN_DIR/tokens.json" ]; then
    cp "$GEN_DIR/tokens.json" "$SRC_DIR/tokens.json"
  else
    echo "  tokens.json not found in $GEN_DIR — skipped (run the orchestrator to emit it)"
  fi

  echo ""
  echo "=== Tokens ready ==="
  echo ""
  echo "Wire the stylesheet into your global CSS, after the tailwindcss import:"
  echo "  @import \\"../tokens.css\\";   /* needs Tailwind v4 */"
  echo ""
  echo "tokens.json is the same data with no CSS runtime — for a native or non-web consumer."
  echo "No atoms were installed. To take them too, re-run without --tokens."
  exit 0
fi

# --- Step 1: App-shell directories (atoms land separately via setup.sh) ---
# src/providers/ is deliberately OUTSIDE src/components/. The two installs own disjoint
# paths so that clearing src/components/ — the obvious way to reset atoms and re-run
# setup.sh — cannot take the app shell with it. It used to, and the resulting build
# failure named a missing provider, which reads like a code defect rather than the
# consequence of the reset.
echo "[1/7] Creating app-shell directories..."
mkdir -p "$SRC_DIR/providers"

# --- Step 2: Token substrate ---
echo "[2/7] Copying tokens.css..."
cp "$GEN_DIR/tokens.css" "$SRC_DIR/tokens.css"

# --- Step 3: globals.css ---
echo "[3/7] Writing globals.css..."
cp "$SCRIPT_DIR/globals.css" "$SRC_DIR/app/globals.css"

# --- Step 4: Theme mechanism + root layout (atom-independent) ---
echo "[4/7] Writing ThemeProvider + layout..."
cp "$SCRIPT_DIR/ThemeProvider.tsx" "$SRC_DIR/providers/ThemeProvider.tsx"
cp "$SCRIPT_DIR/layout.tsx" "$SRC_DIR/app/layout.tsx"

# Projects scaffolded before the move carry a copy at the old path. The layout this
# script just wrote imports the new one, so the old file is dead — and a dead
# ThemeProvider next to a live one is how the next reader picks the wrong import.
if [ -f "$SRC_DIR/components/providers/ThemeProvider.tsx" ]; then
  rm -f "$SRC_DIR/components/providers/ThemeProvider.tsx"
  rmdir "$SRC_DIR/components/providers" 2>/dev/null || true
  echo "  removed the superseded copy at src/components/providers/ThemeProvider.tsx"
fi

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
  "$picks": "${picksNote}",
  "loom": {
    "picks": [
${picksBlock}
    ]
  }
}
PICKS
  echo "  created loom-picks.json (${STARTER_PICKS.length} starter picks — edit, then run setup.sh)"
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
