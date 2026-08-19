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
 *   touch-target      — the `touch` height ladder honours standards.json's 44px minimum
 *   contrast          — every on-X/X colour pair clears WCAG AA in both modes
 *   composited-contrast — the same pairs still clear 3:1 after the muted opacity role
 *   story-coverage    — every atom is actually rendered somewhere in the playground
 *   typecheck         — the generated TSX actually compiles (tsc --noEmit)
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
    return { failures: ['catalog-playground is not synced — run: npm run sync -- catalog-playground'], note: 'not synced' };
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
  if (failures.length) failures.push('  → resync with: npm run sync -- catalog-playground');

  return { failures, note: `${synced.length} synced files, ${atoms.length - uncovered.length}/${atoms.length} atoms covered` };
}

// --- manifest-deps --------------------------------------------------------
// --- interactive-implies-control ---------------------------------------------
// `.interactive` carries only the pointer half of the disabled state (pointer-events);
// the opacity and cursor live on `.control`. That split is safe exactly while every atom
// using one also uses the other — otherwise a disabled control renders at full opacity
// with a normal cursor and nothing says why. The layer cannot enforce it, so this does.
function checkInteractiveImpliesControl(atoms) {
  const failures = [];
  const cls = (src, name) => new RegExp(`(?:^|[\\s'"\`])${name}(?:[\\s'"\`]|$)`, 'm').test(src);
  let checked = 0;
  for (const name of atoms) {
    const tsx = path.join(CATALOG, `${name}.tsx`);
    if (!fs.existsSync(tsx)) continue;
    const src = fs.readFileSync(tsx, 'utf8');
    if (!cls(src, 'interactive')) continue;
    checked++;
    if (!cls(src, 'control')) {
      failures.push(`${name} — uses .interactive without .control, so its disabled state loses opacity and cursor`);
    }
  }
  return { failures, note: `${checked} atoms using .interactive` };
}

// --- class-coverage -----------------------------------------------------------
// Every appearance-only component must either emit a class or be on a stated skip list.
//
// This exists because seventeen of them silently stopped emitting. The emitter used to
// enumerate from the component registry, so deleting the eighteen appearance-only atoms
// deleted the classes those atoms had become — `.card`, `.input`, `.kbd` and fourteen
// more — in the same commit whose premise was that the appearance had moved somewhere
// safe. Every check passed, both builds passed, because nothing inside this repo used
// the classes yet. The regression was found by a person looking at a page.
//
// A schema is not a class until something renders it, and nothing here renders them —
// so the guard is that the emitter's own accounting adds up: emitted plus skipped equals
// the full set, and each emitted name is actually present in the output it produced.
function checkClassCoverage() {
  const { componentPlan, APPEARANCE_ONLY, generateComponents } =
    require('./generate-tokens-css');
  const { emit, skipped } = componentPlan();
  const css = generateComponents();

  const failures = [];
  const emitted = new Set(emit.map((c) => c.name));
  const skippedNames = new Set([
    ...skipped.empty,
    ...skipped.subParts.map((x) => x.split(' ')[0]),
  ]);

  for (const name of APPEARANCE_ONLY) {
    const accounted = emitted.has(name) || skippedNames.has(name) || CELL_SIZED_NAMES.has(name);
    if (!accounted) {
      failures.push(`${name} — neither emitted as a class nor listed as skipped; it has fallen out of the emitter silently`);
    }
  }

  for (const name of emitted) {
    if (!new RegExp(`^\\s*\\.${name}[ \\[]`, 'm').test(css)) {
      failures.push(`${name} — planned for emission but no .${name} rule is in loom.components.css`);
    }
  }

  return {
    failures,
    note: `${emitted.size} emitted, ${skippedNames.size + CELL_SIZED_NAMES.size} accounted for as skipped`,
  };
}

// Kept here rather than imported: the point of the check is to notice when the emitter's
// idea of the set drifts, so it must not read that set from the emitter alone.
const CELL_SIZED_NAMES = new Set(['table']);

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

  // What is NOT checked here: that a phone product actually answers `touch`. The
  // archetypes used to promise it — consumer-mobile and social resolved control-height
  // to the touch ladder, and this check held them to it. Both went with productType, so
  // the floor is now the answerer's to hold. The ladder above is still verified; nothing
  // verifies that anyone selects it.

  return { failures, note: `${checked} touch-ladder tiers against ${min}px` };
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

// --- composited-contrast -----------------------------------------------------
// A token is not what renders: at `opacity-muted` a pair that clears 4.5:1 as declared
// composites toward its background and can land far below it.
//
// 3:1 rather than 4.5 because `muted`'s uses — the dismiss controls on badge, toast and
// file-upload — all wrap an icon glyph, so WCAG 1.4.11 non-text applies.
// If it ever lands on text, re-measure rather than bump this: 22 of the 50 pairs fall
// under 4.5:1 once composited. `disabled` is excluded — WCAG 1.4.3 exempts inactive
// components, and it is dim by intent.
const AA_NON_TEXT = 3.0;

function compositeOver(fgHex, bgHex, alpha) {
  const parse = (hex) => {
    const raw = hex.replace('#', '');
    const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  };
  // Browsers composite in gamma space, per channel — not in linear light.
  const [fg, bg] = [parse(fgHex), parse(bgHex)];
  const out = fg.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function checkCompositedContrast() {
  const colors = loadConfig('base/colors.json');
  const standards = readJson('spec/config/standards.json');
  const muted = standards.effects?.opacity?.muted;
  const failures = [];
  let pairs = 0;

  if (typeof muted !== 'number') {
    return { failures: ['standards.json declares no effects.opacity.muted'], note: 'muted role missing' };
  }

  for (const mode of Object.keys(colors.roles || {})) {
    const flat = {};
    for (const group of Object.values(colors.roles[mode])) {
      for (const [role, value] of Object.entries(group)) {
        if (typeof value === 'string' && value.startsWith('#')) flat[role] = value;
      }
    }
    const check = (fg, bg) => {
      if (!flat[fg] || !flat[bg]) return;
      pairs++;
      const rendered = compositeOver(flat[fg], flat[bg], muted);
      const ratio = contrastRatio(rendered, flat[bg]);
      if (ratio < AA_NON_TEXT) {
        failures.push(
          `${mode}: ${fg} (${flat[fg]}) at opacity ${muted} over ${bg} (${flat[bg]}) renders ${rendered} — ${ratio.toFixed(2)}:1, needs ${AA_NON_TEXT}`
        );
      }
    };

    for (const role of Object.keys(flat)) {
      if (!role.startsWith('on-')) continue;
      check(role, role.slice(3));
    }
    // `surface` only, not the four tiers the full-opacity check sweeps: both muted
    // on-surface-variant controls declare bg-surface. Revisit if one moves off it —
    // on a teal brand the same pair renders 2.90:1 over surface-3.
    check('on-surface-variant', 'surface');
  }

  return { failures, note: `${pairs} pairs at muted opacity ${muted} against ${AA_NON_TEXT}:1` };
}

// --- typecheck ---------------------------------------------------------------
// The compile gate lives in catalog-playground's build, not here, so generated TSX with
// a syntax error passed every check in this file — twice in one session. tsc is the only
// instrument that reads the emitted code as code; everything else reads it as text.
// Skipped rather than failed when the playground has no node_modules: a fresh clone runs
// `npm run generate` before it installs, and a missing toolchain is not a defect.
function checkTypecheck() {
  const dir = path.join(ROOT, 'catalog-playground');
  const tsc = path.join(dir, 'node_modules/typescript/bin/tsc');
  if (!fs.existsSync(tsc)) return { failures: [], note: 'playground deps not installed — skipped' };
  const { spawnSync } = require('child_process');
  const run = spawnSync(process.execPath, [tsc, '--noEmit'], { cwd: dir, encoding: 'utf-8' });
  if (run.status === 0) return { failures: [], note: 'catalog-playground tsc --noEmit' };
  const lines = String(run.stdout || run.stderr || '').split('\n').filter(Boolean).slice(0, 10);
  return { failures: lines, note: 'catalog-playground tsc --noEmit' };
}

// --- story-coverage ----------------------------------------------------------
// playground-parity counts synced *files*, so it reported "66/66 atoms covered" while
// nine atoms were rendered nowhere and could not be looked at — Toast among them, which
// is how a change to it shipped unverifiable. An atom counts as covered when any
// component it exports is rendered in stories.tsx; six atoms (checkbox, radio, switch,
// label, form-field, helper-text) are covered only inside other atoms' stories, which is
// visible and therefore fine.
const STORIES = path.join(ROOT, 'catalog-playground/src/gallery/stories.tsx');

function checkStoryCoverage(atoms) {
  if (!fs.existsSync(STORIES)) return { failures: [], note: 'no stories file — skipped' };
  const src = fs.readFileSync(STORIES, 'utf-8');
  const failures = [];
  let covered = 0;

  for (const atom of atoms) {
    const file = path.join(CATALOG, `${atom}.tsx`);
    if (!fs.existsSync(file)) continue;
    const names = new Set();
    for (const m of fs.readFileSync(file, 'utf-8').matchAll(/export\s*\{([^}]+)\}/g)) {
      for (const raw of m[1].split(',')) {
        const n = raw.trim().split(/\s+as\s+/).pop().trim();
        if (n && /^[A-Z]/.test(n)) names.add(n);
      }
    }
    if (!names.size) continue; // utility, nothing to render
    if ([...names].some((n) => new RegExp(`<${n}(\\s|/|>)`).test(src))) covered++;
    else failures.push(`${atom} — no export of it is rendered in stories.tsx`);
  }
  return { failures, note: `${covered} atoms rendered in the playground` };
}

function verify() {
  const atoms = atomNames();
  const checks = [
    ['doc-counts', checkDocCounts(atoms)],
    ['playground-parity', checkPlaygroundParity(atoms)],
    ['manifest-deps', checkManifestDeps(atoms)],
    ['interactive-implies-control', checkInteractiveImpliesControl(atoms)],
    ['class-coverage', checkClassCoverage()],
    ['base-config-provenance', checkBaseConfigProvenance()],
    ['touch-target', checkTouchTarget()],
    ['contrast', checkContrast()],
    ['composited-contrast', checkCompositedContrast()],
    ['story-coverage', checkStoryCoverage(atoms)],
    ['typecheck', checkTypecheck()],
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
