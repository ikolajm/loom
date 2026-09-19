#!/usr/bin/env node
/**
 * sync.js — install the Loom catalog and the token substrate into a consuming project.
 *
 * Usage: node scripts/sync.js <project-dir> [--tokens] [--refresh]
 *
 *   --answers <file>  the brand to build from, resolved into a throwaway config root so
 *                     this repo's own spec/config/local/ is never written to
 *   --tokens   the substrate only — no atoms, no install line, no framework assumption
 *   --refresh  regenerate the catalog from spec/ first, then sync
 *
 * Without --answers the substrate is emitted from whichever brand is active in this repo,
 * which is the right default for a maintainer and the wrong one for a consumer. A project
 * that owns its answers file passes it and becomes reproducible from its own repo.
 *
 * `--tokens` and the loom:sync script below belong here because this is the only thing
 * that knows both paths: it is invoked with the project directory and lives in Loom.
 * Loom writes no app shell — no root layout, no globals.css, no provider mount — because
 * that is a framework's business, and ThemeProvider is delivered like any other component.
 *
 * The catalog copies in whole, every run, with no edit detection. Delivered files carry a
 * generated header and sit in a directory of Loom's own: editing one is out of contract,
 * so there is nothing for a guard to protect. A change worth keeping goes at the call
 * site — className, a prop, a wrapper — where it survives a resync by construction.
 * Nothing detects an edit, on purpose: that question is "what if another repo is in a
 * strange state", and the answer with one consumer you own is to resync and read the diff.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

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
  const project = argv.find((a, i) => !a.startsWith('--') && i !== answersValueIdx);
  if (!project) die('Usage: node scripts/sync.js <project-dir> [--answers <file>] [--tokens] [--refresh]');
  if (answersIdx !== -1 && (!answers || answers.startsWith('--'))) {
    die('--answers needs a path to an answers JSON file.');
  }
  if (answers && !fs.existsSync(answers)) {
    die([`ERROR: answers file not found: ${answers}`,
         'This is the brand input. Without it the sync emits whichever brand is active in',
         'the Loom repo, which is how a project ends up wearing another brand.']);
  }

  const tokensOnly = flags.has('--tokens');
  const src = path.join(project, 'src');
  // A directory of Loom's own, not `src/components/` itself. Interleaving delivered files
  // with the consumer's meant nothing downstream could address one set without the other:
  // the first consumer's lint run produced 14 errors, all in files it had not written, and
  // the only fix available was an override naming each one — which a seventh atom then
  // arrives outside of. One glob covers every atom, now and later.
  const dest = path.join(src, 'components', 'loom');

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

  console.log('=== Loom sync ===');
  console.log(`Catalog: ${CATALOG}`);
  console.log(`Project: ${project}`);

  // The whole catalog, every run. A consumer CANNOT opt out by deleting: the sync copies
  // unconditionally, so a file they removed returns on the next run. That is
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

  // Delivered filename per atom, straight from the manifests, so a second non-.tsx
  // artifact does not need a second copy of `atom === 'cn' ? 'cn.ts' : ...`.
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

  // Every atom, every run, no questions asked. These files carry a generated header and
  // live in a directory of Loom's own; editing one is out of contract, so the sync does
  // not try to detect it. A change you want to keep goes at the call site — className, a
  // prop, a wrapper — which survives a resync by construction rather than by a guard.
  if (tokensOnly) console.log('Atoms: skipped (--tokens)');
  else console.log('Atoms:');
  for (const atom of tokensOnly ? [] : [...atoms, 'cn']) {
    const file = fileOf(atom);
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
 * Only this script knows the path between the two repos — it is invoked with the project
 * directory and resolves its own root — which is why it writes the line rather than a
 * README documenting it. An existing script is left alone; a project without a package.json says so and
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
