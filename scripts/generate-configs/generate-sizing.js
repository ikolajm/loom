/**
 * Generate sizing.json from questionnaire inputs.
 *
 * Input: { edges: "none" | "sharp" | "soft", controlHeight: "compact" | "standard" | "touch" }
 * Output: sizing.json matching Phase 1 locked structure (flat, semantic mappings only)
 *
 * Primitives (br-*, bw-*, icon-*, ch-*) live in standards.json — not duplicated here.
 * Lookup source: direction-mappings.json → edges, control-height
 */

function generate(answers, standards, mappings) {
  const edges = answers.edges || 'sharp';
  const edgesMapping = mappings.edges[edges];

  if (!edgesMapping) {
    throw new Error(`Unknown edges: "${edges}". Valid: none, sharp, soft`);
  }

  const controlHeight = answers.controlHeight || 'standard';
  const heightMapping = mappings['control-height'][controlHeight];

  if (!heightMapping || controlHeight.startsWith('$')) {
    const valid = Object.keys(mappings['control-height']).filter((k) => !k.startsWith('$'));
    throw new Error(`Unknown controlHeight: "${controlHeight}". Valid: ${valid.join(', ')}`);
  }

  return {
    $note: `Semantic sizing mappings only. Primitives live in config/standards.json → sizing. All values reference standard primitive tokens. Component heights resolve through semantic roles (component-height/<role>/<tier>) — atoms name a role, controlHeight picks the ladder.`,

    "border-radius": edgesMapping['semantic-radius'],
    "component-height": heightMapping['semantic-height']
  };
}

module.exports = { generate };
