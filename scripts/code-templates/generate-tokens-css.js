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
  lines.push(`--transition: ${standards.effects.transition.default};`);
  lines.push(`--easing: ${standards.effects.easing.default};`);

  lines.push('');
  lines.push('/* === Focus Ring === */');
  lines.push(`--focus-ring-width: ${standards.effects['focus-ring'].width};`);
  lines.push(`--focus-ring-offset: ${standards.effects['focus-ring'].offset};`);
  lines.push(`--focus-ring-color: var(--${standards.effects['focus-ring'].color});`);

  // Consumed as `opacity: var(--opacity-disabled)`.
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
 * treatment is one rule, not an N*M matrix.
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
 * Control states — validity, disabled, and the transitions between them.
 *
 * Focus is deliberately not here any more. The baseline ring is an element-level rule in
 * `loom.base`; what stays is the validity recolour, which is a state distinction rather
 * than a baseline. `.control` keeps a narrower job, and its name stops implying "the
 * class that handles focus."
 *
 * Validity keys off `aria-invalid`, not off a class the author has to keep in sync with
 * it. The attribute has to be right anyway for assistive tech, so styling from it means
 * the two cannot drift; a `.tone-error`-style opt-in would have made "we forgot the
 * class" a permanent category of bug. It re-points the tone properties rather than
 * setting colors directly, so an invalid control keeps whatever treatment it had.
 *
 * The ring itself consumes `--focus-ring-width/-offset/-color`, which were defined in the
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
  'width', 'min-width', 'max-width', 'line-height', 'border-width', 'shadow', 'icon-size',
  'icon',
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
    // Raw lengths by design: dialog's schema marks these an $exception, because a modal's
    // breakpoints are layout-specific and derive from no spacing or sizing primitive.
    if (src['max-width']) d.push(`max-width: ${CSS_SPACE(src['max-width']) || CSS_TOKEN(src['max-width'], 'height-')};`);
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
    // A variant may rule one edge rather than all four: `border-bottom` on top-bar,
    // `border-right` on sidebar, `border-top` on bottom-nav. Only `border` was read, so
    // all five declarations were dropped — and the fallback is `border: 0`, which does not
    // merely omit the rule, it removes it. The app header lost its bottom rule and the
    // sidebar its right one, in the same move that was supposed to preserve appearance.
    // Found by hand-porting a consumer off the atom, which is what that exercise is for.
    const sides = ['top', 'right', 'bottom', 'left']
      .map((side) => [side, v[`border-${side}`]])
      .filter(([, raw]) => raw !== undefined);
    d.push(border ? `border: var(--bw-1) solid ${border};` : 'border: 0;');
    for (const [side, raw] of sides) {
      const c = CSS_COLOR(raw);   // `"none"` resolves to nothing; the border: 0 above covers it
      if (c) d.push(`border-${side}: var(--bw-1) solid ${c};`);
    }
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
  'bottom-nav': ['display: flex;', 'align-items: center;', 'justify-content: space-around;', 'width: 100%;'],
  breadcrumbs: ['display: flex;', 'align-items: center;'],
  button: ['display: inline-flex;', 'align-items: center;', 'justify-content: center;'],
  card: ['display: flex;', 'flex-direction: column;'],
  // Appearance only. `.dialog-fixed` carries placement, so the class works on a native
  // <dialog> the UA centres itself and on a hand-rolled portal that needs telling.
  dialog: ['display: flex;', 'flex-direction: column;', 'width: 100%;'],
  'empty-state': ['display: flex;', 'flex-direction: column;', 'align-items: center;', 'text-align: center;'],
  'form-field': ['display: flex;', 'flex-direction: column;'],
  'helper-text': ['display: flex;', 'align-items: center;', 'color: var(--on-surface-variant);'],
  // The border reads `--tone-border` so `.control[aria-invalid="true"]` re-points it to
  // the error role and the field turns red without this rule knowing about validity.
  // Before, that re-point had no reader on an input — only `.treat-outline` consumes it,
  // and a text field carries no treatment — so an invalid input was pixel-identical to a
  // valid one. `--tone-text` is deliberately not read: the atom reddened the border only.
  // `justify-content: center` was in both atoms' cva base and is deliberately NOT restored.
  // It is provably inert on a real <input> or <textarea> — the UA owns the inner editor —
  // so dropping it cannot change anything that rendered before, which is the same test the
  // restores had to pass. And it is actively wrong the first time the class meets hand
  // markup: a Radix Select trigger is a <button> carrying `.input`, and centring its
  // contents puts the chevron in the middle of the field.
  input: ['display: inline-flex;', 'align-items: center;', 'width: 100%;',
          'background-color: var(--surface);', 'color: var(--on-surface);',
          'border: var(--bw-1) solid var(--tone-border, var(--outline));'],
  kbd: ['display: inline-flex;', 'align-items: center;', 'justify-content: center;'],
  label: ['display: flex;', 'align-items: center;', 'color: var(--on-surface);'],
  'list-item': ['display: flex;', 'align-items: center;'],
  pagination: ['display: flex;', 'align-items: center;', 'justify-content: center;'],
  sidebar: ['display: flex;', 'flex-direction: column;'],
  // Static by deliberate choice. A skeleton earns its place by reserving layout and
  // showing the shape of what is coming, and it does both without moving. The pulse it
  // used to carry was also the only thing a reduced-motion user had to be spared from,
  // and what they would have been served instead is exactly this block.
  skeleton: ['width: 100%;', 'border-radius: var(--radius-component);'],
  // The layer's one animation, and the only class that is meaningless without it: a
  // spinner that does not turn is a circle. Deliberately outside the reduced-motion
  // block below — a frozen spinner does not read as calm, it reads as hung.
  spinner: ['display: inline-flex;', 'align-items: center;', 'justify-content: center;',
            'animation: spin 1s linear infinite;'],
  textarea: ['display: inline-flex;', 'align-items: center;', 'width: 100%;',
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
  'badge', 'bottom-nav', 'breadcrumbs', 'button', 'card', 'empty-state',
  'form-field', 'helper-text', 'input', 'kbd', 'label', 'list-item', 'pagination',
  'dialog', 'separator', 'sidebar', 'skeleton', 'spinner', 'table',
  'textarea', 'toolbar', 'top-bar', 'avatar-group',
]);

const TEXT_FAMILY = {
  badge: 'label', 'bottom-nav': 'label', breadcrumbs: 'body',
  button: 'action', card: 'body', dialog: 'body', 'empty-state': 'body',
  'helper-text': 'label', input: 'input', kbd: 'label', label: 'action',
  'list-item': 'body', spinner: null, skeleton: 'body', table: 'body',
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
    ' * Shape only. Color composes: a tone class sets the fill, `.control` carries validity and',
    ' * disabled state, `.surface-N` and `.elevate-N` carry plane and lift.',
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
  // Badge is filled by default, so `badge tone-primary` is correct as written — which is
  // how it will keep being written, and how it was written in the consumer build that
  // shipped a count badge with no background. A badge with no fill is not a variant
  // anyone wants; the component has opinions already, which is what `data-size` implies.
  //
  // :where() is load-bearing, not caution. Spelled as a plain `.badge` rule this breaks
  // every outline badge: the treatments live in loom.css and badge lives in
  // loom.components.css, both inside @layer loom.components, so at equal specificity the
  // later file wins and `.badge` would outrank the `background-color: transparent` that
  // .treat-outline and .treat-ghost set. At zero specificity every treatment beats it and
  // a bare tone still paints, because nothing else puts a background on a badge.
  //
  // Only badge. Button is deliberately untouched — a frameless text button is a real
  // thing someone asks for, and .button already normalizes the UA chrome that made one
  // look broken.
  parts.push(`:where(.badge) {
  background-color: var(--tone-bg, transparent);
  color: var(--tone-fg, inherit);
}
`);
  for (const c of emit) parts.push(buildComponentClass(c.name, c.cfg, c.textFamily));
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

function buildSectionPrintStructure() {
  return `@media print {
  .treat-filled {
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

/**
 * The document base, and the two colour roles that had no class.
 *
 * Everything else in this file is opt-in: you add a class and something happens. This
 * section is the exception, because the portable tier styles no bare element at all.
 * Without it, taking the tokens tier into a Django template, a static page or a PDF gives
 * a white page with black text and a pile of unused custom properties, and every consumer
 * writes the same four lines to fix it.
 *
 * Minimal on purpose. This is not a reset library: border-box because it is the one line
 * everyone writes, and the body defaults because the substrate is useless without them.
 * Layered like the rest, so a consumer's own body rule wins without a specificity fight.
 *
 * The two text roles are named after the tokens they read rather than shortened to
 * something like `.text-muted`, so the class name states which role it paints.
 */
function buildSectionDocumentBase() {
  return `/* === Document Base === */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: var(--surface);
  color: var(--on-surface);
  font-family: var(--type-body-md-family);
  font-size: var(--type-body-md-size);
  line-height: var(--type-body-md-line);
}

/* === Form Controls === */
/* A <button> keeps the UA's border and its own font family unless something clears them,
   so .button.treat-filled renders framed and .treat-ghost renders as an outline, which is
   the opposite of ghost. Nothing in the class layer sets a border on a button:
   .treat-outline does, which is the only reason that one looks right.

   In loom.base on purpose, so a treatment in loom.components that does want a border
   still wins. Buttons only — this is a normalization of the chrome that was showing
   through, not a reset library. */
button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}

button,
[type='button'],
[type='reset'],
[type='submit'] {
  appearance: none;
  background-color: transparent;
  background-image: none;
  border: 0;
}

/* === Focus === */
/* The ring belongs to the element, not to a class. It was gated on .control — the
   form-state class — so a button written \`class="button interactive"\` took no ring at
   all, and neither did a link, a <summary>, or a scroll container the browser has made
   keyboard-focusable. A whole app shipped with a ring on nothing, by an author who had
   loom.css open and picked .interactive deliberately for the press treatment. Lint
   passed, the build passed, and with a mouse it looks correct. When the reader of the
   source misses it, the API is wrong rather than the reader.

   :where() contributes nothing, so the whole selector weighs only what :focus-visible
   does — one pseudo-class. Any single class beats it and a layered or unlayered consumer
   rule displaces it as a normal rule rather than a specificity fight. In loom.base for
   the reason the form-control normalization is: loom.components should be able to restyle
   a ring, not have to outrank one. */
:where(
  a[href],
  button,
  input,
  select,
  textarea,
  summary,
  [tabindex]:not([tabindex="-1"])
):focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* === Selection and scrollbars === */
/* Token-driven appearance, so they belong in the substrate rather than in an app's own
   stylesheet. No body rule beside them: loom.base already sets the same three
   declarations, down to the value, since --type-body-md-family resolves to
   var(--font-body).

   The standard properties are declared alongside the -webkit- ones rather than instead of
   them. ::-webkit-scrollbar is Chrome and Safari only, so on its own this was a substrate
   whose scrollbars ignored the brand in Firefox; scrollbar-color covers that. Both read the
   same two tokens, so the two spellings cannot disagree. */
::selection {
  background: var(--primary-container);
  color: var(--on-primary-container);
}

* {
  scrollbar-color: var(--on-surface-variant) transparent;
  scrollbar-width: thin;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--on-surface-variant);
  border-radius: var(--br-999);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--on-surface);
}

/* === Text Colour Roles === */
.text-on-surface {
  color: var(--on-surface);
}

.text-on-surface-variant {
  color: var(--on-surface-variant);
}

/* Tabular figures, wherever numbers line up in a column: a table, a totals block, a
   statement. Alignment is deliberately not here — outside a table the layout decides,
   and inside one .table right-aligns it, which is the convention money follows. */
.numeric {
  font-variant-numeric: tabular-nums;
}`;
}

function buildSection17_SurfacesTableLink() {
  // Surface level and elevation are independent axes, not one scale. The catalog proves
  // it: bg-surface-1 pairs with shadow-1, shadow-2 and shadow-3 in different atoms, so a
  // class bundling them would be wrong two times in three. Same orthogonality as tone and
  // treatment — one class says which plane, the other says how far off it.
  // `.surface` is the base plane and had no class while 1, 2 and 3 did — an incomplete
  // ladder that every consumer closed by hand (paperboy reaches for bg-surface 24 times).
  const surfaces = ['.surface {\n  background-color: var(--surface);\n}\n']
    .concat([1, 2, 3].map((n) => `.surface-${n} {\n  background-color: var(--surface-${n});\n}\n`))
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
  transition: background-color var(--transition) var(--easing);
}

/* The column modifier. .numeric gives tabular figures anywhere; a table also right-aligns
   them, because that is where a column of money has to line up on its last digit. Written
   by hand twice before it was a class — in jmi-finance's call sites and again in the first
   invoice built on the substrate. */
.table :is(th, td).numeric {
  text-align: right;
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
  transition-duration: var(--transition);
  transition-timing-function: var(--easing);
}

.control[aria-invalid="true"] {
  --tone-border: var(--error);
  --tone-text: var(--error);
}

/* The validity colour only. The baseline ring is on the element in loom.base, so this
   recolours a ring that is already there rather than declaring a second copy of one that
   could drift from it. Nothing focusable reaches .control without matching that rule:
   every atom and every headless primitive that takes it renders a button, an input or
   something carrying tabindex. */
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
    // Both stay at base intensity across solid and soft: an outline treatment draws the
    // same brand line and reads the same label whether its fill is solid or soft. That
    // was the whole justification for --tone-text too, and it was a statement about
    // intensity rather than about legibility — which is what the property actually
    // decides. The label now reads the family's text role, resolved per mode against the
    // most raised surface tier; see the third pass in generate-colors.js.
    //
    // --tone-border reads its own role too, resolved at 3:1 rather than 4.5:1 —
    // WCAG 1.4.11 puts a non-text boundary there. It used to read the base role, on the
    // reasoning that the brand line is most of what an outline treatment is for. That
    // reasoning survives the change: resolving at 3:1 leaves ten of twelve family/mode
    // pairs on exactly the shade they already had, and moves the other two by one ramp
    // step — and those two were the ones failing. Measured, not assumed.
    const edge = f === 'neutral'
      ? ['  --tone-text: var(--on-surface);', '  --tone-border: var(--outline);']
      : [`  --tone-text: var(--${f}-text);`, `  --tone-border: var(--${f}-border);`];
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

  // Every tone property is read through a fallback, so a treatment used without a tone
  // renders a neutral version of itself instead of nothing. It was the other way round,
  // and the two halves failed differently and both invisibly: a tone alone set four
  // custom properties nobody read, and a treatment alone referenced undefined ones, which
  // makes the declaration invalid at computed-value time — so the whole declaration is
  // dropped rather than falling back. `treat-outline` alone drew no border at all.
  //
  // The evidence this comes from is one author, in one edit: they diagnosed the
  // tone/treatment split correctly, wrote a source comment explaining it, fixed a badge
  // to `badge tone-primary treat-filled`, and in the same edit wrote three buttons as
  // `treat-outline` with no tone. An API that catches its reader immediately after they
  // have understood it is not being misread.
  //
  // This is already the house pattern — `.input` and `.textarea` both read
  // `var(--tone-border, var(--outline))`. The treatments were the outliers.
  lines.push('/* === Treatments === */');
  lines.push(
    '.treat-filled {',
    '  background-color: var(--tone-bg, var(--surface-2));',
    '  color: var(--tone-fg, var(--on-surface));',
    '}',
    ''
  );
  lines.push(
    '.treat-outline {',
    '  background-color: transparent;',
    '  border: var(--bw-1) solid var(--tone-border, var(--outline));',
    '  color: var(--tone-text, var(--on-surface));',
    '}',
    ''
  );
  lines.push('.treat-ghost {', '  background-color: transparent;', '  color: var(--tone-text, currentColor);', '}', '');

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
  transition-duration: var(--transition);
  transition-timing-function: var(--easing);
}

.interactive::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transition: opacity var(--transition) var(--easing);
  pointer-events: none;
  z-index: -1;
}

/* [data-highlighted] rides the same overlay as hover. It is the convention headless
   libraries use to mark the keyboard-focused row of a listbox or menu, so without it a
   list built on .interactive answers the mouse and looks dead to the arrow keys. Not a
   Radix coupling: the attribute is the shared spelling, not one library's. */
.interactive:hover::after,
.interactive[data-highlighted]::after {
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

function buildSection14_Animations() {
  return `/* === Animation Keyframes === */
/* One keyframe, consumed by .spinner. Everything else the class layer animates is a
   transition rather than an animation — including a <dialog> on open, which is opacity
   and scale on the panel plus a fading \`::backdrop\`, all on \`--transition\` so reduced
   motion is handled for free. */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`;
}

// --- Assembly ---
// Three files, all plain CSS, running wherever CSS runs — a Vite app, a Django template,
// headless Chrome printing an invoice. Nothing here is framework-bound.
//
// Everything Loom emits sits in a Loom-owned cascade layer, so a consumer's own CSS wins
// by default: unlayered rules outrank every layer regardless of specificity, and that is
// the override story. Two blocks stay deliberately unlayered — see LAYER_ORDER.
const FILES = ['tokens.css', 'loom.css', 'loom.components.css', 'main.css'];

// The layer contract. Order is low-to-high precedence, so `loom.components` beats
// `loom.base`, and a consumer's unlayered rule beats all of it.
//
// `loom.reset` is declared and never written to. It is a slot: a consumer's reset goes
// there and is then guaranteed to lose to the class layer. Without it, an unlayered reset
// silently outranks every rule Loom ships — the failure recorded in docs/gotchas.md.
//
// This statement is documentation, not the mechanism. Minifiers drop an @layer statement
// as redundant, after which precedence falls back to first-appearance order — which is
// why the import order of the files below reproduces this order on its own.
const LAYER_ORDER = `/* Cascade layers, low to high. Your own unlayered CSS beats all of them.
 * Put your reset in @layer loom.reset and import it before tokens.css. */
@layer loom.reset, loom.tokens, loom.base, loom.components;`;

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

/**
 * The whole reduced-motion answer, because every transition the layer emits reads
 * `--transition` and nothing else. One property to redefine, no per-class branches.
 *
 * `0.01ms` rather than `0s` so `transitionend` still fires — nothing in the catalog
 * waits on it today, and a value that quietly stops firing events is a trap to leave
 * for later.
 *
 * `.spinner` is deliberately unaffected: it animates on `spin`, not on `--transition`.
 * An indeterminate progress indicator is essential motion — frozen, it reads as a hung
 * app rather than a calm one, which is the worse outcome.
 *
 * Unlayered, next to the print block and for the same reason: an environmental override
 * should not sit in a layer a consumer's plain `:root` outranks. A consumer who sets
 * their own duration after this still wins on source order, which is the right boundary
 * — they have taken the decision, and its consequences, back.
 */
function buildSectionReducedMotion() {
  return `@media (prefers-reduced-motion: reduce) {
  :root {
    --transition: 0.01ms;
  }
}`;
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
    header('tokens.css', `Design token values in \`@layer loom.tokens\`. Default mode: ${defaultMode}; \`[data-theme="${altMode}"]\` overrides the color roles. Declares the layer order for every Loom file, so import this one first. Plain CSS.`),
    '',
    LAYER_ORDER,
    '',
    `@layer loom.tokens {\n${indent([
      `:root {\n${indent(rootSections.flat())}\n}`,
      '',
      buildSection9_AltMode(altMode),
    ].join('\n').split('\n'))}\n}`,
    '',
    buildSectionPrintRoles(),
    '',
    buildSectionReducedMotion(),
    ''
  ].join('\n');
}

/**
 * The class layer: document base, type ramp, interactive states, keyframes.
 *
 * Two layers, because the two halves want different precedence. `loom.base` touches bare
 * elements — box-sizing and the body defaults — and must lose to everything. Anything a
 * consumer composes with goes in `loom.components`.
 *
 * That split is free: every base rule selects an element and every class rule a class, so
 * specificity already ordered them this way when both sat in one layer. Naming the layers
 * makes the order explicit instead of incidental, and gives a consumer somewhere to aim.
 *
 * Keyframes stay outside the layers — `@keyframes` is not a style rule and cascade layers
 * do not apply to it; wrapping it changes nothing and reads as though it might.
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
    header('loom.css', 'The class layer — the document base in `@layer loom.base`, then the type ramp, tones, treatments and control states in `@layer loom.components`, plus keyframes. Reads the custom properties from tokens.css, which must load first. Plain CSS.'),
    '',
    `@layer loom.base {\n${indent(buildSectionDocumentBase().split('\n'))}\n}`,
    '',
    `@layer loom.components {\n${indent(layered.split('\n'))}\n}`,
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
/**
 * Dialog's parts — hand-written, because none of them ramp on a tier.
 *
 * `.dialog` itself is schema-driven and carries appearance only. Placement is split out
 * into `.dialog-fixed` so one class serves two ways of opening a modal: a native
 * `<dialog>` opened with `showModal()` is centred and layered by the UA, and adding
 * placement on top of that fights it; a hand-rolled portal or a Radix `Content` is a
 * plain div that has to be told.
 *
 * The overlay is styled twice for the same reason. `.dialog-overlay` is the element a
 * portal renders; `::backdrop` is the pseudo the UA renders for a native dialog, and it
 * cannot be reached by a class because it is not in the tree.
 *
 * The parts carry type roles rather than inheriting: `.dialog-title` read `text-title-md`
 * in the atom and `.dialog-description` read `text-body-sm text-on-surface-variant`, both
 * bridge utilities that resolve to nothing now. Naming them here is what makes the
 * README's claim true — appearance in the class layer, behavior in the atom.
 */
/**
 * The target floor: if it is interactive and the pointer is coarse, it is 44px.
 *
 * `--touch-min` is what standards.json declares, and it is the WCAG 2.2 AAA figure
 * (2.5.5) rather than the AA one — AA asks 24x24 (2.5.8). Apple's HIG says the same 44.
 *
 * Conditioned on `pointer: coarse`, which is a reversal — this shipped unconditional, on
 * the argument that a media query lets the same build be compliant on a phone and not on
 * a laptop. What that argument missed is that the three ladders already encode the split.
 * Every tier of every role in `compact` is at or above 28px and in `standard` at or above
 * 32px, so both clear the AA minimum on their own; only `touch` reaches 44. An
 * unconditional clamp therefore imposed AAA on two ladders built to AA and overrode the
 * `controlHeight` answer, which is the mechanism a product has for stating its own input
 * context.
 *
 * The known hole, accepted deliberately rather than missed: `pointer` reports the PRIMARY
 * pointer, so a touchscreen laptop is `pointer: fine` with `any-pointer: coarse`, and a
 * finger on that screen gets the fine ladder. `any-pointer: coarse` would catch it and
 * would also resolve nearly every current laptop to 44, which takes the dense case away
 * from the hardware most likely to want it. No media query separates "can be touched"
 * from "is being touched"; a product that needs that guarantee answers `controlHeight:
 * touch` and gets 44 on every pointer.
 *
 * `height` still ramps; this clamps it. Under a coarse pointer compact's control ladder
 * renders 44/44/44 and standard's 44/44/48.
 *
 * Layered rather than unlayered, unlike the print and reduced-motion blocks: those are
 * environmental overrides a consumer should not casually beat, while a target size is a
 * decision a consumer may legitimately take back.
 */
function buildSectionTargetFloor() {
  return `/* === Target floor === */
@media (pointer: coarse) {
  .interactive,
  .control {
    min-height: var(--touch-min);
  }
}`;
}

function buildSectionDialogParts() {
  return `/* === Dialog parts === */

/* Panel-relative, so the close affordance can sit in the padding rather than the flow.
   Placement of the panel itself is .dialog-fixed, which is opt-in.

   Scoped off the native element deliberately. A UA gives dialog:modal position: fixed,
   and an author rule outranks that — so styling a real <dialog> with .dialog would stop
   it centring itself, which is the one thing taking .dialog alone is supposed to allow.
   Nothing is lost: a fixed box establishes a containing block for the close button just
   as a relative one does.

   And scoped off .dialog-fixed, which is not belt-and-braces. :not() takes the weight of
   its argument, so .dialog:not(dialog) is (0,1,1) against .dialog-fixed at (0,1,0) —
   same layer, so position: relative won and .dialog-fixed could not position anything.
   Both classes were added by the same flow, and the only element .dialog-fixed is for is
   a div, which is exactly what :not(dialog) selects.

   Found downstream: a portaled Radix dialog laid out in normal flow at the end of body
   with the overlay over the viewport, so the scrim appeared and the panel did not. Not
   caught here because docs/preview.html demonstrates the native dialog path, the one
   case the exclusion makes immune. */
.dialog:not(dialog):not(.dialog-fixed) {
  position: relative;
}

/* A closed <dialog> is hidden by the UA rule dialog:not([open]) { display: none }.
   That rule is UA-origin, and any author declaration outranks it whatever the
   specificity — so .dialog's own display: flex un-hides a dialog that is shut, and the
   panel sits in the page flow waiting to be opened twice. Restating the UA's rule as an
   author one puts it back. Specificity here is 0,2,1 against .dialog's 0,1,0, so it wins
   inside the layer without !important. */
dialog.dialog:not([open]) {
  display: none;
}

.dialog-fixed {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: var(--z-modal);
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background-color: var(--scrim);
  transition: opacity var(--transition) var(--easing);
}

dialog::backdrop {
  background-color: var(--scrim);
}

/* === Dialog entry === */

/* Entry only, and deliberately not exit.
   
   The scrim is what makes an unanimated dialog read cheap — a viewport going half-black
   between two frames — so that is what this softens. The panel comes with it because a
   scrim that fades under a panel that does not is worse than neither moving.

   Both durations are --transition, which the reduced-motion block in tokens.css already
   redefines to 0.01ms. So this honors prefers-reduced-motion for free and cannot drift
   from the rest of the system — the reason to build it out of the existing token rather
   than a duration of its own.

   EXIT IS LEFT INSTANT ON PURPOSE, AND THAT IS WHY display AND overlay ARE NOT IN THE
   TRANSITION LIST. The usual recipe includes them with allow-discrete so the element
   stays rendered while it fades out. With no exit animation to wait for, they would only
   defer display: none by the full duration and nothing would move in the meantime — the
   dialog sitting on screen after the click, then vanishing. Worse than instant, which is
   what this is meant to improve on. A native <dialog> could transition out through
   allow-discrete, but the portaled path cannot: Radix removes the node on close,
   so an exit transition has to select on its data-state="closed" attribute — a
   framework contract, in the one layer that is supposed to have none. Entry needs no such
   thing, because @starting-style applies whenever the element is inserted, which is true
   of a portal mount and a showModal() alike. A consumer who wants an exit adds their own
   selector in their own CSS, where knowing about Radix is fine.

   Degrades to exactly today's behaviour where @starting-style or allow-discrete is
   missing: no transition, nothing broken. */
dialog.dialog {
  transition:
    opacity var(--transition) var(--easing),
    transform var(--transition) var(--easing);
}

dialog.dialog[open] {
  opacity: 1;
  transform: scale(1);
}

@starting-style {
  dialog.dialog[open] {
    opacity: 0;
    transform: scale(0.97);
  }
}

dialog.dialog::backdrop {
  transition: background-color var(--transition) var(--easing);
}

@starting-style {
  dialog.dialog[open]::backdrop {
    background-color: transparent;
  }
}

/* The portaled half. .dialog-fixed already carries the centring transform, so the
   starting state has to restate it — a bare scale() here would drop the translate and
   the panel would fly in from the corner. */
.dialog-fixed {
  transition:
    opacity var(--transition) var(--easing),
    transform var(--transition) var(--easing);
}

@starting-style {
  .dialog-fixed {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.97);
  }

  .dialog-overlay {
    opacity: 0;
  }
}

.dialog-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.dialog-title {
  font-family: var(--type-title-md-family);
  font-size: var(--type-title-md-size);
  line-height: var(--type-title-md-line);
  font-weight: var(--type-title-md-weight);
  letter-spacing: var(--type-title-md-tracking);
}

.dialog-description {
  font-family: var(--type-body-sm-family);
  font-size: var(--type-body-sm-size);
  line-height: var(--type-body-sm-line);
  font-weight: var(--type-body-sm-weight);
  letter-spacing: var(--type-body-sm-tracking);
  color: var(--on-surface-variant);
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.dialog-close {
  position: absolute;
  right: var(--space-4);
  top: var(--space-4);
}`;
}

function generateComponents() {
  const layered = [
    buildSectionTable(),
    '',
    buildSectionComponentClasses(),
    '',
    buildSectionDialogParts(),
    '',
    buildSectionTargetFloor(),
  ].join('\n');

  return [
    header('loom.components.css', 'Named component classes in `@layer loom.components` — shape only; compose with the tones, treatments and control states in loom.css, which must load first.'),
    '',
    `@layer loom.components {\n${indent(layered.split('\n'))}\n}`,
    ''
  ].join('\n');
}

/** @returns {{'tokens.css': string, 'loom.css': string, 'loom.components.css': string}} */
/**
 * main.css — one import instead of three, in the order the cascade needs.
 *
 * The order is the mechanism, not the decoration. `@layer` is declared in tokens.css and
 * a minifier is entitled to drop that statement as redundant, after which precedence
 * falls back to first-appearance — which these imports reproduce exactly. So the file
 * works minified and unminified, and a consumer who imports the three directly gets the
 * same result as long as they keep this order.
 *
 * `@import` is serial and render-blocking without a bundler, which is three requests
 * rather than one. That is the cost of the convenience and it is why the three files stay
 * importable on their own: a consumer who owns their components skips
 * loom.components.css, and one who bundles pays nothing either way.
 *
 * Deliberately not a fourth copy of the CSS. It is three lines and no rules, so nothing
 * here can drift from what it imports.
 */
function generateMain() {
  return [
    header('main.css', 'The index stylesheet — imports the three in load-bearing order. Import this, or the three directly in this order. Plain CSS.'),
    '',
    "@import url('tokens.css');",
    "@import url('loom.css');",
    "@import url('loom.components.css');",
    '',
  ].join(String.fromCharCode(10));
}

function generate() {
  return {
    'tokens.css': generateTokens(),
    'loom.css': generateLayer(),
    'loom.components.css': generateComponents(),
    'main.css': generateMain(),
  };
}

/**
 * Every class name the stylesheets emit, as one set — the thing an atom is allowed to name.
 *
 * Recovered by parsing this run's own output rather than assembled from the pieces that
 * produce it, because the pieces do not enumerate. Three mechanisms mint a class here: a
 * loop over data (`.tone-*` per colour family, `.text-*` per type role), a shared constant
 * (TREATMENT_CLASSES, ICON_SLOT_CLASS), and hand-written CSS inside a template literal
 * (`.interactive`, `.control`, `.surface-N`, the dialog parts). Only the first enumerates
 * for free, and no rearrangement of componentPlan(), BASE_RULES or APPEARANCE_ONLY reaches
 * the other two — componentPlan() covers about twenty of the eighty-eight.
 *
 * So this is the same postcss scan atom-class-coverage was doing after the fact, moved to
 * before it. The technique is not the difference; the timing and the input are. It reads
 * the strings this process just built, in memory, so the set is exact by construction
 * rather than by agreement with a file on disk. Nothing is written, nothing has to run
 * first, and `--only components` keeps working standalone.
 *
 * Reads all four files rather than the two that carry classes today, so a class appearing
 * somewhere new cannot fall outside the set silently.
 */
let _classManifest = null;

function classManifest() {
  if (_classManifest) return _classManifest;
  const postcss = require('postcss');
  const names = new Set();
  for (const css of Object.values(generate())) {
    postcss.parse(css).walkRules((rule) => {
      for (const m of rule.selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) names.add(m[1]);
    });
  }
  _classManifest = names;
  return names;
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

module.exports = { generate, generateTokens, generateLayer, generateComponents, generateMain, FILES, componentPlan, classManifest, APPEARANCE_ONLY, BASE_RULES, NO_BOX, SELF_PROPS, SUB_PART_RULES };
