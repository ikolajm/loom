/**
 * Where a config file is read from, for every generator in this repo.
 *
 * Two roots, checked in order:
 *
 *   spec/config/local/  — your brand, written by `npm run configs`. GIT-IGNORED.
 *   spec/config/        — Loom's own look, committed. The fallback.
 *
 * The problem this solves: when the committed set was also the generator's write target,
 * generating a brand rewrote Loom's committed look and the diff rode along in the next
 * commit. That shipped twice, once reaching master. Git-ignoring the pipeline's input was
 * not enough; this covers its output.
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

/**
 * Where the local (brand) config set lives. `spec/config/local/` by default.
 *
 * `LOOM_LOCAL_CONFIG` redirects it, which is what makes a brand generation not evict the
 * one already there. `spec/config/local/` is a single slot: generating pb2's brand
 * overwrote loom-test's, and the only way to get it back was a manual copy. A consumer
 * regenerating its own substrate has no business mutating this repo at all.
 *
 * An environment variable rather than a flag because it has to survive two process
 * boundaries — sync.js spawns generate-configs and then the orchestrator, and threading a
 * path through both CLIs is more plumbing than the job needs. Both roots resolve here, so
 * the redirect covers the write side and the read side at once.
 */
const LOCAL_ROOT = process.env.LOOM_LOCAL_CONFIG
  ? path.resolve(process.env.LOOM_LOCAL_CONFIG)
  : path.join(COMMITTED_ROOT, 'local');

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
