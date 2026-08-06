#!/usr/bin/env bash
# install.sh — end-to-end consumer install, on a machine that has never seen Loom.
#
# Nothing in this repo runs init.sh. Every other reference to it is a doc string
# or the generator that writes it: verify.js checks the generator's OUTPUT, and
# catalog-playground/ is not installed through init.sh at all — it has its own
# package.json and takes tokens from a predev hook. So the app-shell install path
# has only ever been executed by a human, by hand, once. This is the only thing
# that runs it.
#
# The consumer project is created here and destroyed with the container. It is
# deliberately not a checked-in fixture: a fixture accumulates exactly what
# invalidates it — a superseded provider path, a hand-edited atom, a stale
# loom-picks.json — and then passes while a real consumer fails.
set -euo pipefail

ROOT=${LOOM_ROOT:-/loom}
APP=${APP_DIR:-/app/consumer}
PICKS_MODE=${PICKS:-archetype}

cd "$ROOT"

echo "=== 1/5 generate the catalog and the scaffold ==="
node scripts/code-templates/orchestrator.js

echo
echo "=== 2/5 create a consumer Next.js project ==="
# Pinned: create-next-app's flags move between majors, and an unpinned major that
# renames one turns this into an interactive prompt against a null stdin.
# --src-dir is required, not stylistic — init.sh's catalog tier validates src/app/.
mkdir -p "$(dirname "$APP")"
npx --yes create-next-app@15 "$APP" \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --no-turbopack --yes

echo
echo "=== 3/5 init.sh — app shell + token substrate ==="
cd "$ROOT/generated"
./scaffold/init.sh "$APP"

echo
echo "=== 4/5 setup.sh — atoms ==="
cd "$ROOT"
if [ "$PICKS_MODE" = "all" ]; then
  # Every atom. Derived from the catalog's own .tsx basenames rather than from
  # atoms.json, because setup.sh copies "$CATALOG/$atom.tsx" — so the filenames
  # ARE the valid pick ids by construction, and cannot drift from them.
  node -e '
    const fs = require("fs");
    const picks = fs.readdirSync("catalog")
      .filter(f => f.endsWith(".tsx"))
      .map(f => f.replace(/\.tsx$/, ""))
      .sort();
    fs.writeFileSync(process.argv[1] + "/loom-picks.json", JSON.stringify({ loom: { picks } }, null, 2));
    console.log("picks: all " + picks.length + " atoms");
  ' "$APP"
else
  echo "picks: the archetype-seeded set init.sh wrote (what a real consumer gets)"
fi
./setup.sh "$APP"

echo
echo "=== 5/5 install the atoms' npm dependencies, then build ==="
# setup.sh reports these and deliberately never installs them — the consumer owns
# their lockfile. A real consumer runs the line it prints; so does this.
DEPS="$(node scripts/resolve-picks.js "$APP/loom-picks.json" catalog --npm)"
cd "$APP"
[ -n "$DEPS" ] && npm install $DEPS
# `npm run build`, never `npx next build`: next bypasses npm's pre-hooks, and the
# prebuild hook is what writes the token substrate.
npm run build

echo
echo "=== install smoke test passed ==="
