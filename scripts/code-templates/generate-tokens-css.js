#!/usr/bin/env node
/**
 * Generate tokens.css from design-system config JSON files.
 *
 * Reads: config/base/colors.json, spacing.json, sizing.json, typography.json, effects.json
 *        config/standards.json
 * Writes: loom/tokens.css (or stdout with --stdout)
 *
 * Handles:
 *   - default-mode (dark/light) — :root gets default mode, [data-theme] gets alternate
 *   - Optional accent group — skipped when not in config
 *   - {palette.X.N} → hex resolution
 *   - {scale.N} → var(--space-N) resolution
 *   - Tailwind v4 @theme inline block
 *
 * Usage:
 *   node generate-tokens-css.js                — writes to loom/tokens.css
 *   node generate-tokens-css.js --stdout       — prints to stdout
 *   node generate-tokens-css.js --output path  — writes to custom path
 */
const fs = require('fs');
const path = require('path');

// --- Config loading ---
// Prefers spec/config/local/ over the committed set — see scripts/config-paths.js.
const { loadConfig: load } = require('../config-paths');

const colors = load('base/colors.json');
const spacing = load('base/spacing.json');
const sizing = load('base/sizing.json');
const typography = load('base/typography.json');
const effects = load('base/effects.json');
const standards = load('standards.json');

// --- Helpers ---
function resolveScaleRef(val) {
  if (typeof val !== 'string') return val;
  const m = val.match(/^\{scale\.(\d+)\}$/);
  return m ? `var(--space-${m[1]})` : val;
}

function resolvePaletteRef(val) {
  if (typeof val !== 'string' || !val.startsWith('{palette.')) return val;
  const m = val.match(/\{palette\.(\w+)\.(\w+)\}/);
  if (!m) return val;
  const family = m[1], shade = m[2];
  return colors.palette[family]?.[shade] || val;
}

function indent(lines, level = 1) {
  const prefix = '  '.repeat(level);
  return lines.map(l => l ? `${prefix}${l}` : '').join('\n');
}

// --- Section builders ---

function buildSection1_ColorPalette() {
  const lines = ['/* === Color Palette Primitives === */'];
  for (const [family, shades] of Object.entries(colors.palette)) {
    for (const [shade, hex] of Object.entries(shades)) {
      lines.push(`--color-${family}-${shade}: ${hex};`);
    }
  }
  return lines;
}

function buildSection2_ColorRoles(modeName) {
  const roles = colors.roles[modeName];
  if (!roles) return [];
  const lines = [`/* === Color Roles (${modeName === 'light' ? 'Light' : 'Dark'}) === */`];
  for (const [group, roleMap] of Object.entries(roles)) {
    for (const [role, value] of Object.entries(roleMap)) {
      lines.push(`--${role}: ${value};`);
    }
  }
  return lines;
}

function buildSection3_SpacingScale() {
  const scale = standards.spacing.scale;
  const lines = ['/* === Spacing Scale === */'];
  for (const [step, val] of Object.entries(scale)) {
    lines.push(`--space-${step}: ${val === '0' ? '0' : val};`);
  }
  return lines;
}

function buildSection4_SpacingCategories() {
  const lines = ['/* === Spacing Categories === */'];
  for (const [category, variants] of Object.entries(spacing.categories)) {
    if (category.startsWith('$')) continue;
    for (const [variant, props] of Object.entries(variants)) {
      for (const [prop, value] of Object.entries(props)) {
        const prefix = variant === 'default' ? '' : `${variant}-`;
        const varName = `--${category}-${prefix}${prop}`;
        lines.push(`${varName}: ${resolveScaleRef(value)};`);
      }
    }
  }
  return lines;
}

function buildSection5_Sizing() {
  const lines = [];

  // Border radius primitives
  lines.push('/* === Border Radius Primitives === */');
  for (const [token, val] of Object.entries(standards.sizing['border-radius'])) {
    lines.push(`--${token}: ${val};`);
  }

  // Border radius semantic
  lines.push('');
  lines.push('/* === Border Radius Semantic === */');
  for (const [role, token] of Object.entries(sizing['border-radius'])) {
    lines.push(`--radius-${role}: var(--${token});`);
  }

  // Border width
  lines.push('');
  lines.push('/* === Border Width === */');
  for (const [token, val] of Object.entries(standards.sizing['border-width'])) {
    lines.push(`--${token}: ${val};`);
  }

  // Icon size
  lines.push('');
  lines.push('/* === Icon Size === */');
  for (const [token, val] of Object.entries(standards.sizing['icon-size'])) {
    lines.push(`--${token}: ${val};`);
  }

  // Component height primitives
  lines.push('');
  lines.push('/* === Component Height Primitives === */');
  for (const [token, val] of Object.entries(standards.sizing['component-height'])) {
    lines.push(`--${token}: ${val};`);
  }

  // Component height semantic — role → ladder, picked by the controlHeight answer.
  lines.push('');
  lines.push('/* === Component Height Semantic === */');
  for (const [role, tiers] of Object.entries(sizing['component-height'])) {
    for (const [tier, token] of Object.entries(tiers)) {
      lines.push(`--height-${role}-${tier}: var(--${token});`);
    }
  }

  // Touch target
  lines.push('');
  lines.push('/* === Touch Target === */');
  lines.push(`--touch-min: ${standards.sizing['touch-target'].min};`);

  return lines;
}

function buildSection6_Effects() {
  const lines = ['/* === Shadows === */'];
  for (const [name, val] of Object.entries(effects.shadow)) {
    lines.push(`--${name}: ${val};`);
  }

  lines.push('');
  lines.push('/* === Transitions === */');
  for (const [name, val] of Object.entries(standards.effects.transition)) {
    lines.push(`--transition-${name}: ${val};`);
  }
  for (const [name, val] of Object.entries(standards.effects.easing)) {
    if (name.startsWith('$')) continue;
    lines.push(`--easing-${name}: ${val};`);
  }
  lines.push('--easing: var(--easing-standard);'); // back-compat alias

  lines.push('');
  lines.push('/* === Focus Ring === */');
  lines.push(`--focus-ring-width: ${standards.effects['focus-ring'].width};`);
  lines.push(`--focus-ring-offset: ${standards.effects['focus-ring'].offset};`);
  lines.push(`--focus-ring-color: var(--${standards.effects['focus-ring'].color});`);
  lines.push(`--ring: var(--${standards.effects['focus-ring'].color});`);

  // Plain custom properties, deliberately not inside @theme: Tailwind v4 has no
  // --opacity-* namespace, so @theme would emit the variable and never generate the
  // matching utility. Atoms consume these as opacity-(--opacity-disabled).
  lines.push('');
  lines.push('/* === State Opacity === */');
  for (const [name, val] of Object.entries(standards.effects.opacity)) {
    if (name.startsWith('$')) continue;
    lines.push(`--opacity-${name}: ${val};`);
  }

  return lines;
}

function buildSection7_TypographyFonts() {
  const lines = ['/* === Typography Fonts === */'];
  for (const [role, family] of Object.entries(typography.families)) {
    lines.push(`--font-${role}: '${family}', system-ui, sans-serif;`);
  }
  return lines;
}

function buildSection8_ZIndex() {
  return [
    '/* === Z-Index === */',
    '--z-dropdown: 1000;',
    '--z-sticky: 1100;',
    '--z-modal: 1200;',
    '--z-popover: 1300;',
    '--z-tooltip: 1400;'
  ];
}

function buildSection9_AltMode(modeName) {
  const roles = colors.roles[modeName];
  if (!roles) return '';
  const lines = [`/* === Color Roles (${modeName === 'light' ? 'Light' : 'Dark'}) === */`];

  // Collect fixed keys to skip (they don't change between modes)
  const fixedKeys = new Set();
  for (const [group, roleMap] of Object.entries(roles)) {
    for (const role of Object.keys(roleMap)) {
      if (role.includes('-fixed') || role.startsWith('on-') && role.includes('-fixed')) {
        fixedKeys.add(role);
      }
    }
  }

  for (const [group, roleMap] of Object.entries(roles)) {
    for (const [role, value] of Object.entries(roleMap)) {
      if (fixedKeys.has(role)) continue;
      lines.push(`--${role}: ${value};`);
    }
  }

  return `[data-theme="${modeName}"] {\n${indent(lines)}\n}`;
}

function buildSection10_TypographyPresets() {
  const lines = ['/* === Text Style Families === */'];
  const tiers = ['sm', 'md', 'lg'];

  for (const [family, def] of Object.entries(typography.textStyles)) {
    const fontVar = `--font-${def.font}`;

    for (const tier of tiers) {
      const tierDef = def[tier];
      if (!tierDef) continue;

      lines.push(`.text-${family}-${tier} {`);
      lines.push(`  font-family: var(${fontVar});`);
      lines.push(`  font-size: ${tierDef.size};`);
      lines.push(`  line-height: ${tierDef['line-height']};`);
      lines.push(`  font-weight: ${def.weight};`);
      if (def['letter-spacing'] && def['letter-spacing'] !== '0') {
        lines.push(`  letter-spacing: ${def['letter-spacing']};`);
      }
      lines.push('}');
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Tone x treatment — the orthogonal color axis, as CSS.
 *
 * A tone declares four custom properties; a treatment consumes them. Adding a tone or a
 * treatment is one rule, not an N*M matrix — the same orthogonality the CVA version had,
 * with the Tailwind arbitrary-property syntax (`[--v-bg:var(--primary)]`) dropped, since
 * that spelling only works inside a Tailwind build.
 *
 * The vocabulary comes from the color roles, not from what button and badge happened to
 * declare. Those two disagreed: button's colors read the base roles, badge's read the
 * containers, and each named them differently (`destructive` vs `error`, `default` vs
 * `primary`). Every family in the system carries both `X`/`on-X` and
 * `X-container`/`on-X-container`, so the two are one axis — intensity — and `-soft` is
 * the container end of it. One table now covers both, and covers the pairs neither
 * component had bothered to declare.
 */
function buildSection15_Tones() {
  const defaultMode = colors['default-mode'] || 'light';
  const groups = colors.roles[defaultMode] || {};
  // A family qualifies when it carries the full four-role set. That is the contract a
  // tone needs; anything short of it would emit a rule with holes in it.
  const families = Object.keys(groups).filter((g) => {
    const r = groups[g];
    return r && [g, `on-${g}`, `${g}-container`, `on-${g}-container`].every((k) => k in r);
  });

  const lines = ['/* === Tones === */'];
  for (const f of families) {
    // text/border stay at base intensity in both: an outline treatment draws the brand
    // line and reads the brand label whether its fill is solid or soft.
    const edge = f === 'neutral'
      ? ['  --tone-text: var(--on-surface);', '  --tone-border: var(--outline);']
      : [`  --tone-text: var(--${f});`, `  --tone-border: var(--${f});`];
    lines.push(`.tone-${f} {`, `  --tone-bg: var(--${f});`, `  --tone-fg: var(--on-${f});`, ...edge, '}', '');
    lines.push(`.tone-${f}-soft {`, `  --tone-bg: var(--${f}-container);`, `  --tone-fg: var(--on-${f}-container);`, ...edge, '}', '');
  }

  // Inherit is not a color family — it reads whatever ink the parent set, which is how an
  // icon button embedded in a colored surface (a banner dismiss) takes that surface's
  // foreground instead of a tone of its own.
  lines.push(
    '.tone-inherit {',
    '  --tone-bg: transparent;',
    '  --tone-fg: currentColor;',
    '  --tone-text: currentColor;',
    '  --tone-border: currentColor;',
    '}',
    ''
  );

  lines.push('/* === Treatments === */');
  lines.push('.treat-filled {', '  background-color: var(--tone-bg);', '  color: var(--tone-fg);', '}', '');
  lines.push(
    '.treat-outline {',
    '  background-color: transparent;',
    '  border: var(--bw-1) solid var(--tone-border);',
    '  color: var(--tone-text);',
    '}',
    ''
  );
  lines.push('.treat-ghost {', '  background-color: transparent;', '  color: var(--tone-text);', '}', '');
  // The dot mark has no text of its own — it is the border colour rendered as a fill.
  lines.push('.treat-dot {', '  background-color: var(--tone-border);', '}');

  return lines.join('\n');
}

function buildSection11_InteractiveStates() {
  return `/* === Interactive States === */
.interactive {
  cursor: pointer;
  position: relative;
  isolation: isolate;
  -webkit-tap-highlight-color: transparent;
  transition-property: color, background-color, border-color, box-shadow, opacity;
  transition-duration: var(--transition-fast);
  transition-timing-function: var(--easing);
}

.interactive::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transition: opacity var(--transition-fast) var(--easing);
  pointer-events: none;
  z-index: -1;
}

.interactive:hover::after {
  opacity: 0.12;
}

.interactive:active::after {
  opacity: 0.16;
}

.interactive:disabled,
.interactive[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}`;
}

function buildSection13_SpacingUtilities() {
  const lines = ['/* === Semantic Spacing Utilities === */'];

  for (const [category, variants] of Object.entries(spacing.categories)) {
    if (category.startsWith('$')) continue;

    for (const [variant, props] of Object.entries(variants)) {
      const suffix = variant === 'default' ? category : `${category}-${variant}`;
      const varPrefix = variant === 'default' ? category : `${category}-${variant}`;

      if (props['x-padding']) {
        lines.push(`@utility px-${suffix} {`);
        lines.push(`  padding-inline: var(--${varPrefix}-x-padding);`);
        lines.push('}');
      }
      if (props['y-padding']) {
        lines.push(`@utility py-${suffix} {`);
        lines.push(`  padding-block: var(--${varPrefix}-y-padding);`);
        lines.push('}');
      }
      if (props.gap) {
        lines.push(`@utility gap-${suffix} {`);
        lines.push(`  gap: var(--${varPrefix}-gap);`);
        lines.push('}');
      }
    }
  }

  return lines.join('\n');
}

function buildSection14_Animations() {
  return `/* === Animation Keyframes === */
@keyframes accordion-down {
  from { height: 0; opacity: 0; }
  to { height: var(--radix-accordion-content-height); opacity: 1; }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); opacity: 1; }
  to { height: 0; opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes slide-in-from-top {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes slide-in-from-bottom {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes slide-in-from-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slide-in-from-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`;
}

// Note: Slider styling is NOT in tokens.css. Radix Slider provides real DOM elements
// (SliderTrack, SliderRange, SliderThumb) that are styled directly with Tailwind classes
// in the component file, using values from form.json → slider config.

function buildSection12_TailwindTheme() {
  const lines = ['/* === Tailwind v4 Theme === */', '@theme inline {'];

  // Colors — from semantic roles
  lines.push('  /* Colors */');
  const defaultMode = colors['default-mode'] || 'light';
  const defaultRoles = colors.roles[defaultMode];
  if (defaultRoles) {
    for (const [group, roleMap] of Object.entries(defaultRoles)) {
      for (const role of Object.keys(roleMap)) {
        lines.push(`  --color-${role}: var(--${role});`);
      }
    }
  }

  // Focus ring — maps --ring to Tailwind's ring-ring utility
  lines.push('  --color-ring: var(--ring);');

  // Spacing
  lines.push('');
  lines.push('  /* Spacing */');
  for (const step of Object.keys(standards.spacing.scale)) {
    lines.push(`  --spacing-${step}: var(--space-${step});`);
  }

  // Border radius primitives
  lines.push('');
  lines.push('  /* Border Radius */');
  for (const token of Object.keys(standards.sizing['border-radius'])) {
    const step = token.replace('br-', '');
    lines.push(`  --radius-${step}: var(--${token});`);
  }
  // Semantic radius
  for (const role of Object.keys(sizing['border-radius'])) {
    lines.push(`  --radius-${role}: var(--radius-${role});`);
  }

  // Component Heights — enables h-ch-0 through h-ch-9
  // NOTE: the custom scales emitted here (radius, ch-*, icon-*, spacing categories) must
  // also be registered in components/cn.js so tailwind-merge dedupes className overrides
  // against them. Add a scale here → add it there too.
  lines.push('');
  lines.push('  /* Component Heights */');
  for (const token of Object.keys(standards.sizing['component-height'])) {
    lines.push(`  --height-${token}: var(--${token});`);
  }

  // Semantic heights — enables h-control-md, h-bar-sm, etc. The block is `@theme inline`,
  // so this substitutes textually into the utility rather than redefining the :root var;
  // the same self-reference is how semantic radius reaches `rounded-component`.
  lines.push('');
  lines.push('  /* Component Heights (semantic) */');
  for (const [role, tiers] of Object.entries(sizing['component-height'])) {
    for (const tier of Object.keys(tiers)) {
      lines.push(`  --height-${role}-${tier}: var(--height-${role}-${tier});`);
    }
  }

  // Component Sizes (square) — enables size-ch-0 through size-ch-9 (for icon-only buttons etc.)
  lines.push('');
  lines.push('  /* Component Sizes (square) */');
  for (const token of Object.keys(standards.sizing['component-height'])) {
    lines.push(`  --size-${token}: var(--${token});`);
  }

  // Square semantic — a square control (icon button, fab, pagination cell) takes its edge
  // from the same role ladder, so size-control-md and h-control-md can never disagree.
  lines.push('');
  lines.push('  /* Component Sizes (square, semantic) */');
  for (const [role, tiers] of Object.entries(sizing['component-height'])) {
    for (const tier of Object.keys(tiers)) {
      lines.push(`  --size-${role}-${tier}: var(--height-${role}-${tier});`);
    }
  }

  // Icon Sizes — enables w-icon-0 through w-icon-4, h-icon-0 through h-icon-4
  lines.push('');
  lines.push('  /* Icon Sizes */');
  for (const token of Object.keys(standards.sizing['icon-size'])) {
    lines.push(`  --size-${token}: var(--${token});`);
  }

  // Shadows
  lines.push('');
  lines.push('  /* Shadows */');
  for (const name of Object.keys(effects.shadow)) {
    lines.push(`  --shadow-${name.replace('shadow-', '')}: var(--${name});`);
  }

  // Animations
  lines.push('');
  lines.push('  /* Animations */');
  lines.push('  --animate-accordion-down: accordion-down 200ms ease-out;');
  lines.push('  --animate-accordion-up: accordion-up 200ms ease-out;');
  lines.push('  --animate-fade-in: fade-in 150ms ease-out;');
  lines.push('  --animate-fade-out: fade-out 150ms ease-out;');
  lines.push('  --animate-scale-in: scale-in 200ms ease-out;');
  lines.push('  --animate-slide-in-from-top: slide-in-from-top 200ms ease-out;');
  lines.push('  --animate-slide-in-from-bottom: slide-in-from-bottom 200ms ease-out;');
  lines.push('  --animate-slide-in-from-left: slide-in-from-left 200ms ease-out;');
  lines.push('  --animate-slide-in-from-right: slide-in-from-right 200ms ease-out;');
  lines.push('  --animate-spin: spin 1s linear infinite;');

  lines.push('}');
  return lines.join('\n');
}

// --- Assembly ---
// Three files, because only one of them is framework-bound. tokens.css and loom.css are
// plain CSS and run wherever CSS runs — a Vite app, a Django template, headless Chrome
// printing an invoice. loom.tailwind.css carries the `@theme inline` bridge and the
// `@utility` blocks, which are Tailwind v4 at-rules: a non-Tailwind consumer drops them
// silently, so shipping them inside tokens.css made the tokens tier's "assumes nothing
// about your framework" claim false for every consumer that was not on Tailwind.
//
// Keyframes ride with the layer, not the bridge — `@keyframes` is portable CSS. Only the
// `--animate-*` registration that names them is Tailwind's, and that stays in the bridge.
const FILES = ['tokens.css', 'loom.css', 'loom.tailwind.css'];

function header(name, note) {
  return `/**
 * ${name} — generated, do not edit. Regenerate from spec/config/.
 *
 * ${note}
 */`;
}

/** Custom properties only: :root and the alternate-mode block. Portable. */
function generateTokens() {
  const defaultMode = colors['default-mode'] || 'light';
  const altMode = defaultMode === 'dark' ? 'light' : 'dark';

  const rootSections = [
    buildSection1_ColorPalette(),
    [],
    buildSection2_ColorRoles(defaultMode),
    [],
    buildSection3_SpacingScale(),
    [],
    buildSection4_SpacingCategories(),
    [],
    buildSection5_Sizing(),
    [],
    buildSection6_Effects(),
    [],
    buildSection7_TypographyFonts(),
    [],
    buildSection8_ZIndex()
  ];

  return [
    header('tokens.css', `Design token values. Default mode: ${defaultMode}; \`[data-theme="${altMode}"]\` overrides the color roles. No framework at-rules — this file is plain CSS.`),
    '',
    `:root {\n${indent(rootSections.flat())}\n}`,
    '',
    buildSection9_AltMode(altMode),
    ''
  ].join('\n');
}

/**
 * The class layer: type ramp, interactive states, keyframes. Portable.
 *
 * The classes go in `@layer components`, which Tailwind orders below `utilities` — so
 * `<h3 class="text-title-md font-bold">` lets `font-bold` win. Unlayered they beat every
 * utility instead, which is not a style preference: it silently voided overrides authors
 * had written. `carousel.js` still carries a wrapper div added because `.interactive`'s
 * `position: relative` outranked an `absolute` on the same element.
 *
 * Keyframes stay outside the layer — `@keyframes` is not a style rule and cascade layers
 * do not apply to it; wrapping it changes nothing and reads as though it might.
 *
 * A non-Tailwind consumer gets a bare `@layer components` with no other layers declared,
 * which is valid CSS and orders the layer before all unlayered rules. That is the same
 * relationship Tailwind produces, so the file behaves consistently in both.
 */
function generateLayer() {
  const layered = [
    buildSection10_TypographyPresets(),
    '',
    buildSection11_InteractiveStates(),
    '',
    buildSection15_Tones(),
  ].join('\n');

  return [
    header('loom.css', 'The class layer — type ramp and interactive states in `@layer components` so utilities override them, plus keyframes. Reads the custom properties from tokens.css, which must load first. Plain CSS.'),
    '',
    `@layer components {\n${indent(layered.split('\n'))}\n}`,
    '',
    buildSection14_Animations(),
    ''
  ].join('\n');
}

/** The Tailwind v4 bridge: @theme inline and @utility. Not portable. */
function generateTailwind() {
  return [
    header('loom.tailwind.css', 'Tailwind v4 only — `@theme inline` maps the token vocabulary onto Tailwind utilities, and `@utility` declares the semantic spacing shorthands. A non-Tailwind build drops both silently; skip this file there and use the custom properties directly.'),
    '',
    buildSection13_SpacingUtilities(),
    '',
    buildSection12_TailwindTheme(),
    ''
  ].join('\n');
}

/** @returns {{'tokens.css': string, 'loom.css': string, 'loom.tailwind.css': string}} */
function generate() {
  return {
    'tokens.css': generateTokens(),
    'loom.css': generateLayer(),
    'loom.tailwind.css': generateTailwind(),
  };
}

// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);
  const files = generate();

  if (args.includes('--stdout')) {
    process.stdout.write(FILES.map((f) => files[f]).join('\n'));
  } else {
    const outputDir = args.includes('--output')
      ? args[args.indexOf('--output') + 1]
      : path.resolve(__dirname, '../..');
    for (const name of FILES) {
      const outputPath = path.join(outputDir, name);
      fs.writeFileSync(outputPath, files[name]);
      console.log(`${name}: ${files[name].length} chars → ${outputPath}`);
    }
  }
}

module.exports = { generate, generateTokens, generateLayer, generateTailwind, FILES };
