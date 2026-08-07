/**
 * Invariant checks over the emitted catalog. Runs last in the orchestrator and fails
 * the run — `npm run generate` reporting success on broken output is what this exists
 * to stop. Two defect classes reached a consumer undetected before it existed: a dead
 * import that shipped in a generated atom, and manifests that under-declared a
 * dependency, so an install typechecked here and failed there.
 *
 * Scope: things the TypeScript compiler cannot see. Compile-level invariants (unused
 * imports, type errors) belong to catalog-playground, which picks every atom and runs
 * `strict` + `noUnusedLocals` — a real compiler beats a regex, so nothing here re-checks
 * what tsc already covers. This file checks the artifacts around the code:
 *
 *   doc-counts        — hand-written "N components/atoms/patterns/groups" claims match
 *   playground-parity — the playground's synced copies match what the generator emits
 *   manifest-deps     — every relative import is declared (regression guard on aacc481)
 *   base-config-provenance — the committed base configs are what answers.example generates
 *   archetype-picks   — every archetype's curated pick-list names a real atom
 *   touch-target      — the `touch` height ladder honours standards.json's 44px minimum
 *   contrast          — every on-X/X colour pair clears WCAG AA in both modes
 *
 * Each check reports its denominator. "0 of 66 under-declared" is auditable; "clean"
 * is not — a check whose scope silently shrank reads identically to one that passed.
 */
const fs = require('fs');
const path = require('path');

const { resolveIntent } = require('../generate-configs/resolve-intent');
const { loadConfig } = require('../config-paths');

const ROOT = path.resolve(__dirname, '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
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

  // `atoms` counted the whole catalog until kind was introduced, when "66 atoms"
  // stopped being true — 66 is the total, 41 of them are atoms. The total is now
  // "components" and "atoms" means the kind, so a doc cannot claim one while meaning
  // the other. Splitting the numbers without gating the new ones is how the Figma step
  // numbers drifted, which is why patterns is checked here rather than trusted.
  const kinds = atoms.map((a) => {
    const m = JSON.parse(fs.readFileSync(path.join(CATALOG, `${a}.manifest.json`), 'utf8'));
    return m.kind || 'atom';
  });
  const expected = {
    components: atoms.length,
    atoms: kinds.filter((k) => k === 'atom').length,
    patterns: kinds.filter((k) => k === 'pattern').length,
    groups,
  };
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
        ['components', /(\d+)\s+(?:React\s+)?components\b/g],
        ['atoms', /(\d+)\s+atoms\b/g],
        ['patterns', /(\d+)\s+patterns\b/g],
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
// spec/config/base/ is a generated artifact that is COMMITTED — it is Loom's own look
// and the fallback a fresh clone builds from. It used to be the generator's write
// target too, so `npm run configs` with a local brand rewrote it and the diff rode
// along in the next commit. That happened twice: an Availo brand-gen diff left dirty
// on master (2026-07-16, caught) and a dashboard's orange swept into e935de3
// (2026-08-04, shipped to master and live for a day).
//
// The 07-16 fix git-ignored the input, the 08-05 fix redirected the output to the
// ignored spec/config/local/, and this is the check that neither has quietly come
// undone: the committed base configs must be exactly what the committed
// answers.example.json generates. It reads spec/config/base/ by explicit path rather
// than through config-paths.js — a provenance check that reads whatever is local
// checks nothing. The generators are pure (answers, standards, mappings) → object, so
// this regenerates in memory and compares — no temp files, no side effects.
function checkBaseConfigProvenance() {
  const standards = readJson('spec/config/standards.json');
  const mappings = readJson('spec/direction-mappings.json');
  // Resolve Tier 1 exactly as `npm run configs` does. Regenerating from the raw example
  // would diverge the moment it leaves a Tier 2 key absent, and report the difference as
  // a brand leak.
  const example = resolveIntent(readJson('spec/answers.example.json'), mappings).answers;

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

  // standards.json is no longer a generator write target — defaultMode rides in
  // colors.json, which the loop above already compares. What is worth checking is that
  // it has not drifted back: a key the generator sets must not reappear in the file the
  // generator must never touch, or the two disagree silently and the locked-across-
  // projects header is false again.
  if (standards.colors['default-mode'] !== undefined) {
    failures.push(
      `spec/config/standards.json — carries a "default-mode" key; it is a per-project answer and belongs in the generated base/colors.json`
    );
  }

  if (failures.length) {
    failures.push('  → a local brand leaked in. Restore with: npm run configs -- --input spec/answers.example.json --default-set');
  }
  return { failures, note: `${generators.length} configs + standards` };
}

// --- touch-target ----------------------------------------------------------
// `standards.json` has declared touch-target.min: 44px since v2 and nothing consumed it:
// it reached tokens.css, tokens.json and the NativeWind preset as a value no atom read,
// while the default button shipped at 40px. The semantic height ladder is what makes it
// reachable, and this is what makes it binding — every tier of every role in the `touch`
// ladder must sit at or above the minimum, checked against direction-mappings rather than
// against the one resolved config, so a ladder edit cannot quietly drop below it.
//
// Only `touch` is checked. `compact` is deliberately below the minimum — it is for
// pointer-driven dashboards — so asserting the floor everywhere would be asserting that
// every product is a phone.
function checkTouchTarget() {
  const standards = readJson('spec/config/standards.json');
  const mappings = readJson('spec/direction-mappings.json');
  const min = parseFloat(standards.sizing['touch-target'].min);
  const primitives = standards.sizing['component-height'];

  const failures = [];
  let checked = 0;

  const ladder = mappings['control-height'].touch['semantic-height'];
  for (const [role, tiers] of Object.entries(ladder)) {
    for (const [tier, token] of Object.entries(tiers)) {
      checked++;
      const px = parseFloat(primitives[token]);
      if (Number.isNaN(px)) {
        failures.push(`control-height.touch.${role}.${tier} — "${token}" is not a component-height primitive`);
      } else if (px < min) {
        failures.push(`control-height.touch.${role}.${tier} — ${token} is ${px}px, under the ${min}px touch minimum`);
      }
    }
  }

  // The archetypes that promise a touch surface must actually resolve to that ladder;
  // a mobile archetype pointing at `standard` would pass every check above and still
  // ship 40px controls, which is the exact defect this item was filed for.
  for (const name of ['consumer-mobile', 'social']) {
    const archetype = mappings['product-type'][name];
    if (archetype && archetype['control-height'] !== 'touch') {
      failures.push(`product-type.${name} — resolves control-height "${archetype['control-height']}", not "touch"`);
    }
  }

  return { failures, note: `${checked} touch-ladder tiers against ${min}px` };
}

// --- archetype-picks -------------------------------------------------------
// Each `product-type` archetype in direction-mappings.json curates an atom pick-list,
// which now seeds a consumer's starter loom-picks.json. The names are hand-written
// against the catalog and drifted once already: all ten listed `icon-button`, `chip`,
// `text-input` and `alert`, absent since the v2 consolidation, and every one would have
// written an unresolvable pick into a consumer's project. Same failure as the
// hand-maintained mirror two checks up — fail the run rather than re-check by hand.
function checkArchetypePicks(atoms) {
  const known = new Set(atoms);
  const mappings = readJson('spec/direction-mappings.json');
  const archetypes = Object.entries(mappings['product-type']).filter(([name]) => !name.startsWith('$'));

  const failures = [];
  let picks = 0;
  for (const [name, cfg] of archetypes) {
    for (const pick of cfg.components || []) {
      picks++;
      if (!known.has(pick)) {
        failures.push(`product-type.${name} — picks "${pick}", which is not in the catalog`);
      }
    }
  }
  return { failures, note: `${picks} picks across ${archetypes.length} archetypes` };
}

// --- contrast ---------------------------------------------------------------
// Every `on-X` role exists to be read against `X` — the naming is the contract, so
// these are the pairs the system itself declares, not combinations invented here.
// WCAG 2.1 AA: 4.5:1 for text. Deliberately not AAA (7.0), which both Bootstrap and
// Material also miss on their own defaults.
//
// This is checked per generated brand rather than fixed once, because only the status
// palettes are brand-independent (STATUS_HUES pins their hue). `primary` and `neutral`
// are derived from the answers file, so a consumer generates their own pass or fail —
// six pairs failed on Loom's own default and nothing surfaced it until a human
// measured. Same shape as touch-target: a value declared and never made binding.
const AA_TEXT = 4.5;

function srgbToLinear(channel) {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function checkContrast() {
  // Read through config-paths, so this validates whichever brand is active. That is
  // the exact opposite of base-config-provenance two checks up, which reads the
  // committed set by explicit path — a provenance check that read a local brand would
  // check nothing, and a contrast check that read the committed one would pass a
  // consumer straight through with their own failing palette.
  const colors = loadConfig('base/colors.json');
  const failures = [];
  let pairs = 0;

  for (const mode of Object.keys(colors.roles || {})) {
    const flat = {};
    for (const group of Object.values(colors.roles[mode])) {
      for (const [role, value] of Object.entries(group)) {
        if (typeof value === 'string' && value.startsWith('#')) flat[role] = value;
      }
    }
    const check = (fg, bg, why) => {
      if (!flat[fg] || !flat[bg]) return;
      pairs++;
      const ratio = contrastRatio(flat[fg], flat[bg]);
      if (ratio < AA_TEXT) {
        failures.push(
          `${mode}: ${fg} (${flat[fg]}) on ${bg} (${flat[bg]}) — ${ratio.toFixed(2)}:1, needs ${AA_TEXT}${why ? ` — ${why}` : ''}`
        );
      }
    };

    // Declared pairs: `on-X` exists to be read against `X`.
    for (const role of Object.keys(flat)) {
      if (!role.startsWith('on-')) continue;
      check(role, role.slice(3));
    }

    // Body and muted text over every surface tier. A page's text roles are not
    // declared against each raised tier by name, but a card sits on surface-2 and its
    // text is still on-surface — so the pairing is real even though no role name
    // states it. Found by hand: on-surface-variant on surface-3 in dark.
    for (const surface of ['surface', 'surface-1', 'surface-2', 'surface-3']) {
      for (const text of ['on-surface', 'on-surface-variant']) {
        if (text === 'on-surface' && surface === 'surface') continue; // declared above
        check(text, surface, 'text on a raised tier');
      }
    }
  }
  return { failures, note: `${pairs} on-X/X pairs against WCAG AA ${AA_TEXT}:1` };
}

function verify() {
  const atoms = atomNames();
  const checks = [
    ['doc-counts', checkDocCounts(atoms)],
    ['playground-parity', checkPlaygroundParity(atoms)],
    ['manifest-deps', checkManifestDeps(atoms)],
    ['base-config-provenance', checkBaseConfigProvenance()],
    ['archetype-picks', checkArchetypePicks(atoms)],
    ['touch-target', checkTouchTarget()],
    ['contrast', checkContrast()],
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
