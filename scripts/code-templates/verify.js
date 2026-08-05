/**
 * Invariant checks over the emitted catalog. Runs last in the orchestrator and fails
 * the run — `npm run generate` reporting success on broken output is what this exists
 * to stop. See docs/DEFERRED.md #4 for the defects that motivated it.
 *
 * Scope: things the TypeScript compiler cannot see. Compile-level invariants (unused
 * imports, type errors) belong to catalog-playground, which picks every atom and runs
 * `strict` + `noUnusedLocals` — a real compiler beats a regex, so nothing here re-checks
 * what tsc already covers. This file checks the artifacts around the code:
 *
 *   doc-counts        — hand-written "N atoms" claims match the catalog
 *   playground-parity — the playground's synced copies match what the generator emits
 *   manifest-deps     — every relative import is declared (regression guard on aacc481)
 *
 * Each check reports its denominator. "0 of 66 under-declared" is auditable; "clean"
 * is not — a check whose scope silently shrank reads identically to one that passed.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const CATALOG = path.join(ROOT, 'catalog');
const PLAYGROUND = path.join(ROOT, 'catalog-playground/src/components');

// Files carrying hand-written counts. A doc not listed here is not checked — add it
// when it starts making a claim, or the claim drifts unobserved.
const COUNTED_DOCS = ['README.md', 'CATALOG_SPEC.md', 'spec/questionnaire.md'];

function atomNames() {
  return fs
    .readdirSync(CATALOG)
    .filter((f) => f.endsWith('.manifest.json'))
    .map((f) => f.replace(/\.manifest\.json$/, ''))
    .filter((n) => n !== 'cn')
    .sort();
}

// --- doc-counts -----------------------------------------------------------
function checkDocCounts(atoms) {
  const groups = Object.keys(JSON.parse(fs.readFileSync(path.join(CATALOG, 'atoms.json'), 'utf8')))
    .filter((k) => !k.startsWith('$')).length;
  const expected = { atoms: atoms.length, groups };
  const failures = [];
  let claims = 0;

  for (const rel of COUNTED_DOCS) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      failures.push(`${rel} — listed in COUNTED_DOCS but missing`);
      continue;
    }
    fs.readFileSync(abs, 'utf8').split('\n').forEach((line, i) => {
      for (const [kind, re] of [
        ['atoms', /(\d+)\s+(?:React\s+)?atoms\b/g],
        ['groups', /(\d+)\s+groups\b/g],
      ]) {
        for (const m of line.matchAll(re)) {
          claims++;
          const found = Number(m[1]);
          if (found !== expected[kind]) {
            failures.push(`${rel}:${i + 1} — claims ${found} ${kind}, catalog has ${expected[kind]}`);
          }
        }
      }
    });
  }
  return { failures, note: `${claims} claims across ${COUNTED_DOCS.length} files` };
}

// --- playground-parity ----------------------------------------------------
// The playground is the compile-level gate; a stale copy means it is verifying an old
// catalog. Checked, never auto-synced — copying into it here would make it a mirror
// this repo maintains by hand, which is the failure mode two items above it describe.
function checkPlaygroundParity(atoms) {
  if (!fs.existsSync(PLAYGROUND)) {
    return { failures: ['catalog-playground is not synced — run: ./setup.sh catalog-playground'], note: 'not synced' };
  }
  const failures = [];
  const synced = fs.readdirSync(PLAYGROUND).filter((f) => /\.(tsx|ts|manifest\.json)$/.test(f));

  for (const f of synced) {
    const src = path.join(CATALOG, f);
    if (!fs.existsSync(src)) {
      failures.push(`catalog-playground/src/components/${f} — no longer in the catalog`);
      continue;
    }
    if (fs.readFileSync(src, 'utf8') !== fs.readFileSync(path.join(PLAYGROUND, f), 'utf8')) {
      failures.push(`${f} — playground copy differs from the catalog`);
    }
  }

  const uncovered = atoms.filter((a) => !fs.existsSync(path.join(PLAYGROUND, `${a}.tsx`)));
  if (uncovered.length) {
    const noun = uncovered.length === 1 ? 'atom' : 'atoms';
    failures.push(`${uncovered.length} ${noun} not compiled by the playground: ${uncovered.join(', ')}`);
  }
  if (failures.length) failures.push('  → resync with: ./setup.sh catalog-playground');

  return { failures, note: `${synced.length} synced files, ${atoms.length - uncovered.length}/${atoms.length} atoms covered` };
}

// --- manifest-deps --------------------------------------------------------
function checkManifestDeps(atoms) {
  const failures = [];
  for (const name of atoms) {
    const tsx = path.join(CATALOG, `${name}.tsx`);
    if (!fs.existsSync(tsx)) continue;
    const src = fs.readFileSync(tsx, 'utf8');
    const imported = [...new Set([...src.matchAll(/from\s+['"]\.\/([\w-]+)['"]/g)].map((m) => m[1]))];
    const declared = JSON.parse(fs.readFileSync(path.join(CATALOG, `${name}.manifest.json`), 'utf8')).dependencies || [];
    const missing = imported.filter((i) => !declared.includes(i));
    if (missing.length) {
      failures.push(`${name} — imports ${missing.join(', ')} but does not declare it`);
    }
  }
  return { failures, note: `${atoms.length} atoms` };
}

// --- base-config-provenance -----------------------------------------------
// spec/config/base/ is a generated artifact that is COMMITTED, produced from
// spec/answers.json — which is git-ignored and machine-local. So `npm run configs`
// run with a local brand rewrites the repo's committed brand, and the diff rides
// along in the next commit. That happened twice: an Availo brand-gen diff left dirty
// on master (2026-07-16, caught) and a dashboard's orange swept into e935de3
// (2026-08-04, shipped to master and live for a day).
//
// The 07-16 fix git-ignored the input. This guards the output: the committed base
// configs must be exactly what the committed answers.example.json generates. The
// generators are pure (answers, standards, mappings) → object, so this regenerates
// in memory and compares — no temp files, no prose parsing, no side effects.
function checkBaseConfigProvenance() {
  const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const example = read('spec/answers.example.json');
  const standards = read('spec/config/standards.json');
  const mappings = read('spec/direction-mappings.json');

  const generators = [
    ['colors.json', require('../generate-configs/generate-colors').generate],
    ['spacing.json', require('../generate-configs/generate-spacing').generate],
    ['sizing.json', require('../generate-configs/generate-sizing').generate],
    ['typography.json', require('../generate-configs/generate-typography').generate],
    ['effects.json', require('../generate-configs/generate-effects').generate],
  ];

  const failures = [];
  for (const [file, gen] of generators) {
    const expected = JSON.stringify(gen(example, standards, mappings), null, 2) + '\n';
    const actual = fs.readFileSync(path.join(ROOT, 'spec/config/base', file), 'utf8');
    if (expected !== actual) {
      failures.push(`spec/config/base/${file} — does not match what answers.example.json generates`);
    }
  }

  // `npm run configs` also writes answers.defaultMode into standards.json.
  if (standards.colors['default-mode'] !== example.defaultMode) {
    failures.push(
      `spec/config/standards.json — default-mode is "${standards.colors['default-mode']}", answers.example.json says "${example.defaultMode}"`
    );
  }

  if (failures.length) {
    failures.push('  → a local brand leaked in. Restore with: npm run configs -- --input spec/answers.example.json');
  }
  return { failures, note: `${generators.length} configs + standards` };
}

function verify() {
  const atoms = atomNames();
  const checks = [
    ['doc-counts', checkDocCounts(atoms)],
    ['playground-parity', checkPlaygroundParity(atoms)],
    ['manifest-deps', checkManifestDeps(atoms)],
    ['base-config-provenance', checkBaseConfigProvenance()],
  ];

  let failed = 0;
  for (const [name, result] of checks) {
    const status = result.failures.length ? 'FAIL' : 'ok';
    console.log(`  ${name.padEnd(23)} ${result.note} — ${status}`);
    for (const f of result.failures) console.log(`    ${f}`);
    if (result.failures.length) failed++;
  }

  if (failed) {
    console.error(`\nVerification failed: ${failed} of ${checks.length} checks.`);
    process.exit(1);
  }
}

module.exports = { verify };
