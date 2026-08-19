/**
 * Generates init.sh — the one-time project bootstrap for the Loom app shell + token
 * substrate. Deliberately atom-agnostic: it installs only what does NOT depend on a
 * specific atom (ThemeProvider, globals, root layout, the three stylesheets, core deps).
 *
 * Atoms are a separate, repeatable step — the catalog sync at the repo root
 * (`npm run sync -- <project>`), which resolves loom-picks.json. Two commands, two jobs:
 *   init.sh  → app shell + substrate (once)
 *   npm run sync → picked atoms + token refresh (repeatable)
 */

const { applyPins } = require('../npm-pins');

// The starter pick-list. Two atoms, enough to prove the sync works; the consumer edits
// from there. It used to be seeded from the productType archetype's curated list —
// that supplier was cut with productType, and a seed nobody could predict was worth
// less than a pair anyone can read.
//
// `card` was the second until it became a class, at which point every freshly scaffolded
// project failed its first sync on an unknown atom. Nothing caught that: the catalog
// checks verify what the catalog contains, and this list is a string in a generator.
// `dialog` replaces it — a real behavior component, which is what the catalog is now.
const STARTER_PICKS = ['button', 'dialog'];

function generate() {
  const picksBlock = STARTER_PICKS.map((p) => `      "${p}"`).join(',\n');
  const picksNote = 'A starter pair. Add the atoms you need.';

  // Core deps — atom-agnostic. Per-atom Radix deps come with their atoms (sync side).
  // Pins come from npm-pins.js, the same map sync.js's printed line resolves through;
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
#   npm run sync -- <this-project-dir>
#
# Usage: ./scaffold/init.sh <frontend-dir> [--tokens]
#   (default)  catalog tier — app shell + substrate + core deps + starter picker
#   --tokens   tokens tier  — the three stylesheets + tokens.json and nothing else
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
# The tokens tier writes stylesheets and tokens.json into src/ and touches nothing else,
# so it does not require src/app/ — it does not assume Next.js, or a React app at all.
for f in tokens.css loom.css loom.components.css loom.tailwind.css; do
  [ -f "$GEN_DIR/$f" ] || { echo "ERROR: $f not found in $GEN_DIR — run the orchestrator first."; exit 1; }
done
if [ "$TIER" = "tokens" ]; then
  [ -d "$SRC_DIR" ] || { echo "ERROR: $SRC_DIR not found — expected a project with a src/ directory."; exit 1; }
else
  [ -d "$SRC_DIR/app" ] || { echo "ERROR: $SRC_DIR/app not found — is this a Next.js project with src/?"; exit 1; }
fi

# --- Tokens tier: the substrate, and stop ---------------------------------
# Everything below this block is the catalog tier: it writes a stylesheet, a layout, a
# provider and a route, and installs four packages. A consumer who wants Loom's design
# decisions as values and owns their own components should get none of that.
# --- The refresh loop, available to either tier -------------------------------
# A shell function rather than a step, because it used to sit below the tokens tier's
# exit and only the catalog tier ever ran it. That is backwards: the tokens tier is
# for a consumer who owns their own components and takes only the substrate, and that is
# the consumer whose copy goes stale most quietly — once the stylesheets are copied,
# nothing in their project references Loom at all.
add_loom_sync() {
  LOOM_REL="$(node -e "console.log(require('path').relative('$FRONTEND_DIR', '$SCRIPT_DIR/../..'))")"
  node - "$FRONTEND_DIR/package.json" "$LOOM_REL" <<'SCRIPTJS'
  const fs = require('fs');
  const [, , pkgPath, loomRel] = process.argv;
  if (!fs.existsSync(pkgPath)) { console.log('  no package.json — skipped'); process.exit(0); }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  if (pkg.scripts['loom:sync']) { console.log('  loom:sync already present — left as-is'); process.exit(0); }
  pkg.scripts['loom:sync'] = 'node ' + loomRel + '/scripts/sync.js .';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\\n');
  console.log('  added "loom:sync": "node ' + loomRel + '/scripts/sync.js ."');
SCRIPTJS
}

if [ "$TIER" = "tokens" ]; then
  echo "[1/3] Copying stylesheets..."
  cp "$GEN_DIR/tokens.css" "$SRC_DIR/tokens.css"
  cp "$GEN_DIR/loom.css" "$SRC_DIR/loom.css"
  cp "$GEN_DIR/loom.components.css" "$SRC_DIR/loom.components.css"
  cp "$GEN_DIR/loom.tailwind.css" "$SRC_DIR/loom.tailwind.css"

  echo "[2/3] Copying tokens.json..."
  if [ -f "$GEN_DIR/tokens.json" ]; then
    cp "$GEN_DIR/tokens.json" "$SRC_DIR/tokens.json"
  else
    echo "  tokens.json not found in $GEN_DIR — skipped (run the orchestrator to emit it)"
  fi

  echo "[3/3] Adding the loom:sync script..."
  add_loom_sync

  echo ""
  echo "=== Tokens ready ==="
  echo ""
  echo "Wire the stylesheets into your global CSS, in this order:"
  echo "  @import \\"../tokens.css\\";          /* custom properties — plain CSS */"
  echo "  @import \\"../loom.css\\";            /* primitives — plain CSS */"
  echo "  @import \\"../loom.components.css\\"; /* named components — optional, plain CSS */"
  echo "  @import \\"../loom.tailwind.css\\";   /* Tailwind v4 only — skip if you are not on it */"
  echo ""
  echo "The first two run anywhere CSS runs. loom.tailwind.css is @theme/@utility at-rules;"
  echo "a non-Tailwind build drops them without an error, so omit it rather than debug it."
  echo ""
  echo "tokens.json is the same data with no CSS runtime — for a native or non-web consumer."
  echo "No atoms were installed. To take them too, re-run without --tokens."
  echo ""
  echo "Refresh whenever the brand changes in the Loom repo:  npm run loom:sync"
  exit 0
fi

# --- Step 1: App-shell directories (atoms land separately via the sync) ---
# src/providers/ is deliberately OUTSIDE src/components/. The two installs own disjoint
# paths so that clearing src/components/ — the obvious way to reset atoms and re-run
# the sync — cannot take the app shell with it. It used to, and the resulting build
# failure named a missing provider, which reads like a code defect rather than the
# consequence of the reset.
echo "[1/8] Creating app-shell directories..."
mkdir -p "$SRC_DIR/providers"

# --- Step 2: Token substrate ---
# Three files: values, class layer, Tailwind bridge. globals.css (step 3) imports all
# three in that order — the bridge reads what the first two define.
echo "[2/8] Copying stylesheets..."
cp "$GEN_DIR/tokens.css" "$SRC_DIR/tokens.css"
cp "$GEN_DIR/loom.css" "$SRC_DIR/loom.css"
cp "$GEN_DIR/loom.components.css" "$SRC_DIR/loom.components.css"
cp "$GEN_DIR/loom.tailwind.css" "$SRC_DIR/loom.tailwind.css"

# --- Step 3: globals.css ---
echo "[3/8] Writing globals.css..."
cp "$SCRIPT_DIR/globals.css" "$SRC_DIR/app/globals.css"

# --- Step 4: Theme mechanism + root layout (atom-independent) ---
echo "[4/8] Writing ThemeProvider + layout..."
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
echo "[5/8] Writing /preview route..."
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
echo "[6/8] Installing core dependencies..."
npm install --prefix "$FRONTEND_DIR" ${depString}
echo "  ${coreDeps.length} core packages installed"

# --- Step 7: Starter loom-picks.json (the input the sync reads) ---
echo "[7/8] Writing starter loom-picks.json..."
if [ ! -f "$FRONTEND_DIR/loom-picks.json" ]; then
  cat > "$FRONTEND_DIR/loom-picks.json" <<'PICKS'
{
  "$schema": "Loom picker — list the atom names you want; the sync resolves their dependencies and copies them into src/components/. The full list of valid names is catalog/atoms.json in the Loom repo.",
  "$picks": "${picksNote}",
  "loom": {
    "picks": [
${picksBlock}
    ]
  }
}
PICKS
  echo "  created loom-picks.json (${STARTER_PICKS.length} starter picks — edit, then run the sync)"
else
  echo "  loom-picks.json already exists — left as-is"
fi

# --- Step 8: loom:sync script ------------------------------------------------
# The round trip used to be one-directional: you tune spec/answers.json in the Loom repo,
# and this project keeps rendering whatever substrate was last copied in until you go back
# there and re-run the sync. This puts the pull side in the project.
#
# Written here rather than by hand because init.sh is the only thing that knows the path
# between the two repos — it was invoked with it. Not wired into predev: a dev server
# that cannot start without a sibling repo present is a worse failure than a stale
# stylesheet, and it is discovered by whoever clones this next rather than by you.
echo "[8/8] Adding the loom:sync script..."
add_loom_sync

echo ""
echo "=== App shell ready ==="
echo ""
echo "Next — edit loom-picks.json to pick your atoms, then sync. From here:"
echo "  npm run loom:sync"
echo ""
echo "Re-run that whenever the brand changes in the Loom repo — it regenerates the token"
echo "substrate every time and tells you if the atoms have fallen behind."
`;
}

module.exports = { generate };
