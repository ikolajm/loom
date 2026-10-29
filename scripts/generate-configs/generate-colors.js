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
  function resolveTable(mode) {
    const table = {};
    for (const [group, groupRoles] of Object.entries(standards.colors.modes[mode])) {
      table[group] = {};
      for (const [role, template] of Object.entries(groupRoles)) {
        if (typeof template !== 'string' || !template.startsWith('{')) {
          table[group][role] = template;
          continue;
        }
        const match = template.match(/^\{palette\.(\w+)\.(\w+)\}$/);
        const hex = match && palette[match[1]]?.[match[2]];
        if (!hex) {
          throw new Error(`standards.json colors.modes.${mode}.${group}.${role}: ${template} is not a {palette.family.shade} the palette has`);
        }
        table[group][role] = hex;
      }
    }
    return table;
  }

  // One mode: the brand answers light or dark once and ships that table. standards.json
  // keeps both, so the other stays a choice a brand can make rather than a derivation.
  const mode = answers.defaultMode;
  if (!standards.colors.modes[mode]) {
    throw new Error(`defaultMode must be one of ${Object.keys(standards.colors.modes).join(', ')}; got ${JSON.stringify(mode)}`);
  }

  return {
    $note: `Generated from primary: ${primary} (chosen). secondary: ${secondary} (${secondaryChosen ? 'chosen' : `DERIVED — analogous +${SECONDARY_ROTATION}° from primary, nobody picked it; set "secondary" in your answers file to choose one`}). accent: ${accent} (${accentChosen ? 'chosen' : `DERIVED — analogous +${ACCENT_ROTATION}° from primary, nobody picked it; set "accent" in your answers file to choose one`}). Neutral tinted toward the primary's hue. A derived family generates a full ramp and role set identical in structure to a chosen one, so this note is the only thing recording which is which. Questionnaire is the override mechanism — change inputs and regenerate.`,
    // Machine-readable half of the note above. The Figma pipeline reads this to put
    // a description on every derived variable, because the Figma ramp is where an
    // invented hue looks most like a decision someone made.
    $derived: { secondary: !secondaryChosen, accent: !accentChosen },

    // The brand's one mode. Lives here, with the generated colors, because it is a
    // per-project answer: standards.json declares itself locked across projects.
    mode,
    palette,
    roles: resolveTable(mode),
    // Print always uses the light table. Browsers drop backgrounds when printing but
    // keep text colors, so a dark brand would print pale text on white paper. Carried
    // for every brand so the config's shape does not depend on the answer; tokens.css
    // emits it only when it differs from `roles`.
    'print-roles': resolveTable('light')
  };
}

module.exports = { generate };
