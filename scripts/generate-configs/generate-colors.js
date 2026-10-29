/**
 * Generate colors.json from questionnaire inputs.
 *
 * Input: { primary: "#hex", secondary?: "#hex", accent?: "#hex", defaultMode: "light" | "dark" }
 * Output: colors.json matching Phase 1 locked structure (palette + roles)
 *
 * Source of truth for role mappings: standards.json → colors.modes
 */
const {
  generatePalette,
  generateNeutralPalette,
  generateStatusPalette
} = require('./utils/color');

const STATUS_HUES = {
  error: 0,
  success: 145,
  warning: 40,
  info: 210
};

// Families that exist only when the brand answers them. An unanswered one has no ramp
// and no roles, so its tone classes are not emitted either: a family nobody picked is
// a hue that looks like a decision, and a fallback to primary would be a class claiming
// a meaning it does not carry.
const OPTIONAL_FAMILIES = ['secondary', 'accent'];

function generate(answers, standards) {
  const primary = answers.primary;
  const answered = OPTIONAL_FAMILIES.filter((f) => answers[f]);

  // --- Generate palettes ---
  // Every ramp places its shades by luminance (see utils/color.js), so a shade has
  // the same contrast whatever the brand. That is what lets each role in
  // standards.json name its shade outright instead of searching for one.
  const palette = {
    primary: generatePalette(primary),
    ...Object.fromEntries(answered.map((f) => [f, generatePalette(answers[f])])),
    neutral: generateNeutralPalette(primary),
    error: generateStatusPalette(STATUS_HUES.error),
    success: generateStatusPalette(STATUS_HUES.success),
    warning: generateStatusPalette(STATUS_HUES.warning),
    info: generateStatusPalette(STATUS_HUES.info)
  };

  // --- Resolve role mappings ---
  // standards.json defines role templates as {palette.family.shade} references or
  // literal values. References resolve to hex from the generated palette. A group named
  // for an unanswered optional family is left out whole.
  //
  // Any other brace template, or a reference to a shade the palette lacks, throws.
  // An unresolved template once travelled as a literal string all the way into the
  // Figma plugin console before anything complained; failing here names the role.
  function resolveTable(mode) {
    const table = {};
    for (const [group, groupRoles] of Object.entries(standards.colors.modes[mode])) {
      if (OPTIONAL_FAMILIES.includes(group) && !answered.includes(group)) continue;
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
    $note: [
      `Generated from primary ${primary}${answered.map((f) => `, ${f} ${answers[f]}`).join('')}.`,
      `Neutral tinted toward the primary's hue.`,
      ...OPTIONAL_FAMILIES.filter((f) => !answered.includes(f))
        .map((f) => `No ${f}: unanswered, so it has no ramp and no roles.`),
      'Questionnaire is the override mechanism — change inputs and regenerate.',
    ].join(' '),

    // The brand's one mode. Lives here, with the generated colors, because it is a
    // per-project answer: standards.json declares itself locked across projects.
    mode,
    palette,
    roles: resolveTable(mode),
    // Print always uses the light table. Browsers drop backgrounds when printing but
    // keep text colors, so a dark brand would print pale text on white paper. Carried
    // for every brand; tokens.css emits it only when it differs from `roles`.
    'print-roles': resolveTable('light')
  };
}

// The role templates for a generated colors.json: its mode's table in standards.json,
// with the groups the brand did not answer left out, as they are from its roles. Figma
// aliases these by name, so a template for an absent family would name a variable no
// stylesheet declares.
function roleTemplates(standards, colors) {
  return Object.fromEntries(
    Object.entries(standards.colors.modes[colors.mode]).filter(([group]) => group in colors.roles)
  );
}

module.exports = { generate, roleTemplates, OPTIONAL_FAMILIES };
