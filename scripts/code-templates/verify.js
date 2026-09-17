/**
 * Invariant checks over the emitted catalog. Runs last in the orchestrator and fails
 * the run — `npm run generate` reporting success on broken output is what this exists
 * to stop. Two defect classes reached a consumer undetected before it existed: a dead
 * import that shipped in a generated atom, and manifests that under-declared a
 * dependency, so an install typechecked here and failed there.
 *
 * Scope: things the TypeScript compiler cannot see. Compile-level invariants (unused
 * imports, type errors) belong to the typecheck gate, which runs
 * `strict` + `noUnusedLocals` — a real compiler beats a regex, so nothing here re-checks
 * what tsc already covers. This file checks the artifacts around the code:
 *
 *   css-parse         — the emitted stylesheets parse at all (postcss)
 *   doc-counts        — hand-written "N components/atoms/patterns/groups" claims match
 *   manifest-deps     — every relative import is declared (regression guard on aacc481)
 *   base-config-provenance — the committed base configs are what answers.example generates
 *   touch-target      — the `touch` height ladder honours standards.json's 44px minimum
 *   contrast          — every on-X/X colour pair clears WCAG AA in both modes
 *   composited-contrast — the same pairs still clear 3:1 after the muted opacity role
 *   typecheck         — the generated TSX actually compiles (tsc --noEmit)
 *
 * Each check reports its denominator. "0 of 66 under-declared" is auditable; "clean"
 * is not — a check whose scope silently shrank reads identically to one that passed. The
 * checks that read the parse tree say so explicitly when the tree is short, because
 * finding nothing in a file that did not parse is not a pass.
 */
const fs = require('fs');
const path = require('path');

const { resolveIntent } = require('../generate-configs/resolve-intent');
const { loadConfig } = require('../config-paths');

const ROOT = path.resolve(__dirname, '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const CATALOG = path.join(ROOT, 'catalog');
const EMITTED = ['tokens.css', 'loom.css', 'loom.components.css', 'main.css'];

/**
 * The emitted CSS, parsed once.
 *
 * Every check here read the stylesheets as text until postcss. That is how generated
 * output with a syntax error passed twice: a regex asking "is there a rule that looks
 * like this" cannot ask "is this a stylesheet", and nothing else was asking either — the
 * atoms had a compiler, the CSS did not.
 *
 * postcss also removes a whole class of near-miss. The old rule matcher was
 * `/\{([^}]*)\}/`, which stops at the first closing brace and so cannot see into an
 * at-rule; the reduced-motion and coarse-pointer blocks are exactly that shape. And
 * `/\.([a-z0-9-]+)/` over raw text matched the `.5` in `0.5rem` as a class named `5`.
 *
 * Returns null when postcss is not installed, and every check that needs it says so
 * rather than passing. A gate that quietly stops checking is worse than one that is off.
 */
let _sheets;
function sheets() {
  if (_sheets !== undefined) return _sheets;
  let postcss;
  try { postcss = require('postcss'); } catch { _sheets = null; return _sheets; }
  // A stylesheet that does not parse is css-parse's failure to report, not an exception
  // to throw out of the middle of an unrelated check. Unparseable files drop out here and
  // everything downstream says it skipped.
  _sheets = [];
  for (const name of EMITTED) {
    try {
      _sheets.push({
        name,
        root: postcss.parse(fs.readFileSync(path.join(ROOT, 'generated', name), 'utf8'), { from: name }),
      });
    } catch {
      /* css-parse reports it, with the line and the reason. */
    }
  }
  return _sheets;
}

/**
 * Whether every emitted stylesheet parsed.
 *
 * A check that reads a parse tree and finds nothing has not passed, it has not run — and
 * with an unparseable file it reported "0 sized classes carry a display — ok", which is
 * the failure this whole arc keeps turning up. Depending on the tree means saying so when
 * the tree is short.
 */
const parseComplete = () => (sheets() || []).length === EMITTED.length;
const NOT_PARSED = { failures: [], note: 'emitted CSS did not parse — see css-parse' };

/** Every rule in the emitted CSS, at any nesting depth, as { selector, decls }. */
function allRules() {
  const out = [];
  for (const { root } of sheets() || []) {
    root.walkRules((rule) => {
      const decls = {};
      rule.walkDecls((d) => { decls[d.prop] = d.value; });
      out.push({ selector: rule.selector, decls });
    });
  }
  return out;
}

// --- css-parse ---------------------------------------------------------------
// Does the emitted CSS parse at all. postcss throws a CssSyntaxError with a line and a
// caret, which is the whole check: everything below assumes a stylesheet, and this is the
// only thing that confirms there is one.
function checkCssParse() {
  let postcss;
  try { postcss = require('postcss'); } catch { return { failures: [], note: 'postcss not installed — skipped' }; }
  const failures = [];
  let rules = 0;
  for (const name of EMITTED) {
    const file = path.join(ROOT, 'generated', name);
    try {
      const root = postcss.parse(fs.readFileSync(file, 'utf8'), { from: name });
      root.walkRules(() => { rules += 1; });
    } catch (e) {
      failures.push(`${name} — ${e.reason || e.message}${e.line ? ` (line ${e.line})` : ''}`);
    }
  }
  return { failures, note: `${EMITTED.length} stylesheets, ${rules} rules` };
}

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
  if (!parseComplete()) return NOT_PARSED;
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

// --- variant-keys ---------------------------------------------------------------
// Every key a variant declares is either consumed by the emitter or parked here by name.
//
// A declared key vanishing has now happened three times: `item-x-padding` split wrong and
// the sidebar's item padding never emitted; `rail-width` was read as a part and nearly
// styled an element that does not exist; and `border-bottom` / `border-right` /
// `border-top` were dropped by a variant emitter that only ever read `border` — so the
// app header lost its bottom rule and the sidebar its right one, replaced by `border: 0`,
// which removes rather than omits. That last one was found by hand-porting a consumer off
// the atom, months after it shipped.
//
// The parked list is the point. A key the emitter cannot yet express is fine; a key that
// disappears without anyone noticing is not. Adding a new key to a schema fails here until
// it is either handled or parked with the others.
const CONSUMED_VARIANT_KEYS = new Set(['bg', 'fg', 'border', 'shadow',
  'border-top', 'border-right', 'border-bottom', 'border-left']);

const UNCONSUMED_VARIANT_KEYS = {
  'hover-bg': 'hover is a state, and the layer has no state hook on a variant yet',
  'active-bg': 'same as hover-bg',
  'from': 'a gradient start; the layer emits no gradients',
  'overlay': 'a scrim colour, which belongs to whatever renders the scrim',
  'track-bg': 'progress/slider internals — the parts are not named yet',
  'fill-bg': 'same as track-bg',
  'thumb-bg': 'same as track-bg',
  'indicator': 'tabs internals — not named yet',
  'indicator-width': 'same as indicator',
  'gap': 'declared on a variant, but gap ramps per size; the size block already emits it',
};

function checkVariantKeys() {
  const configs = ['button', 'form', 'layout', 'feedback', 'data-display', 'navigation', 'composite']
    .map((g) => {
      const f = path.join(ROOT, `spec/config/components/${g}.json`);
      return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
    });

  const failures = [];
  let seen = 0;
  for (const src of configs) {
    for (const [name, cfg] of Object.entries(src)) {
      if (!cfg || typeof cfg !== 'object') continue;
      for (const [vname, v] of Object.entries(cfg.variants || {})) {
        if (vname.startsWith('$') || !v || typeof v !== 'object') continue;
        for (const k of Object.keys(v)) {
          if (k.startsWith('$')) continue;
          seen++;
          if (CONSUMED_VARIANT_KEYS.has(k)) continue;
          if (k.endsWith('-fg') && k !== 'fg') continue;       // the sub-part colour path
          if (UNCONSUMED_VARIANT_KEYS[k]) continue;            // parked, with a stated reason
          failures.push(`${name}.${vname}.${k} — the variant emitter does not read this key, so it is silently dropped. Handle it, or park it in UNCONSUMED_VARIANT_KEYS with the reason`);
        }
      }
    }
  }
  return {
    failures,
    note: `${seen} variant keys, ${Object.keys(UNCONSUMED_VARIANT_KEYS).length} parked as unconsumed`,
  };
}

// --- phantom-parts ------------------------------------------------------------
// A schema key that is itself a property must never be read as `<part>-<prop>`.
//
// `line-height` ends in `height`, `min-width` and `border-width` end in `width`, so the
// part splitter read them as parts `line`, `min` and `border` and emitted
// `.helper-text-line`, `.label-line`, `.kbd-min`, `.textarea-min` and `.spinner-border` —
// five classes naming elements that do not exist. Nothing rendered wrong, because the real
// declaration also lands on the element, so no check and no page could have shown it; it
// was found by reading the emitted CSS for a different reason.
//
// SELF_PROPS is the guard and this check is what keeps it honest. class-box-model happens
// to fail on a phantom too, but it says "give it a display" — advice that would entrench
// the class rather than delete it. A check should name the cause it is guarding.
function checkPhantomParts() {
  const { generateComponents, SELF_PROPS } = require('./generate-tokens-css');
  const css = generateComponents();

  // `.<name>-icon` is emitted deliberately by the icon-part path, so `icon` is not a
  // phantom head even though `icon-size` is a self-prop.
  const ALLOWED_HEADS = new Set(['icon']);
  const heads = [...new Set([...SELF_PROPS]
    .filter((k) => k.includes('-'))
    .map((k) => k.split('-')[0]))]
    .filter((h) => !ALLOWED_HEADS.has(h));

  const emitted = new Set(allRules().flatMap(({ selector }) =>
    (selector.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g) || []).map((c) => c.slice(1))));
  const failures = [];
  for (const name of emitted) {
    for (const h of heads) {
      if (name.endsWith(`-${h}`)) {
        failures.push(`.${name} — "${h}" is the head of a self-property (${[...SELF_PROPS].filter((k) => k.startsWith(h + '-')).join(', ')}), so this is a property mis-read as a part. Add the key to SELF_PROPS rather than giving the class a box`);
      }
    }
  }
  return { failures, note: `${heads.length} self-property heads, ${emitted.size} class names` };
}

// --- class-box-model ----------------------------------------------------------
// `class-coverage` asks whether a class exists. This asks whether it declares a box.
//
// Both questions had to be asked separately, because every class existed and seventeen
// of them still rendered wrong. The emitter read the sizing schema and nothing else, so
// a component's ladder survived the move to a class and the cva base string it ramped
// did not: `.button` emitted `gap` while computing `display: block`, `.icon-slot` sized
// an inline span, `.input` emitted padding and height with no border or background.
// A 16px icon rendered at 55px and a text field rendered as bare text, with every check
// green — the failures were found by looking at a page, which is the thing this check
// exists to stop being the only way.
//
// Two clauses. The first pins the recovered declarations: BASE_RULES is the record of
// what each atom stated, so every line of it must reach the output. The second catches
// the next component to arrive without one — an emitted class either declares a
// `display` or names why it does not.
function checkClassBoxModel() {
  if (!parseComplete()) return NOT_PARSED;
  const { componentPlan, generateComponents, BASE_RULES, NO_BOX } =
    require('./generate-tokens-css');
  const { emit } = componentPlan();
  const css = generateComponents();

  const baseRule = (name) => {
    const m = css.match(new RegExp(`^\\s*\\.${name} \\{([^}]*)\\}`, 'm'));
    return m ? m[1] : null;
  };

  const failures = [];
  let pinned = 0;

  for (const [name, decls] of Object.entries(BASE_RULES)) {
    const body = baseRule(name);
    if (body === null) {
      failures.push(`${name} — BASE_RULES declares ${decls.length} lines for it, but there is no .${name} base rule in the output`);
      continue;
    }
    for (const d of decls) {
      if (body.includes(d)) pinned++;
      else failures.push(`${name} — BASE_RULES line "${d}" never reached .${name}; it was recovered from the atom this class replaced, so dropping it is a regression`);
    }
  }

  // The invariant, stated as the failure rather than as a list of names: width, height
  // and gap do nothing on an inline box. So any class that sets one of them, anywhere in
  // its ladder, has to declare a display somewhere in that same ladder.
  //
  // Written against the emitted CSS rather than against `emit`, because the two worst
  // instances were not component classes at all — `.icon-slot` and the `<name>-icon`
  // sub-parts are written by the emitter directly and never appear in the plan. A check
  // that enumerated the plan passed while a 16px icon rendered at 55px.
  //
  // Keyed on the LAST class in the selector, because the first one is the ancestor.
  // Written the other way this check passed while `.sidebar[data-size="sm"] .sidebar-item`
  // set height and gap with no display of its own — the rule got credited to `.sidebar`,
  // which has one. Eleven classes were hiding behind that, and the hole was found by
  // hand-marking-up `.sidebar-item` in the gallery shell, not by the check. Second time
  // this check has been wrong in the direction of passing.
  const byClass = new Map();
  for (const { selector, decls } of allRules()) {
    const classes = selector.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g);
    if (!classes) continue;
    const name = classes[classes.length - 1].slice(1);
    const e = byClass.get(name) || { sized: false, display: false };
    if ('width' in decls || 'height' in decls || 'gap' in decls) e.sized = true;
    if ('display' in decls) e.display = true;
    byClass.set(name, e);
  }
  let boxed = 0;
  for (const [name, e] of byClass) {
    if (!e.sized || NO_BOX[name]) continue;
    if (e.display) { boxed++; continue; }
    failures.push(`.${name} sets width, height or gap but declares no display — all three are inert on an inline box. Give it one in BASE_RULES (or SUB_PART_RULES for a sub-part), or state in NO_BOX why it needs none`);
  }

  return {
    failures,
    note: `${pinned} recovered declarations pinned, ${boxed} sized classes carry a display, ${Object.keys(NO_BOX).length} excused`,
  };
}

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
// it reached tokens.css as a value no atom read,
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
// The atoms are TypeScript, and nothing else in this repo compiles them. It used to be
// a `tsc --noEmit` over a whole Next app; it is now tsc over `catalog/`
// against the root tsconfig, which is the same question asked of a tenth of the files.
//
// Skipped when the root has no node_modules. Generating Loom needs no install — this is
// the only
// thing that does, and losing it silently on a fresh clone beats failing a generate
// that is otherwise fine. CI installs.
function checkTypecheck() {
  const tsc = path.join(ROOT, 'node_modules/typescript/bin/tsc');
  if (!fs.existsSync(tsc)) return { failures: [], note: 'root deps not installed — skipped' };
  const { spawnSync } = require('child_process');
  const run = spawnSync(process.execPath, [tsc, '--noEmit', '-p', 'tsconfig.json'], { cwd: ROOT, encoding: 'utf-8' });
  if (run.status === 0) return { failures: [], note: 'tsc --noEmit over catalog/' };
  const lines = String(run.stdout || run.stderr || '').split(String.fromCharCode(10)).filter(Boolean).slice(0, 10);
  return { failures: lines, note: 'tsc --noEmit over catalog/' };
}

// --- atom-class-coverage ---------------------------------------------------
// The gate that was missing for the whole of the Tailwind removal.
//
// `dialog` shipped visually broken across five commits with every check green. Its
// appearance lived in the TSX as `bg-surface-1 rounded-modal px-6`, utilities that
// resolved only through the `@theme` bridge; once the bridge went, they resolved to
// nothing. No check could see it: the static checks read the emitted CSS or the schemas,
// and `tsc` does not read CSS at all. A class that exists and a class that is *applied to
// something* are two questions, and only the first was being asked.
//
// So: every class an atom puts in a className must exist in the emitted CSS, and every
// custom property an emitted rule reads must be defined in tokens.css. The second half is
// here because `data-size="full"` on dialog emitted five `--type-body-full-*` references
// against a type role that does not exist — same shape of defect, found by hand.
//
// Known gaps are declared, not discovered. An allowlist that grows silently is how the
// thing being checked stops being checked.
const CLASS_GAPS = {};

function checkAtomClassCoverage() {
  if (!sheets()) return { failures: [], note: 'postcss not installed — skipped' };
  if (!parseComplete()) return NOT_PARSED;
  const defined = new Set(allRules().flatMap(({ selector }) =>
    (selector.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g) || []).map((c) => c.slice(1))));

  // Tailwind-shaped: a utility prefix followed by a dash, or a bare utility word. A class
  // Loom does not define and that looks like a utility is a class nothing will style.
  const BARE = new Set(['flex', 'grid', 'block', 'hidden', 'relative', 'absolute', 'fixed', 'truncate', 'shrink-0', 'grow']);
  const PREFIX = /^!?-?(p|m|px|py|pt|pb|pl|pr|mx|my|ml|mr|w|h|gap|space|text|bg|border|rounded|shadow|z|inset|top|left|right|bottom|size|flex|items|justify|grid|opacity|cursor|overflow|animate|transition|duration|ease|translate|ring|outline|font|leading|tracking|hover|fill|stroke)(-|$)/;

  const failures = [];
  let checked = 0;

  for (const file of fs.readdirSync(CATALOG).filter((f) => f.endsWith('.tsx'))) {
    const name = file.replace(/\.tsx$/, '');
    const src = fs.readFileSync(path.join(CATALOG, file), 'utf8');
    const allowed = new Set(CLASS_GAPS[name] || []);
    const strings = [
      ...src.matchAll(/className=(?:\{cn\(|\{)?\s*'([^']*)'/g),
      ...src.matchAll(/className="([^"]*)"/g),
      ...src.matchAll(/cva\(\s*'([^']*)'/g),
      ...src.matchAll(/CLASSES = '([^']*)'/g),
    ];
    for (const m of strings) {
      for (const token of m[1].split(/\s+/).filter(Boolean)) {
        checked += 1;
        const base = token.replace(/^.*:/, '').replace(/\[.*\]/, '').replace(/^!/, '');
        if (defined.has(base) || allowed.has(token)) continue;
        if (BARE.has(base) || PREFIX.test(base)) {
          failures.push(`${name} applies \`${token}\`, which no rule in the emitted CSS defines — it will render as nothing`);
        }
      }
    }
  }

  // Every --type-* an emitted rule reads has to be a role tokens.css actually declares.
  const declared = new Set();
  const read = new Set();
  for (const { root } of sheets()) {
    root.walkDecls((d) => {
      if (d.prop.startsWith('--type-')) declared.add(d.prop);
      for (const m of d.value.matchAll(/var\((--type-[a-z0-9-]+)\)/g)) read.add(m[1]);
    });
  }
  for (const v of read) {
    checked += 1;
    if (!declared.has(v)) {
      failures.push(`${v} is read by the class layer and declared nowhere — a tier is deriving a type role that does not exist`);
    }
  }

  return { failures, note: `${checked} class and token references across ${fs.readdirSync(CATALOG).filter((f) => f.endsWith('.tsx')).length} atoms` };
}

function verify() {
  const atoms = atomNames();
  const checks = [
    ['css-parse', checkCssParse()],
    ['doc-counts', checkDocCounts(atoms)],
    ['manifest-deps', checkManifestDeps(atoms)],
    ['interactive-implies-control', checkInteractiveImpliesControl(atoms)],
    ['class-coverage', checkClassCoverage()],
    ['atom-class-coverage', checkAtomClassCoverage()],
    ['class-box-model', checkClassBoxModel()],
    ['phantom-parts', checkPhantomParts()],
    ['variant-keys', checkVariantKeys()],
    ['base-config-provenance', checkBaseConfigProvenance()],
    ['touch-target', checkTouchTarget()],
    ['contrast', checkContrast()],
    ['composited-contrast', checkCompositedContrast()],
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
