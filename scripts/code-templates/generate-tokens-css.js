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
// The table's colors, rules and text weights are declared in its own schema; the layer
// reads them so the schema stays the source rather than becoming decoration.
const layoutComponents = load('components/layout.json');

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

/**
 * Type roles as custom properties.
 *
 * The ramp is the only source of type, but a class cannot apply another class — so a
 * component class that needs `body/md` would have to restate its font-size and
 * line-height, which is two sources and the drift we have been removing all week. These
 * properties give both consumers one source: `.text-body-md` reads them, and so does
 * `.card[data-size="md"]`, which means a card's padding tier and its type tier cannot
 * disagree.
 */
function buildSectionTypeRoleVars() {
  const lines = ['/* === Type Role Values === */'];
  for (const [family, def] of Object.entries(typography.textStyles)) {
    for (const tier of ['sm', 'md', 'lg']) {
      const t = def[tier];
      if (!t) continue;
      const k = `--type-${family}-${tier}`;
      lines.push(`${k}-family: var(--font-${def.font});`);
      lines.push(`${k}-size: ${t.size};`);
      lines.push(`${k}-line: ${t['line-height']};`);
      lines.push(`${k}-weight: ${def.weight};`);
      lines.push(`${k}-tracking: ${def['letter-spacing'] && def['letter-spacing'] !== '0' ? def['letter-spacing'] : 'normal'};`);
    }
  }
  return lines;
}

function buildSection10_TypographyPresets() {
  const lines = ['/* === Text Style Families === */'];
  const tiers = ['sm', 'md', 'lg'];

  for (const [family, def] of Object.entries(typography.textStyles)) {
    const fontVar = `--font-${def.font}`;

    for (const tier of tiers) {
      const tierDef = def[tier];
      if (!tierDef) continue;

      const k = `--type-${family}-${tier}`;
      lines.push(`.text-${family}-${tier} {`);
      lines.push(`  font-family: var(${k}-family);`);
      lines.push(`  font-size: var(${k}-size);`);
      lines.push(`  line-height: var(${k}-line);`);
      lines.push(`  font-weight: var(${k}-weight);`);
      lines.push(`  letter-spacing: var(${k}-tracking);`);
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
/**
 * Control states — focus, validity, disabled.
 *
 * Validity keys off `aria-invalid`, not off a class the author has to keep in sync with
 * it. The attribute has to be right anyway for assistive tech, so styling from it means
 * the two cannot drift; a `.tone-error`-style opt-in would have made "we forgot the
 * class" a permanent category of bug. It re-points the tone properties rather than
 * setting colors directly, so an invalid control keeps whatever treatment it had.
 *
 * The focus ring consumes `--focus-ring-width/-offset/-color`, which were defined in the
 * token set and read by nothing — every atom hardcoded `ring-2 ring-ring` instead, so
 * changing the tokens changed no pixel. `outline` rather than a box-shadow ring: it takes
 * no layout space, follows border-radius, and `outline-offset` is what the offset token
 * was describing all along.
 *
 * Disabled lives here rather than in `.interactive` because it is not a pointer concern —
 * checkbox, radio, switch and slider are disable-able and carry no `.interactive`. The
 * three spellings are all present because Radix marks non-native controls with
 * `data-disabled` and `aria-disabled` where a native control gets `:disabled`.
 * `pointer-events` is deliberately not set: native `:disabled` already blocks interaction,
 * and suppressing events would also kill the hover that shows a tooltip explaining why
 * the control is disabled.
 */
/**
 * Surfaces, table, link.
 *
 * A surface names a background plane; `.elevate-N` names how far off it something sits.
 * They are separate because the catalog uses them separately. The shadow tokens already
 * resolve to `none` under `shadowDepth: flat`, so `.elevate-N` references them
 * unconditionally and the questionnaire answer decides whether anything renders — no
 * branch here. Border is not bundled either: a surface class travels with a border in
 * only a handful of atoms, so an outlined container stays a separate decision.
 *
 * The table is ruled — horizontal separators only, no outer frame — so a consumer can add
 * a full border later without first removing one. Rows shade on hover. Descendant
 * selectors here rather than a class per element: nobody should have to class every `tr`,
 * and the alternative is the `[&_tr:hover]:bg-surface-1` arbitrary-variant soup this
 * replaces.
 *
 * The link reads `--tone-text`, so it takes a tone when one is set and falls back to the
 * brand color when none is. That is the same composition the treatments use.
 */
/**
 * Print structure — what survives the page break.
 *
 * The color half lives in tokens.css, which forces the light roles under `@media print`.
 * This is the rest: fills that carry meaning have to actually render, and containers have
 * to break sensibly.
 *
 * `print-color-adjust: exact` is scoped to the classes whose fill IS the information — a
 * filled badge reading "OVERDUE" prints as bare text without it, and on a statement that
 * is a defect, not a rendering preference. It is deliberately not applied to surfaces:
 * page-wide plates should drop out and save the toner, which is the browser default and
 * the right one.
 *
 * `display: table-header-group` is the rule that makes a long table readable on paper —
 * without it the header prints once and every page after the first is unlabelled columns.
 *
 * This block is deliberately NOT inside `@layer components`. Unlayered rules outrank every
 * layer, which is what print needs: layered, a `shadow-lg` or `hover:bg-*` utility would
 * beat the print override and survive onto the page. Print is the one place the layer
 * ordering has to invert.
 */
/**
 * Component classes — shape only.
 *
 * A component class carries what makes the thing that thing: padding, radius, gap, the
 * dimensions that ramp, and the type role. Color composition is NOT included — a badge
 * takes `.tone-error-soft .treat-filled`, a control takes `.control`. Folding a default
 * tone into `.badge` would re-couple the axes that were just separated, and the terser
 * call site is not worth losing the property that adding a tone is one rule.
 *
 * The exception is a named variant vocabulary with no equivalent in the layer. `card`
 * declares default/elevated/outline/flush as combinations of background, border and
 * shadow; there is no border class to compose from, and the four names are a deliberate
 * design vocabulary rather than a mechanical product of two axes. Those become
 * `[data-variant]` modifiers on the class.
 *
 * Sizes ride on `[data-size]` rather than a class per tier. The atoms already emit that
 * attribute and the table already reads it, so it costs one selector per tier instead of
 * multiplying the class count by three.
 */
const CSS_SPACE = (v) => {
  if (v == null) return null;
  const m = String(v).match(/^\{scale\.(\d+)\}$/);
  if (m) return `var(--space-${m[1]})`;
  return /^\d/.test(String(v)) ? String(v) : null;
};
const CSS_COLOR = (v) => {
  if (!v || v === 'none') return null;
  if (v === 'transparent') return 'transparent';
  if (v === 'currentColor') return 'currentColor';
  return `var(--${String(v).split('/').pop()})`;
};
// Primitive scales are emitted under their own names (`--ch-3`, `--bw-1`, `--br-6`,
// `--icon-2`); semantic roles get a namespace (`--height-control-md`, `--radius-card`).
// A schema value can reference either — `height/control-md` is semantic, `height/ch-1` is
// the primitive underneath it — so the prefix is skipped when the tail already carries a
// primitive's own scale name.
const PRIMITIVE_TAIL = /^(ch|bw|br|icon|space|shadow)-/;
const CSS_TOKEN = (v, prefix) => {
  if (!v || typeof v !== 'string') return null;
  const tail = v.split('/').pop();
  return `var(--${PRIMITIVE_TAIL.test(tail) ? '' : prefix}${tail})`;
};

/** One component's shape rules: base, per-size, per-variant. */
/**
 * Sub-parts. A schema key of the form `<part>-<prop>` describes a child, not the element
 * the class is on — `heading-text` is the heading's type role, not the container's. Those
 * emit as `.<component>-<part>` so the part is nameable in markup without the class
 * guessing which element carries it (`.empty-state h3` would be wrong the moment someone
 * uses a div).
 *
 * Generic on purpose: `stepper`, `pagination` and `sidebar` declare the same shape of key
 * and can use this when their internals get named, rather than each inventing a scheme.
 */
const PART_PROPS = new Set(['text', 'fg', 'size', 'height', 'gap', 'x-padding', 'y-padding', 'radius', 'width']);

/**
 * Keys `decls()` consumes as the element's own property, and which therefore can never be
 * a `<part>-<prop>` pair however much they look like one.
 *
 * A compound name ends in a known part-prop: `line-height` ends in `height`, `min-width`
 * and `border-width` in `width`. So splitParts read them as parts `line`, `min` and
 * `border` and emitted `.helper-text-line`, `.label-line`, `.kbd-min`, `.textarea-min`
 * and `.spinner-border` — five classes naming elements that do not exist. Nothing
 * rendered wrong, because `decls()` also puts the real declaration on the element; the
 * layer simply carried five names a consumer could reach for and get a stray height from.
 *
 * Kept in step with `decls()` by `phantom-parts` in verify.js, which fails if a schema key
 * that decls() handles is still being split into a part.
 */
const SELF_PROPS = new Set([
  'text', 'x-padding', 'y-padding', 'gap', 'radius', 'height', 'min-height', 'size',
  'width', 'min-width', 'line-height', 'border-width', 'shadow', 'icon-size', 'icon',
]);

/**
 * Split `<part>-<prop>` by the longest known prop suffix rather than the last hyphen.
 *
 * `item-x-padding` is the case that matters: split at the last hyphen it becomes part
 * `item-x`, prop `padding`, which is not a known prop — so the key was dropped and the
 * sidebar's item padding silently never emitted. Props contain hyphens; parts may too.
 */
function splitParts(keys) {
  const props = [...PART_PROPS].sort((a, b) => b.length - a.length);
  const parts = {};
  for (const k of keys) {
    if (SELF_PROPS.has(k)) continue;   // a property, not a part
    const prop = props.find((p) => k.endsWith(`-${p}`) && k.length > p.length + 1);
    if (!prop) continue;
    const part = k.slice(0, k.length - prop.length - 1);
    if (part === 'icon' && prop === 'size') continue; // the container's --icon-size
    (parts[part] = parts[part] || []).push([k, prop]);
  }
  return parts;
}

/**
 * `<prop>-<variant>` is the mirror of `<part>-<prop>`: the same property, in one variant.
 * The distinction is not inferable from the shape — `rail-width` and `item-height` look
 * identical and mean opposite things — so the schema spells it prop-first, and a suffix
 * matching a declared variant name is what tells the two apart. Written the other way it
 * nearly produced a `.sidebar-rail` class for an element that does not exist.
 */
function splitVariantDims(keys, variantNames) {
  const props = [...PART_PROPS].sort((a, b) => b.length - a.length);
  const out = [];
  for (const k of keys) {
    if (SELF_PROPS.has(k)) continue;   // same reasoning as splitParts
    for (const v of variantNames) {
      if (!k.endsWith(`-${v}`)) continue;
      const prop = k.slice(0, k.length - v.length - 1);
      if (props.includes(prop)) out.push([k, prop, v]);
    }
  }
  return out;
}

function buildComponentClass(name, cfg, textFamily) {
  if (!cfg) return '';
  const out = [];
  const sizes = cfg.sizes || {};
  const constant = sizes.$constant || {};
  const tiers = Object.keys(sizes).filter((t) => !t.startsWith('$') && sizes[t] && typeof sizes[t] === 'object');

  const decls = (src) => {
    const d = [];
    // `text: "body/sm"` binds this tier to a type role through the shared properties, so
    // the padding tier and the type tier cannot drift apart at a call site.
    const role = src.text ? String(src.text).replace('/', '-') : (textFamily && src.$tier ? `${textFamily}-${src.$tier}` : null);
    if (role) {
      const k = `--type-${role}`;
      d.push(`font-family: var(${k}-family);`, `font-size: var(${k}-size);`,
             `line-height: var(${k}-line);`, `font-weight: var(${k}-weight);`,
             `letter-spacing: var(${k}-tracking);`);
    }
    const x = CSS_SPACE(src['x-padding']);
    const y = CSS_SPACE(src['y-padding']);
    const gap = CSS_SPACE(src.gap);
    if (x) d.push(`padding-inline: ${x};`);
    if (y) d.push(`padding-block: ${y};`);
    if (gap) d.push(`gap: ${gap};`);
    if (src.radius) d.push(`border-radius: ${CSS_TOKEN(src.radius, 'radius-')};`);
    if (src.height) d.push(`height: ${CSS_TOKEN(src.height, 'height-')};`);
    if (src['min-height']) d.push(`min-height: ${CSS_TOKEN(src['min-height'], 'height-')};`);
    // A square: one token driving both axes (dot, spinner, the icon-only fab).
    if (src.size) {
      const sz = CSS_TOKEN(src.size, src.size.startsWith('icon/') ? '' : 'height-');
      d.push(`width: ${sz};`, `height: ${sz};`);
    }
    if (src.width) d.push(`width: ${CSS_SPACE(src.width) || CSS_TOKEN(src.width, 'height-')};`);
    if (src['min-width']) d.push(`min-width: ${CSS_SPACE(src['min-width']) || CSS_TOKEN(src['min-width'], 'height-')};`);
    if (src['line-height']) d.push(`line-height: ${CSS_SPACE(src['line-height']) || src['line-height']};`);
    if (src['border-width']) d.push(`border-width: ${CSS_TOKEN(src['border-width'], '')};`);
    if (src.shadow) d.push(`box-shadow: ${CSS_TOKEN(src.shadow, '')};`);
    // Icon size travels as a property rather than a descendant rule: the class must not
    // assume what element holds the icon. The atom's icon slot reads it, and so can a
    // consumer marking up by hand.
    const icon = src['icon-size'] || src.icon;
    if (icon) d.push(`--icon-size: ${CSS_TOKEN(icon, '')};`);
    return d;
  };

  // `$constant` is already expanded into every tier by the config loader, so re-detect
  // what does not vary and lift it to the base rule. Without this each tier restates the
  // radius and gap it shares with the others, which is the repetition the layer exists to
  // remove — in the file a person reads, not just in the minified output.
  const perTier = tiers.map((t) => decls({ ...sizes[t], $tier: t }));
  const shared = perTier.length
    ? perTier[0].filter((line) => perTier.every((d) => d.includes(line)))
    : [];
  const base = [...(BASE_RULES[name] || []), ...decls(constant), ...shared];
  if (base.length) out.push(`.${name} {`, ...base.map((l) => `  ${l}`), '}', '');

  tiers.forEach((t, i) => {
    const d = perTier[i].filter((line) => !shared.includes(line));
    if (!d.length) return;
    out.push(`.${name}[data-size="${t}"] {`, ...d.map((l) => `  ${l}`), '}', '');
  });

  // Icon-only mode is a second size ladder in the schema (`icon-sizes`), square rather
  // than padded. It rides the same attribute so a caller sets one thing.
  const iconSizes = cfg['icon-sizes'] || {};
  for (const [t, c2] of Object.entries(iconSizes)) {
    if (t.startsWith('$') || !c2 || typeof c2 !== 'object') continue;
    const d = decls({ ...c2 });
    if (d.length) out.push(`.${name}[data-size="icon-${t}"] {`, ...d.map((l) => `  ${l}`), '}', '');
  }

  // --- sub-parts ---
  const allKeys = new Set();
  for (const t of tiers) for (const k of Object.keys(sizes[t] || {})) if (!k.startsWith('$')) allKeys.add(k);
  // Variant-scoped dimensions: `.x[data-size="md"][data-variant="rail"] { width: … }`.
  const variantNames = Object.keys(cfg.variants || {}).filter((v) => !v.startsWith('$'));
  for (const [key, prop, vname] of splitVariantDims(allKeys, variantNames)) {
    tiers.forEach((t) => {
      const raw = (sizes[t] || {})[key];
      if (raw == null) return;
      const val = CSS_SPACE(raw) || CSS_TOKEN(raw, prop === 'radius' ? 'radius-' : 'height-') || raw;
      out.push(`.${name}[data-size="${t}"][data-variant="${vname}"] {`, `  ${prop}: ${val};`, '}', '');
    });
  }

  const parts = splitParts(allKeys);
  // An `icon` part reads the container's --icon-size rather than restating each tier: the
  // container already ramps it, and one rule beats three that say the same thing.
  const hasIconPart = Object.keys(cfg.variants || {}).some((v) =>
    Object.keys(cfg.variants[v] || {}).some((k) => k === 'icon-fg'));
  if (hasIconPart) {
    out.push(`.${name}-icon {`, '  display: inline-flex;', '  align-items: center;', '  justify-content: center;',
             '  width: var(--icon-size);', '  height: var(--icon-size);', '  flex-shrink: 0;', '}', '');
  }
  for (const [part, propKeys] of Object.entries(parts)) {
    const sel = `.${name}-${part}`;
    const base = SUB_PART_RULES[`${name}-${part}`];
    if (base) out.push(`${sel} {`, ...base.map((l) => `  ${l}`), '}', '');
    tiers.forEach((t) => {
      const d = [];
      for (const [key, prop] of propKeys) {
        const v = (sizes[t] || {})[key];
        if (v == null) continue;
        if (prop === 'text') {
          const k = `--type-${String(v).replace('/', '-')}`;
          d.push(`font-size: var(${k}-size);`, `line-height: var(${k}-line);`,
                 `font-weight: var(${k}-weight);`, `letter-spacing: var(${k}-tracking);`);
        } else if (prop === 'size') {
          const sz = CSS_TOKEN(v, String(v).startsWith('icon/') ? '' : 'height-');
          d.push(`width: ${sz};`, `height: ${sz};`);
        } else if (prop === 'gap') { const g = CSS_SPACE(v); if (g) d.push(`gap: ${g};`); }
        else if (prop === 'x-padding') { const g = CSS_SPACE(v); if (g) d.push(`padding-inline: ${g};`); }
        else if (prop === 'y-padding') { const g = CSS_SPACE(v); if (g) d.push(`padding-block: ${g};`); }
        else if (prop === 'radius') d.push(`border-radius: ${CSS_TOKEN(v, 'radius-')};`);
        else if (prop === 'height') d.push(`height: ${CSS_TOKEN(v, 'height-')};`);
        else if (prop === 'width') { const g = CSS_SPACE(v); d.push(`width: ${g || CSS_TOKEN(v, 'height-')};`); }
      }
      if (d.length) out.push(`.${name}[data-size="${t}"] ${sel} {`, ...d.map((l) => `  ${l}`), '}', '');
    });
  }

  const variants = cfg.variants || {};
  for (const [vname, v] of Object.entries(variants)) {
    if (vname.startsWith('$') || !v || typeof v !== 'object') continue;
    for (const [vk, vv] of Object.entries(v)) {
      const i = vk.lastIndexOf('-');
      if (i < 1 || vk.slice(i + 1) !== 'fg' || vk === 'fg') continue;
      const c = CSS_COLOR(vv);
      if (c) out.push(`.${name}[data-variant="${vname}"] .${name}-${vk.slice(0, i)} {`, `  color: ${c};`, '}', '');
    }
    const d = [];
    const bg = CSS_COLOR(v.bg);
    const fg = CSS_COLOR(v.fg);
    const border = CSS_COLOR(v.border);
    if (bg) d.push(`background-color: ${bg};`);
    if (fg) d.push(`color: ${fg};`);
    d.push(border ? `border: var(--bw-1) solid ${border};` : 'border: 0;');
    if (v.shadow) d.push(`box-shadow: ${CSS_TOKEN(v.shadow, '')};`);  // tail is already 'shadow-N'
    out.push(`.${name}[data-variant="${vname}"] {`, ...d.map((l) => `  ${l}`), '}', '');
  }

  return out.join('\n');
}

// The component classes are enumerated from the SCHEMAS, not from the component registry.
//
// They were read from the registry until dropping the eighteen appearance-only atoms
// emptied it — and every class those atoms had become vanished with their registry entry.
// The emit went from 19 classes to 4 in one commit, silently: nothing failed, because the
// classes had no consumer inside this repo yet. The whole point of the deletion was that
// the appearance had moved somewhere safe, and the enumeration source made that false.
//
// The schema is the right source. It survives the component, which is exactly the property
// wanted: `card` has no .tsx any more and must still emit `.card`.
// `table` is excluded for a different reason than the rest: its size keys describe the
// *cells*, so they emit as `.table[data-size] :is(th, td)` with the other table rules.
// Padding on the table element would pad the frame and leave every cell untouched.
const CELL_SIZED = new Set(['table']);

// Layout a component class must carry because it is the shape, not a choice: the schema
// describes spacing between children and says nothing about the axis they sit on.
/**
 * Declarations the schema cannot express, keyed by class name.
 *
 * The emitter only ever knew about the sizing schema. Everything an atom stated in its
 * cva base string — box model, the chrome of a form control, the dot's pill — was
 * invisible to it, so the class layer inherited a component's ladder and dropped the box
 * it ramped. `.button` emitted `gap` while computing `display: block`; `.icon-slot` set
 * width and height on an inline span, which ignores both; `.input` emitted padding and
 * height with no border, background or text colour, so a text field rendered as bare text
 * on the page. Nothing failed: every class was present, which is all `class-coverage`
 * could see.
 *
 * Every line below is recovered from the atom that the class replaced, read out of
 * `git show 0e4547a^:catalog/<name>.tsx` — the commit before the appearance-only atoms
 * were dropped. Recovered rather than redesigned on purpose: a faithful restore cannot
 * break something that rendered correctly before, and a judgement call here could not be
 * checked in a browser.
 *
 * `class-box-model` in verify.js asserts every line reaches the output.
 */
const BASE_RULES = {
  badge: ['display: inline-flex;', 'align-items: center;', 'justify-content: center;'],
  banner: ['display: flex;', 'align-items: center;'],
  'bottom-nav': ['display: flex;', 'align-items: center;', 'justify-content: space-around;', 'width: 100%;'],
  breadcrumbs: ['display: flex;', 'align-items: center;'],
  button: ['display: inline-flex;', 'align-items: center;', 'justify-content: center;'],
  card: ['display: flex;', 'flex-direction: column;'],
  // `rounded-pill` sat in the cva base, not in the schema, so the dot emitted as a square.
  dot: ['display: inline-block;', 'flex-shrink: 0;', 'border-radius: var(--radius-pill);'],
  'empty-state': ['display: flex;', 'flex-direction: column;', 'align-items: center;', 'text-align: center;'],
  fab: ['display: inline-flex;', 'align-items: center;', 'justify-content: center;'],
  'helper-text': ['display: flex;', 'align-items: center;', 'color: var(--on-surface-variant);'],
  // The border reads `--tone-border` so `.control[aria-invalid="true"]` re-points it to
  // the error role and the field turns red without this rule knowing about validity.
  // Before, that re-point had no reader on an input — only `.treat-outline` consumes it,
  // and a text field carries no treatment — so an invalid input was pixel-identical to a
  // valid one. `--tone-text` is deliberately not read: the atom reddened the border only.
  input: ['display: inline-flex;', 'align-items: center;', 'justify-content: center;', 'width: 100%;',
          'background-color: var(--surface);', 'color: var(--on-surface);',
          'border: var(--bw-1) solid var(--tone-border, var(--outline));'],
  kbd: ['display: inline-flex;', 'align-items: center;', 'justify-content: center;'],
  label: ['display: flex;', 'align-items: center;', 'color: var(--on-surface);'],
  'list-item': ['display: flex;', 'align-items: center;'],
  pagination: ['display: flex;', 'align-items: center;', 'justify-content: center;'],
  sidebar: ['display: flex;', 'flex-direction: column;'],
  // `animate-pulse` was a Tailwind built-in; a consumer without Tailwind has no such
  // utility, so the layer has to carry the animation for the class to mean anything.
  skeleton: ['width: 100%;', 'border-radius: var(--radius-component);',
             'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;'],
  spinner: ['display: inline-flex;', 'align-items: center;', 'justify-content: center;'],
  stepper: ['display: flex;', 'align-items: center;', 'width: 100%;'],
  textarea: ['display: inline-flex;', 'align-items: center;', 'justify-content: center;', 'width: 100%;',
             'background-color: var(--surface);', 'color: var(--on-surface);',
             'border: var(--bw-1) solid var(--tone-border, var(--outline));'],
  toolbar: ['display: flex;', 'align-items: center;'],
  'top-bar': ['display: flex;', 'align-items: center;'],
};

// Emitted classes that need no `display`, and why. Anything else missing one is a bug —
// see `class-box-model`.
const NO_BOX = {
  skeleton: 'a plain block; the atom declared no display either',
  table: 'the element is display: table already',
};

/**
 * The same recovery as BASE_RULES, for the sub-part classes.
 *
 * A sub-part rule only ever emits the tier dimensions — `height`, `gap`, `padding` — on a
 * selector like `.sidebar[data-size="sm"] .sidebar-item`. It never emitted a `display`,
 * and the atoms hid that: every one of these lived inside a flex parent, which blockifies
 * its children, so height applied and gap did not. Marked up by hand, outside that parent,
 * they are inline boxes and the dimensions are inert — which is what the gallery shell hit
 * the moment it stopped importing the Sidebar atom and used `.sidebar-item` directly.
 *
 * Recovered from the atom that rendered each part, at the commit before the catalog cut.
 * A flex item's display is blockified anyway, so declaring it changes nothing inside the
 * old parents and makes the class stand on its own outside them.
 */
const SUB_PART_RULES = {
  'sidebar-item': ['display: flex;', 'align-items: center;', 'width: 100%;',
                   'border-radius: var(--radius-component);'],
  'pagination-item': ['display: inline-flex;', 'align-items: center;', 'justify-content: center;'],
  'stepper-indicator': ['display: flex;', 'align-items: center;', 'justify-content: center;',
                        'flex-shrink: 0;', 'border-radius: var(--radius-pill);'],
  // `flex-1 h-px` in the atom — a flex child, so its height applied only because the
  // parent blockified it. `display: block` is that behaviour, stated.
  'stepper-connector': ['display: block;', 'flex: 1 1 0%;'],
};

// Sub-part vocabularies. A component declaring one describes its internals, and naming
// those is a design decision per component rather than a loop — so it waits, visibly.
// Empty by design. Every sub-part key the catalog declares is now handled generically —
// this stays as the place to park a key whose shape the emitter genuinely cannot express,
// rather than half-emitting a component and leaving the gap unstated.
const SUB_PART_KEYS = new Set([]);

const APPEARANCE_ONLY = new Set([
  'badge', 'banner', 'bottom-nav', 'breadcrumbs', 'button', 'card', 'dot', 'empty-state',
  'fab', 'form-field', 'helper-text', 'input', 'kbd', 'label', 'list-item', 'pagination',
  'separator', 'sidebar', 'skeleton', 'spinner', 'stepper', 'table', 'textarea',
  'toolbar', 'top-bar', 'avatar-group',
]);

const TEXT_FAMILY = {
  badge: 'label', banner: 'body', 'bottom-nav': 'label', breadcrumbs: 'body',
  button: 'action', card: 'body', 'empty-state': 'body', fab: 'action',
  'helper-text': 'label', input: 'input', kbd: 'label', label: 'action',
  'list-item': 'body', spinner: null, dot: null, skeleton: 'body', table: 'body',
  textarea: 'input', toolbar: 'body', 'top-bar': 'title',
};

// Schema key -> class name, where they differ. `input` is styled by the shared
// `text-field` foundation the form controls all reference.
const SCHEMA_KEY = { input: 'text-field' };

function componentPlan() {
  const sources = ['button', 'form', 'layout', 'feedback', 'data-display', 'navigation', 'composite']
    .map((g) => load(`components/${g}.json`));
  const find = (key) => {
    const k = SCHEMA_KEY[key] || key;
    for (const src of sources) if (src[k]) return src[k];
    return null;
  };

  const emit = [];
  const skipped = { empty: [], subParts: [] };
  for (const name of [...APPEARANCE_ONLY].sort()) {
    const cfg = find(name);
    if (!cfg) { skipped.empty.push(name); continue; }
    if (CELL_SIZED.has(name)) continue;
    const sizes = cfg.sizes || {};
    const keys = new Set(Object.keys(sizes.$constant || {}));
    for (const t of Object.keys(sizes)) {
      if (t.startsWith('$') || !sizes[t] || typeof sizes[t] !== 'object') continue;
      for (const k of Object.keys(sizes[t])) if (!k.startsWith('$')) keys.add(k);
    }
    const hasVariants = Object.keys(cfg.variants || {}).length > 0;
    if (!keys.size && !hasVariants) { skipped.empty.push(name); continue; }
    const sub = [...keys].filter((k) => SUB_PART_KEYS.has(k));
    if (sub.length) { skipped.subParts.push(`${name} (${sub.join(', ')})`); continue; }
    emit.push({ name, cfg, textFamily: TEXT_FAMILY[name] });
  }
  return { emit, skipped };
}

function buildSectionComponentClasses() {
  const { emit, skipped } = componentPlan();
  const parts = [
    '/* === Components ===',
    ' *',
    ' * Shape only. Color composes: a tone class sets the fill, `.control` carries focus and',
    ' * validity, `.surface-N` and `.elevate-N` carry plane and lift.',
    ' *',
    ` * No class emitted for: ${skipped.empty.join(', ')} — nothing declared to carry.`,
    ' * No class emitted for these until their internals are named:',
    ...skipped.subParts.map((x) => ` *   ${x}`),
    ' */',
  ];
  // Every component that ramps an icon sets --icon-size; this is the one rule that reads
  // it, so the ladder lives in the CSS alone rather than also in a JS lookup per atom.
  // `display` is load-bearing, not tidiness: a span is inline, and width and height do
  // not apply to an inline box. Without it the slot ignored --icon-size entirely and the
  // svg fell back to its intrinsic size — a 16px icon rendering at 55px and overflowing
  // the button. It worked inside the atoms only because their flex parent blockified it,
  // and the parents lost their `display` in the same move.
  parts.push(`.icon-slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-size);
  height: var(--icon-size);
  flex-shrink: 0;
}

.icon-slot > svg {
  width: 100%;
  height: 100%;
}
`);
  for (const c of emit) parts.push(buildComponentClass(c.name, c.cfg, c.textFamily));
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

function buildSectionPrintStructure() {
  return `@media print {
  .treat-filled,
  .treat-dot {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .surface-1,
  .surface-2,
  .surface-3 {
    break-inside: avoid;
  }

  .elevate-0,
  .elevate-1,
  .elevate-2,
  .elevate-3 {
    box-shadow: none;
  }

  .table thead {
    display: table-header-group;
  }

  .table tr {
    break-inside: avoid;
  }

  .table tbody tr:hover {
    background-color: transparent;
  }

  .link {
    text-decoration: underline;
  }
}`;
}

function buildSection17_SurfacesTableLink() {
  // Surface level and elevation are independent axes, not one scale. The catalog proves
  // it: bg-surface-1 pairs with shadow-1, shadow-2 and shadow-3 in different atoms, so a
  // class bundling them would be wrong two times in three. Same orthogonality as tone and
  // treatment — one class says which plane, the other says how far off it.
  const surfaces = [1, 2, 3]
    .map((n) => `.surface-${n} {\n  background-color: var(--surface-${n});\n}\n`)
    .join('\n');
  const elevations = [0, 1, 2, 3]
    .map((n) => `.elevate-${n} {\n  box-shadow: var(--shadow-${n});\n}\n`)
    .join('\n');

  return `/* === Surfaces === */
${surfaces}
/* === Elevation === */
${elevations}
/* === Link === */
.link {
  color: var(--tone-text, var(--primary));
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.link:hover {
  text-decoration-thickness: var(--bw-2);
}`;
}

/** The table's own rules. Lives with the components, not the primitives. */
function buildSectionTable() {
  const t = (layoutComponents.table || {});
  const v = (t.variants && t.variants.default) || {};
  const role = (p, fallback) => {
    const r = String(v[p] || '').split('/').pop();
    return r ? `var(--${r})` : fallback;
  };
  const headerFg = role('header-fg', 'var(--on-surface-variant)');
  const rowFg = role('row-fg', 'var(--on-surface)');
  const ruleColor = role('border', 'var(--outline)');
  const typo = t.typography || {};
  const headerWeight = (typo.header && typo.header['font-weight']) || 500;
  const cellWeight = (typo.cell && typo.cell['font-weight']) || 400;

  // Cell sizing. The schema's tiers describe th/td, not the table element — padding on
  // `.table[data-size]` would pad the frame and leave the cells untouched.
  const cellTiers = Object.entries(t.sizes || {})
    .filter(([tier, cfg]) => !tier.startsWith('$') && cfg && typeof cfg === 'object')
    .map(([tier, cfg]) => {
      const d = [];
      const x = CSS_SPACE(cfg['x-padding']);
      const y = CSS_SPACE(cfg['y-padding']);
      if (x) d.push(`  padding-inline: ${x};`);
      if (y) d.push(`  padding-block: ${y};`);
      if (cfg.text) {
        const k = `--type-${String(cfg.text).replace('/', '-')}`;
        d.push(`  font-size: var(${k}-size);`, `  line-height: var(${k}-line);`);
      }
      return d.length ? `.table[data-size="${tier}"] :is(th, td) {\n${d.join('\n')}\n}` : '';
    })
    .filter(Boolean)
    .join('\n\n');

  return `/* === Table === */
.table {
  width: 100%;
  border-collapse: collapse;
  caption-side: bottom;
}

.table thead {
  color: ${headerFg};
}

.table tbody {
  color: ${rowFg};
}

.table tr {
  border-bottom: var(--bw-1) solid ${ruleColor};
  transition: background-color var(--transition-fast) var(--easing);
}

.table tbody tr:last-child {
  border-bottom: 0;
}

.table tbody tr:hover {
  background-color: var(--surface-1);
}

.table th {
  text-align: left;
  vertical-align: middle;
  font-weight: ${headerWeight};
}

.table td {
  vertical-align: middle;
  font-weight: ${cellWeight};
}

${cellTiers}`;
}

function buildSection16_ControlStates() {
  return `/* === Control States === */
.control {
  transition-property: color, background-color, border-color, outline-color, opacity;
  transition-duration: var(--transition-fast);
  transition-timing-function: var(--easing);
}

.control:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

.control[aria-invalid="true"] {
  --tone-border: var(--error);
  --tone-text: var(--error);
}

.control[aria-invalid="true"]:focus-visible {
  outline-color: var(--error);
}

.control:disabled,
.control[aria-disabled="true"],
.control[data-disabled] {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}`;
}

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

/* Only the pointer half. Opacity and cursor belong to .control, which every atom
   carrying .interactive also carries — checked by the interactive-implies-control
   verify check. Suppressing pointer events is a pointer concern and stays here. */
.interactive:disabled,
.interactive[aria-disabled="true"] {
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
}

/* Consumed by .skeleton. The other keyframes here are named for atoms to reach for;
   this one the layer uses itself, because a skeleton that does not pulse is a grey bar. */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
const FILES = ['tokens.css', 'loom.css', 'loom.components.css', 'loom.tailwind.css'];

function header(name, note) {
  return `/**
 * ${name} — generated, do not edit. Regenerate from spec/config/.
 *
 * ${note}
 */`;
}

/** Custom properties only: :root and the alternate-mode block. Portable. */
/**
 * Print forces the light roles, whatever the app is showing.
 *
 * A document is a document. `defaultMode` decides what the screen opens in; it should not
 * decide that an invoice arrives as a full-bleed dark page — and `print-color-adjust:
 * exact` would make that worse, insisting the browser actually render the dark ground
 * instead of dropping it as it would by default.
 *
 * Both `:root` and `[data-theme="dark"]` are overridden, so this holds whichever mode is
 * the default and whether or not the viewer has toggled. It redefines the same custom
 * properties the light block already emits, so nothing downstream — tones, treatments,
 * surfaces — needs a print-aware branch: they read the roles, and the roles changed.
 */
function buildSectionPrintRoles() {
  const lines = buildSection2_ColorRoles('light');
  if (!lines.length) return '';
  return `@media print {\n  :root,\n  [data-theme="dark"] {\n${indent(lines, 2)}\n  }\n}`;
}

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
    buildSectionTypeRoleVars(),
    [],
    buildSection8_ZIndex()
  ];

  return [
    header('tokens.css', `Design token values. Default mode: ${defaultMode}; \`[data-theme="${altMode}"]\` overrides the color roles. No framework at-rules — this file is plain CSS.`),
    '',
    `:root {\n${indent(rootSections.flat())}\n}`,
    '',
    buildSection9_AltMode(altMode),
    '',
    buildSectionPrintRoles(),
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
    '',
    buildSection16_ControlStates(),
    '',
    buildSection17_SurfacesTableLink(),
  ].join('\n');

  return [
    header('loom.css', 'The class layer — type ramp and interactive states in `@layer components` so utilities override them, plus keyframes. Reads the custom properties from tokens.css, which must load first. Plain CSS.'),
    '',
    `@layer components {\n${indent(layered.split('\n'))}\n}`,
    '',
    buildSection14_Animations(),
    '',
    buildSectionPrintStructure(),
    ''
  ].join('\n');
}

/**
 * Named components. Portable.
 *
 * Split from loom.css because the two answer different questions. loom.css is what you
 * compose with — type roles, tones, treatments, control states, surfaces, elevation. This
 * file is what those compose *into*, and it is the larger and more churn-prone half. A
 * consumer who wants the substrate and owns their own components takes loom.css and skips
 * this one; that is the tokens tier, now expressible as a file rather than a paragraph.
 */
function generateComponents() {
  const layered = [
    buildSectionTable(),
    '',
    buildSectionComponentClasses(),
  ].join('\n');

  return [
    header('loom.components.css', 'Named component classes — shape only; compose with the tones, treatments and control states in loom.css, which must load first.'),
    '',
    `@layer components {\n${indent(layered.split('\n'))}\n}`,
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
    'loom.components.css': generateComponents(),
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

module.exports = { generate, generateTokens, generateLayer, generateComponents, generateTailwind, FILES, componentPlan, APPEARANCE_ONLY, BASE_RULES, NO_BOX, SELF_PROPS, SUB_PART_RULES };
