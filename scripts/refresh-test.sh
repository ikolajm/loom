#!/bin/bash
# refresh-test.sh — Regenerate the catalog and re-install it into a test project.
#
# Usage:
#   ./scripts/refresh-test.sh <test-project-dir>
#
# Run from loom/. Regenerates catalog/ (+ tokens) from the current spec/, then
# re-runs setup.sh to resync the project's picked atoms + token substrate.
# The project must already have a loom-picks.json (run ./setup.sh <dir> once first).
#
# This is the catalog-model refresh: setup.sh owns the project layout, so this
# script no longer copies files directly — it regenerates, then delegates.

set -euo pipefail

TEST_DIR="${1:?Usage: refresh-test.sh <test-project-dir>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOOM_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

[ -f "$TEST_DIR/loom-picks.json" ] || {
  echo "ERROR: $TEST_DIR/loom-picks.json not found — run ./setup.sh $TEST_DIR once first."
  exit 1
}

echo "[1/2] Regenerating catalog from spec/..."
node "$LOOM_ROOT/scripts/code-templates/orchestrator.js" >/dev/null
echo "       catalog/ + tokens regenerated"

echo "[2/2] Re-installing picks into $TEST_DIR..."
"$LOOM_ROOT/setup.sh" "$TEST_DIR"
