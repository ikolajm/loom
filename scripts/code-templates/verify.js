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
 *   doc-counts        — hand-written "N components/atoms/patterns/groups" claims match,
 *                       and docs/pipeline.md's check list matches this file's registry
 *   manifest-deps     — every relative import is declared (regression guard on aacc481)
 *   base-config-provenance — the committed base configs are what answers.example generates
 *   touch-target      — every height ladder honours standards.json's touch-target.min
 *   contrast          — every on-X/X colour pair clears WCAG AA in both modes
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
const COUNTED_DOCS = ['README.md', 'docs/catalog.md', 'spec/questionnaire.md'];
// Not in COUNTED_DOCS: it carries no N-of-kind claims, only the check list below.
const CHECKLIST_DOC = 'docs/pipeline.md';

function atomNames() {
  return fs
    .readdirSync(CATALOG)
    .filter((f) => f.endsWith('.manifest.json'))
    .map((f) => f.replace(/\.manifest\.json$/, ''))
    .filter((n) => n !== 'cn')
    .sort();
}

// --- doc-counts -----------------------------------------------------------
function checkDocCounts(atoms, checkNames) {
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
  // `components` is by KIND, not "everything that is not cn". A snippet is delivered by
  // the sync and is not a component: theme-init.js is text a consumer pastes into <head>,
  // with nothing to import and no class contract. Counting it as one made three docs
  // wrong the moment it existed.
  const COMPONENT_KINDS = new Set(['atom', 'pattern', 'provider']);
  const expected = {
    components: kinds.filter((k) => COMPONENT_KINDS.has(k)).length,
    atoms: kinds.filter((k) => k === 'atom').length,
    patterns: kinds.filter((k) => k === 'pattern').length,
    snippets: kinds.filter((k) => k === 'snippet').length,
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
      for (const [kind, re] of /** @type {[string, RegExp][]} */ ([
        ['components', /(\d+)\s+(?:React\s+)?components\b/g],
        ['atoms', /(\d+)\s+atoms\b/g],
        ['patterns', /(\d+)\s+patterns\b/g],
        ['groups', /(\d+)\s+groups\b/g],
      ])) {
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
  // The check list in docs/pipeline.md is prose, and prose drifted twice: it named
  // fourteen of sixteen, was corrected by hand, then sat at sixteen while nine more
  // gates landed — including figma-assembly, the one guarding the Figma half. It is
  // derivable from the registry, so it is derived rather than trusted. Order is
  // asserted too, because the sentence claims the checks are in order.
  let listed = null;
  const listAbs = path.join(ROOT, CHECKLIST_DOC);
  if (!fs.existsSync(listAbs)) {
    failures.push(`${CHECKLIST_DOC} — named as the check-list doc but missing`);
  } else {
    const passage = fs.readFileSync(listAbs, 'utf8').match(/The checks, in order:([\s\S]*?)Any failure/);
    if (!passage) {
      failures.push(`${CHECKLIST_DOC} — no "The checks, in order:" passage to read`);
    } else {
      listed = [...passage[1].matchAll(/`([a-z][a-z-]*)`/g)].map((m) => m[1]);
      const missing = checkNames.filter((n) => !listed.includes(n));
      const extra = listed.filter((n) => !checkNames.includes(n));
      for (const n of missing) {
        failures.push(`${CHECKLIST_DOC} — check list omits \`${n}\``);
      }
      for (const n of extra) {
        failures.push(`${CHECKLIST_DOC} — check list names \`${n}\`, which is not a check`);
      }
      // Guarded on this block's own findings, not on `failures` — a numeral claim
      // failing above would otherwise silently skip the order assertion.
      if (!missing.length && !extra.length && listed.join() !== checkNames.join()) {
        failures.push(`${CHECKLIST_DOC} — check list is complete but not in run order`);
      }
    }
  }
  const listNote = listed
    ? `check list ${listed.length} of ${checkNames.length}`
    : 'check list unreadable';
  return {
    failures,
    note: `${claims} claims across ${COUNTED_DOCS.length} files, ${listNote}`,
  };
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
  const configs = ['button', 'form', 'layout', 'feedback', 'data-display', 'navigation']
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
// and the fallback a fresh clone builds from. A brand generated locally once rewrote it
// and rode along in the next commit, twice, once reaching master. The input is git-ignored
// and the output redirected to the ignored spec/config/local/; this is the check that
// neither has quietly come undone: the committed base configs must be exactly what the
// committed
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

  /** @type {[string, (a: object, s: object, m: object) => object][]} */
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

// --- config-parity -----------------------------------------------------------
// The committed base set is verified by base-config-provenance. The set that actually
// FEEDS the generator is not: config-paths.js prefers spec/config/local/ whenever it has
// the file, and local is git-ignored, so nothing in a clone can check it.
//
// That gap is not theoretical. docs/gotchas.md carries it as a trap — "a stale local set
// silently outranks a fresh committed one" — and it has now bitten twice in one session:
// removing the `fab` height role left three dead --height-fab-* tokens emitting from a
// stale local with all gates green, and two break tests written against a mutated
// standards.json passed, because verify read a local set generated before the mutation.
//
// This cannot be a provenance check. Local IS a brand and its VALUES are supposed to
// differ — that is the whole point of the slot, and base-config-provenance's own comment
// says a check that reads whatever is local checks nothing. What must not differ is the
// SHAPE: a brand changes what a token is, never which tokens exist. So this compares key
// paths and ignores every value.
//
// Absent local set passes and says so — a fresh clone has none, and that is the
// supported state rather than a failure.
function checkConfigParity() {
  const { COMMITTED_ROOT, LOCAL_ROOT } = require('../config-paths');
  const FILES = ['colors.json', 'spacing.json', 'sizing.json', 'typography.json', 'effects.json'];

  // Every key path in the object, values discarded. Arrays are compared by index, because
  // a config array is a fixed ladder rather than a bag — a brand with a different number
  // of ramp stops is a shape change and should report.
  const keyPaths = (node, prefix, out) => {
    if (node === null || typeof node !== 'object') return out;
    const entries = Array.isArray(node)
      ? node.map((v, i) => [String(i), v])
      : Object.entries(node);
    for (const [k, v] of entries) {
      const at = prefix ? prefix + '.' + k : k;
      out.add(at);
      keyPaths(v, at, out);
    }
    return out;
  };

  const failures = [];
  let compared = 0;
  let present = 0;

  for (const file of FILES) {
    const localPath = path.join(LOCAL_ROOT, 'base', file);
    if (!fs.existsSync(localPath)) continue;
    present++;
    const basePath = path.join(COMMITTED_ROOT, 'base', file);
    if (!fs.existsSync(basePath)) {
      failures.push(`local has base/${file} but the committed set does not`);
      continue;
    }
    const a = keyPaths(JSON.parse(fs.readFileSync(basePath, 'utf8')), '', new Set());
    const b = keyPaths(JSON.parse(fs.readFileSync(localPath, 'utf8')), '', new Set());
    compared += a.size;

    // $note is prose and $derived records which families were invented for THAT brand.
    // Both are per-brand by construction and neither declares a token.
    const skip = (k) => k.split('.').some((seg) => seg === '$note' || seg === '$derived');
    const missing = [...a].filter((k) => !b.has(k) && !skip(k));
    const extra = [...b].filter((k) => !a.has(k) && !skip(k));

    // Report a handful, not a wall: a stale local usually differs by a whole subtree and
    // the first few name it.
    const show = (list) => list.slice(0, 4).join(', ') + (list.length > 4 ? `, +${list.length - 4} more` : '');
    if (missing.length) {
      failures.push(
        `local base/${file} is missing ${missing.length} key(s) the committed set declares — ${show(missing)}`
        + ' — regenerate it: npm run configs -- --input <your answers>'
      );
    }
    if (extra.length) {
      failures.push(
        `local base/${file} declares ${extra.length} key(s) the committed set does not — ${show(extra)}`
        + ' — usually a stale set left behind by a schema change; regenerate it'
      );
    }
  }

  if (!present) return { failures, note: 'no local config set — a clone builds from the committed base' };
  return { failures, note: `${present} local config file(s), ${compared} key paths against the committed shape` };
}

// --- dead-exports ------------------------------------------------------------
// A name on module.exports that nothing references, in any file including its own.
//
// It exists because a removal that leaves its helpers behind is invisible otherwise —
// twice the leftovers were found by a hand sweep, which is not a mechanism.
//
// Deliberately narrow. An export used only inside its own module is over-exported, not
// dead, and there are enough of those that flagging them would be style noise in a check
// that has to stay worth reading. An export nothing mentions anywhere is unambiguous.
//
// Not covered: a function that IS called but whose output is dead — a real limitation of
// checking the import graph rather than the interpolation. It has gone green over exactly
// that before, on helpers whose returned strings reached no template.
// `atom-class-coverage` is what catches an emitted-but-unrenderable class, and only once
// an atom applies one.
// Exempt by name and by reason, never by pattern. An allowlist that grows silently is how
// the thing being checked stops being checked.
const UNCALLED_EXPORTS = {
  'sourceOf': 'a debugging entry point, not dead: gotchas.md and pipeline.md both point a '
    + 'reader at it to find which config root a file came from. Nothing in the repo calls '
    + 'it and nothing should — it answers a question you ask from a REPL. Wiring it into '
    + 'the generate log would make it live and is a real option.',
};

function checkDeadExports() {
  const roots = [path.join(ROOT, 'scripts')];
  const files = [];
  while (roots.length) {
    const dir = roots.pop();
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') roots.push(full); }
      else if (e.name.endsWith('.js')) files.push(full);
    }
  }

  const texts = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));
  // Identifier tokens per file, as a set. A tokenizer rather than a per-name regex: an
  // interpolated regex is how the first version of tone-fallbacks silently matched nothing.
  const IDENT = /[A-Za-z_$][A-Za-z0-9_$]*/g;
  const tokens = new Map();
  for (const [f, t] of texts) tokens.set(f, t.match(IDENT) || []);

  const EXPORTS = /module\.exports\s*=\s*\{([^}]*)\}/;
  const failures = [];
  let checked = 0;

  for (const [f, t] of texts) {
    const m = t.match(EXPORTS);
    if (!m) continue;
    const names = m[1]
      .split(',')
      .map((s) => s.split(':')[0].trim())
      .filter((s) => s && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s));

    for (const name of names) {
      checked += 1;
      let refs = 0;
      for (const [g, toks] of tokens) {
        for (const tok of toks) if (tok === name) refs += 1;
        // In its own file a live name appears at least three times: declaration, export,
        // and a use. Two means declared and exported and never touched.
        if (g === f && refs > 2) break;
      }
      if (refs <= 2 && !UNCALLED_EXPORTS[name]) {
        failures.push(`${path.relative(ROOT, f)} exports \`${name}\`, which nothing references — not another module, not its own file. It is declared, exported, and never called`);
      }
    }
  }

  return { failures, note: `${checked} named exports over ${files.length} files, ${Object.keys(UNCALLED_EXPORTS).length} exempt` };
}

// --- tone-fallbacks ----------------------------------------------------------
// Every `--tone-*` read carries a fallback, and no component default outranks a treatment.
//
// Tone and treatment are orthogonal classes, and both halves used to fail silently. A tone
// alone set four custom properties nobody read. A treatment alone referenced undefined
// ones — which makes the declaration invalid at computed-value time, so it is DROPPED
// rather than falling back, and `treat-outline` alone drew no border at all. Neither half
// errors, warns, or leaves a visual hint. A consumer build shipped `badge tone-primary`
// with no background, and the author then wrote three buttons as `treat-outline` with no
// tone in the same edit that fixed the badge.
//
// Second assertion, from a defect this check's own flow nearly introduced. The badge
// default was specified as a plain `.badge` rule. Treatments are emitted in loom.css and
// badge in loom.components.css, both inside @layer loom.components — so at equal
// specificity the later FILE wins, and `.badge { background-color: ... }` would have
// outranked the `background-color: transparent` in .treat-outline and .treat-ghost and
// filled every outline badge. Anything providing a tone default has to sit below the
// treatments, which is what :where() buys. Following the spec literally would have
// traded a silent no-fill for a silent wrong-fill.
const TONE_PROPS = ['--tone-bg', '--tone-fg', '--tone-text', '--tone-border'];

// How a declaration uses a tone property: 'bare' (no fallback, the defect), 'fallback', or
// null. Written with string scanning rather than a regex on purpose — the first version of
// this was an interpolated regex whose escapes did not survive, so it matched nothing and
// passed a stylesheet that had the fallback stripped out by hand. Third time in this repo
// a check has been wrong in the direction of passing.
function readTone(value, tone) {
  let found = null;
  for (let i = value.indexOf('var('); i !== -1; i = value.indexOf('var(', i + 4)) {
    const inner = value.slice(i + 4).trimStart();
    if (!inner.startsWith(tone)) continue;
    const after = inner.slice(tone.length).trimStart();
    if (after.startsWith(')')) return 'bare';
    if (after.startsWith(',')) found = 'fallback';
  }
  return found;
}

function checkToneFallbacks() {
  if (!parseComplete()) return NOT_PARSED;

  const failures = [];
  let reads = 0;
  let defaults = 0;

  for (const { selector, decls } of allRules()) {
    for (const [prop, value] of Object.entries(decls)) {
      for (const tone of TONE_PROPS) {
        const use = readTone(value, tone);
        if (use === 'bare') {
          failures.push(`${selector} reads ${tone} with no fallback in \`${prop}\` — used without a tone class the declaration is invalid at computed-value time and gets dropped, so the rule renders as nothing rather than as a neutral version of itself`);
        } else if (use === 'fallback') {
          reads += 1;
        }
      }
    }

    // A rule that is not a treatment but hands out a tone fill is a component default.
    // It must not be able to beat the treatment it defers to.
    const isTreatment = /\.treat-[a-z]/.test(selector);
    const setsToneFill = ['background-color', 'color'].some(
      (p) => decls[p] && (decls[p].includes('--tone-bg') || decls[p].includes('--tone-fg'))
    );
    if (setsToneFill && !isTreatment) {
      defaults += 1;
      // Zero specificity is the only way to sit under a treatment emitted in an earlier
      // file of the same layer. Anything with a bare class in the selector outranks it.
      const bare = selector.replace(/:where\([^)]*\)/g, '');
      if (/\.[a-zA-Z]/.test(bare)) {
        failures.push(`${selector} sets a tone fill outside a .treat-* rule and carries specificity of its own — it outranks .treat-outline and .treat-ghost, which are emitted in an earlier file of the same layer, so every outline and ghost variant of it renders filled. Wrap the selector in :where()`);
      }
    }
  }

  return { failures, note: `${reads} tone reads, all with fallbacks; ${defaults} tone default(s) held at zero specificity` };
}

// --- focus-ring --------------------------------------------------------------
// The focus ring reaches the elements, not a class someone has to remember.
//
// It shipped gated on `.control` alone, and a whole consumer app rendered with a ring on
// nothing: every button in it was written `class="button interactive"`, deliberately, by
// an author with loom.css open who wanted the press treatment. Lint passed, the build
// passed, and with a mouse it looks correct. The mistake is invisible to the person
// making it, which is why this is a gate and not a line in gotchas.md.
//
// Two things are asserted. That at least one `:focus-visible` rule is reachable without
// naming a class — a class-gated ring is opt-in, and an accessibility floor cannot be.
// And that each element a keyboard lands on is inside one of those selectors, because
// "some element gets a ring" is the weaker claim and the one that was already true.
//
// The list is spelled out here rather than imported from the emitter. The point is to
// notice when the emitter's idea of what a keyboard reaches drifts, so reading the set
// from the emitter would make the check agree with whatever it does.
const FOCUSABLE = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
];

function checkFocusRing() {
  if (!parseComplete()) return NOT_PARSED;

  const focusRules = allRules().filter(({ selector }) => selector.includes(':focus-visible'));
  if (!focusRules.length) {
    return {
      failures: ['no :focus-visible rule is emitted at all — nothing in the substrate shows a keyboard user where they are'],
      note: '0 focus-visible rules',
    };
  }

  // A selector that names no class is one a consumer cannot fail to opt into. `:where()`
  // and `:not()` wrappers are transparent for this — what matters is whether a class is
  // required to match, so the test is the presence of a class anywhere in the selector.
  const ungated = focusRules.filter(({ selector }) => !/\.[a-zA-Z]/.test(selector));

  const failures = [];
  if (!ungated.length) {
    failures.push(
      `all ${focusRules.length} :focus-visible rules are gated on a class (${focusRules.map((r) => r.selector.replace(/\s+/g, ' ')).join('; ')}) — the ring is opt-in, so an element styled without that exact class shows a keyboard user nothing`
    );
    return { failures, note: `${focusRules.length} focus-visible rules, none reachable without a class` };
  }

  // Every ungated rule has to actually draw something. A rule that only recolours is the
  // validity variant's job and would leave a bare element ringless.
  const drawing = ungated.filter(({ decls }) => 'outline' in decls || 'outline-width' in decls || 'box-shadow' in decls);
  if (!drawing.length) {
    failures.push(
      `${ungated.length} :focus-visible rules are reachable without a class, but none of them draw a ring — they set only ${[...new Set(ungated.flatMap(({ decls }) => Object.keys(decls)))].join(', ')}`
    );
  }

  const covered = drawing.map(({ selector }) => selector.replace(/\s+/g, ''));
  for (const sel of FOCUSABLE) {
    if (!covered.some((c) => c.includes(sel.replace(/\s+/g, '')))) {
      failures.push(`${sel} is keyboard-focusable and no unclassed :focus-visible rule covers it`);
    }
  }

  return {
    failures,
    note: `${FOCUSABLE.length} focusable selectors, ${drawing.length} of ${focusRules.length} focus rules reachable without a class`,
  };
}

// --- touch-target ----------------------------------------------------------
// `standards.json` declared touch-target.min and nothing consumed it: the value reached
// tokens.css unread while the default button shipped under it. The semantic height ladder
// is what makes it
// reachable, and this is what makes it binding — every tier of every role in the `touch`
// ladder must sit at or above the minimum, checked against direction-mappings rather than
// against the one resolved config, so a ladder edit cannot quietly drop below it.
//
// Every ladder is checked, each against the level it is built for. `touch` answers the
// AAA figure (2.5.5) because that is what it exists to promise. `compact` and `standard`
// answer the AA minimum (2.5.8), which their smallest tiers clear without help, and which
// nothing asserted while the unconditional clamp was hiding them at the floor. Now that
// the floor is conditioned on `pointer: coarse`,
// those two render at their declared heights on a fine pointer, so the AA floor is the
// thing standing between a ladder edit and an undersized target.
function checkTouchTarget() {
  const standards = readJson('spec/config/standards.json');
  const mappings = readJson('spec/direction-mappings.json');
  const min = parseFloat(standards.sizing['touch-target'].min);
  const primitives = standards.sizing['component-height'];

  const failures = [];
  let checked = 0;

  // WCAG 2.2 SC 2.5.8 Target Size (Minimum). Lives here with AA_TEXT and AA_NON_TEXT
  // rather than in standards.json: it is a figure the spec fixes, not one a brand answers.
  const AA_TARGET = 24;

  for (const [name, cfg] of Object.entries(mappings['control-height'])) {
    if (name.startsWith('$')) continue;
    const floor = name === 'touch' ? min : AA_TARGET;
    const level = name === 'touch' ? 'AAA 2.5.5' : 'AA 2.5.8';
    for (const [role, tiers] of Object.entries(cfg['semantic-height'] || {})) {
      if (role.startsWith('$')) continue;
      for (const [tier, token] of Object.entries(tiers)) {
        checked++;
        const px = parseFloat(primitives[token]);
        if (Number.isNaN(px)) {
          failures.push(`control-height.${name}.${role}.${tier} — "${token}" is not a component-height primitive`);
        } else if (px < floor) {
          failures.push(
            `control-height.${name}.${role}.${tier} — ${token} is ${px}px, under the ${floor}px ${level} floor`
          );
        }
      }
    }
  }

  // What is NOT checked here: that a phone product actually answers `touch`. The
  // archetypes used to promise it — consumer-mobile and social resolved control-height
  // to the touch ladder, and this check held them to it. Both went with productType, so
  // the floor is now the answerer's to hold. The ladder above is still verified; nothing
  // verifies that anyone selects it.

  return { failures, note: `${checked} control tiers — touch against ${min}px, compact and standard against ${AA_TARGET}px` };
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
// The two WCAG ratios, together and at module scope. A threshold the spec fixes belongs
// to the file, not to whichever check happened to need it first.
const AA_TEXT = 4.5; // SC 1.4.3 Contrast (Minimum)
const AA_NON_TEXT = 3.0; // SC 1.4.11 Non-text Contrast

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
  // the exact opposite of `base-config-provenance`, which reads the
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

const TONE_SURFACES = ['surface', 'surface-1', 'surface-2', 'surface-3'];

// --- tone-contrast ------------------------------------------------------------
// The colour a treatment paints its label WITH, against the surfaces it can land on.
//
// `contrast` checks a foreground against its own fill — on-primary against primary.
// That is the declared pairing and it is the wrong one for .treat-outline,
// .treat-ghost and .link, which paint no fill at all. Until this existed, the pairing
// that decides whether an outline badge can be read was measured by nothing.
//
// It reads {family}-text, not {family} — a per-family text role that generate-colors.js
// resolves against the most raised surface tier, so every pair passes by construction
// rather than by exemption. Reading the base role at full strength put a third of the
// pairs below AA, which is what the separate role is for.
//
// A brand whose ramp cannot produce a legible label still fails here, loudly, which
// is the outcome worth having: the alternative is shipping an unreadable label.

function checkToneContrast() {
  const colors = loadConfig('base/colors.json');
  const failures = [];
  let pairs = 0;

  for (const mode of Object.keys(colors.roles || {})) {
    const groups = colors.roles[mode];
    const flat = {};
    for (const group of Object.values(groups)) {
      for (const [role, value] of Object.entries(group)) {
        if (typeof value === 'string' && value.startsWith('#')) flat[role] = value;
      }
    }

    // The same four-role test the tones emitter uses to decide a family qualifies,
    // restated rather than imported: a check that asks the emitter which families exist
    // agrees with the emitter by construction.
    const families = Object.keys(groups).filter((f) => f !== 'neutral'
      && [f, 'on-' + f, f + '-container', 'on-' + f + '-container'].every((k) => k in flat));

    for (const family of families) {
      // The role --tone-text actually reads. Its absence is itself a failure: a family
      // that qualifies for a tone but declares no text role emits
      // `--tone-text: var(--{family}-text)` pointing at nothing, and an invalid
      // custom-property reference drops the whole declaration — so the label renders as
      // whatever it inherited rather than as the tone, silently.
      const label = flat[family + '-text'];
      if (!label) {
        failures.push(
          mode + ': ' + family + ' qualifies for a tone but declares no ' + family
          + '-text role, so .tone-' + family + ' points --tone-text at an undefined property'
        );
        continue;
      }

      for (const surface of TONE_SURFACES) {
        if (!flat[surface]) continue;
        pairs++;
        const ratio = contrastRatio(label, flat[surface]);

        if (ratio < AA_TEXT) {
          failures.push(
            mode + ': tone-' + family + ' text (' + label + ') on ' + surface
            + ' (' + flat[surface] + ') — ' + ratio.toFixed(2) + ':1, needs ' + AA_TEXT
            + ' — reached by .treat-outline, .treat-ghost and .link'
          );
        }
      }
    }
  }

  return {
    failures,
    note: pairs + ' tone-text/surface pairs against WCAG AA ' + AA_TEXT + ':1, nothing parked',
  };
}

// --- border-contrast ---------------------------------------------------------
// The colour a treatment paints its EDGE with, against the surfaces that edge can land on.
//
// `tone-contrast` measures --tone-text and stops there. --tone-border is a separate role
// read by .treat-outline and by badge's and button's outline rules, and until this existed
// nothing measured it at all — the gap the tone-text flow named on its way past.
//
// 3:1, not 4.5: WCAG 1.4.11 puts a non-text boundary at 3:1. Same four tiers and the same
// worst-case argument as tone-contrast — --tone-border is one value and nothing tells a
// badge which tier it landed on, so surface-3 is in scope or the guarantee is not one.
//
// It reads {family}-border, the role .tone-{family} assigns. That role is resolved by the
// same nearest-passing-shade pass as {family}-text, at 3:1 instead of 4.5:1 — the pass
// runs both kinds in one loop so they cannot drift. Its absence is itself a failure: a
// family that qualifies for a tone but declares no border role emits
// `--tone-border: var(--{family}-border)` pointing at nothing, and an invalid custom
// property reference drops the whole declaration, so the border falls back to --outline
// silently.
const BORDER_CONTRAST_PARKS = {};

function checkBorderContrast() {
  const colors = loadConfig('base/colors.json');
  const failures = [];
  const hit = new Set();
  let pairs = 0;

  for (const mode of Object.keys(colors.roles || {})) {
    const groups = colors.roles[mode];
    const flat = {};
    for (const group of Object.values(groups)) {
      for (const [role, value] of Object.entries(group)) {
        if (typeof value === 'string' && value.startsWith('#')) flat[role] = value;
      }
    }

    // Same four-role qualification test as tone-contrast, restated for the same reason.
    const families = Object.keys(groups).filter((f) => f !== 'neutral'
      && [f, 'on-' + f, f + '-container', 'on-' + f + '-container'].every((k) => k in flat));

    for (const family of families) {
      const edge = flat[family + '-border'];
      if (!edge) {
        failures.push(
          mode + ': ' + family + ' qualifies for a tone but declares no ' + family
          + '-border role, so .tone-' + family + ' points --tone-border at an undefined property'
        );
        continue;
      }

      for (const surface of TONE_SURFACES) {
        if (!flat[surface]) continue;
        pairs++;
        const ratio = contrastRatio(edge, flat[surface]);
        if (ratio >= AA_NON_TEXT) continue;

        const key = mode + ':' + family + ':' + surface;
        const park = BORDER_CONTRAST_PARKS[key];
        // Mark it seen either way. A park whose hexes no longer match is reported on the
        // failure line below; letting the stale-park sweep fire too would add a second
        // message saying it no longer fails, which is the one thing that is not true.
        if (park) hit.add(key);
        // Parked by hex pair, not by role name: a brand whose ramp moves un-parks itself
        // rather than carrying a stale exemption for a colour that is no longer there.
        if (park && park.pair[0] === edge && park.pair[1] === flat[surface]) continue;
        failures.push(
          mode + ': tone-' + family + ' border (' + edge + ') on ' + surface
          + ' (' + flat[surface] + ') — ' + ratio.toFixed(2) + ':1, needs ' + AA_NON_TEXT
          + ' — reached by .treat-outline'
          + (park ? ' (parked, but for ' + park.pair.join(' on ') + ' — the ramp moved)' : '')
        );
      }
    }
  }

  // A park that no longer describes a failure is a lie the next reader inherits.
  for (const key of Object.keys(BORDER_CONTRAST_PARKS)) {
    if (!hit.has(key)) {
      failures.push(key + ' is in BORDER_CONTRAST_PARKS but no longer fails — drop the entry');
    }
  }

  return {
    failures,
    note: pairs + ' tone-border/surface pairs against WCAG 1.4.11 ' + AA_NON_TEXT + ':1, '
      + Object.keys(BORDER_CONTRAST_PARKS).length + ' parked',
  };
}

// --- figma-assembly ----------------------------------------------------------
// The Figma half is the one piece of the pipeline that `npm run generate` never touches:
// `npm run figma` is a separate command, so its scripts can rot for as long as nobody
// runs it. They had not been run at all until the day this was written, which is exactly
// how long a break would have gone unnoticed.
//
// Built in memory from the assembler's own exports — no temp files, no side effects, the
// same shape as base-config-provenance. It does NOT paste them into Figma; a plugin
// console is the half a check cannot reach, and that stays a human pass.
//
// Two things, and they are the two that fail silently:
//
//   Every script must COMPILE. They are assembled by slicing templates at a marker and
//   prepending a JSON config line, so a template edit that unbalances a brace produces a
//   file that is written happily and throws only when a designer pastes it.
//
//   No role template may survive unresolved. `{fill.*}`, `{readable.*}` and `{boundary.*}`
//   are resolved by the assembler against $fillShades / $textShades / $borderShades so
//   Figma aliases the primitive the CODE shipped, not the one the template asked for. Miss
//   a branch and the literal string travels into the plugin console — which the resolver's
//   own comment records having happened once already, and which nearly happened again when
//   {boundary.*} was added and needed a third branch.
//
// `{palette.*}` is deliberately NOT a failure. It is the alias path Figma needs, and it is
// what a resolved role looks like on the other side.
const FIGMA_RAW_TEMPLATE = /\{(fill|readable|boundary)\.[A-Za-z0-9._-]+\}/g;

function checkFigmaAssembly() {
  const vm = require('vm');
  const failures = [];
  let scripts = 0;
  let bytes = 0;

  let built;
  try {
    const { buildSharedUtils, buildAllSteps } = require('../assemble-figma');
    built = [{ name: '00_shared-utils', script: buildSharedUtils() }, ...buildAllSteps()];
  } catch (err) {
    return { failures: [`the assembler threw before emitting anything — ${err.message}`], note: 'not run' };
  }

  if (!built.length) return { failures: ['the assembler emitted no scripts'], note: 'not run' };

  for (const { name, script } of built) {
    scripts++;
    bytes += script.length;
    // Compiles without running: these call the `figma` global, which does not exist here.
    try {
      new vm.Script(script, { filename: `${name}.js` });
    } catch (err) {
      failures.push(`${name}.js does not parse — ${err.message}`);
    }
    const raw = [...new Set(script.match(FIGMA_RAW_TEMPLATE) || [])];
    if (raw.length) {
      failures.push(
        `${name}.js carries ${raw.length} unresolved role template(s) — ${raw.slice(0, 3).join(', ')}`
        + (raw.length > 3 ? `, +${raw.length - 3} more` : '')
        + ' — the assembler needs a resolver branch for that kind, or the literal reaches the plugin console'
      );
    }
  }

  return { failures, note: `${scripts} scripts, ${bytes} chars, compiled and swept for unresolved role templates` };
}

// --- figma-code-syntax --------------------------------------------------------
// A Figma variable's code syntax is the string a developer copies out of the design file.
// Nothing downstream resolves it, so a wrong one is not a broken build anywhere - it is a
// designer handing over a token that does not exist.
//
// Two shipped that way. The spacing primitives published `var(--spacing-4)` for a scale
// emitted as `--space-4`, so every spacing variable in Figma carried a name no stylesheet
// declares. The semantic spacing roles published `px-4`, `gap-2` and `max-w-[1280px]`,
// utilities from a framework this repo no longer has under it. figma-assembly saw neither:
// it compiles the scripts and sweeps for unresolved role templates, and both of these
// compile and carry no template.
//
// The scripts are RUN, against a stub of the Figma API, so what is checked is the string
// each variable actually receives rather than the shape of the literal that builds it.
// `var(--height-${role}-${tier})` interpolates to 30 different names and a prefix match
// would clear all of them on the strength of one.
//
// Two shapes are legitimate, because they are the two ways Loom's output can be
// referenced: `var(--token)` against a custom property some sheet declares, and `.class`
// (or `.prefix-*`) against classManifest(). Anything else fails on shape alone - that is
// what catches a utility from somewhere else, without keeping a list of framework
// prefixes to go stale.
function checkFigmaCodeSyntax() {
  if (!sheets()) return { failures: [], note: 'postcss not installed - skipped' };
  if (!parseComplete()) return NOT_PARSED;

  const vm = require('vm');
  const captured = [];
  const collections = [];
  const byId = new Map();
  let seq = 0;

  const makeVar = (name, collection) => {
    const v = {
      id: `v${seq++}`, name, scopes: [],
      setValueForMode() {},
      setVariableCodeSyntax(platform, value) { captured.push({ name, value }); },
    };
    byId.set(v.id, v);
    if (collection) collection.variableIds.push(v.id);
    return v;
  };
  const figma = {
    variables: {
      createVariableCollection(name) {
        const c = {
          id: `c${seq++}`, name, variableIds: [], modes: [{ modeId: 'm0', name: 'default' }],
          renameMode() {},
          addMode(n) { const id = `m${seq++}`; c.modes.push({ modeId: id, name: n }); return id; },
        };
        collections.push(c);
        return c;
      },
      createVariable: (name, collection) => makeVar(name, collection),
      getLocalVariableCollections: () => collections,
      getVariableById: (id) => byId.get(id),
      createVariableAlias: (v) => ({ type: 'VARIABLE_ALIAS', id: v.id }),
    },
    createTextStyle: () => ({ setBoundVariable() {} }),
    createEffectStyle: () => ({ effects: [], setBoundVariable() {} }),
    loadFontAsync: () => Promise.resolve(),
    listAvailableFontsAsync: () => Promise.resolve([]),
  };

  let built;
  try {
    const { buildSharedUtils, buildAllSteps } = require('../assemble-figma');
    built = [{ name: '00_shared-utils', script: buildSharedUtils() }, ...buildAllSteps()];
  } catch (err) {
    return { failures: [`the assembler threw before emitting anything - ${err.message}`], note: 'not run' };
  }

  const failures = [];
  const ctx = vm.createContext({ figma, console: { log() {}, warn() {}, error() {} } });
  for (const { name, script } of built) {
    // A step that awaits would defer the rest of its body past this check, and the code
    // syntax set after the await would go unseen - a silent under-count, which is the one
    // failure mode a gate must not have. Only the shared-utils module may await: its
    // awaits sit inside helper bodies that the steps call, not at its top level.
    if (name !== '00_shared-utils' && /\bawait\b/.test(script) && /createVar(iable)?\s*\(|createAlias\s*\(|createDirect\s*\(/.test(script)) {
      failures.push(`${name}.js both awaits and creates variables - this check cannot see past the await, so teach it or drop the await`);
      continue;
    }
    try {
      const done = new vm.Script(script, { filename: `${name}.js` }).runInContext(ctx);
      if (done && typeof done.then === 'function') done.catch(() => {});
    } catch (err) {
      // figma-assembly owns "does it compile"; a throw here is the stub coming up short.
      failures.push(`${name}.js threw against the API stub - ${err.message}`);
    }
  }

  if (!captured.length) {
    return { failures: failures.concat('no code syntax was set by any script - the stub is not seeing the pipeline'), note: 'not run' };
  }

  const declared = new Set();
  for (const { root } of sheets()) {
    root.walkDecls((d) => { if (d.prop.startsWith('--')) declared.add(d.prop); });
  }
  const { classManifest } = require('./generate-tokens-css');
  const classes = classManifest();

  for (const { name, value } of captured) {
    const asVar = /^var\((--[a-z0-9-]+)\)$/.exec(value);
    if (asVar) {
      if (!declared.has(asVar[1])) {
        failures.push(`${name}: code syntax \`${value}\` names a custom property no stylesheet declares`);
      }
      continue;
    }
    if (value.startsWith('.')) {
      const bare = value.slice(1);
      if (bare.endsWith('-*')) {
        const prefix = bare.slice(0, -1);
        if (![...classes].some((c) => c.startsWith(prefix))) {
          failures.push(`${name}: code syntax \`${value}\` matches no emitted class`);
        }
      } else if (!classes.has(bare)) {
        failures.push(`${name}: code syntax \`${value}\` names a class no stylesheet emits`);
      }
      continue;
    }
    failures.push(
      `${name}: code syntax \`${value}\` is neither a var() nor a class - ` +
      'Loom publishes nothing a consumer could write that way'
    );
  }

  return {
    failures,
    note: `${captured.length} code syntaxes across ${collections.length} collections, resolved against the emitted CSS`,
  };
}

// --- typecheck-scripts --------------------------------------------------------
// The other half of typecheck: that one compiles the catalog Loom emits, this one checks
// the modules that do the emitting, from their JSDoc.
//
// It exists because a correct @param did not stop the defect it described. The Figma
// helper documented `codeSyntax` as a CSS custom property string, with a worked example,
// one function above the call that passed it a utility class - and that shipped. A tag
// nothing reads is prose wearing a sigil, and it carries the false confidence of looking
// like a type. This is what makes the tags in this repo load-bearing; it found a call
// passing an argument to a function that takes none on its first run.
//
// scripts/figma-* is excluded, and the reason is in tsconfig.scripts.json: those files
// are template fragments, not modules. figma-assembly compiles them in their assembled
// form, which is the only form they have a meaning in.
//
// Skipped without an install, like typecheck, and for the same reason: generating Loom
// needs no dependencies, so losing this on a fresh clone beats failing a generate that is
// otherwise fine.
function checkTypecheckScripts() {
  const tsc = path.join(ROOT, 'node_modules/typescript/bin/tsc');
  if (!fs.existsSync(tsc)) return { failures: [], note: 'root deps not installed - skipped' };
  const { spawnSync } = require('child_process');
  const run = spawnSync(process.execPath, [tsc, '--noEmit', '-p', 'tsconfig.scripts.json'], { cwd: ROOT, encoding: 'utf-8' });
  if (run.status === 0) return { failures: [], note: 'checkJs over scripts/, figma templates excluded' };
  const lines = String(run.stdout || run.stderr || '').split(String.fromCharCode(10)).filter(Boolean).slice(0, 10);
  return { failures: lines, note: 'checkJs over scripts/, figma templates excluded' };
}

// --- typecheck ---------------------------------------------------------------
// The atoms are TypeScript, and nothing else in this repo compiles them. `tsc --noEmit`
// over `catalog/` against the root tsconfig.
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
// `dialog` once shipped visually broken across five commits with every check green: its
// appearance lived in the TSX as class names no stylesheet defined. No check could see
// it — the static checks read the emitted CSS or the schemas, and `tsc` does not read CSS
// at all. A class that exists and a class that is *applied to something* are two
// questions, and only the first was being asked.
//
// So: every class an atom puts in a className must exist in the emitted CSS, and every
// custom property an emitted rule reads must be defined in tokens.css. The second half is
// here because `data-size="full"` on dialog emitted five `--type-body-full-*` references
// against a type role that does not exist — same shape of defect, found by hand.
//
// Known gaps are declared, not discovered. An allowlist that grows silently is how the
// thing being checked stops being checked.
const CLASS_GAPS = {};

// The class half is a BACKSTOP now, not the mechanism. Every naming site in the component
// templates resolves through shared.js's `cls()`, which throws at generation against
// classManifest() — so a name that reached a .tsx has already been checked, and this
// re-check is tautological for every site that went through it. What it still catches is
// the site that did not: a template author writing a literal into the JSX directly.
//
// It is strict: with the manifest to check against there is no reason to guess at shape.
// A token in a className is a class, and a class the stylesheets do not emit is a defect
// whatever it looks like. Guessing at shape is what let a misspelling of a Loom class
// through while a misspelling shaped like a foreign utility failed — the same absence
// from the CSS, caught or missed on spelling alone.
//
// The fifth pattern reaches cva variant VALUES, where `treat-*` and `tone-inherit` sit;
// none of the other four does. Fully interpolated names (`'tone-' + badgeTone[color] +
// ...`) are out of reach of any scan — those are resolved at generation by buildToneLookup
// and checked against the emitted CSS by tone-matrix.
function checkAtomClassCoverage() {
  if (!sheets()) return { failures: [], note: 'postcss not installed — skipped' };
  if (!parseComplete()) return NOT_PARSED;
  const { classManifest } = require('./generate-tokens-css');
  const defined = classManifest();

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
      // Anchored at both ends so the bare `'tone-'` prefix in the concatenated
      // expression is not read as a class. It is a fragment, not a name.
      ...src.matchAll(/'(tone-[a-z][a-z-]*[a-z]|treat-[a-z][a-z-]*[a-z])'/g),
    ];
    for (const m of strings) {
      for (const token of m[1].split(/\s+/).filter(Boolean)) {
        checked += 1;
        if (defined.has(token) || allowed.has(token)) continue;
        failures.push(
          `${name} applies \`${token}\`, which no rule in the emitted CSS defines — it will ` +
          'render as nothing. Route the name through cls() in the template so this fails at ' +
          'generation instead of here'
        );
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

// --- tone-matrix --------------------------------------------------------------
// Every colour x intensity pair an atom can express must land on a class that exists,
// and Badge and Button must answer to one colour vocabulary.
//
// This covers a real blind spot rather than doubling up on atom-class-coverage. An atom
// builds its tone by concatenation - `'tone-' + badgeTone[color] + (intensity === 'soft'
// ? '-soft' : '')` - so no scan of the source ever sees the string `tone-info-soft`.
// atom-class-coverage reads the literal class names an atom applies and cannot resolve an
// interpolated one. That same blind spot is why `.dialog-fixed` shipped unable to do its
// only job with seventeen gates green.
//
// The failure is cheap to cause and silent: add a colour to a component schema whose
// family does not emit the full four-role set, and the atom compiles, typechecks, renders
// and paints nothing. buildSection15_Tones only emits a family carrying all four roles,
// so the schema's colour list and the emitted tones can disagree with nothing noticing.
//
// The maps are lifted out of the GENERATED components, not recomputed from the schema.
// Recomputing would re-derive the thing under test from its own inputs and pass whenever
// the generator was self-consistently wrong.
function checkToneMatrix() {
  if (!parseComplete()) return NOT_PARSED;

  const failures = [];

  // Every class the emitted CSS defines, from the parsed tree rather than by matching
  // text - an at-rule's contents are invisible to a brace-counting regex.
  const emitted = new Set();
  for (const { selector } of allRules()) {
    for (const m of selector.matchAll(/\.([A-Za-z_][\w-]*)/g)) emitted.add(m[1]);
  }

  const atoms = [
    { file: 'button', varName: 'button', type: 'Button' },
    { file: 'badge', varName: 'badge', type: 'Badge' },
  ];

  let pairs = 0;
  const vocabularies = {};

  for (const { file, varName, type } of atoms) {
    const srcPath = path.join(CATALOG, `${file}.tsx`);
    if (!fs.existsSync(srcPath)) continue;
    const src = fs.readFileSync(srcPath, 'utf8');

    const grab = (name) => {
      const m = src.match(new RegExp(`const ${name}: Record<string, string> = \\{([^}]*)\\}`));
      const out = {};
      if (m) for (const e of m[1].matchAll(/([\w-]+):\s*'([^']+)'/g)) out[e[1]] = e[2];
      return out;
    };
    const list = (suffix) => {
      const m = src.match(new RegExp(`type ${type}${suffix} = ([^;]+);`));
      return m ? m[1].split('|').map((x) => x.trim().replace(/'/g, '')) : [];
    };

    const tone = grab(`${varName}Tone`);
    const fixed = grab(`${varName}ToneFixed`);
    const colors = list('Color');
    const intensities = list('Intensity');
    vocabularies[file] = colors;

    if (!colors.length || !intensities.length) {
      failures.push(`${file}: could not read its Color or Intensity union out of the generated source, so its matrix went unchecked`);
      continue;
    }

    for (const color of colors) {
      if (fixed[color] === undefined && tone[color] === undefined) {
        failures.push(`${file}.${color} is in the ${type}Color union but in neither tone map, so it resolves to "tone-undefined"`);
        continue;
      }
      for (const intensity of intensities) {
        pairs++;
        const cls = fixed[color] !== undefined
          ? fixed[color]
          : `tone-${tone[color]}${intensity === 'soft' ? '-soft' : ''}`;
        if (!emitted.has(cls)) {
          failures.push(`${file}: color="${color}" intensity="${intensity}" applies .${cls}, which nothing emits`);
        }
      }
    }
  }

  // Badge and Button share one vocabulary deliberately. They diverged on the axis NAME
  // (state against color) and later on its VALUES, both silently, and each cost a
  // consumer call sites. Same keys, same order.
  const names = Object.keys(vocabularies);
  if (names.length === 2) {
    const [a, b] = names;
    if (vocabularies[a].join(',') !== vocabularies[b].join(',')) {
      failures.push(
        `${a} and ${b} no longer share one colour vocabulary - ` +
        `${a} is [${vocabularies[a].join(', ')}] and ${b} is [${vocabularies[b].join(', ')}]. ` +
        `Converge them in spec/config/components/button.json, or drop this assertion with a stated reason`
      );
    }
  }

  return { failures, note: `${pairs} colour/intensity pairs across ${names.length} atoms` };
}

// --- theme-init-parity --------------------------------------------------------
// The two halves of the theme mechanism must agree, and only one of them can be tested
// by running it.
//
// theme-init.js sets data-theme before first paint; theme-provider.tsx owns every change
// after. They are separate artifacts in separate languages, and they share three
// constants: the storage key, the default mode, and what an unrecognised stored value
// resolves to. If those drift, the page paints one theme and React switches it to
// another - which is the flash the snippet exists to remove, arriving from the other
// side and looking exactly the same to a consumer.
//
// Checked by reading the EMITTED files rather than the generators. Both are produced
// from the same module, so comparing the generators would compare a value to itself.
function checkThemeInitParity() {
  const failures = [];
  // Counted and reported so that REMOVING an assertion is visible. The 'went
  // unchecked' failures below cover a regex that stops matching; nothing covered an
  // edit that quietly drops a comparison, and the note is where that would show.
  let asserted = 0;
  const initPath = path.join(CATALOG, 'theme-init.js');
  const provPath = path.join(CATALOG, 'theme-provider.tsx');

  if (!fs.existsSync(initPath) || !fs.existsSync(provPath)) {
    return {
      failures: ['theme-init.js or theme-provider.tsx is missing from the catalog, so the two halves could not be compared'],
      note: 'not run',
    };
  }

  const init = fs.readFileSync(initPath, 'utf8');
  const prov = fs.readFileSync(provPath, 'utf8');

  // Storage key.
  const initKey = init.match(/localStorage\.getItem\('([^']+)'\)/);
  const provKey = prov.match(/const STORAGE_KEY = '([^']+)';/);
  if (initKey && provKey) asserted++;
  if (!initKey || !provKey) {
    failures.push('could not read the storage key out of both files, so parity went unchecked');
  } else if (initKey[1] !== provKey[1]) {
    failures.push(
      `storage key disagrees - theme-init.js reads '${initKey[1]}', theme-provider.tsx writes '${provKey[1]}'. ` +
      'A visitor who picks a theme would have it saved under one key and read back under another, so the choice never sticks'
    );
  }

  // Default mode. The snippet carries it twice: the fallback branch and the catch.
  const provDefault = prov.match(/const DEFAULT_THEME: Theme = '([^']+)';/);
  const initDefaults = [...init.matchAll(/: '(light|dark)';\n/g)].map((m) => m[1])
    .concat([...init.matchAll(/setAttribute\('data-theme', '(light|dark)'\)/g)].map((m) => m[1]));
  if (provDefault && initDefaults.length) asserted++;
  if (!provDefault) {
    failures.push('could not read DEFAULT_THEME out of theme-provider.tsx, so parity went unchecked');
  } else {
    // De-duplicated: the snippet carries the default twice, in the fallback branch and in
    // the catch, and both disagreeing is one fact rather than two.
    for (const d of new Set(initDefaults)) {
      if (d !== provDefault[1]) {
        failures.push(
          `default mode disagrees - theme-init.js falls back to '${d}', theme-provider.tsx to '${provDefault[1]}'. ` +
          'A first-time visitor would be painted one theme and handed another on hydration'
        );
      }
    }
  }

  // The snippet must never be loadable as an external script: deferred it runs after the
  // paint it exists to precede, and undeferred it costs a round trip before it.
  asserted++;
  if (!/paste/i.test(init)) {
    failures.push('theme-init.js no longer says it must be pasted inline - a consumer who <script src>s it gets the flash back and no error');
  }

  // The provider must not stamp the attribute from an effect that runs on mount with a
  // fixed theme. That is the defect this pair was built to fix: the effect wrote
  // DEFAULT_THEME over the snippet's value before the stored choice had applied.
  asserted++;
  const sysEffect = prov.match(/useEffect\(\(\) => \{\s*if \(theme !== 'system'\) return;/);
  if (!sysEffect) {
    failures.push(
      "theme-provider.tsx's [theme] effect no longer bails out for a fixed theme - if it applies on mount it " +
      'will stamp DEFAULT_THEME over whatever theme-init.js painted, and the flash returns with the snippet installed'
    );
  }

  return {
    failures,
    note: `${asserted} of 4 parity assertions ran — storage key, default mode, paste mode, system effect`,
  };
}

// --- preview-coverage ---------------------------------------------------------
// Every class an ATOM applies is rendered in docs/preview.html, and no class on that page
// is one the stylesheets do not emit.
//
// Scoped to atoms deliberately, and narrower than this started. The first version required
// all 94 emitted classes to appear, which the page satisfied by growing a generated
// inventory of labelled boxes. Jacob's read of that page: it should show itself off, not
// explain itself, and an inventory of generic boxes is neither. He is right, and the
// coverage requirement was mine rather than the defect's.
//
// What survives is the half with a defect behind it. `.dialog-fixed` shipped unable to do
// its only job - it weighs (0,1,0) against `.dialog:not(dialog)` at (0,1,1), same layer,
// so it could not position anything - and it is applied by dialog.tsx. So "every class an
// atom applies is rendered here" would have caught it, while "every class the emitters
// produce" was a bigger net for the same fish.
//
// It does not cover the named component classes that no atom applies. class-coverage
// asserts those are emitted; nothing asserts they render, and that gap is stated rather
// than papered over with boxes nobody reads.
//
// Read as GENERATED HTML, not as the generator: every class on the page is in the static
// markup, because the one script flips attributes and calls dialog methods and never
// touches classList. So interpolated names are already resolved.
const PREVIEW_SKIPS = {
  'list-item': "select.tsx's listbox row. It is `display: flex; align-items: center` and "
    + 'nothing else, and the page has no select demo to put it in — a bare div carrying the '
    + 'class would assert less than class-coverage already does. The better answer is a real '
    + 'select demo showing an open listbox, which is a design task rather than a coverage one.',
};

function checkPreviewCoverage() {
  if (!parseComplete()) return NOT_PARSED;

  const page = path.join(ROOT, 'docs/preview.html');
  if (!fs.existsSync(page)) {
    return { failures: ['docs/preview.html is missing, so nothing could be compared against it'], note: 'not run' };
  }
  const html = fs.readFileSync(page, 'utf8');

  const rendered = new Set();
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) rendered.add(c);
  }
  if (!rendered.size) {
    return { failures: ['no class attributes found in docs/preview.html - the matcher read nothing, so this check did not run'], note: 'not run' };
  }

  const emitted = new Set();
  for (const { selector } of allRules()) {
    for (const m of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) emitted.add(m[1]);
  }

  // The classes atoms actually apply, from the same string positions atom-class-coverage
  // reads. Only names the stylesheets define count: the rest are utilities and prop
  // values, which that check already polices.
  const applied = new Set();
  for (const file of fs.readdirSync(CATALOG).filter((f) => f.endsWith('.tsx'))) {
    const src = fs.readFileSync(path.join(CATALOG, file), 'utf8');
    const strings = [
      ...src.matchAll(/className=(?:\{cn\(|\{)?\s*'([^']*)'/g),
      ...src.matchAll(/className="([^"]*)"/g),
      ...src.matchAll(/cva\(\s*'([^']*)'/g),
      ...src.matchAll(/CLASSES = '([^']*)'/g),
      ...src.matchAll(/'(tone-[a-z][a-z-]*[a-z]|treat-[a-z][a-z-]*[a-z])'/g),
    ];
    for (const m of strings) {
      for (const t of m[1].split(/\s+/).filter(Boolean)) if (emitted.has(t)) applied.add(t);
    }
  }
  if (!applied.size) {
    return { failures: ['no atom-applied classes were found, so this check did not run'], note: 'not run' };
  }

  const failures = [];
  const isChrome = (c) => c.startsWith('pv-');

  for (const c of [...applied].sort()) {
    if (rendered.has(c) || PREVIEW_SKIPS[c]) continue;
    failures.push(
      `.${c} is applied by an atom but never rendered in docs/preview.html - it can be ` +
      'emptied, renamed or outranked without this page changing, which is how .dialog-fixed ' +
      'shipped unable to position anything. Render it, or add it to PREVIEW_SKIPS with a reason'
    );
  }

  for (const c of [...rendered].sort()) {
    if (isChrome(c) || emitted.has(c)) continue;
    failures.push(
      `.${c} is applied in docs/preview.html but no stylesheet emits it - the page is ` +
      'showing a class the product does not have'
    );
  }

  for (const c of Object.keys(PREVIEW_SKIPS)) {
    if (!applied.has(c)) {
      failures.push(`.${c} is in PREVIEW_SKIPS but no atom applies it any more - drop the entry`);
    } else if (rendered.has(c)) {
      failures.push(`.${c} is in PREVIEW_SKIPS but the page renders it now - drop the entry`);
    }
  }

  return {
    failures,
    note: `${applied.size} atom-applied classes against docs/preview.html, ${Object.keys(PREVIEW_SKIPS).length} skipped`,
  };
}
function verify() {
  const atoms = atomNames();
  // Lazy, so the registry's own names are readable before anything runs: doc-counts
  // derives docs/pipeline.md's check list from this array. A list written down twice
  // is the drift the gate exists to catch.
  const checks = [
    ['css-parse', () => checkCssParse()],
    ['doc-counts', () => checkDocCounts(atoms, checks.map(([n]) => n))],
    ['manifest-deps', () => checkManifestDeps(atoms)],
    ['interactive-implies-control', () => checkInteractiveImpliesControl(atoms)],
    ['class-coverage', () => checkClassCoverage()],
    ['preview-coverage', () => checkPreviewCoverage()],
    ['atom-class-coverage', () => checkAtomClassCoverage()],
    ['class-box-model', () => checkClassBoxModel()],
    ['phantom-parts', () => checkPhantomParts()],
    ['variant-keys', () => checkVariantKeys()],
    ['base-config-provenance', () => checkBaseConfigProvenance()],
    ['config-parity', () => checkConfigParity()],
    ['dead-exports', () => checkDeadExports()],
    ['tone-fallbacks', () => checkToneFallbacks()],
    ['tone-matrix', () => checkToneMatrix()],
    ['theme-init-parity', () => checkThemeInitParity()],
    ['focus-ring', () => checkFocusRing()],
    ['touch-target', () => checkTouchTarget()],
    ['contrast', () => checkContrast()],
    ['tone-contrast', () => checkToneContrast()],
    ['border-contrast', () => checkBorderContrast()],
    ['figma-assembly', () => checkFigmaAssembly()],
    ['figma-code-syntax', () => checkFigmaCodeSyntax()],
    ['typecheck', () => checkTypecheck()],
    ['typecheck-scripts', () => checkTypecheckScripts()],
  ];

  let failed = 0;
  for (const [name, run] of checks) {
    const result = run();
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
