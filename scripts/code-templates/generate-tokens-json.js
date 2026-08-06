#!/usr/bin/env node
/**
 * Generate tokens.json — the neutral, engine-agnostic token artifact.
 *
 * The sibling of generate-tokens-css.js. Where tokens.css targets the web
 * (custom properties, @theme, composite .text-* utilities, @utility spacing),
 * this emits the SAME resolved token data as plain structured JSON, so a
 * consumer without a CSS runtime — React Native / NativeWind, a native
 * Tailwind config, a Swift/Kotlin theme — reads one source instead of
 * hand-transcribing tokens.css.
 *
 * What ports is values + vocabulary, NOT components. This file is the token
 * layer only; component logic is rebuilt per platform (see the Loom README /
 * docs/design-system for that boundary).
 *
 * Reads: spec/config/base/{colors,spacing,sizing,typography,effects}.json
 *        spec/config/standards.json
 * Writes: loom/tokens.json (or --stdout / --output path)
 *
 * Values are resolved: color roles are already hex in colors.json; spacing
 * {scale.N} refs and semantic-radius token refs are resolved to px here, so
 * every value in the artifact is directly usable with no CSS var() runtime.
 */
const fs = require('fs');
const path = require('path');

// Prefers spec/config/local/ over the committed set — see scripts/config-paths.js.
const { loadConfig: load } = require('../config-paths');

const colors = load('base/colors.json');
const spacing = load('base/spacing.json');
const sizing = load('base/sizing.json');
const typography = load('base/typography.json');
const effects = load('base/effects.json');
const standards = load('standards.json');

// {scale.N} → the resolved px value (e.g. "16px"); pass non-refs through.
function resolveScale(val) {
  if (typeof val !== 'string') return val;
  const m = val.match(/^\{scale\.(\d+)\}$/);
  return m ? standards.spacing.scale[m[1]] : val;
}

// Color roles: flatten the {group}{role} nesting to a flat role→value map per
// mode. Both modes are emitted in full (every role, including -fixed keys) so a
// consumer picks a mode and gets a complete set — no alt-mode-override merge to
// replay the way the CSS does.
function buildColorRoles() {
  const out = {};
  for (const [mode, groups] of Object.entries(colors.roles)) {
    out[mode] = {};
    for (const roleMap of Object.values(groups)) {
      for (const [role, value] of Object.entries(roleMap)) {
        out[mode][role] = value;
      }
    }
  }
  return out;
}

// Type ramp as structured data: {font, weight, letterSpacing, tiers:{sm,md,lg:{size,lineHeight}}}
// per family — not composite CSS classes. Keys normalized to camelCase.
function buildTypography() {
  const styles = {};
  for (const [family, def] of Object.entries(typography.textStyles)) {
    const tiers = {};
    for (const tier of ['sm', 'md', 'lg']) {
      if (!def[tier]) continue;
      tiers[tier] = { size: def[tier].size, lineHeight: def[tier]['line-height'] };
    }
    styles[family] = {
      font: def.font, // role name ("heading"/"body") — resolve via fonts below
      weight: def.weight,
      letterSpacing: def['letter-spacing'] || '0',
      tiers,
    };
  }
  return { families: typography.families, styles };
}

// Semantic spacing categories with {scale.N} resolved to px. Shape mirrors the
// config: category → variant → { x-padding, y-padding, gap, max-width }.
function buildSemanticSpacing() {
  const out = {};
  for (const [category, variants] of Object.entries(spacing.categories)) {
    if (category.startsWith('$')) continue;
    out[category] = {};
    for (const [variant, props] of Object.entries(variants)) {
      out[category][variant] = {};
      for (const [prop, value] of Object.entries(props)) {
        out[category][variant][prop] = resolveScale(value);
      }
    }
  }
  return out;
}

// Semantic radius roles (component/card/…) resolved from their br-* token to px.
function buildSemanticRadius() {
  const out = {};
  for (const [role, token] of Object.entries(sizing['border-radius'])) {
    out[role] = standards.sizing['border-radius'][token] || token;
  }
  return out;
}

// Resolved to px, same as semantic radius: a native consumer reads values, not the
// ch-* names, which are a web-utility concern. The role names DO cross — they are the
// vocabulary half of the values-port boundary.
function buildSemanticHeight() {
  const out = {};
  for (const [role, tiers] of Object.entries(sizing['component-height'])) {
    out[role] = {};
    for (const [tier, token] of Object.entries(tiers)) {
      out[role][tier] = standards.sizing['component-height'][token] || token;
    }
  }
  return out;
}

function buildEffects() {
  const focus = standards.effects['focus-ring'];
  const easing = {};
  for (const [name, val] of Object.entries(standards.effects.easing)) {
    if (name.startsWith('$')) continue;
    easing[name] = val;
  }
  const opacity = {};
  for (const [name, val] of Object.entries(standards.effects.opacity)) {
    if (name.startsWith('$')) continue;
    opacity[name] = val;
  }
  return {
    shadow: effects.shadow,
    transition: standards.effects.transition,
    easing,
    focusRing: { width: focus.width, offset: focus.offset, color: focus.color },
    opacity,
  };
}

function generate() {
  const defaultMode = colors['default-mode'] || 'light';
  return {
    $meta: {
      artifact: 'tokens.json',
      source: 'spec/config/',
      defaultMode,
      note:
        'Neutral, engine-agnostic token data. Every value is resolved (no CSS var() indirection) for consumers without a CSS runtime — React Native / NativeWind, native Tailwind configs, etc. Values + vocabulary port; components do not. Regenerate from config — do not edit.',
    },
    fonts: typography.families,
    color: {
      palette: colors.palette,
      roles: buildColorRoles(),
    },
    typography: buildTypography(),
    spacing: {
      scale: standards.spacing.scale,
      semantic: buildSemanticSpacing(),
    },
    radius: {
      primitive: standards.sizing['border-radius'],
      semantic: buildSemanticRadius(),
    },
    borderWidth: standards.sizing['border-width'],
    iconSize: standards.sizing['icon-size'],
    componentHeight: {
      primitive: standards.sizing['component-height'],
      semantic: buildSemanticHeight(),
    },
    touchTarget: standards.sizing['touch-target'].min,
    effects: buildEffects(),
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const json = JSON.stringify(generate(), null, 2) + '\n';

  if (args.includes('--stdout')) {
    process.stdout.write(json);
  } else {
    const outputPath = args.includes('--output')
      ? args[args.indexOf('--output') + 1]
      : path.resolve(__dirname, '../../tokens.json');
    fs.writeFileSync(outputPath, json);
    console.log(`tokens.json: ${json.length} chars → ${outputPath}`);
  }
}

module.exports = { generate };
