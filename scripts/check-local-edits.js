#!/usr/bin/env node
/**
 * Which of a project's installed atoms has the consumer edited?
 *
 * Loom's promise is that atoms are project-owned — install them, then edit them freely.
 * `setup.sh` used to break that promise on every resync: a plain `cp` over each installed
 * atom, no diff, no backup, no warning. A consuming project hand-patched `badge.tsx`
 * for a defect Loom had shipped, and two later resyncs — adding `select`, then
 * `form-field` — silently reverted the patch both times. Each resync was run to pick up
 * a fix for a *different* Loom defect, so the consumer re-broke by doing the right thing.
 *
 * The detector is already in the artifact. Every atom ships a `manifest.json` carrying
 * `version`, the first 12 hex of sha256 over that atom's generated source
 * (generate-components.js). The installed manifest is therefore a record of exactly what
 * the sync last delivered — no sidecar state file, no install log, nothing to keep in
 * sync. Re-hash the installed .tsx and compare:
 *
 *   hash(local source) === local manifest.version   → untouched since delivery
 *   hash(local source) !== local manifest.version   → the consumer edited it
 *
 * A locally-edited atom whose catalog version ALSO moved is the only interesting case:
 * that is the one where overwriting destroys work, and where skipping withholds a fix.
 * sync.js skips it and says so, rather than picking for the consumer.
 *
 * Returns one status per resolved atom (and prints them, run as a CLI):
 *   fresh        — not installed yet
 *   clean        — installed, unmodified; safe to overwrite
 *   modified     — installed and edited locally
 *   unknown      — installed but no local manifest, so no delivery record to compare against
 *   inconsistent — the installed source IS the current catalog file, byte for byte, and
 *                  only its manifest disagrees. The consumer cannot have edited it into
 *                  something identical to the catalog, so this is a split pair: the source
 *                  and the manifest are copied in two calls with no transaction around
 *                  them, at both ends. Without this verdict the guard said `modified` and
 *                  told a consumer they had edited a file they never opened, which is how
 *                  it was found.
 *
 * The drift is one-directional, which is worth stating because the opposite was claimed
 * once: `clean` requires hash(installed) === manifest.version, so ANY divergence pushes
 * the verdict toward `modified`. A false negative would need a consumer's edit to hash to
 * the same value as the catalog file, which means it is the catalog file. It cries wolf;
 * it does not wave things through.
 *
 * Usage: node check-local-edits.js <dest-dir> <catalog-dir> <atom>...
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** @returns {Map<string,'fresh'|'clean'|'modified'|'unknown'|'inconsistent'>} */
function checkLocalEdits(dest, catalog, atoms) {
  const states = new Map();
  const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
  // The delivered filename comes from the catalog manifest, not from a list of which
  // atoms are not .tsx. That list was `atom === 'cn' ? 'cn.ts' : ...` in two files, which
  // held until a second non-.tsx artifact existed. Falls back for a catalog generated
  // before manifests carried `file`, so an older install still resolves.
  const sourceName = (atom) => {
    try {
      const m = JSON.parse(fs.readFileSync(path.join(catalog, `${atom}.manifest.json`), 'utf8'));
      if (m.file) return m.file;
    } catch { /* fall through */ }
    return atom === 'cn' ? 'cn.ts' : `${atom}.tsx`;
  };

  for (const atom of atoms) {
    const localSrc = path.join(dest, sourceName(atom));
    const localManifest = path.join(dest, `${atom}.manifest.json`);

    if (!fs.existsSync(localSrc)) {
      states.set(atom, 'fresh');
      continue;
    }
    // No local manifest means no delivery record — but there is a second way to prove the
    // file is unedited: it is byte-identical to the catalog. Overwriting it is then a
    // no-op, so it is safe to copy and to deliver the manifest that ends this state.
    // Without this, anything installed before manifests were delivered alongside — `cn`,
    // every atom in an older install — is permanently `unknown`: skipped, so the manifest
    // never lands, so it is skipped again. The check bootstraps itself instead.
    if (!fs.existsSync(localManifest)) {
      const catalogSrc = path.join(catalog, sourceName(atom));
      const identical =
        fs.existsSync(catalogSrc) &&
        fs.readFileSync(catalogSrc, 'utf8') === fs.readFileSync(localSrc, 'utf8');
      states.set(atom, identical ? 'clean' : 'unknown');
      continue;
    }

    let delivered;
    try {
      delivered = JSON.parse(fs.readFileSync(localManifest, 'utf8')).version;
    } catch {
      states.set(atom, 'unknown');
      continue;
    }

    // A manifest with no version predates the content hash, or had it overridden by a
    // config's $catalog.version — either way there is no delivery record to compare, and
    // guessing "clean" would overwrite an edit. No config sets that override today.
    if (!delivered) {
      states.set(atom, 'unknown');
      continue;
    }

    const src = fs.readFileSync(localSrc, 'utf8');
    const local = hash(src);
    if (local === delivered) {
      states.set(atom, 'clean');
      continue;
    }

    // Byte-identical to the catalog with a manifest that says otherwise. Nothing a
    // consumer could type produces this; the pair was delivered split. Safe to repair,
    // because the source is already what a resync would write — only the manifest is
    // wrong, and rewriting it destroys nothing.
    const catalogSrc = path.join(catalog, sourceName(atom));
    if (fs.existsSync(catalogSrc) && fs.readFileSync(catalogSrc, 'utf8') === src) {
      states.set(atom, 'inconsistent');
      continue;
    }

    states.set(atom, 'modified');
  }

  return states;
}

// --- CLI ---
if (require.main === module) {
  const [dest, catalog, ...atoms] = process.argv.slice(2);
  if (!dest || !catalog || !atoms.length) {
    console.error('Usage: check-local-edits.js <dest-dir> <catalog-dir> <atom>...');
    process.exit(1);
  }
  for (const [atom, state] of checkLocalEdits(dest, catalog, atoms)) {
    console.log(`${state}\t${atom}`);
  }
}

module.exports = { checkLocalEdits };
