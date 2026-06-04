/**
 * Generates setup.sh — the shell script that copies scaffold files
 * into the downstream Next.js project in the correct locations.
 */

function generate(configs, registry) {
  const defaultMode = configs.standards.colors['default-mode'] || 'dark';

  // Collect unique primitives from registry
  const primitives = new Set();
  if (registry) {
    for (const def of Object.values(registry)) {
      if (def.primitive && !def.primitive.startsWith('./')) primitives.add(def.primitive);
    }
  }
  // Always-needed deps
  const coreDeps = [
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'lucide-react',
  ];
  const allDeps = [...coreDeps, ...Array.from(primitives)].sort();
  const depString = allDeps.join(' ');

  return `#!/bin/bash
# setup.sh — Scaffold design system into a Next.js + Tailwind v4 project.
#
# Usage: ./scaffold/setup.sh <frontend-dir>
# Example: ./scaffold/setup.sh ./frontend
#
# Run from the generated/ directory. Each step is idempotent.

set -euo pipefail

FRONTEND_DIR="\${1:?Usage: setup.sh <frontend-dir>}"
SRC_DIR="$FRONTEND_DIR/src"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GEN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Design System Setup ==="
echo "Source:  $GEN_DIR"
echo "Target:  $FRONTEND_DIR"
echo ""

# --- Validate ---
if [ ! -f "$GEN_DIR/tokens.css" ]; then
  echo "ERROR: tokens.css not found in $GEN_DIR"
  exit 1
fi

if [ ! -d "$SRC_DIR/app" ]; then
  echo "ERROR: $SRC_DIR/app not found — is this a Next.js project with src/?"
  exit 1
fi

# --- Step 0: Answers receipt ---
if [ -f "$GEN_DIR/answers.json" ]; then
  echo "[0/8] Copying answers.json (generation receipt)..."
  cp "$GEN_DIR/answers.json" "$FRONTEND_DIR/answers.json"
fi

# --- Step 1: Directory structure ---
echo "[1/8] Creating directory structure..."
mkdir -p "$SRC_DIR/components/atoms"
mkdir -p "$SRC_DIR/components/molecules"
mkdir -p "$SRC_DIR/components/organisms"
mkdir -p "$SRC_DIR/components/providers"
mkdir -p "$SRC_DIR/components/playground"
mkdir -p "$SRC_DIR/stories"
mkdir -p "$SRC_DIR/app/design-system"
mkdir -p "$SRC_DIR/config/base"

# --- Step 1b: Config files (for ColorsView/TypographyView runtime imports) ---
SPEC_DIR="$(cd "$GEN_DIR/../spec" && pwd)"
cp "$SPEC_DIR/config/base/colors.json" "$SRC_DIR/config/base/colors.json"
cp "$SPEC_DIR/config/base/typography.json" "$SRC_DIR/config/base/typography.json"
cp "$SPEC_DIR/config/standards.json" "$SRC_DIR/config/standards.json"

# --- Step 2: Tokens ---
echo "[2/8] Copying tokens.css..."
cp "$GEN_DIR/tokens.css" "$SRC_DIR/tokens.css"

# --- Step 3: globals.css ---
echo "[3/8] Writing globals.css..."
cp "$SCRIPT_DIR/globals.css" "$SRC_DIR/app/globals.css"

# --- Step 4: Theme provider + toggle ---
echo "[4/8] Writing theme provider..."
cp "$SCRIPT_DIR/ThemeProvider.tsx" "$SRC_DIR/components/providers/ThemeProvider.tsx"
cp "$SCRIPT_DIR/ThemeToggle.tsx" "$SRC_DIR/components/providers/ThemeToggle.tsx"

# --- Step 5: Layout ---
echo "[5/8] Writing layout.tsx..."
cp "$SCRIPT_DIR/layout.tsx" "$SRC_DIR/app/layout.tsx"

# --- Step 6: Components, stories, playground ---
echo "[6/8] Copying components, stories, playground..."
cp "$GEN_DIR/components/"*.tsx "$SRC_DIR/components/atoms/" 2>/dev/null || true
cp "$GEN_DIR/components/"*.ts "$SRC_DIR/components/atoms/" 2>/dev/null || true
echo "  components -> atoms/"
cp "$GEN_DIR/stories/"* "$SRC_DIR/stories/" 2>/dev/null || true
echo "  stories -> stories/"
cp "$GEN_DIR/playground/"* "$SRC_DIR/components/playground/" 2>/dev/null || true
cp "$SCRIPT_DIR/ColorsView.tsx" "$SRC_DIR/components/playground/ColorsView.tsx"
cp "$SCRIPT_DIR/TypographyView.tsx" "$SRC_DIR/components/playground/TypographyView.tsx"
echo "  playground -> components/playground/"

# --- Step 7: Design system route ---
echo "[7/8] Writing /design-system route..."
cp "$SCRIPT_DIR/design-system-page.tsx" "$SRC_DIR/app/design-system/page.tsx"

# --- Step 8: Install dependencies ---
echo "[8/8] Installing dependencies..."
cd "$FRONTEND_DIR"
npm install ${depString}
echo "  ${allDeps.length} packages installed"

echo ""
echo "=== Done ==="
echo ""
echo "Next steps:"
echo "  cd $FRONTEND_DIR"
echo "  npm run dev"
echo "  -> visit /design-system"
`;
}

module.exports = { generate };
