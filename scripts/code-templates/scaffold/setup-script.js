/**
 * Generates init.sh — the one-time project bootstrap for the Loom app shell + token
 * substrate. Deliberately atom-agnostic: it installs only what does NOT depend on a
 * specific atom (ThemeProvider, globals, root layout, tokens.css, core deps).
 *
 * Atoms are a separate, repeatable step — the catalog sync at the repo root
 * (`./setup.sh <project>`), which resolves loom-picks.json. Two commands, two jobs:
 *   init.sh  → app shell + substrate (once)
 *   setup.sh → picked atoms + token refresh (repeatable)
 *
 * Component-coupled extras (ThemeToggle, the /design-system gallery route, the
 * foundation views) are NOT installed here — they consume atoms, so they belong to
 * the component flow and install after their atoms are synced.
 */

function generate() {
  // Core deps — atom-agnostic. Per-atom Radix deps come with their atoms (sync side).
  const coreDeps = [
    'class-variance-authority',
    'clsx',
    'lucide-react',
    'tailwind-merge',
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
echo "[1/5] Creating app-shell directories..."
mkdir -p "$SRC_DIR/components/providers"

# --- Step 2: Token substrate ---
echo "[2/5] Copying tokens.css..."
cp "$GEN_DIR/tokens.css" "$SRC_DIR/tokens.css"

# --- Step 3: globals.css ---
echo "[3/5] Writing globals.css..."
cp "$SCRIPT_DIR/globals.css" "$SRC_DIR/app/globals.css"

# --- Step 4: Theme mechanism + root layout (atom-independent) ---
echo "[4/5] Writing ThemeProvider + layout..."
cp "$SCRIPT_DIR/ThemeProvider.tsx" "$SRC_DIR/components/providers/ThemeProvider.tsx"
cp "$SCRIPT_DIR/layout.tsx" "$SRC_DIR/app/layout.tsx"

# --- Step 5: Core dependencies (atom-agnostic) ---
echo "[5/5] Installing core dependencies..."
cd "$FRONTEND_DIR"
npm install ${depString}
echo "  ${coreDeps.length} core packages installed"

echo ""
echo "=== App shell ready ==="
echo ""
echo "Next — add atoms (from the loom repo):"
echo "  ./setup.sh $FRONTEND_DIR   # loom-picks.json -> picked atoms + token refresh"
echo ""
echo "ThemeToggle and the /design-system gallery route consume atoms, so they install"
echo "as part of the component flow once their atoms are synced — not here."
`;
}

module.exports = { generate };
