/**
 * Generate React component .tsx files + per-atom manifests into catalog/.
 *
 * Architecture: Config → CVA (variant management) → Radix/lib primitives (behavior) → tokens (styling)
 *
 * Template types:
 *   cva-only  — styled HTML element + CVA variants from config
 *   radix     — Radix primitive + CVA styling from config
 *   lib       — specialized library + CVA styling from config
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
const { applyPins } = require('./npm-pins');
const { buildCnUtility } = require('./components/cn');
const { generateCvaOnly } = require('./components/cva-only');
const { generateLib } = require('./components/radix-fallback');

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

function dispatch(name, config, meta) {
  if (meta.generator) return resolveGenerator(name, meta.generator)(name, config, meta);

  switch (meta.template) {
    case 'radix':
      // A registry entry claiming a Radix primitive with no generator to build it. Was a
      // silent cva-only fallback inside the old router; still falls back, still says so.
      console.warn(`  ${name}: no generator for Radix primitive ${meta.primitive}, using cva-only`);
      return `// TODO: Add Radix primitive template for ${name} (${meta.primitive})\n` + generateCvaOnly(name, config, meta);
    case 'lib': return generateLib(name, config, meta);
    case 'cva-only':
    default: return generateCvaOnly(name, config, meta);
  }
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
  'Motion': 'motion',
};

function extractAxisKeys(obj) {
  if (!obj) return [];
  return Object.keys(obj).filter(k => !k.startsWith('$'));
}

// External npm packages a generated atom imports — the consumer install set.
// Scans `from '<spec>'`; keeps non-relative specifiers, drops react/react-dom (peer deps
// a React app already has). Scoped pkgs collapse to @scope/name, subpaths to the package root.
// Pinned packages carry their range (see npm-pins.js) — setup.sh prints this list verbatim.
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
  return applyPins(deps);
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
    category: cat.category || CATEGORY_MAP[def.category] || 'misc',
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
    // Config-free utilities. The branch is about the MANIFEST — buildManifest takes a
    // null config — not about the generator, which resolves through the registry like
    // every other atom's. It used to call its template directly, which made it a fourth
    // place an atom's generator could be named.
    if (name === 'FormField') {
      const tsx = dispatch(name, null, def);
      const manifest = buildManifest(def, null, contentVersion(tsx), tsx);
      fs.writeFileSync(path.join(CATALOG_DIR, `${def.key}.tsx`), tsx);
      fs.writeFileSync(path.join(CATALOG_DIR, `${def.key}.manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
      console.log(`  ${def.key}.tsx + manifest (utility)`);
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
    console.log(`  ${def.key}.tsx + manifest (${def.template})`);
    atoms.push({ name: manifest.name, category: manifest.category, description: manifest.description });
    count++;
  }

  // cn — utility atom (catalog-resident, foundation dependency)
  const cnSrc = buildCnUtility(configs);
  fs.writeFileSync(path.join(CATALOG_DIR, 'cn.ts'), cnSrc);
  fs.writeFileSync(path.join(CATALOG_DIR, 'cn.manifest.json'), JSON.stringify({
    name: 'cn',
    category: 'utility',
    description: 'Class name merger utility (clsx + tailwind-merge). Foundation dependency for all components.',
    version: contentVersion(cnSrc),
    dependencies: [],
    npmDependencies: extractNpmDeps(cnSrc),
    tokens: [],
    composition: 'none',
  }, null, 2) + '\n');
  console.log(`  cn.ts + manifest (utility)`);

  // Pickable atoms grouped by catalog group — the menu to grab loom-picks.json names from.
  // Generated from the catalog so it can't drift from what's actually built.
  const GROUP_ORDER = ['button', 'form', 'layout', 'feedback', 'data-display', 'navigation', 'composite', 'motion'];
  const byGroup = {};
  for (const a of atoms) (byGroup[a.category] ||= []).push(a.name);
  const grouped = {};
  for (const g of [...GROUP_ORDER, ...Object.keys(byGroup)]) {
    if (byGroup[g] && !grouped[g]) grouped[g] = byGroup[g].sort();
  }
  fs.writeFileSync(path.join(CATALOG_DIR, 'atoms.json'), JSON.stringify({
    $note: 'Pickable atoms by group — copy names into loom-picks.json "picks". setup.sh resolves dependencies automatically. Generated from the catalog; do not hand-edit.',
    ...grouped,
  }, null, 2) + '\n');
  console.log('  atoms.json (pickable atoms by group)');

  console.log(`\nCatalog: ${count + 1} atoms → ${CATALOG_DIR}`);
  return count + 1;
}

module.exports = { generate, CATALOG_DIR };
