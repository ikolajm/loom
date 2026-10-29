/**
 * Generate colors.json from questionnaire inputs.
 *
 * Input: { primary: "#hex", secondary?: "#hex", accent?: "#hex" }
 * Output: colors.json matching Phase 1 locked structure (palette + roles)
 *
 * Source of truth for role mappings: standards.json → colors.modes
 */
const {
  generatePalette,
  generateNeutralPalette,
  generateStatusPalette,
  deriveAnalogous
} = require('./utils/color');

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

  // --- Generate palettes ---
  // Every ramp places its shades by luminance (see utils/color.js), so a shade has
  // the same contrast whatever the brand. That is what lets each role in
  // standards.json name its shade outright instead of searching for one.
  const palette = {
    primary: generatePalette(primary),
    secondary: generatePalette(secondary),
    accent: generatePalette(accent),
    neutral: generateNeutralPalette(primary),
    error: generateStatusPalette(STATUS_HUES.error),
    success: generateStatusPalette(STATUS_HUES.success),
    warning: generateStatusPalette(STATUS_HUES.warning),
    info: generateStatusPalette(STATUS_HUES.info)
  };

  // --- Resolve role mappings ---
  // standards.json defines role templates as {palette.family.shade} references or
  // literal values. References resolve to hex from the generated palette.
  //
  // Any other brace template, or a reference to a shade the palette lacks, throws.
  // An unresolved template once travelled as a literal string all the way into the
  // Figma plugin console before anything complained; failing here names the role.
  const roles = {};

  for (const [mode, modeRoles] of Object.entries(standards.colors.modes)) {
    roles[mode] = {};
    for (const [group, groupRoles] of Object.entries(modeRoles)) {
      roles[mode][group] = {};
      for (const [role, template] of Object.entries(groupRoles)) {
        if (typeof template !== 'string' || !template.startsWith('{')) {
          roles[mode][group][role] = template;
          continue;
        }
        const match = template.match(/^\{palette\.(\w+)\.(\w+)\}$/);
        const hex = match && palette[match[1]]?.[match[2]];
        if (!hex) {
          throw new Error(`standards.json colors.modes.${mode}.${group}.${role}: ${template} is not a {palette.family.shade} the palette has`);
        }
        roles[mode][group][role] = hex;
      }
    }
  }

  return {
    $note: `Generated from primary: ${primary} (chosen). secondary: ${secondary} (${secondaryChosen ? 'chosen' : `DERIVED — analogous +${SECONDARY_ROTATION}° from primary, nobody picked it; set "secondary" in your answers file to choose one`}). accent: ${accent} (${accentChosen ? 'chosen' : `DERIVED — analogous +${ACCENT_ROTATION}° from primary, nobody picked it; set "accent" in your answers file to choose one`}). Neutral tinted toward the primary's hue. A derived family generates a full ramp and role set identical in structure to a chosen one, so this note is the only thing recording which is which. Questionnaire is the override mechanism — change inputs and regenerate.`,
    // Machine-readable half of the note above. The Figma pipeline reads this to put
    // a description on every derived variable, because the Figma ramp is where an
    // invented hue looks most like a decision someone made.
    $derived: { secondary: !secondaryChosen, accent: !accentChosen },

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
