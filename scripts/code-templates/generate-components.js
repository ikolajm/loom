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
const { buildCnUtility } = require('./components/cn');
const { generateCvaOnly } = require('./components/cva-only');
const { generateButton } = require('./components/button');
const { generateFAB } = require('./components/fab');
const { generateFabMenu } = require('./components/fab-menu');
const { generateBadge } = require('./components/badge');
const { generateDot } = require('./components/dot');
const { generateTable } = require('./components/table');
const { generateRadixDialog, generateRadixAlertDialog, generateRadixSheet } = require('./components/radix-dialogs');
const { generateRadixCheckbox, generateRadixSwitch, generateRadixRadio, generateRadixSlider, generateRadixSelect } = require('./components/radix-form-controls');
const { generateRadixToggle, generateRadixToggleGroup } = require('./components/radix-toggle');
const { generateRadixTabs, generateRadixAccordion, generateRadixCollapsible } = require('./components/radix-navigation');
const { generateRadixTooltip, generateRadixPopover, generateRadixSeparator, generateRadixAvatar, generateRadixProgress, generateRadixHoverCard } = require('./components/radix-feedback');
const { generateRadixDropdownMenu, generateRadixContextMenu } = require('./components/radix-menus');
const { generateRadixToast } = require('./components/radix-toast');
const { generateRadixNavigationMenu } = require('./components/radix-navigation-menu');
const { generateRadixScrollArea, generateLib } = require('./components/radix-fallback');
const { generateBanner } = require('./components/banner');
const { generateEmptyState } = require('./components/empty-state');
const { generateListItem } = require('./components/list-item');
const { generateStepper } = require('./components/stepper');
const { generateTreeView } = require('./components/tree-view');
const { generateCarousel } = require('./components/carousel');
const { generateReveal } = require('./components/reveal');
const { generateStagger } = require('./components/stagger');
const { generateCountUp } = require('./components/count-up');
const { generateScrollProgress } = require('./components/scroll-progress');
const { generatePagination } = require('./components/pagination');
const { generateFileUpload } = require('./components/file-upload');
const { generateInputOTP } = require('./components/input-otp');
const { generateCommandPalette } = require('./components/command-palette');
const { generateCombobox } = require('./components/combobox');
const { generateCalendar } = require('./components/calendar');
const { generateDatePicker } = require('./components/date-picker');
const { generateSkeleton } = require('./components/skeleton');
const { generateFormField } = require('./components/form-field');
const { generateHelperText } = require('./components/helper-text');
const { generateRating } = require('./components/rating');
const { generateTimePicker } = require('./components/time-picker');
const { generateSearchBar } = require('./components/search-bar');
const { generateAvatarGroup } = require('./components/avatar-group');
const { generateNumber } = require('./components/number');
const { generateRelativeTime } = require('./components/relative-time');
const { generateVideoPlayer } = require('./components/video-player');
const { generateSidebar } = require('./components/sidebar');

// --- Catalog output directory (catalog/) ---
const CATALOG_DIR = path.resolve(__dirname, '../../catalog');

// ============================================================
// === RADIX ROUTER
// ============================================================

function generateRadix(name, config, meta) {
  const generators = {
    'Dialog': generateRadixDialog,
    'AlertDialog': generateRadixAlertDialog,
    'Sheet': generateRadixSheet,
    'Tabs': generateRadixTabs,
    'Accordion': generateRadixAccordion,
    'Collapsible': generateRadixCollapsible,
    'Checkbox': generateRadixCheckbox,
    'Switch': generateRadixSwitch,
    'Radio': generateRadixRadio,
    'Slider': generateRadixSlider,
    'Toggle': generateRadixToggle,
    'ToggleGroup': generateRadixToggleGroup,
    'Tooltip': generateRadixTooltip,
    'Popover': generateRadixPopover,
    'Separator': generateRadixSeparator,
    'Avatar': generateRadixAvatar,
    'ProgressBar': generateRadixProgress,
    'Select': generateRadixSelect,
    'DropdownMenu': generateRadixDropdownMenu,
    'ContextMenu': generateRadixContextMenu,
    'HoverCard': generateRadixHoverCard,
    'ScrollArea': generateRadixScrollArea,
    'Toast': generateRadixToast,
    'NavigationMenu': generateRadixNavigationMenu,
  };

  const gen = generators[name];
  if (gen) return gen(name, config, meta);

  console.warn(`  ${name}: Radix template not yet implemented, using cva-only fallback`);
  return `// TODO: Add Radix primitive template for ${name} (${meta.primitive})\n` + generateCvaOnly(name, config, meta);
}

// ============================================================
// === DISPATCH
// ============================================================

function dispatch(name, config, meta) {
  if (name === 'Button') return generateButton(name, config, meta);
  if (name === 'FAB') return generateFAB(name, config, meta);
  if (name === 'FabMenu') return generateFabMenu(name, config, meta);
  if (name === 'Badge') return generateBadge(name, config, meta);
  if (name === 'Dot') return generateDot(name, config, meta);
  if (name === 'Table') return generateTable(name, config, meta);
  if (name === 'Banner') return generateBanner(name, config, meta);
  if (name === 'EmptyState') return generateEmptyState(name, config, meta);
  if (name === 'ListItem') return generateListItem(name, config, meta);
  if (name === 'Stepper') return generateStepper(name, config, meta);
  if (name === 'TreeView') return generateTreeView(name, config, meta);
  if (name === 'Carousel') return generateCarousel(name, config, meta);
  if (name === 'Pagination') return generatePagination(name, config, meta);
  if (name === 'FileUpload') return generateFileUpload(name, config, meta);
  if (name === 'InputOTP') return generateInputOTP(name, config, meta);
  if (name === 'CommandPalette') return generateCommandPalette(name, config, meta);
  if (name === 'Combobox') return generateCombobox(name, config, meta);
  if (name === 'Calendar') return generateCalendar(name, config, meta);
  if (name === 'DatePicker') return generateDatePicker(name, config, meta);
  if (name === 'Skeleton') return generateSkeleton(name, config, meta);
  if (name === 'FormField') return generateFormField();
  if (name === 'HelperText') return generateHelperText(name, config, meta);
  if (name === 'Rating') return generateRating(name, config, meta);
  if (name === 'TimePicker') return generateTimePicker(name, config, meta);
  if (name === 'SearchBar') return generateSearchBar(name, config, meta);
  if (name === 'AvatarGroup') return generateAvatarGroup(name, config, meta);
  if (name === 'NumberDisplay') return generateNumber(name, config, meta);
  if (name === 'RelativeTime') return generateRelativeTime(name, config, meta);
  if (name === 'VideoPlayer') return generateVideoPlayer(name, config, meta);
  if (name === 'Sidebar') return generateSidebar(name, config, meta);
  if (name === 'Reveal') return generateReveal(name, config, meta);
  if (name === 'Stagger') return generateStagger(name, config, meta);
  if (name === 'CountUp') return generateCountUp(name, config, meta);
  if (name === 'ScrollProgress') return generateScrollProgress(name, config, meta);

  switch (meta.template) {
    case 'radix': return generateRadix(name, config, meta);
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

  const manifest = {
    name: def.key,
    category: cat.category || CATEGORY_MAP[def.category] || 'misc',
    description: cat.description || '',
    version: cat.version || version,
    dependencies: cat.dependencies || ['cn'],
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

  for (const [name, def] of Object.entries(registry)) {
    // Config-free utilities — generated directly
    if (name === 'FormField') {
      const tsx = generateFormField();
      const manifest = buildManifest(def, null, contentVersion(tsx), tsx);
      fs.writeFileSync(path.join(CATALOG_DIR, `${def.key}.tsx`), tsx);
      fs.writeFileSync(path.join(CATALOG_DIR, `${def.key}.manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
      console.log(`  ${def.key}.tsx + manifest (utility)`);
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

  console.log(`\nCatalog: ${count + 1} atoms → ${CATALOG_DIR}`);
  return count + 1;
}

module.exports = { generate, CATALOG_DIR };
