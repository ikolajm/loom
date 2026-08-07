/**
 * Generate colors.json from questionnaire inputs.
 *
 * Input: { primary: "#hex", secondary?: "#hex", accent?: "#hex" }
 * Output: colors.json matching Phase 1 locked structure (palette + roles)
 *
 * Source of truth for role mappings: standards.json → colors.modes
 */
const path = require('path');
const {
  generatePalette,
  generateNeutralPalette,
  generateStatusPalette,
  deriveAnalogous,
  hexToHsl
} = require('./utils/color');

// WCAG 2.1 AA for text. Mirrored by the `contrast` check in code-templates/verify.js,
// which is what actually fails the build — this constant only steers the pick.
const AA_TEXT = 4.5;

function srgbToLinear(channel) {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function contrastRatio(a, b) {
  const lum = (hex) => {
    const raw = hex.replace('#', '');
    const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const STATUS_HUES = {
  error: 0,
  success: 145,
  warning: 40,
  info: 210
};

function generate(answers, standards) {
  const primary = answers.primary;
  // Rotations are small and on the same side of the wheel — see deriveAnalogous.
  // Whether a value was chosen or derived is carried into $note below, because the
  // generated ramps are structurally identical either way and nothing downstream
  // can tell them apart.
  const SECONDARY_ROTATION = 30;
  const ACCENT_ROTATION = 60;
  const secondaryChosen = Boolean(answers.secondary);
  const accentChosen = Boolean(answers.accent);
  const secondary = answers.secondary || deriveAnalogous(primary, SECONDARY_ROTATION);
  const accent = answers.accent || deriveAnalogous(primary, ACCENT_ROTATION);
  const primaryHsl = hexToHsl(primary);

  // --- Generate palettes ---
  const palette = {
    primary: generatePalette(primary),
    secondary: generatePalette(secondary),
    accent: generatePalette(accent),
    neutral: generateNeutralPalette(primaryHsl.h),
    error: generateStatusPalette(STATUS_HUES.error),
    success: generateStatusPalette(STATUS_HUES.success),
    warning: generateStatusPalette(STATUS_HUES.warning),
    info: generateStatusPalette(STATUS_HUES.info)
  };

  // --- Resolve role mappings ---
  // standards.json defines role templates with {palette.family.shade} references
  // We resolve those to actual hex values from our generated palette
  const roles = {};

  // Two passes. Labels and every plain reference resolve first; {fill.*} resolves
  // second, because a fill has to read the label it will carry.
  for (const [mode, modeRoles] of Object.entries(standards.colors.modes)) {
    roles[mode] = {};
    for (const [group, groupRoles] of Object.entries(modeRoles)) {
      roles[mode][group] = {};
      for (const [role, template] of Object.entries(groupRoles)) {
        if (typeof template === 'string' && template.startsWith('{fill.')) {
          // Reserve the key so the second pass overwrites in place. Creating it there
          // instead would append it after every first-pass role and reorder the emitted
          // JSON — a 70-line diff for a handful of changed values.
          roles[mode][group][role] = null;
          continue;
        }
        if (typeof template === 'string' && template.startsWith('{palette.')) {
          // Resolve {palette.family.shade} → hex value
          const match = template.match(/\{palette\.(\w+)\.(\w+)\}/);
          if (match) {
            const [, family, shade] = match;
            roles[mode][group][role] = palette[family]?.[shade] || template;
          } else {
            roles[mode][group][role] = template;
          }
        } else {
          // Direct value (e.g., "#FFFFFF", "rgba(...)")
          roles[mode][group][role] = template;
        }
      }
    }
  }

  // Second pass: {fill.family.shade} → the nearest shade to `shade` whose contrast
  // against the role's already-resolved label clears AA.
  //
  // The discarded alternative was letting the label chase the fill per role, which
  // optimises each pair and produces a patchwork: on the default brand every light-mode
  // button
  // took a white label but dark-mode `error` alone took white while its six siblings
  // took dark, and on a teal brand light-mode `primary` flipped to dark while its
  // siblings stayed white. A row of filled buttons with one odd label out reads as a
  // bug, not as a system. Label polarity is now fixed per mode by declaration — white
  // in light, the family's dark tone in dark — and the fill moves to meet it.
  //
  // Nearest-passing rather than a fixed direction: standard ramps darken as the number
  // rises (600 → 700) while the neutral ramp lightens (60 → 70), so a hardcoded
  // direction would be wrong for one of them. If no shade clears AA the start shade is
  // kept and the `contrast` check in code-templates/verify.js fails the build loudly,
  // which is the right outcome — silently shipping an unreadable button is not.
  // Which shade each {fill.*} role actually landed on, per mode. The Figma pipeline
  // aliases semantic colours to primitive variables by name, so it needs the *resolved*
  // shade — handing it the intent shade would alias `primary/600` in Figma while code
  // shipped `primary/700`, which is the design↔code divergence this whole model exists
  // to prevent. Emitted as $fillShades and consumed by assemble-figma.js.
  const fillShades = {};

  for (const [mode, modeRoles] of Object.entries(standards.colors.modes)) {
    for (const [group, groupRoles] of Object.entries(modeRoles)) {
      for (const [role, template] of Object.entries(groupRoles)) {
        if (typeof template !== 'string' || !template.startsWith('{fill.')) continue;
        const m = template.match(/\{fill\.(\w+)\.(\w+)\}/);
        const label = roles[mode][group][`on-${role}`];
        if (!m || !palette[m[1]] || !label || !String(label).startsWith('#')) {
          roles[mode][group][role] = m ? palette[m[1]]?.[m[2]] || template : template;
          if (m) (fillShades[mode] = fillShades[mode] || {})[role] = `${m[1]}.${m[2]}`;
          continue;
        }
        const [, family, startShade] = m;
        const shades = Object.keys(palette[family]);
        const startIdx = shades.indexOf(startShade);
        const passing = shades
          .map((s, i) => ({ s, i, hex: palette[family][s] }))
          .filter((c) => contrastRatio(c.hex, label) >= AA_TEXT)
          .sort((a, b) => Math.abs(a.i - startIdx) - Math.abs(b.i - startIdx));
        const landed = passing.length ? passing[0].s : startShade;
        roles[mode][group][role] = palette[family][landed] || template;
        (fillShades[mode] = fillShades[mode] || {})[role] = `${family}.${landed}`;
      }
    }
  }


  return {
    $note: `Generated from primary: ${primary} (chosen). secondary: ${secondary} (${secondaryChosen ? 'chosen' : `DERIVED — analogous +${SECONDARY_ROTATION}° from primary, nobody picked it; set "secondary" in your answers file to choose one`}). accent: ${accent} (${accentChosen ? 'chosen' : `DERIVED — analogous +${ACCENT_ROTATION}° from primary, nobody picked it; set "accent" in your answers file to choose one`}). Neutral tinted from primary hue (${Math.round(primaryHsl.h)}°). A derived family generates a full ramp and role set identical in structure to a chosen one, so this note is the only thing recording which is which. Questionnaire is the override mechanism — change inputs and regenerate.`,
    // Machine-readable half of the note above. The Figma pipeline reads this to put
    // a description on every derived variable, because the Figma ramp is where an
    // invented hue looks most like a decision someone made.
    $derived: { secondary: !secondaryChosen, accent: !accentChosen },

    // Resolved shade per {fill.*} role, per mode — see the second pass above. The Figma
    // pipeline reads this instead of the raw templates, so its aliases point at the same
    // primitive the code shipped.
    $fillShades: fillShades,

    // Which mode loads first. Lives here, with the generated colors, because it is a
    // per-project answer: standards.json declares itself "values locked across all
    // projects, do not override per-project" and `npm run configs` used to write this
    // one key into it anyway, which is both a false header and the second of the two
    // tracked-path writes that dirtied the working tree.
    'default-mode': answers.defaultMode || 'dark',
    palette,
    roles
  };
}

module.exports = { generate };
