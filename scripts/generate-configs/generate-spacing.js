/**
 * Generate spacing.json from questionnaire inputs.
 *
 * Input: { density: "compact" | "comfortable" | "airy" }
 * Output: spacing.json matching Phase 1 locked structure (categories only)
 *
 * Scale primitives live in standards.json — not duplicated here.
 * Lookup source: direction-mappings.json → density
 */

function generate(answers, standards, mappings) {
  const density = answers.density || 'comfortable';
  const densityMapping = mappings.density[density];

  if (!densityMapping) {
    throw new Error(`Unknown density: "${density}". Valid: compact, comfortable, airy`);
  }

  return {
    $note: `Spacing categories for "${density}" density. Scale primitives live in config/standards.json → spacing.scale. All values reference {scale.N} tokens.`,
    categories: densityMapping['spacing-categories']
  };
}

module.exports = { generate };
