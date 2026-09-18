#!/usr/bin/env node
/**
 * sync.js — install the Loom catalog and the token substrate into a consuming project.
 *
 * Usage: node scripts/sync.js <project-dir> [--tokens] [--force] [--refresh]
 *
 *   --answers <file>  the brand to build from, resolved into a throwaway config root so
 *                     this repo's own spec/config/local/ is never written to
 *   --tokens   the substrate only — no atoms, no install line, no framework assumption
 *   --force    overwrite atoms the consumer has edited locally. Takes an optional list:
 *              `--force badge,select` overwrites those two and leaves every other edit
 *              alone. Bare `--force` still means all of them, which is the blunt form and
 *              is why the list exists — repairing one wrongly-flagged atom used to mean
 *              disabling the guard for every atom, destroying a real edit elsewhere to
 *              fix a false positive here.
 *   --refresh  regenerate the catalog from spec/ first, then sync
 *
 * Without --answers the substrate is emitted from whichever brand is active in this repo,
 * which is the right default for a maintainer and the wrong one for a consumer. A project
 * that owns its answers file passes it and becomes reproducible from its own repo.
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
  // --answers takes a value, so its argument is not a project directory.
  const answersIdx = argv.indexOf('--answers');
  const answers = answersIdx === -1 ? null : argv[answersIdx + 1];
  // The guard is on answersIdx, not on the sum: with the flag absent it is -1, and
  // -1 + 1 is the index the project directory sits at.
  const answersValueIdx = answersIdx === -1 ? -1 : answersIdx + 1;
  // A --force list is a value too, so it must not be mistaken for the project directory.
  const forceValueIdx = (() => {
    const i = argv.indexOf('--force');
    return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? i + 1 : -1;
  })();
  const project = argv.find((a, i) => !a.startsWith('--') && i !== answersValueIdx && i !== forceValueIdx);
  if (!project) die('Usage: node scripts/sync.js <project-dir> [--answers <file>] [--tokens] [--force] [--refresh]');
  if (answersIdx !== -1 && (!answers || answers.startsWith('--'))) {
    die('--answers needs a path to an answers JSON file.');
  }
  if (answers && !fs.existsSync(answers)) {
    die([`ERROR: answers file not found: ${answers}`,
         'This is the brand input. Without it the sync emits whichever brand is active in',
         'the Loom repo, which is how a project ends up wearing another brand.']);
  }

  // `--force` alone means every atom; `--force a,b` means those. The value is read the
  // same way --answers reads its own, and the index guard is on the flag rather than on
  // the sum: with the flag absent indexOf is -1, and -1 + 1 is the project directory.
  const forceIdx = argv.indexOf('--force');
  const forceArg = forceIdx === -1 ? null : argv[forceIdx + 1];
  const forceList = forceArg && !forceArg.startsWith('--')
    ? new Set(forceArg.split(',').map((a) => a.trim()).filter(Boolean))
    : null;
  const force = forceIdx !== -1;
  const forces = (atom) => force && (!forceList || forceList.has(atom));
  const tokensOnly = flags.has('--tokens');
  const src = path.join(project, 'src');
  // A directory of Loom's own, not `src/components/` itself. Interleaving delivered files
  // with the consumer's meant nothing downstream could address one set without the other:
  // the first consumer's lint run produced 14 errors, all in files it had not written, and
  // the only fix available was an override naming each one — which a seventh atom then
  // arrives outside of. One glob covers every atom, now and later.
  const dest = path.join(src, 'components', 'loom');
  const legacyDest = path.join(src, 'components');

  // The brand, built into a throwaway config root rather than into spec/config/local/.
  // That directory is a single slot, so generating a consumer brand there evicts whatever
  // was in it — and a project regenerating its own substrate has no business writing to
  // this repo at all. LOOM_LOCAL_CONFIG redirects both the write and the read; see
  // config-paths.js. Cleaned up in the finally below, alongside the emit directory.
  let cfgRoot = null;
  if (answers) {
    cfgRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'loom-cfg-'));
    execFileSync(
      'node',
      [path.join(LOOM_ROOT, 'scripts/generate-configs/index.js'), '--input', path.resolve(answers)],
      { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, LOOM_LOCAL_CONFIG: cfgRoot } }
    );
  }
  // Every child process reads the same config set, so --refresh cannot rebuild the atoms
  // against one brand while the substrate comes from another.
  const childEnv = cfgRoot ? { ...process.env, LOOM_LOCAL_CONFIG: cfgRoot } : process.env;

  if (flags.has('--refresh')) {
    console.log('Regenerating the catalog from spec/...');
    execFileSync('node', [path.join(LOOM_ROOT, 'scripts/code-templates/orchestrator.js')], {
      stdio: ['ignore', 'ignore', 'inherit'],
      env: childEnv,
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

  // The whole catalog, every run. A consumer CANNOT opt out by deleting: check-local-edits
  // reports a missing file as `fresh`, which is right for a first install and
  // indistinguishable from a deletion, so the file returns on the next sync. That is
  // acceptable only because an unimported component is tree-shaken — verified downstream,
  // where seven synced atoms with none imported left the bundle byte-identical. If that
  // ever stops being true, this needs a pick list again rather than a note. There were six
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

  // Delivered filename per atom, straight from the manifests. See check-local-edits.js:
  // the alternative was a second copy of `atom === 'cn' ? 'cn.ts' : ...`, which held only
  // until a second non-.tsx artifact existed.
  const fileOf = (name) => {
    try {
      const m = JSON.parse(fs.readFileSync(path.join(CATALOG, `${name}.manifest.json`), 'utf8'));
      if (m.file) return m.file;
    } catch { /* fall through */ }
    return name === 'cn' ? 'cn.ts' : `${name}.tsx`;
  };

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
  const repaired = [];

  if (tokensOnly) console.log('Atoms: skipped (--tokens)');
  else console.log('Atoms:');
  for (const atom of tokensOnly ? [] : [...atoms, 'cn']) {
    const state = states.get(atom);

    // `inconsistent` is repaired, not skipped. The installed source is already byte-for-
    // byte the catalog file, so there is no edit to protect and no change to make to it —
    // only its manifest is wrong. Skipping it was the defect: it told a consumer they had
    // edited a file they never opened and then withheld every later fix to it.
    if (state === 'inconsistent') {
      repaired.push(atom);
    } else if (!forces(atom) && (state === 'modified' || state === 'unknown')) {
      // `unknown` is skipped too: the file is installed but carries no delivery record, so
      // "has the consumer edited it" is unanswerable — and answering "no" is the silent
      // overwrite this whole mechanism exists to stop.
      skipped.push(atom);
      const why = state === 'unknown' ? 'no manifest to compare against' : 'edited locally';
      console.log(`  ~ ${atom} (${why} — skipped)`);
      continue;
    }
    const file = fileOf(atom);
    fs.copyFileSync(path.join(CATALOG, file), path.join(dest, file));
    const manifest = `${atom}.manifest.json`;
    if (fs.existsSync(path.join(CATALOG, manifest))) {
      fs.copyFileSync(path.join(CATALOG, manifest), path.join(dest, manifest));
    }
    const note = state === 'inconsistent' ? ' (manifest repaired)' : atom === 'cn' ? ' (utility)' : '';
    console.log(`  + ${atom}${note}`);
  }

  // The substrate is generated fresh rather than copied from generated/, so a sync always
  // delivers what spec/ currently says rather than what the last build happened to leave.
  console.log('Substrate:');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loom-'));
  try {
    execFileSync(
      'node',
      [path.join(LOOM_ROOT, 'scripts/code-templates/orchestrator.js'), '--only', 'tokens', '--output', tmp],
      { stdio: ['ignore', 'ignore', 'inherit'], env: childEnv }
    );
    for (const f of SUBSTRATE) {
      fs.copyFileSync(path.join(tmp, f), path.join(src, f));
      console.log(`  + src/${f}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
    if (cfgRoot) fs.rmSync(cfgRoot, { recursive: true, force: true });
  }

  console.log(`Done → ${tokensOnly ? src : dest}`);

  // Atoms from before the catalog moved into its own directory. They still compile and the
  // consumer's imports still resolve to them, so nothing goes red — they simply stop
  // receiving upstream fixes, which is the silent-staleness failure the overwrite guard
  // exists to prevent, arriving by a different door. Named, never deleted: this is the
  // consumer's tree, and one of these files may be a copy they edited.
  const strays = tokensOnly
    ? []
    : [...atoms, 'cn'].filter((a) => fs.existsSync(path.join(legacyDest, fileOf(a))));
  if (strays.length) {
    const legacyStates = checkLocalEdits(legacyDest, CATALOG, strays);
    console.log('');
    console.log('WARNING: older copies of these atoms are still in src/components/:');
    for (const a of strays) {
      const state = legacyStates.get(a);
      const note = state === 'clean' ? 'unmodified — safe to delete'
        : state === 'modified' ? 'YOU EDITED THIS — move your change before deleting'
        : 'no delivery record — read it before deleting';
      console.log(`  ! ${a} (${note})`);
    }
    console.log('');
    console.log('Your imports still point at them, so your build stays green while those files');
    console.log("go stale. Repoint each import at './loom/<atom>' (or '../components/loom/<atom>'),");
    console.log('then delete the old pair:');
    for (const a of strays) {
      // Only what is actually there. An atom installed before manifests were delivered
      // alongside has no manifest, and naming one makes a copy-pasted rm fail on the file
      // that does exist.
      const pair = [fileOf(a), `${a}.manifest.json`]
        .filter((f) => fs.existsSync(path.join(legacyDest, f)))
        .map((f) => `"${path.join(legacyDest, f)}"`);
      console.log(`  rm ${pair.join(' ')}`);
    }
  }

  if (repaired.length) {
    console.log('');
    console.log('Repaired a split delivery — these files already matched the catalog exactly,');
    console.log('but their manifests recorded a different version, so the guard had been');
    console.log('reporting them as your edits and withholding upstream fixes:');
    for (const atom of repaired) console.log(`  + ${atom}`);
    console.log('');
    console.log('Nothing of yours was overwritten: the source was already what a resync writes.');
  }

  if (skipped.length) {
    console.log('');
    console.log('Kept your edits — these were NOT resynced:');
    for (const atom of skipped) console.log(`  ~ ${atom}`);
    console.log('');
    console.log("They still hold your changes and may be missing catalog fixes. To see what you'd");
    console.log('be taking, diff against the catalog:');
    for (const atom of skipped) {
      const file = fileOf(atom);
      console.log(`  diff "${path.join(dest, file)}" "${path.join(CATALOG, file)}"`);
    }
    console.log('');
    console.log(`Then re-run with --force ${skipped.join(',')} to take the catalog version for`);
    console.log('these, or name a subset. Bare --force overwrites every edited atom, which is');
    console.log('rarely what you want: repairing one file should not destroy an edit in another.');
    console.log('Or move your change to the call site (className / prop / a wrapper), which');
    console.log('survives every resync by design.');
  }

  addLoomSyncScript(project, answers);

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

  if (!tokensOnly) {
    console.log('');
    console.log('Theme switching is two artifacts, not one:');
    console.log('  1. Paste the body of components/loom/theme-init.js into an INLINE <script>');
    console.log('     in <head>, before your stylesheet. It sets data-theme on the first frame.');
    console.log('  2. Mount <ThemeProvider> at your root. It owns every change after that.');
    console.log('');
    console.log('Skip step 1 and the theme still works — one frame late, so anyone who chose the');
    console.log('non-default mode sees a flash of it on every load. Nothing React renders can');
    console.log('set an attribute before React has rendered, which is why this half is not a');
    console.log('component. Do not <script src> it: deferred it runs after the paint it exists');
    console.log('to precede, undeferred it costs a round trip before it.');
  }
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
function addLoomSyncScript(project, answers) {
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
  // The answers path goes into the script too, or `npm run loom:sync` would quietly fall
  // back to whichever brand is active in the Loom checkout — the failure this flag exists
  // to close. Written project-relative when the file lives in the project, which is where
  // it belongs: that is what makes the substrate reproducible from the consumer's repo
  // alone. An answers file kept outside the project is recorded absolute, and says so by
  // looking like what it is.
  let suffix = '';
  if (answers) {
    const abs = path.resolve(answers);
    const inside = path.relative(path.resolve(project), abs);
    suffix = inside.startsWith('..') || path.isAbsolute(inside)
      ? ` --answers ${abs.split(path.sep).join('/')}`
      : ` --answers ./${inside.split(path.sep).join('/')}`;
  }
  pkg.scripts['loom:sync'] = `node ${rel}/scripts/sync.js .${suffix}`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Added "loom:sync": "${pkg.scripts['loom:sync']}" — refresh from your own directory.`);
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { main };
