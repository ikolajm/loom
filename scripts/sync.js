#!/usr/bin/env node
/**
 * sync.js — install the Loom catalog and the token substrate into a consuming project.
 *
 * Usage: node scripts/sync.js <project-dir> [--tokens] [--force] [--refresh]
 *
 *   --tokens   the substrate only — no atoms, no install line, no framework assumption
 *   --force    overwrite atoms the consumer has edited locally
 *   --refresh  regenerate the catalog from spec/ first, then sync
 *
 * `--tokens` and the loom:sync script below came from init.sh when scaffold/ was cut. Both
 * belong here: this is the only thing that knows both paths, because it is invoked with
 * one and lives in the other. What did NOT come across is the app shell — a Next root
 * layout, a globals.css, a provider mount — because that is a framework's business and
 * ThemeProvider is in the catalog now, delivered like any other component.
 *
 * Replaces setup.sh and scripts/refresh-test.sh. Those were 145 lines of shell whose only
 * work was argument parsing, copying, and printing — every decision already lived in
 * check-local-edits.js and the orchestrator, which the shell called out to four times.
 * One language, and the helpers are imported rather than shelled.
 *
 * An atom the consumer has edited is SKIPPED, not overwritten, and named in the summary.
 * Skipping rather than prompting is deliberate: this runs unattended in CI, where a
 * [y/N] prompt hangs a build instead of protecting anything.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { checkLocalEdits } = require('./check-local-edits');
const { inputHash } = require('./catalog-stamp');

const LOOM_ROOT = path.resolve(__dirname, '..');
const CATALOG = path.join(LOOM_ROOT, 'catalog');
const SUBSTRATE = ['tokens.css', 'loom.css', 'loom.components.css', 'main.css'];

function die(lines) {
  for (const line of [].concat(lines)) console.error(line);
  process.exit(1);
}

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const project = argv.find((a) => !a.startsWith('--'));
  if (!project) die('Usage: node scripts/sync.js <project-dir> [--tokens] [--force] [--refresh]');

  const force = flags.has('--force');
  const tokensOnly = flags.has('--tokens');
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

  // Staleness is reported, not repaired. Regenerating on every sync would run the whole
  // pipeline — including a tsc pass over the catalog — so a consumer refreshing its
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

  // The whole catalog, and the consumer deletes what they do not want. There were six
  // manifests and one edge in the dependency graph — every atom needs `cn`, which is
  // copied unconditionally below anyway — so resolving a subset walked a graph to
  // return what it had been handed. Deleting a file you did not want is cheaper than
  // maintaining a pick list, and there is no id left to mistype.
  const atoms = fs
    .readdirSync(CATALOG)
    .filter((f) => f.endsWith('.manifest.json'))
    .map((f) => f.replace(/\.manifest\.json$/, ''))
    .filter((name) => name !== 'cn')
    .sort();

  const npmDependencies = [...new Set(
    [...atoms, 'cn'].flatMap((name) =>
      JSON.parse(fs.readFileSync(path.join(CATALOG, `${name}.manifest.json`), 'utf8')).npmDependencies || []
    )
  )].sort();

  if (!tokensOnly) fs.mkdirSync(dest, { recursive: true });

  // `cn` is checked with the rest — it is a delivered file with a manifest, and a
  // consumer who patched it deserves the same care as one who patched an atom.
  const states = tokensOnly ? new Map() : checkLocalEdits(dest, CATALOG, [...atoms, 'cn']);
  const skipped = [];

  if (tokensOnly) console.log('Atoms: skipped (--tokens)');
  else console.log('Atoms:');
  for (const atom of tokensOnly ? [] : [...atoms, 'cn']) {
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

  console.log(`Done → ${tokensOnly ? src : dest}`);

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

  addLoomSyncScript(project);

  if (!tokensOnly) {
    console.log('');
    console.log('Next — install the packages these atoms import (once):');
    console.log(`  npm install ${npmDependencies.join(' ')}`);
  }

  console.log('');
  console.log('Wire the substrate into your global stylesheet with one line:');
  console.log('  @import "./main.css";   /* path relative to that stylesheet */');
  console.log('');
  console.log('main.css imports the three in the order the cascade needs. Import them directly');
  console.log('instead if you own your components and want to drop the third:');
  console.log('  @import "./tokens.css";          /* values */');
  console.log('  @import "./loom.css";            /* the class layer */');
  console.log('  @import "./loom.components.css"; /* named components */');
  console.log('');
  console.log('Your own reset goes in @layer loom.reset, imported before tokens.css, or it');
  console.log('silently outranks the whole class layer. See docs/gotchas.md.');
}

/**
 * Add `loom:sync` to the project's package.json, so a refresh runs from the consumer's
 * own directory instead of from this repo.
 *
 * This is the one thing init.sh did that nothing else could: it knows the path between the
 * two repos. So does this script — it is invoked with the project directory and resolves
 * its own root — which is why the job moved here rather than being written by hand into a
 * README. An existing script is left alone; a project without a package.json says so and
 * moves on, because the tokens tier does not assume node.
 *
 * Deliberately not wired into `predev`. A consumer's dev server that cannot start without
 * a sibling repo present is a worse failure than a stale stylesheet, and it lands on
 * whoever clones the project next rather than on the person who set it up.
 */
function addLoomSyncScript(project) {
  const pkgPath = path.join(project, 'package.json');
  console.log('');
  if (!fs.existsSync(pkgPath)) {
    console.log('No package.json — skipped the loom:sync script.');
    return;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  if (pkg.scripts['loom:sync']) {
    console.log('loom:sync already in package.json — left as-is.');
    return;
  }
  const rel = path.relative(path.resolve(project), LOOM_ROOT).split(path.sep).join('/');
  pkg.scripts['loom:sync'] = `node ${rel}/scripts/sync.js .`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Added "loom:sync": "${pkg.scripts['loom:sync']}" — refresh from your own directory.`);
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { main };
