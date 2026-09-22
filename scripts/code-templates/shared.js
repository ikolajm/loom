/**
 * Shared config loading and the component registry.
 * Used by all code-template generators.
 */
const fs = require('fs');
const path = require('path');

// --- Config loading ---
// Prefers spec/config/local/ (your brand, git-ignored) over the committed default set.
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
  };
}

// Shared icon-slot wrapper class — the span that holds a leading/trailing/standalone icon and
// makes its svg fill the slot. Interpolated into component templates so the literal lives once.
// The icon slot sizes from the component class's --icon-size, which every size tier sets.
// It used to take a per-tier `size-icon-N` class threaded through the component, so the
// icon ladder existed twice: once in the generated CSS and once in a JS lookup table.
const ICON_SLOT_CLASS = 'icon-slot';

// --- Variant/size style builders ---

/**
 * Catalog-wide treatment vocabulary for orthogonal atoms. A treatment is a fixed consumer
 * of the tone custom properties (--tone-bg/--tone-fg for the solid fill, --tone-text and
 * --tone-border for the line and label). The tone sets those properties; the treatment
 * reads them — so treatment and tone stay independent axes with no N×M matrix.
 *
 * Both halves are plain classes emitted into loom.css by generate-tokens-css.js.
 */
const TREATMENT_CLASSES = {
  filled: 'treat-filled',
  outline: 'treat-outline',
  ghost: 'treat-ghost',
};

/**
 * Resolve a class string against the set the stylesheets actually emit. Throws on a name
 * no rule defines.
 *
 * This is the one gate that runs at the moment a name is minted rather than after the
 * artifact is on disk. It exists because a misspelled class name is absent from the CSS
 * without being malformed, so a check that runs over the finished artifact has to guess
 * whether an unknown name is a defect; here there is nothing to guess.
 *
 * Required lazily. generate-tokens-css.js does not import this module, so there is no
 * cycle, but a top-level import would force a full CSS generation at load time for every
 * consumer of shared.js — including ones that never mint a class.
 *
 * `where` is the atom, so the error names the file to open rather than the mechanism.
 */
function cls(spec, where) {
  const { classManifest } = require('./generate-tokens-css');
  const manifest = classManifest();
  const names = String(spec).split(/\s+/).filter(Boolean);
  const unknown = names.filter((n) => !manifest.has(n));
  if (unknown.length) {
    const subject = where ? `${where} names` : 'a component template names';
    throw new Error(
      `${subject} ${unknown.map((n) => `\`${n}\``).join(', ')}, which no stylesheet emits. ` +
      'An atom can only apply a class the class layer defines — emit the rule in ' +
      'generate-tokens-css.js, or fix the name.'
    );
  }
  return names.join(' ');
}

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
  // The family behind each colour, so a component with an intensity axis can build both
  // `tone-{family}` and `tone-{family}-soft` from one declaration. toneClass alone pins a
  // state to whichever intensity its `bg` token named, which is how Badge ended up
  // soft-only while Button was solid-only. null for `inherit`, which has no family.
  const toneFamily = {};
  for (const name of colorNames) {
    const c = colorsCfg[name] || {};
    if (c.bg === 'transparent' && c.fg === 'currentColor') {
      toneClass[name] = 'tone-inherit';
      toneFamily[name] = null;
      continue;
    }
    const role = String(c.bg || '').split('/').pop();
    const family = String(c.bg || '').split('/')[1];
    if (!role || !family) {
      throw new Error(`Cannot derive a tone for color "${name}": bg is "${c.bg}".`);
    }
    toneFamily[name] = family;
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
  return { colorNames, toneClass, toneFamily };
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


// --- Component registry ---

function getComponentRegistry(configs) {
  const { buttonConfig, formConfig, feedbackConfig, dataDisplayConfig, layoutConfig } = configs;
  return {
    // === Actions ===
    'Button': { generator: 'button#generateButton', source: buttonConfig, key: 'button', element: 'button', htmlType: 'ButtonHTMLAttributes<HTMLButtonElement>', textFamily: 'action', category: 'Actions' },
    // IconButton removed — use <Button variant="ghost" size="icon"> instead
    'Badge': { generator: 'badge#generateBadge', source: buttonConfig, key: 'badge', element: 'span', htmlType: 'HTMLAttributes<HTMLElement>', textFamily: 'label', category: 'Actions' },

    // === Inputs ===
    'Select': { generator: 'radix-form-controls#generateRadixSelect', source: formConfig, key: 'select', baseKey: 'text-field', element: 'select', htmlType: 'SelectHTMLAttributes<HTMLSelectElement>', noIconSlots: true, textFamily: 'input', category: 'Inputs', variantKey: 'state' },
    'Checkbox': { generator: 'toggles#generateCheckbox', source: formConfig, key: 'checkbox', baseKey: 'toggle-base', element: 'input', htmlType: 'InputHTMLAttributes<HTMLInputElement>', noIconSlots: true, noChildren: true, defaultSize: 'md', category: 'Inputs' },
    'Radio': { generator: 'toggles#generateRadio', source: formConfig, key: 'radio', baseKey: 'toggle-base', element: 'input', htmlType: 'InputHTMLAttributes<HTMLInputElement>', noIconSlots: true, noChildren: true, defaultSize: 'md', category: 'Inputs' },
    'Switch': { generator: 'toggles#generateSwitch', source: formConfig, key: 'switch', element: 'input', htmlType: 'InputHTMLAttributes<HTMLInputElement>', noIconSlots: true, noChildren: true, defaultSize: 'md', category: 'Inputs' },
    'FormField': { generator: 'form-field#generateFormField', source: formConfig, key: 'form-field', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noIconSlots: true, noChildren: true, textFamily: 'body', category: 'Inputs' },

    // === Layout ===
    'Dialog': { generator: 'radix-dialogs#generateRadixDialog', source: layoutConfig, key: 'dialog', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noChildren: true, layout: 'stack', role: 'dialog', textFamily: 'body', category: 'Layout' },

    // === Feedback ===

    // === Data Display ===

    // === Navigation ===

    // === Composite ===
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

/**
 * Emit the tone lookup a component with an `intensity` axis needs.
 *
 * `color` picks a family and `intensity` picks the suffix, so what is wanted is ONE class
 * built from two choices — `tone-error` against `tone-error-soft`. cva cannot express
 * that: each of its axes contributes its own class independently, so saying it there
 * means a compound matrix of colours times intensities. A lookup on the family is the
 * same statement without the entries, and cva keeps the treatment.
 *
 * Shared by badge and button rather than written twice. They diverged once already —
 * badge's schema declared containers and button's declared base roles, so each could
 * reach exactly one intensity and neither could reach the other's — and the fix is worth
 * only one copy.
 *
 * A colour with no family is emitted separately and ignores intensity. `inherit` is the
 * case: it paints nothing and reads currentColor, so there is no soft form to select.
 * buildColorVars marks those with `toneFamily[name] === null`. When a component has none,
 * the second map is omitted entirely, so a component that never declares such a colour
 * emits exactly what it emitted before this existed.
 */
function buildToneLookup(varName, colorNames, toneFamily, toneClass) {
  const familyColors = colorNames.filter((c) => toneFamily[c] !== null);
  const fixedColors = colorNames.filter((c) => toneFamily[c] === null);

  // Resolve every pair the atom can express, here, where the family list is still in hand.
  // The emitted TSX builds these by concatenation — `'tone-' + badgeTone[color] +
  // (intensity === 'soft' ? '-soft' : '')` — so no scan of the generated source ever sees
  // the string `tone-info-soft`, which atom-class-coverage states as its own blind spot.
  // The concatenation has exactly two shapes and both are known at this point, so the
  // whole matrix checks in four lines.
  for (const c of familyColors) {
    cls(`tone-${toneFamily[c]}`, `${varName} color "${c}"`);
    cls(`tone-${toneFamily[c]}-soft`, `${varName} color "${c}" at soft intensity`);
  }
  for (const c of fixedColors) cls(toneClass[c], `${varName} color "${c}"`);

  const familyMap =
    `// The family behind each colour; \`intensity\` picks the suffix. One declaration in the\n` +
    `// schema therefore reaches both tone classes, instead of pinning this component to\n` +
    `// whichever one its \`bg\` token happened to name.\n` +
    `const ${varName}Tone: Record<string, string> = {\n` +
    familyColors.map((c) => `  ${c}: '${toneFamily[c]}',`).join('\n') +
    `\n};`;

  if (!fixedColors.length) {
    return {
      declaration: familyMap,
      expression: (color, intensity) =>
        `'tone-' + ${varName}Tone[${color}] + (${intensity} === 'soft' ? '-soft' : '')`,
    };
  }

  const fixedMap =
    `\n\n// Colours with no family. These paint nothing and read currentColor, so they resolve to\n` +
    `// one class and ignore \`intensity\` — there is no soft form of "no colour".\n` +
    `const ${varName}ToneFixed: Record<string, string> = {\n` +
    fixedColors.map((c) => `  ${c}: '${toneClass[c]}',`).join('\n') +
    `\n};`;

  return {
    declaration: familyMap + fixedMap,
    expression: (color, intensity) =>
      `${varName}ToneFixed[${color}] ?? 'tone-' + ${varName}Tone[${color}] + ` +
      `(${intensity} === 'soft' ? '-soft' : '')`,
  };
}


module.exports = {
  expandSizeConstants,
  loadAllConfigs,
  cls,
  TREATMENT_CLASSES,
  ICON_SLOT_CLASS,
  buildColorVars,
  buildToneLookup,
  buildTypographyClasses,
  resolveBase,
  getComponentRegistry,
};
