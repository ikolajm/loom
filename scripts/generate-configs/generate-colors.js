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
  deriveComplementary,
  deriveTriadic,
  hexToHsl
} = require('./utils/color');

const STATUS_HUES = {
  error: 0,
  success: 145,
  warning: 40,
  info: 210
};

function generate(answers, standards) {
  const primary = answers.primary;
  const secondary = answers.secondary || deriveComplementary(primary);
  const accent = answers.accent || deriveTriadic(primary);
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

  for (const [mode, modeRoles] of Object.entries(standards.colors.modes)) {
    roles[mode] = {};
    for (const [group, groupRoles] of Object.entries(modeRoles)) {
      roles[mode][group] = {};
      for (const [role, template] of Object.entries(groupRoles)) {
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

  return {
    $note: `Generated from primary: ${primary}, secondary: ${secondary}, accent: ${accent}. Neutral tinted from primary hue (${Math.round(primaryHsl.h)}°). Questionnaire is the override mechanism — change inputs and regenerate.`,
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
