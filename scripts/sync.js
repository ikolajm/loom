#!/usr/bin/env node
/**
 * sync.js — install picked Loom atoms and the token substrate into a consuming project.
 *
 * Usage: node scripts/sync.js <project-dir> [--force] [--refresh]
 *
 *   --force    overwrite atoms the consumer has edited locally
 *   --refresh  regenerate the catalog from spec/ first, then sync
 *
 * Replaces setup.sh and scripts/refresh-test.sh. Those were 145 lines of shell whose only
 * work was argument parsing, copying, and printing — every decision already lived in
 * resolve-picks.js, check-local-edits.js and the orchestrator, which the shell called out
 * to four times. One language, and the three helpers are now imported rather than shelled.
 *
 * An atom the consumer has edited is SKIPPED, not overwritten, and named in the summary.
 * Skipping rather than prompting is deliberate: this runs unattended (the playground
 * resync inside `npm run generate`, CI), where a [y/N] prompt hangs a build instead of
 * protecting anything.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { resolvePicks, PickError } = require('./resolve-picks');
const { checkLocalEdits } = require('./check-local-edits');
const { inputHash } = require('./catalog-stamp');

const LOOM_ROOT = path.resolve(__dirname, '..');
const CATALOG = path.join(LOOM_ROOT, 'catalog');
const SUBSTRATE = ['tokens.css', 'loom.css', 'loom.components.css', 'loom.tailwind.css'];

function die(lines) {
  for (const line of [].concat(lines)) console.error(line);
  process.exit(1);
}

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const project = argv.find((a) => !a.startsWith('--'));
  if (!project) die('Usage: node scripts/sync.js <project-dir> [--force] [--refresh]');

  const force = flags.has('--force');
  const picksPath = path.join(project, 'loom-picks.json');
  const src = path.join(project, 'src');
  const dest = path.join(src, 'components');

  if (flags.has('--refresh')) {
    console.log('Regenerating the catalog from spec/...');
    execFileSync('node', [path.join(LOOM_ROOT, 'scripts/code-templates/orchestrator.js')], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
  }

  if (!fs.existsSync(CATALOG)) {
    die('ERROR: catalog/ not found — run: node scripts/code-templates/orchestrator.js --only components');
  }
  if (!fs.existsSync(picksPath)) die(`ERROR: ${picksPath} not found`);

  // Staleness is reported, not repaired. Regenerating on every sync would run the whole
  // pipeline — including a tsc pass over the playground — so a consumer refreshing its
  // brand could fail on a surface it has never heard of. Saying so costs a line.
  const stampPath = path.join(CATALOG, 'atoms.json');
  let stale = false;
  if (fs.existsSync(stampPath) && !flags.has('--refresh')) {
    const recorded = JSON.parse(fs.readFileSync(stampPath, 'utf8')).$inputs;
    stale = recorded !== undefined && recorded !== inputHash();
  }

  console.log('=== Loom sync ===');
  console.log(`Catalog: ${CATALOG}`);
  console.log(`Project: ${project}`);
  if (stale) {
    console.log('');
    console.log('Note: catalog/ was built from older schemas or templates than the ones on disk.');
    console.log('      The substrate below is always regenerated, so your tokens are current —');
    console.log('      it is the atoms that may lag. Re-run with --refresh to rebuild them first.');
  }

  let atoms;
  let npmDependencies;
  try {
    ({ atoms, npmDependencies } = resolvePicks(picksPath, CATALOG));
  } catch (e) {
    if (!(e instanceof PickError)) throw e;
    die(['', ...e.lines, '', 'Nothing was copied.']);
  }

  fs.mkdirSync(dest, { recursive: true });

  // `cn` is checked with the rest — it is a delivered file with a manifest, and a
  // consumer who patched it deserves the same care as one who patched an atom.
  const states = checkLocalEdits(dest, CATALOG, [...atoms, 'cn']);
  const skipped = [];

  console.log('Picked + resolved atoms:');
  for (const atom of [...atoms, 'cn']) {
    const state = states.get(atom);
    // `unknown` is skipped too: the file is installed but carries no delivery record, so
    // "has the consumer edited it" is unanswerable — and answering "no" is the silent
    // overwrite this whole mechanism exists to stop.
    if (!force && (state === 'modified' || state === 'unknown')) {
      skipped.push(atom);
      const why = state === 'unknown' ? 'no manifest to compare against' : 'edited locally';
      console.log(`  ~ ${atom} (${why} — skipped)`);
      continue;
    }
    const file = atom === 'cn' ? 'cn.ts' : `${atom}.tsx`;
    fs.copyFileSync(path.join(CATALOG, file), path.join(dest, file));
    const manifest = `${atom}.manifest.json`;
    if (fs.existsSync(path.join(CATALOG, manifest))) {
      fs.copyFileSync(path.join(CATALOG, manifest), path.join(dest, manifest));
    }
    console.log(`  + ${atom}${atom === 'cn' ? ' (utility)' : ''}`);
  }

  // The substrate is generated fresh rather than copied from generated/, so a sync always
  // delivers what spec/ currently says rather than what the last build happened to leave.
  console.log('Substrate:');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loom-'));
  try {
    execFileSync(
      'node',
      [path.join(LOOM_ROOT, 'scripts/code-templates/orchestrator.js'), '--only', 'tokens', '--output', tmp],
      { stdio: ['ignore', 'ignore', 'inherit'] }
    );
    for (const f of SUBSTRATE) {
      fs.copyFileSync(path.join(tmp, f), path.join(src, f));
      console.log(`  + src/${f}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(`Done → ${dest}`);

  if (skipped.length) {
    console.log('');
    console.log('Kept your edits — these were NOT resynced:');
    for (const atom of skipped) console.log(`  ~ ${atom}`);
    console.log('');
    console.log("They still hold your changes and may be missing catalog fixes. To see what you'd");
    console.log('be taking, diff against the catalog:');
    for (const atom of skipped) {
      const ext = atom === 'cn' ? 'ts' : 'tsx';
      console.log(`  diff "${path.join(dest, `${atom}.${ext}`)}" "${path.join(CATALOG, `${atom}.${ext}`)}"`);
    }
    console.log('');
    console.log('Then re-run with --force to take the catalog version, or move your change to the');
    console.log('call site (className / prop / a wrapper), which survives every resync by design.');
  }

  console.log('');
  console.log('Next — install the packages these atoms import (once):');
  console.log(`  npm install ${npmDependencies.join(' ')}`);
  console.log('');
  console.log('Note: the stylesheets are auto-wired into globals.css by init.sh — nothing to do.');
  console.log('Only if you bootstrapped globals.css yourself, add (after the tailwindcss import):');
  console.log('  @import "../tokens.css";          /* values — plain CSS */');
  console.log('  @import "../loom.css";            /* primitives — plain CSS */');
  console.log('  @import "../loom.components.css"; /* named components — plain CSS */');
  console.log('  @import "../loom.tailwind.css";   /* Tailwind v4 only */');
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { main };
