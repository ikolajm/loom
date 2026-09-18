/**
 * Generate React component .tsx files + per-atom manifests into catalog/.
 *
 * Architecture: Config → CVA (variant management) → Radix/lib primitives (behavior) → tokens (styling)
 *
 * Every registry entry in shared.js names its own generator module, as
 * `<module>#<export>`, and there is no generic fallback. There used to be a `template`
 * field selecting between `cva-only`, `radix` and `lib`; `lib` was never implemented,
 * `radix` only warned, and `cva-only` was unreachable because every entry also carried a
 * generator. The field is gone and dispatch throws on an entry without one.
 *
 * Output (per atom):
 *   catalog/[name].tsx          — component code
 *   catalog/[name].manifest.json — catalog metadata (from $catalog + inference)
 *
 * Also emits:
 *   catalog/cn.ts + cn.manifest.json — class-name merger utility (catalog atom)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- Module imports ---
const { resolveConfig } = require('./components/helpers');
const { kindOf } = require('./shared');
const { buildCnUtility } = require('./components/cn');
const { buildThemeProvider } = require('./components/theme-provider');
const { buildThemeInit } = require('./components/theme-init');

// Every other template module is reached through the registry's `generator` field
// ('module#export', resolved below) rather than a hand-written import here. Adding an
// atom used to mean editing three places in lockstep — the registry entry, an import
// line, and a dispatch line — and the two here were pure restatement of the first.

// --- Catalog output directory (catalog/) ---
const CATALOG_DIR = path.resolve(__dirname, '../../catalog');

// ============================================================
// === DISPATCH
// ============================================================

// `generator` on a registry entry is 'module#export', relative to ./components/.
// Required lazily so a broken or renamed template fails on the atom that names it,
// with that atom's name in the error — not at load time for the whole run.
const generatorCache = new Map();

function resolveGenerator(name, spec) {
  if (generatorCache.has(spec)) return generatorCache.get(spec);
  const [mod, exp] = spec.split('#');
  if (!mod || !exp) {
    throw new Error(`${name}: generator "${spec}" is not in module#export form`);
  }
  let fn;
  try {
    fn = require(`./components/${mod}`)[exp];
  } catch (err) {
    throw new Error(`${name}: generator module ./components/${mod} failed to load — ${err.message}`);
  }
  if (typeof fn !== 'function') {
    throw new Error(`${name}: ./components/${mod} exports no "${exp}"`);
  }
  generatorCache.set(spec, fn);
  return fn;
}

/**
 * Every registry entry names its own generator, and there is no fallback.
 *
 * There used to be a `template` switch behind this, falling through to `cva-only` — a
 * generic "styled element plus CVA variants" builder. It was unreachable: `meta.generator`
 * is set on all five entries, so the switch never ran, which was proven by making
 * `generateCvaOnly` throw on entry and watching a full generate complete. It also emitted
 * `size-icon-N`, a Tailwind class nothing has defined since the bridge went out, so the
 * thing it would have produced had it ever run was partly broken.
 *
 * Throwing is the better failure. A component added without a generator now stops the
 * build and says so, instead of silently receiving something utility-shaped.
 */
function dispatch(name, config, meta) {
  if (!meta.generator) {
    throw new Error(`${name}: registry entry has no "generator". Add one — there is no generic fallback template.`);
  }
  return resolveGenerator(name, meta.generator)(name, config, meta);
}

// ============================================================
// === MANIFEST BUILDER
// ============================================================

// Registry category → catalog category (manifest schema)
const CATEGORY_MAP = {
  'Actions': 'button',
  'Inputs': 'form',
  'Layout': 'layout',
  'Feedback': 'feedback',
  'Data Display': 'data-display',
  'Navigation': 'navigation',
  'Composite': 'composite',
};

function extractAxisKeys(obj) {
  if (!obj) return [];
  return Object.keys(obj).filter(k => !k.startsWith('$'));
}

// External npm packages a generated atom imports — the consumer install set.
// Scans `from '<spec>'`; keeps non-relative specifiers, drops react/react-dom (peer deps
// a React app already has). Scoped pkgs collapse to @scope/name, subpaths to the package root.
// Sorted, because sync.js prints this list verbatim and an install line that reorders
// between runs reads as a change. No version ranges: the one pinned package was
// tailwind-merge, which left with the bridge.
function extractNpmDeps(src) {
  const deps = new Set();
  const re = /from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const spec = m[1];
    if (spec.startsWith('.')) continue;
    if (spec === 'react' || spec === 'react-dom' || spec.startsWith('react/') || spec.startsWith('react-dom/')) continue;
    deps.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
  }
  return [...deps].sort();
}

// Sibling catalog atoms a generated atom imports — the transitive copy set setup.sh walks.
// Derived, not declared: a hand-authored list under-declared `form-field` on five atoms,
// each of which then copied into a project unable to compile. Config-declared deps are
// unioned in rather than replaced, so a composition dep that isn't a static import still
// has a home; buildManifest warns when one shows up, since that is usually just stale.
function extractLocalDeps(src) {
  const deps = new Set();
  const re = /from\s+['"]\.\/([\w-]+)['"]/g;
  let m;
  while ((m = re.exec(src)) !== null) deps.add(m[1]);
  return [...deps].sort();
}

function buildManifest(def, config, version, src) {
  const cat = config?.$catalog || {};

  // Primary axis: variants if present, else state, else checked, else active, else step-state
  const axisKey = config?.variants ? 'variants'
    : config?.state ? 'state'
    : config?.checked ? 'checked'
    : config?.active ? 'active'
    : config?.['step-state'] ? 'step-state'
    : null;
  const variants = axisKey ? extractAxisKeys(config[axisKey]) : [];
  const sizes = extractAxisKeys(config?.sizes);

  const imported = extractLocalDeps(src || '');
  const declared = cat.dependencies || [];
  const phantom = declared.filter(d => !imported.includes(d));
  if (phantom.length) {
    console.warn(`  ${def.key}: declared but not imported — ${phantom.join(', ')} (intentional composition, or stale?)`);
  }

  const manifest = {
    name: def.key,
    // `kind` is atom-vs-pattern (what the thing is). `composition` further down is
    // asChild/Slot mechanics (how it renders). Different axes, easily confused.
    kind: kindOf(def.key),
    category: cat.category || CATEGORY_MAP[def.category] || 'misc',
    // The delivered filename, so nothing downstream has to know which atoms are not
    // .tsx. sync.js and check-local-edits.js both carried `atom === 'cn' ? 'cn.ts' : ...`,
    // which was one special case until theme-init.js made it two.
    file: `${def.key}.tsx`,
    description: cat.description || '',
    version: cat.version || version,
    dependencies: [...new Set([...imported, ...declared])].sort(),
    npmDependencies: extractNpmDeps(src || ''),
    tokens: cat.tokens || ['color', 'typography', 'spacing', 'sizing'],
    composition: cat.composition || 'none',
  };

  if (variants.length > 0) manifest.variants = variants;
  if (sizes.length > 0) manifest.sizes = sizes;

  return manifest;
}

// ============================================================
// === MAIN
// ============================================================

function generate(registry, outputDir, configs) {
  // Catalog output: always catalog/ regardless of outputDir.
  // outputDir is ignored here (kept in signature for orchestrator compatibility).
  fs.mkdirSync(CATALOG_DIR, { recursive: true });

  // Per-atom content version: a short hash of the atom's own generated source.
  // Changes iff the atom's content changes — so regenerating an unchanged catalog
  // is a no-op (no churn), and the consumer's staleness check fires exactly when
  // that atom actually moved. Not wall-clock (over-fires) or a hand-bumped constant
  // (forgotten-bump footgun). A config's $catalog.version still overrides (buildManifest).
  const contentVersion = (src) => crypto.createHash('sha256').update(src).digest('hex').slice(0, 12);
  let count = 0;
  const atoms = []; // collected for the pickable-atom index (catalog/atoms.json)

  for (const [name, def] of Object.entries(registry)) {
    // The GENERATOR is config-free here — form-field declares only a $constant, so its
    // template takes null — but the MANIFEST is not. Passing null to both meant its
    // $catalog never reached the manifest, and form-field shipped to every consumer with
    // an empty description while badge and button carried paragraphs. Nothing noticed,
    // because a description is only ever read by a person opening the file; the
    // catalog-integrity check reads it now.
    if (name === 'FormField') {
      const tsx = dispatch(name, null, def);
      const manifest = buildManifest(def, resolveConfig(def.source, def.key, def.baseKey), contentVersion(tsx), tsx);
      fs.writeFileSync(path.join(CATALOG_DIR, `${def.key}.tsx`), tsx);
      fs.writeFileSync(path.join(CATALOG_DIR, `${def.key}.manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
      console.log(`  ${def.key}.tsx + manifest (${def.generator})`);
      atoms.push({ name: manifest.name, category: manifest.category, description: manifest.description });
      count++;
      continue;
    }

    const config = resolveConfig(def.source, def.key, def.baseKey);

    if (!config) {
      console.warn(`  ${name}: config not found, skipping`);
      continue;
    }

    const tsx = dispatch(name, config, def);
    const manifest = buildManifest(def, config, contentVersion(tsx), tsx);

    fs.writeFileSync(path.join(CATALOG_DIR, `${def.key}.tsx`), tsx);
    fs.writeFileSync(path.join(CATALOG_DIR, `${def.key}.manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`  ${def.key}.tsx + manifest (${def.generator})`);
    atoms.push({ name: manifest.name, category: manifest.category, description: manifest.description });
    count++;
  }

  // cn — utility atom (catalog-resident, foundation dependency)
  const cnSrc = buildCnUtility(configs);
  fs.writeFileSync(path.join(CATALOG_DIR, 'cn.ts'), cnSrc);
  fs.writeFileSync(path.join(CATALOG_DIR, 'cn.manifest.json'), JSON.stringify({
    name: 'cn',
    // Neither an atom nor a pattern — it renders nothing. Its own kind, so a consumer
    // filtering the catalog by kind never has to special-case it.
    kind: 'utility',
    category: 'utility',
    file: 'cn.ts',
    description: 'Class name merger utility (clsx). Foundation dependency for all components.',
    version: contentVersion(cnSrc),
    dependencies: [],
    npmDependencies: extractNpmDeps(cnSrc),
    tokens: [],
    composition: 'none',
  }, null, 2) + '\n');
  console.log(`  cn.ts + manifest (utility)`);

  // theme-provider — the theme mechanism, catalog-resident.
  //
  // Its own kind, for the reason cn has one: a consumer filtering by kind should not have
  // to special-case it. It is not an atom — it renders no shape and has no class contract
  // — but it is not a utility either, because it carries the behavior the alternate-mode
  // block depends on: persisting a choice, resolving prefers-color-scheme, and writing
  // data-theme. It came out of scaffold/, where the only route to it was a Next-only
  // init.sh.
  const tpSrc = buildThemeProvider(configs);
  fs.writeFileSync(path.join(CATALOG_DIR, 'theme-provider.tsx'), tpSrc);
  fs.writeFileSync(path.join(CATALOG_DIR, 'theme-provider.manifest.json'), JSON.stringify({
    name: 'ThemeProvider',
    kind: 'provider',
    category: 'utility',
    file: 'theme-provider.tsx',
    description: 'Theme context — light/dark/system, persisted, writes data-theme. Pair it with theme-init.js, which sets the first frame.',
    version: contentVersion(tpSrc),
    dependencies: [],
    npmDependencies: extractNpmDeps(tpSrc),
    tokens: [],
    composition: 'wrapper',
  }, null, 2) + '\n');
  console.log(`  theme-provider.tsx + manifest (provider)`);

  // theme-init.js — the blocking half of the theme mechanism.
  //
  // Its own kind, and not a component, because it is not code a consumer imports: it is
  // text they paste into an inline <script> in <head>. A module cannot do this job. React
  // renders after first paint, so nothing React owns can set an attribute before the
  // first frame, which is the entire defect. It ships beside ThemeProvider so the two
  // halves arrive together and agree on the storage key and the default by construction.
  const tiSrc = buildThemeInit(configs);
  fs.writeFileSync(path.join(CATALOG_DIR, 'theme-init.js'), tiSrc);
  fs.writeFileSync(path.join(CATALOG_DIR, 'theme-init.manifest.json'), JSON.stringify({
    name: 'theme-init',
    kind: 'snippet',
    category: 'utility',
    file: 'theme-init.js',
    description: 'Blocking <head> snippet that sets data-theme and color-scheme before first paint. Paste its body inline; do not load it with <script src>. Without it ThemeProvider still works, one frame late.',
    version: contentVersion(tiSrc),
    dependencies: [],
    npmDependencies: [],
    tokens: [],
    composition: 'none',
  }, null, 2) + '\n');
  console.log(`  theme-init.js + manifest (snippet)`);

  // Atoms grouped by catalog group — the readable view of what the sync copies.
  // Generated from the catalog so it can't drift from what's actually built.
  const GROUP_ORDER = ['button', 'form', 'layout', 'feedback', 'data-display', 'navigation', 'composite'];
  const byGroup = {};
  for (const a of atoms) (byGroup[a.category] ||= []).push(a.name);
  const grouped = {};
  for (const g of [...GROUP_ORDER, ...Object.keys(byGroup)]) {
    if (byGroup[g] && !grouped[g]) grouped[g] = byGroup[g].sort();
  }
  fs.writeFileSync(path.join(CATALOG_DIR, 'atoms.json'), JSON.stringify({
    $note: 'Atoms by group, and the carrier for the $inputs staleness stamp. The sync delivers the whole catalog every run, so deleting a file you do not want is temporary — it returns on the next sync, because a missing file and a never-installed one are the same thing on disk. An unimported component is tree-shaken and costs nothing shipped, which is why this is a note rather than a pick list. Generated from the catalog; do not hand-edit.',
    // Fingerprint of the schemas and templates this catalog was built from, so a sync can
    // say "these atoms predate your edits" without relying on mtimes, which a checkout
    // rewrites. See scripts/catalog-stamp.js.
    $inputs: require('../catalog-stamp').inputHash(),
    ...grouped,
  }, null, 2) + '\n');
  console.log('  atoms.json (pickable atoms by group)');

  console.log(`\nCatalog: ${count + 1} atoms → ${CATALOG_DIR}`);
  return count + 1;
}

module.exports = { generate, CATALOG_DIR };
