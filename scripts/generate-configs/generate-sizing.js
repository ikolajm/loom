/**
 * Generate sizing.json from questionnaire inputs.
 *
 * Input: { edges: "none" | "sharp" | "soft" }
 * Output: sizing.json matching Phase 1 locked structure (flat, semantic mappings only)
 *
 * Primitives (br-*, bw-*, icon-*, ch-*) live in standards.json — not duplicated here.
 * Lookup source: direction-mappings.json → edges
 */

function generate(answers, standards, mappings) {
  const edges = answers.edges || 'sharp';
  const edgesMapping = mappings.edges[edges];

  if (!edgesMapping) {
    throw new Error(`Unknown edges: "${edges}". Valid: none, sharp, soft`);
  }

  return {
    $note: `Semantic sizing mappings only. Primitives live in config/standards.json → sizing. All values reference standard primitive tokens. Component heights are consumed directly from primitives (height/ch-N) — no semantic layer.`,

    "border-radius": edgesMapping['semantic-radius']
  };
}

module.exports = { generate };
