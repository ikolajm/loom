/**
 * Where a config file is read from, for every generator in this repo.
 *
 * Two roots, checked in order:
 *
 *   spec/config/local/  — your brand, written by `npm run configs`. GIT-IGNORED.
 *   spec/config/        — Loom's own look, committed. The fallback.
 *
 * The problem this solves: `spec/config/base/*.json` used to be both a tracked file
 * and the generator's write target, so generating a brand rewrote Loom's committed
 * look and the diff rode along in the next commit. That shipped twice — an abandoned
 * Availo brand left dirty on master (2026-07-16) and a dashboard's orange that reached
 * master and stayed live for a day (2026-08-04). `.gitignore` already claimed this was
 * handled: its comment on spec/answers.json reads "Keeping it out of the repo means
 * generating your brand never dirties the Loom working tree." That covered the
 * pipeline's input and missed its output. This covers the output.
 *
 * Why not just git-ignore spec/config/base/: `loadAllConfigs()` needs those five files
 * to exist, so ignoring them makes a fresh clone unbuildable until it runs
 * `npm run configs`, which needs spec/answers.json — also ignored. Keeping a committed
 * default set and preferring a local one over it means a fresh clone builds Loom's look
 * with no answers file at all, and a brand generation never touches a tracked path.
 *
 * The committed set is guarded: `base-config-provenance` in code-templates/verify.js
 * fails the build if spec/config/base/ stops matching what answers.example.json
 * generates. Read the committed set with COMMITTED_ROOT, never through resolve() —
 * a provenance check that reads whatever is local checks nothing.
 */
const fs = require('fs');
const path = require('path');

const COMMITTED_ROOT = path.resolve(__dirname, '../spec/config');
const LOCAL_ROOT = path.join(COMMITTED_ROOT, 'local');

/** Absolute path to `rel`, preferring the local set when it has that file. */
function resolve(rel) {
  const local = path.join(LOCAL_ROOT, rel);
  return fs.existsSync(local) ? local : path.join(COMMITTED_ROOT, rel);
}

/** Read + parse `rel` through resolve(). The one loader every generator uses. */
function loadConfig(rel) {
  return JSON.parse(fs.readFileSync(resolve(rel), 'utf-8'));
}

/** Which root a file actually came from — for run logs, so the source is never a guess. */
function sourceOf(rel) {
  return fs.existsSync(path.join(LOCAL_ROOT, rel)) ? 'local' : 'committed';
}

module.exports = { COMMITTED_ROOT, LOCAL_ROOT, resolve, loadConfig, sourceOf };
