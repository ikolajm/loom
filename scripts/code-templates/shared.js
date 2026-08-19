/**
 * Shared config loading, Tailwind class mappers, and component registry.
 * Used by all code-template generators.
 */
const fs = require('fs');
const path = require('path');

// --- Config loading ---
// Prefers spec/config/local/ (your brand, git-ignored) over the committed default set.
// See scripts/config-paths.js for why the generator no longer writes a tracked path.
const { loadConfig: load } = require('../config-paths');

/**
 * Expand `sizes.$constant` back into every tier.
 *
 * A key that carries the same value in every tier says nothing about size — `radius` was
 * declared three identical times in 25 of the 26 components that set it. Hoisted into
 * `$constant`, the tier blocks hold only what actually ramps, and the one component that
 * genuinely ramps its radius stops hiding among twenty-five that do not.
 *
 * Expansion happens at load so every downstream generator still sees fully-populated
 * tiers and nothing else had to learn about this. A value declared on a tier wins, which
 * is what makes `$constant` a default rather than an override.
 */
function expandSizeConstants(componentConfig) {
  for (const entry of Object.values(componentConfig)) {
    if (!entry || typeof entry !== 'object') continue;
    const sizes = entry.sizes;
    const constant = sizes && sizes.$constant;
    if (!constant) continue;
    for (const [tier, cfg] of Object.entries(sizes)) {
      if (tier.startsWith('$') || !cfg || typeof cfg !== 'object') continue;
      for (const [k, v] of Object.entries(constant)) {
        if (!(k in cfg)) cfg[k] = v;
      }
    }
    delete sizes.$constant;
  }
  return componentConfig;
}

const loadComponents = (rel) => expandSizeConstants(load(rel));

function loadAllConfigs() {
  return {
    standards: load('standards.json'),
    sizing: load('base/sizing.json'),
    spacing: load('base/spacing.json'),
    typography: load('base/typography.json'),
    colors: load('base/colors.json'),
    effects: load('base/effects.json'),
    buttonConfig: loadComponents('components/button.json'),
    formConfig: loadComponents('components/form.json'),
    feedbackConfig: loadComponents('components/feedback.json'),
    dataDisplayConfig: loadComponents('components/data-display.json'),
    layoutConfig: loadComponents('components/layout.json'),
    navigationConfig: loadComponents('components/navigation.json'),
    compositeConfig: loadComponents('components/composite.json'),
    motionConfig: loadComponents('components/motion.json'),
  };
}

// Shared icon-slot wrapper class — the span that holds a leading/trailing/standalone icon and
// makes its svg fill the slot. Interpolated into component templates so the literal lives once.
// The icon slot sizes from the component class's --icon-size, which every size tier sets.
// It used to take a per-tier `size-icon-N` class threaded through the component, so the
// icon ladder existed twice: once in the generated CSS and once in a JS lookup table.
const ICON_SLOT_CLASS = 'icon-slot';

// --- Tailwind class mappers ---

function colorToClass(colorPath, prefix = 'bg') {
  if (!colorPath) return null;
  if (colorPath === 'transparent') return `${prefix}-transparent`;
  if (colorPath === 'currentColor') return `${prefix}-current`;
  const parts = colorPath.split('/');
  const role = parts[parts.length - 1];
  return `${prefix}-${role}`;
}

function scaleToValue(val) {
  if (!val || typeof val !== 'string') return null;
  const m = val.match(/^\{scale\.(\d+)\}$/);
  return m ? m[1] : null;
}

/** Resolve a padding/spacing value to a Tailwind class suffix. Handles both {scale.N} and raw values like "2px". */
function spacingToClass(val, prefix) {
  if (!val) return null;
  const scale = scaleToValue(val);
  if (scale) return `${prefix}-${scale}`;
  // Raw value (e.g. "2px") → arbitrary value
  if (typeof val === 'string' && val.match(/^\d/)) return `${prefix}-[${val}]`;
  return null;
}

function heightToClass(val) {
  if (!val || typeof val !== 'string') return null;
  if (val.startsWith('height/')) return val.replace('height/', '');
  // Scale reference: {scale.N} → N (maps to Tailwind h-N)
  const scale = scaleToValue(val);
  if (scale) return scale;
  // Raw value (e.g. "72px") → arbitrary value (caller emits h-[72px])
  if (val.match(/^\d/)) return `[${val}]`;
  return null;
}

function radiusToClass(val) {
  if (!val || typeof val !== 'string') return null;
  if (val.startsWith('radius/')) return val.replace('radius/', '');
  return null;
}

function shadowToClass(val) {
  if (!val || typeof val !== 'string') return null;
  const m = val.match(/effects\/shadow-(\d)/);
  if (!m) return null;
  const level = parseInt(m[1]);
  if (level === 0) return null;
  return `shadow-[var(--shadow-${level})]`;
}

function borderWidthToClass(val) {
  if (!val || typeof val !== 'string') return null;
  const m = val.match(/border-width\/bw-(\d)/);
  if (!m) return null;
  const w = parseInt(m[1]);
  return w === 1 ? 'border' : `border-${w}`;
}

function maxWidthToClass(val) {
  if (!val || typeof val !== 'string') return null;
  if (val === '100%') return 'max-w-full';
  return `max-w-[${val}]`;
}

function iconSizeToClass(val) {
  if (!val || typeof val !== 'string') return null;
  if (val.startsWith('icon/')) return `size-${val.replace('icon/', '')}`;
  return null;
}

function fontWeightToClass(w) {
  if (!w) return null;
  const map = { 400: 'font-normal', 500: 'font-medium', 600: 'font-semibold', 700: 'font-bold' };
  return map[w] || null;
}

function letterSpacingToClass(ls) {
  if (!ls || ls === '0' || ls === 'normal') return null;
  return `tracking-[${ls}]`;
}

// --- Variant/size style builders ---

function buildVariantStyles(variants) {
  const styles = {};
  for (const [name, colors] of Object.entries(variants)) {
    const classes = [];
    const bg = colorToClass(colors.bg, 'bg');
    const fg = colorToClass(colors.fg, 'text');
    const border = colors.border && colors.border !== 'none' ? colorToClass(colors.border, 'border') : null;
    const shadow = shadowToClass(colors.shadow);
    if (bg) classes.push(bg);
    if (fg) classes.push(fg);
    if (border) classes.push(border, 'border');
    if (colors.border === 'none') classes.push('border-0');
    // Directional borders
    const borderBottom = colors['border-bottom'] && colors['border-bottom'] !== 'none' ? colorToClass(colors['border-bottom'], 'border') : null;
    if (borderBottom) classes.push(borderBottom, 'border-b');
    const borderTop = colors['border-top'] && colors['border-top'] !== 'none' ? colorToClass(colors['border-top'], 'border') : null;
    if (borderTop) classes.push(borderTop, 'border-t');
    const borderRight = colors['border-right'] && colors['border-right'] !== 'none' ? colorToClass(colors['border-right'], 'border') : null;
    if (borderRight) classes.push(borderRight, 'border-r');
    const borderLeft = colors['border-left'] && colors['border-left'] !== 'none' ? colorToClass(colors['border-left'], 'border') : null;
    if (borderLeft) classes.push(borderLeft, 'border-l');
    if (shadow) classes.push(shadow);
    styles[name] = classes.join(' ');
  }
  return styles;
}

/**
 * Map a role-token path (color/primary/on-primary) to its runtime CSS variable — var(--on-primary).
 * The token pipeline emits role tokens to :root as --{role} (e.g. --primary, --on-surface, --outline).
 * NOTE: it must be --{role}, NOT --color-{role}: the @theme block is `@theme inline`, which inlines
 * values into utilities and does NOT register --color-* on :root, so only --{role} resolves at runtime.
 */
function colorToVar(colorPath) {
  if (!colorPath || colorPath === 'transparent') return null;
  if (colorPath === 'currentColor') return 'currentColor';
  const role = colorPath.split('/').pop();
  return `var(--${role})`;
}

/**
 * Catalog-wide treatment vocabulary for orthogonal atoms. A treatment is a fixed consumer
 * of the tone custom properties (--tone-bg/--tone-fg for the solid fill, --tone-text and
 * --tone-border for the line and label). The tone sets those properties; the treatment
 * reads them — so treatment and tone stay independent axes with no N×M matrix.
 *
 * Both halves are now plain classes emitted into loom.css by generate-tokens-css.js. They
 * used to be Tailwind arbitrary-property strings built here (`[--v-bg:var(--primary)]`
 * consumed by `bg-[color:var(--v-bg)]`), which meant the orthogonal model — the one idea
 * in this catalog not available off the shelf — only worked inside a Tailwind build.
 */
const TREATMENT_CLASSES = {
  filled: 'treat-filled',
  outline: 'treat-outline',
  ghost: 'treat-ghost',
  dot: 'treat-dot',
};

/**
 * Map an atom's declared color entry onto a tone class from loom.css.
 *
 * The tone vocabulary belongs to the color system, not to the atom: every family carries
 * `X`/`on-X` and `X-container`/`on-X-container`, so a fill reading the base roles is
 * `.tone-{family}` and one reading the containers is `.tone-{family}-soft`. That is what
 * button and badge had been expressing separately — button naming the base set `primary`
 * and `destructive`, badge naming the container set `default` and `destructive` — and it
 * is why the same word meant two different fills depending on which atom you were in.
 *
 * Derived from the token paths already in the schema, so no schema change is needed and
 * an atom keeps its own prop vocabulary. Returns { colorNames, toneClass }.
 */
function buildColorVars(colorsCfg) {
  const colorNames = Object.keys(colorsCfg).filter((k) => !k.startsWith('$'));
  const toneClass = {};
  for (const name of colorNames) {
    const c = colorsCfg[name] || {};
    if (c.bg === 'transparent' && c.fg === 'currentColor') {
      toneClass[name] = 'tone-inherit';
      continue;
    }
    const role = String(c.bg || '').split('/').pop();
    const family = String(c.bg || '').split('/')[1];
    if (!role || !family) {
      throw new Error(`Cannot derive a tone for color "${name}": bg is "${c.bg}".`);
    }
    if (role === family) toneClass[name] = `tone-${family}`;
    else if (role === `${family}-container`) toneClass[name] = `tone-${family}-soft`;
    else {
      throw new Error(
        `Cannot derive a tone for color "${name}": bg "${c.bg}" is neither the base role ` +
          `nor the container of family "${family}". Tones are emitted per family from ` +
          `colors.json; a one-off fill has no class to land on.`
      );
    }
  }
  return { colorNames, toneClass };
}

function buildSizeStyles(sizes) {
  const styles = {};
  for (const [name, sz] of Object.entries(sizes)) {
    if (name.startsWith('$')) continue; // skip $exception notes
    const classes = [];
    // Icon-sized components (spinner etc.) — size: "icon/icon-N"
    if (sz.size && typeof sz.size === 'string' && sz.size.startsWith('icon/')) {
      classes.push(`size-${sz.size.replace('icon/', '')}`);
    }
    // Square size via height token (e.g. icon-button)
    if (sz.size && typeof sz.size === 'string' && sz.size.startsWith('height/')) {
      classes.push(`size-${sz.size.replace('height/', '')}`);
    }
    // Height — height/ch-N
    const h = heightToClass(sz.height);
    if (h) classes.push(`h-${h}`);
    // Min-height (e.g. textarea)
    if (sz['min-height']) classes.push(`min-h-[${sz['min-height']}]`);
    // Min-width (e.g. kbd) — for atoms whose content can be a single narrow
    // character, where x-padding alone leaves the box narrower than it is tall.
    if (sz['min-width']) classes.push(`min-w-[${sz['min-width']}]`);
    // Padding — handles both {scale.N} and raw values
    const px = spacingToClass(sz['x-padding'], 'px');
    if (px) classes.push(px);
    const py = spacingToClass(sz['y-padding'], 'py');
    if (py) classes.push(py);
    // Gap
    const gap = spacingToClass(sz.gap, 'gap');
    if (gap) classes.push(gap);
    // Border radius
    const rad = radiusToClass(sz.radius);
    if (rad) classes.push(`rounded-${rad}`);
    // Shadow per size (e.g. FAB)
    const shadow = shadowToClass(sz.shadow);
    if (shadow) classes.push(shadow);
    // Border-width
    const bw = borderWidthToClass(sz['border-width']);
    if (bw) classes.push(bw);
    // Max-width (Dialog, Sheet, etc.)
    const mw = maxWidthToClass(sz['max-width']);
    if (mw) classes.push(mw);
    // Width (Sidebar, ColorPicker, etc.)
    if (sz.width && !sz.size) classes.push(`w-[${sz.width}]`);
    styles[name] = classes.join(' ');
  }
  return styles;
}

// --- $base inheritance resolver ---

function resolveBase(allComponents, configKey) {
  const config = allComponents[configKey];
  if (!config || !config['$base']) return config;
  const base = allComponents[config['$base']];
  if (!base) return config;
  const merged = {};
  for (const key of new Set([...Object.keys(base), ...Object.keys(config)])) {
    if (key === '$base' || key.startsWith('$')) continue;
    const bv = base[key], cv = config[key];
    if (bv === undefined) { merged[key] = cv; continue; }
    if (cv === undefined) { merged[key] = bv; continue; }
    if (typeof cv !== 'object' || cv === null || typeof bv !== 'object' || bv === null) { merged[key] = cv; continue; }
    if (key === 'sizes') {
      merged[key] = {};
      for (const t of new Set([...Object.keys(bv), ...Object.keys(cv)])) merged[key][t] = t in cv ? cv[t] : bv[t];
    } else {
      merged[key] = {};
      for (const sk of new Set([...Object.keys(bv), ...Object.keys(cv)])) {
        const b2 = bv[sk], c2 = cv[sk];
        if (c2 !== undefined && b2 !== undefined && typeof c2 === 'object' && typeof b2 === 'object') {
          merged[key][sk] = { ...b2, ...c2 };
        } else {
          merged[key][sk] = c2 !== undefined ? c2 : b2;
        }
      }
    }
  }
  // $catalog is the atom's own metadata (deps, tokens, composition) — base-independent.
  // The merge loop skips all $-prefixed keys, so carry the child's $catalog through
  // explicitly; otherwise a $base-extending atom can never declare its catalog manifest.
  if (config['$catalog']) merged['$catalog'] = config['$catalog'];
  return merged;
}

// --- Catalog kind ---
//
// Two things live in this catalog and it only had one word for them. An **atom** is a
// primitive you compose with — one control, one mark, one piece of content. A
// **pattern** is an arrangement already composed for you, solving an assembly you
// would otherwise repeat. Both are first-class and installed identically; the split is
// vocabulary, not a tier. Nothing branches on it.
//
// It has to be declared. Two mechanical derivations were tried and both measure a
// different axis:
//   - The Figma `build-pattern-*` prefix marks "cannot be emitted by the standard
//     variant × size builder" — which is why `number` and `relative-time` carry it.
//   - Manifest `dependencies` marks "imports another atom" — which makes `input` a
//     composer (it imports form-field for error context) and a self-contained shell a primitive
//     (it reimplements an input inline rather than importing one). Exactly backwards.
//
// The test that does hold: could a competent consumer assemble this from other Loom
// atoms without inventing anything? If yes, it is a pattern. Default is `atom`; only
// the exceptions are listed, so this stays one auditable list instead of 66 fields.
const PATTERN_IDS = new Set([
  // Compose several controls into a working arrangement
  'combobox', 'date-picker', 'time-picker', 'file-upload',
  // Menu and overlay arrangements built from a trigger + surface + item rows
  'dropdown-menu', 'context-menu', 'command-palette', 'navigation-menu',
  // Structural page furniture
  'top-bar', 'sidebar', 'bottom-nav', 'breadcrumbs', 'pagination', 'toolbar',
  // Repeating-item arrangements
  'list-item', 'accordion', 'avatar-group', 'tree-view', 'stepper', 'carousel',
  // Composed states
  'empty-state', 'fab-menu', 'toggle-group',
  // Motion that drives other motion atoms
  'stagger',
]);

/** `atom` unless listed above. See PATTERN_IDS for why this is authored, not derived. */
function kindOf(key) {
  return PATTERN_IDS.has(key) ? 'pattern' : 'atom';
}

// --- Component registry ---

function getComponentRegistry(configs) {
  const { buttonConfig, formConfig, feedbackConfig, dataDisplayConfig, layoutConfig, navigationConfig, compositeConfig, motionConfig } = configs;
  return {
    // === Actions ===
    'Button': { generator: 'button#generateButton', source: buttonConfig, key: 'button', element: 'button', htmlType: 'ButtonHTMLAttributes<HTMLButtonElement>', textFamily: 'action', category: 'Actions', template: 'cva-only', primitive: '@radix-ui/react-slot' },
    // IconButton removed — use <Button variant="ghost" size="icon"> instead
    'Badge': { generator: 'badge#generateBadge', source: buttonConfig, key: 'badge', element: 'span', htmlType: 'HTMLAttributes<HTMLElement>', textFamily: 'label', category: 'Actions', template: 'cva-only', primitive: '@radix-ui/react-slot' },

    // === Inputs ===
    'Select': { generator: 'radix-form-controls#generateRadixSelect', source: formConfig, key: 'select', baseKey: 'text-field', element: 'select', htmlType: 'SelectHTMLAttributes<HTMLSelectElement>', noIconSlots: true, textFamily: 'input', category: 'Inputs', template: 'radix', primitive: '@radix-ui/react-select', variantKey: 'state' },
    'FormField': { generator: 'form-field#generateFormField', source: formConfig, key: 'form-field', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noIconSlots: true, noChildren: true, textFamily: 'body', category: 'Inputs', template: 'cva-only', primitive: null },

    // === Layout ===
    'Dialog': { generator: 'radix-dialogs#generateRadixDialog', source: layoutConfig, key: 'dialog', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noChildren: true, layout: 'stack', role: 'dialog', textFamily: 'body', category: 'Layout', template: 'radix', primitive: '@radix-ui/react-dialog' },

    // === Feedback ===

    // === Data Display ===

    // === Navigation ===

    // === Composite ===

    // === Motion ===
  };
}

// --- Typography extraction ---

/**
 * Base typography classes for an atom.
 *
 * `font-weight` and `letter-spacing` are deliberately NOT emitted. Every atom that
 * declares typography also lands a `text-{family}-{tier}` ramp class through its size
 * variant, and the ramp already carries both — so emitting them here put two sources on
 * one element. That was invisible while the ramp was unlayered and outranked the
 * utilities; in `@layer components` the utilities win, and a schema's font-weight would
 * quietly outrank the type ramp it sits on. If an atom needs a different weight, it needs
 * a different text role.
 *
 * `text-transform` stays: no ramp tier declares it, so there is nothing to conflict with.
 */
function buildTypographyClasses(config) {
  const typo = config.typography;
  if (!typo) return '';
  const classes = [];
  if (typo['text-transform'] && typo['text-transform'] !== 'none') {
    classes.push(typo['text-transform']);
  }
  return classes.join(' ');
}

// --- Display name formatting ---

function formatDisplayName(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

module.exports = {
  expandSizeConstants,
  loadAllConfigs,
  colorToClass,
  scaleToValue,
  spacingToClass,
  heightToClass,
  radiusToClass,
  shadowToClass,
  borderWidthToClass,
  maxWidthToClass,
  iconSizeToClass,
  fontWeightToClass,
  letterSpacingToClass,
  buildVariantStyles,
  colorToVar,
  TREATMENT_CLASSES,
  ICON_SLOT_CLASS,
  buildColorVars,
  buildSizeStyles,
  buildTypographyClasses,
  resolveBase,
  getComponentRegistry,
  kindOf,
  PATTERN_IDS,
  formatDisplayName,
};
