#!/bin/bash
# refresh-test.sh — Regenerate code bundle and re-deploy to test project.
#
# Usage:
#   ./scripts/refresh-test.sh <test-project-dir>
#   ./scripts/refresh-test.sh <test-project-dir> --only components
#
# Run from loom/. Regenerates the code bundle (all or targeted),
# then re-copies generated files to the test project. Does NOT create
# directories or install deps — use scaffold/setup.sh for first-time setup.

set -euo pipefail

TEST_DIR="${1:?Usage: refresh-test.sh <test-project-dir> [--only <generator>]}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GEN_DIR="$DS_DIR/generated"
SRC_DIR="$TEST_DIR/src"

# --- Validate ---
if [ ! -d "$SRC_DIR/components/atoms" ]; then
  echo "ERROR: $SRC_DIR/components/atoms not found."
  echo "Run scaffold/setup.sh first for initial project setup."
  exit 1
fi

# --- Step 1: Regenerate ---
echo "[1/2] Regenerating code bundle..."
ONLY_ARGS=""
if [ "${2:-}" = "--only" ] && [ -n "${3:-}" ]; then
  ONLY_ARGS="--only $3"
  echo "       (targeted: $3 only)"
fi
node "$DS_DIR/scripts/code-templates/orchestrator.js" $ONLY_ARGS

# --- Step 2: Re-deploy ---
echo ""
echo "[2/2] Deploying to $TEST_DIR..."

# Config (source of truth for foundation views)
mkdir -p "$SRC_DIR/config/base"
cp "$DS_DIR/spec/config/standards.json" "$SRC_DIR/config/"
cp "$DS_DIR/spec/config/base/"*.json "$SRC_DIR/config/base/"
echo "  config -> config/"

# Tokens
cp "$GEN_DIR/tokens.css" "$SRC_DIR/tokens.css"
echo "  tokens.css"

# Components
cp "$GEN_DIR/components/"*.tsx "$SRC_DIR/components/atoms/" 2>/dev/null || true
cp "$GEN_DIR/components/"*.ts "$SRC_DIR/components/atoms/" 2>/dev/null || true
echo "  components -> atoms/"

# Stories (clean stale files first, then copy fresh)
rm -f "$SRC_DIR/stories/"*.story.ts "$SRC_DIR/stories/"*.story.tsx 2>/dev/null || true
cp "$GEN_DIR/stories/"* "$SRC_DIR/stories/" 2>/dev/null || true
echo "  stories -> stories/"

# Playground
cp "$GEN_DIR/playground/"* "$SRC_DIR/components/playground/" 2>/dev/null || true
echo "  playground -> playground/"

# Scaffold files
cp "$GEN_DIR/scaffold/globals.css" "$SRC_DIR/app/globals.css"
cp "$GEN_DIR/scaffold/ThemeProvider.tsx" "$SRC_DIR/components/providers/ThemeProvider.tsx"
cp "$GEN_DIR/scaffold/ThemeToggle.tsx" "$SRC_DIR/components/providers/ThemeToggle.tsx"
cp "$GEN_DIR/scaffold/layout.tsx" "$SRC_DIR/app/layout.tsx"
cp "$GEN_DIR/scaffold/design-system-page.tsx" "$SRC_DIR/app/design-system/page.tsx"
cp "$GEN_DIR/scaffold/ColorsView.tsx" "$SRC_DIR/components/playground/ColorsView.tsx" 2>/dev/null || true
cp "$GEN_DIR/scaffold/TypographyView.tsx" "$SRC_DIR/components/playground/TypographyView.tsx" 2>/dev/null || true
echo "  scaffold -> app/ + providers/ + playground/"

echo ""
echo "=== Refreshed ==="
echo ""
echo "Next:"
echo "  cd $TEST_DIR && npm run build"
