/**
 * Generate typography.json from questionnaire inputs.
 *
 * Input: { typeScale: "compact" | "standard" | "dramatic", heading?: string, body?: string }
 * Output: typography.json with text style families × size tiers
 *
 * Lookup source: direction-mappings.json → type-scale
 *   - $shared defines universal families (body, action, label, input)
 *   - Each scale defines variable families (display, title)
 *   - Output merges both into a single textStyles object
 */

function generate(answers, standards, mappings) {
  const typeScale = answers.typeScale || 'standard';
  const heading = answers.heading || 'Inter';
  const body = answers.body || 'Inter';

  const scaleMapping = mappings['type-scale'][typeScale];
  const shared = mappings['type-scale']['$shared'];

  if (!scaleMapping) {
    throw new Error(`Unknown type-scale: "${typeScale}". Valid: compact, standard, dramatic`);
  }

  // Merge scale-specific families (display, title) with universal families (body, action, label, input)
  const textStyles = {};

  // Scale-specific families first (display, title)
  for (const [name, def] of Object.entries(scaleMapping)) {
    if (name === 'source') continue;
    textStyles[name] = def;
  }

  // Universal families from $shared
  for (const [name, def] of Object.entries(shared)) {
    textStyles[name] = def;
  }

  return {
    $note: `Generated from "${typeScale}" type scale + font pairing (${heading} / ${body}). Text style families with sm/md/lg tiers. Components bind to a family; the size prop selects the tier. Change via questionnaire, not manual editing.`,

    families: { heading, body },
    textStyles
  };
}

module.exports = { generate };
