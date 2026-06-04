/**
 * Generate effects.json from questionnaire inputs.
 *
 * Input: { shadowDepth: "flat" | "elevated" }
 * Output: effects.json matching Phase 1 locked structure
 *
 * Lookup source: direction-mappings.json → shadow-depth
 * Transitions/easing/focus-ring are universal — live in standards.json (code-only).
 */

/**
 * Parse a CSS shadow shorthand into individual properties.
 * "0 1px 3px rgba(0, 0, 0, 0.2)" → { offset-x: 0, offset-y: 1, blur: 3, spread: 0, alpha: 0.2 }
 */
function parseShadow(shadowStr) {
  if (shadowStr === 'none') return null;

  // Take first shadow layer if comma-separated
  const firstLayer = shadowStr.split(/,(?![^(]*\))/)[0].trim();

  const match = firstLayer.match(
    /^(-?\d+(?:\.\d+)?)\s*(?:px)?\s+(-?\d+(?:\.\d+)?)\s*(?:px)?\s+(-?\d+(?:\.\d+)?)\s*(?:px)?(?:\s+(-?\d+(?:\.\d+)?)\s*(?:px)?)?\s+rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)/
  );

  if (!match) return null;

  return {
    "offset-x": parseFloat(match[1]),
    "offset-y": parseFloat(match[2]),
    "blur": parseFloat(match[3]),
    "spread": match[4] ? parseFloat(match[4]) : 0,
    "alpha": parseFloat(match[8])
  };
}

function generate(answers, standards, mappings) {
  const shadowDepth = answers.shadowDepth || 'elevated';
  const shadowMapping = mappings['shadow-depth'][shadowDepth];

  if (!shadowMapping) {
    throw new Error(`Unknown shadow-depth: "${shadowDepth}". Valid: flat, elevated`);
  }

  // Build shadow shorthand object (includes shadow-0)
  const shadow = {
    "shadow-0": "none",
    ...shadowMapping.shadow
  };

  // Decompose into properties for Figma variable binding
  // For "flat", all shadows are "none" — no properties needed
  const shadowProperties = {};
  for (const [key, value] of Object.entries(shadow)) {
    if (key === 'shadow-0') continue;
    const level = key.replace('shadow-', '');
    const parsed = parseShadow(value);
    if (parsed) {
      shadowProperties[level] = parsed;
    }
  }

  return {
    $note: `Generated from "${shadowDepth}" shadow depth. Shadow values only — transitions, easing, and focus ring are universal values in config/standards.json (code-only for transitions/easing). Tune shadow values per project in this file if needed.`,
    shadow,
    "shadow-properties": shadowProperties
  };
}

module.exports = { generate };
