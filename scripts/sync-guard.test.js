#!/usr/bin/env node
/**
 * sync-guard.test.js — the overwrite guard's verdicts, against a real directory.
 *
 * The guard is the one mechanism protecting a consumer's edits from a resync, and it had
 * never been exercised except by using it. It reported `badge (edited locally — skipped)`
 * on a file a consumer had never touched: the installed source and its delivered manifest
 * had diverged, and the guard has no way to say that, so it blamed the consumer.
 *
 * Its failure mode is quiet by construction. A wrongly-flagged atom stops receiving
 * upstream fixes and the only signal is one line in the sync output that reads as though
 * you had edited it — everything downstream keeps passing.
 *
 * Run: node scripts/sync-guard.test.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { checkLocalEdits } = require('./check-local-edits');

const CATALOG = path.resolve(__dirname, '../catalog');
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);

let failed = 0;
let ran = 0;

function scenario(name, expected, build) {
  ran++;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loom-guard-'));
  try {
    build(dir);
    const actual = checkLocalEdits(dir, CATALOG, ['badge']).get('badge');
    const ok = actual === expected;
    if (!ok) failed++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(56)} expected ${expected}, got ${actual}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const catalogSrc = () => fs.readFileSync(path.join(CATALOG, 'badge.tsx'), 'utf8');
const catalogManifest = () => JSON.parse(fs.readFileSync(path.join(CATALOG, 'badge.manifest.json'), 'utf8'));

const put = (dir, src, manifestVersion) => {
  fs.writeFileSync(path.join(dir, 'badge.tsx'), src);
  if (manifestVersion !== null) {
    const m = { ...catalogManifest(), version: manifestVersion };
    fs.writeFileSync(path.join(dir, 'badge.manifest.json'), JSON.stringify(m, null, 2) + '\n');
  }
};

console.log('overwrite guard verdicts\n');

scenario('nothing installed', 'fresh', () => {});

scenario('delivered and untouched', 'clean', (d) => {
  const src = catalogSrc();
  put(d, src, hash(src));
});

scenario('the consumer edited it', 'modified', (d) => {
  const src = catalogSrc() + '\n// a local patch\n';
  put(d, src, hash(catalogSrc()));
});

scenario('no manifest, and the file differs from the catalog', 'unknown', (d) => {
  put(d, catalogSrc() + '\n// patched before manifests shipped\n', null);
});

// The bootstrap branch: no delivery record, but byte-identical to the catalog proves it
// unedited, so the manifest can land and end the state.
scenario('no manifest, but byte-identical to the catalog', 'clean', (d) => {
  put(d, catalogSrc(), null);
});

// THE ONE THIS EXISTS FOR.
//
// The installed source IS the current catalog file, byte for byte. The consumer cannot
// have edited it — there is nothing to edit it into that would come out identical. Only
// the manifest disagrees, which means the pair was delivered split: sync copies the
// source and the manifest in two calls with no transaction around them, and the generator
// writes them in two calls too.
//
// The guard compares hash(source) to manifest.version and sees a mismatch, so it says
// `modified` and the sync skips the atom. The consumer is told they edited a file they
// never opened, and stops receiving upstream fixes to it.
scenario('file matches the catalog exactly, manifest records something else', 'inconsistent', (d) => {
  put(d, catalogSrc(), 'ffffffffffff');
});

console.log(`\n${ran} scenarios, ${failed} failing`);
process.exit(failed ? 1 : 0);
