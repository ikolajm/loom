/**
 * loom-native-preset.js — a NativeWind (Tailwind v3) preset built from tokens.json.
 *
 * This is the native half of the "values + vocabulary port; components don't"
 * boundary. It reads Loom's neutral token artifact (generated/tokens.json — run
 * `npm run generate` in the Loom repo, or copy the file in) and reproduces the
 * SAME class vocabulary Loom's web output emits — `rounded-component`, `h-ch-6`,
 * `w-icon-2`, `px-screen`, `gap-group`, `bg-primary`, `text-on-surface` — so a
 * spec ("the card is `rounded-card`, the CTA clears `h-ch-6`") reads identically
 * on web and native.
 *
 * What this does NOT do: ship components. NativeWind can't resolve the web
 * atoms' color×variant CSS-var cascade at runtime; those are rebuilt per platform
 * (an explicit compound matrix). This file is the token/vocabulary layer only.
 *
 * Usage in a consumer's tailwind.config.js:
 *
 *   const loom = require('./loom-native-preset')(require('./tokens.json'));
 *   module.exports = {
 *     content: [...],
 *     presets: [require('nativewind/preset'), loom],
 *   };
 *
 * The type ramp is data, not utilities (NativeWind has no composite .text-*):
 * feed loomTextStyles(tokens) to your <Text> component. See native/README.md.
 */

// Strip a token's family prefix ("br-4" → "4", "bw-1" → "1") to match the web
// vocabulary, where the CSS emits --radius-4 / --border-width-1 etc.
const stripPrefix = (key) => key.replace(/^[a-z]+-/, '');

/**
 * Build a NativeWind preset object from a parsed tokens.json.
 * @param {object} tokens - parsed tokens.json
 * @param {object} [opts]
 * @param {'dark'|'light'} [opts.mode] - which color-role set to bind (default: tokens.$meta.defaultMode)
 */
function loomNativePreset(tokens, opts = {}) {
  const mode = opts.mode || tokens.$meta.defaultMode;
  const roles = tokens.color.roles[mode];
  if (!roles) throw new Error(`loom-native-preset: no color roles for mode "${mode}"`);

  // Border radius: primitive br-N → "N", plus semantic role names.
  const borderRadius = {};
  for (const [token, val] of Object.entries(tokens.radius.primitive)) {
    borderRadius[stripPrefix(token)] = val;
  }
  Object.assign(borderRadius, tokens.radius.semantic); // component/card/input/modal/pill

  // Border width: bw-N → "N".
  const borderWidth = {};
  for (const [token, val] of Object.entries(tokens.borderWidth)) {
    borderWidth[stripPrefix(token)] = val;
  }

  // Component heights keep their full ch-N name (→ h-ch-6); add the touch floor.
  // Semantic roles flatten to <role>-<tier> (→ h-control-md), matching the web utility
  // names exactly — that shared vocabulary is the point of the values-port boundary,
  // and it means a screen ported from web keeps its height classes verbatim.
  const height = { ...tokens.componentHeight.primitive, touch: tokens.touchTarget };
  for (const [role, tiers] of Object.entries(tokens.componentHeight.semantic)) {
    for (const [tier, val] of Object.entries(tiers)) height[`${role}-${tier}`] = val;
  }

  // Icons are square — expose on width AND height so w-icon-2 / h-icon-2 both resolve
  // (the web output emits both via --size-icon-*).
  const width = { ...tokens.iconSize };
  Object.assign(height, tokens.iconSize);

  // `ring` is derived, not a role: the web CSS emits --ring: var(--<focus color>).
  // Resolve it from the focus-ring color *reference* so the indirection is honored
  // (freezing a literal here is the exact drift the neutral artifact exists to kill).
  const colors = { ...roles };
  const ringRef = tokens.effects.focusRing && tokens.effects.focusRing.color;
  if (ringRef && !('ring' in colors) && roles[ringRef]) colors.ring = roles[ringRef];

  return {
    theme: {
      extend: {
        colors,
        borderRadius,
        borderWidth,
        height,
        minHeight: { touch: tokens.touchTarget },
        width,
        fontFamily: {
          heading: [tokens.fonts.heading, 'system-ui', 'sans-serif'],
          body: [tokens.fonts.body, 'system-ui', 'sans-serif'],
        },
      },
    },
    plugins: [semanticSpacingPlugin(tokens)],
  };
}

// Semantic spacing → utilities. Mirrors Loom's web @utility output: `default`
// variant emits the bare name (px-group, gap-content), other variants suffix
// (px-group-compact). Emits symmetric px-/py-/mx-/my- and single-side forms so
// asymmetric cases keep the semantic name, plus gap-*.
function semanticSpacingPlugin(tokens) {
  const plugin = require('tailwindcss/plugin');
  return plugin(({ addUtilities }) => {
    const utils = {};
    for (const [category, variants] of Object.entries(tokens.spacing.semantic)) {
      for (const [variant, props] of Object.entries(variants)) {
        const name = variant === 'default' ? category : `${category}-${variant}`;
        const x = props['x-padding'];
        const y = props['y-padding'];
        const gap = props.gap;
        if (x != null) {
          utils[`.px-${name}`] = { paddingLeft: x, paddingRight: x };
          utils[`.pl-${name}`] = { paddingLeft: x };
          utils[`.pr-${name}`] = { paddingRight: x };
          utils[`.mx-${name}`] = { marginLeft: x, marginRight: x };
          utils[`.ml-${name}`] = { marginLeft: x };
          utils[`.mr-${name}`] = { marginRight: x };
        }
        if (y != null) {
          utils[`.py-${name}`] = { paddingTop: y, paddingBottom: y };
          utils[`.pt-${name}`] = { paddingTop: y };
          utils[`.pb-${name}`] = { paddingBottom: y };
          utils[`.my-${name}`] = { marginTop: y, marginBottom: y };
          utils[`.mt-${name}`] = { marginTop: y };
          utils[`.mb-${name}`] = { marginBottom: y };
        }
        if (gap != null) utils[`.gap-${name}`] = { gap };
      }
    }
    addUtilities(utils);
  });
}

/**
 * The type ramp as ready-to-spread React Native <Text> styles — one object per
 * family/tier. Kills the hand-retype of every type role into text-[Npx] bundles.
 *
 *   const T = loomTextStyles(tokens);
 *   <Text style={T.title.md}>…</Text>   // {fontSize, lineHeight, fontWeight, letterSpacing, fontFamily}
 *
 * Sizes are returned as numbers (RN wants unitless); letterSpacing in em is
 * converted against the tier size (RN letterSpacing is in px).
 */
function loomTextStyles(tokens) {
  const px = (v) => (typeof v === 'string' ? parseFloat(v) : v);
  const out = {};
  for (const [family, def] of Object.entries(tokens.typography.styles)) {
    out[family] = {};
    for (const [tier, t] of Object.entries(def.tiers)) {
      const size = px(t.size);
      let letterSpacing = 0;
      const ls = def.letterSpacing;
      if (ls && ls !== '0') {
        letterSpacing = ls.endsWith('em') ? parseFloat(ls) * size : px(ls);
      }
      out[family][tier] = {
        fontSize: size,
        lineHeight: px(t.lineHeight),
        fontWeight: String(def.weight),
        letterSpacing,
        fontFamily: tokens.fonts[def.font] || def.font,
      };
    }
  }
  return out;
}

module.exports = loomNativePreset;
module.exports.loomNativePreset = loomNativePreset;
module.exports.loomTextStyles = loomTextStyles;
