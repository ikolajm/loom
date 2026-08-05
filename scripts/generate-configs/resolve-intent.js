/**
 * Tier 1 → Tier 2 resolution.
 *
 * `spec/direction-mappings.json` carries two intent blocks — `product-type` (ten
 * archetypes) and `style-direction` (ten styles) — each supplying Tier 2 values.
 * Nothing consumed them: answering `productType: "dashboard"` changed no token.
 * This fills the Tier 2 keys an answers file leaves absent.
 *
 * Precedence, general to specific — the more specific source wins:
 *
 *   productType  <  styleDirection  <  hand-written answer
 *
 * The two blocks genuinely conflict (`dashboard` says `type-scale: compact`, its own
 * first style-suggestion `clean` says `standard`), which is why the order is stated
 * rather than left to whichever object is merged last. An explicitly written value is
 * never overridden.
 *
 * Callers must resolve BEFORE handing answers to a generator. Two do: the `npm run
 * configs` entry point, and `verify.js`'s base-config-provenance check, which
 * regenerates the committed configs in memory from `answers.example.json`. Those two
 * paths must resolve identically or the check fails on a leak that isn't there.
 */

// Tier 2 keys this resolves, in answers-file casing, mapped to their key in the
// mapping blocks (which are kebab). Anything outside this set — colors, fonts,
// defaultMode — is not archetype-derivable and passes through untouched.
const TIER2_KEYS = {
  edges: 'edges',
  density: 'density',
  shadowDepth: 'shadow-depth',
  typeScale: 'type-scale',
};

// The fallback layer, applied last and recorded as such. These were previously
// inlined at the CLI-flag parse (`args.edges || 'sharp'`), which made every flagless
// run look like an explicit answer — the archetype could never win.
const DEFAULTS = {
  edges: 'sharp',
  density: 'comfortable',
  shadowDepth: 'elevated',
  typeScale: 'standard',
};

// A valid answer that maps to no archetype: the questionnaire offers it for products
// that fit none of the ten. It supplies nothing and must not fail validation.
const NO_ARCHETYPE = 'other';

const named = (block) => Object.keys(block).filter((k) => !k.startsWith('$'));

function lookup(block, value, field) {
  if (value == null || value === NO_ARCHETYPE) return null;
  if (!Object.prototype.hasOwnProperty.call(block, value) || value.startsWith('$')) {
    throw new Error(
      `Unknown ${field}: "${value}". Valid: ${named(block).join(', ')}` +
        (field === 'productType' ? `, ${NO_ARCHETYPE}` : '')
    );
  }
  return block[value];
}

/**
 * @returns {{answers: object, sources: object}} a copy of `answers` with every Tier 2
 * key filled, and a parallel map of where each value came from (for the run log).
 */
function resolveIntent(answers, mappings) {
  const resolved = { ...answers };
  const sources = {};

  const archetype = lookup(mappings['product-type'], answers.productType, 'productType');
  const style = lookup(mappings['style-direction'], answers.styleDirection, 'styleDirection');

  // Least specific first; each layer fills only what the layers after it left absent.
  const layers = [
    [archetype, `productType: ${answers.productType}`],
    [style, `styleDirection: ${answers.styleDirection}`],
  ];

  for (const [key, mappingKey] of Object.entries(TIER2_KEYS)) {
    if (resolved[key] != null) {
      sources[key] = 'answers file';
      continue;
    }
    for (const [source, label] of layers) {
      if (source && source[mappingKey] != null) {
        resolved[key] = source[mappingKey];
        sources[key] = label;
      }
    }
    if (resolved[key] == null) {
      resolved[key] = DEFAULTS[key];
      sources[key] = 'default';
    }
  }

  return { answers: resolved, sources };
}

/**
 * The archetype's curated atom list, or null. Seeds the starter `loom-picks.json`
 * that `init.sh` writes. Names are validated against the catalog by the
 * `archetype-picks` check in scripts/code-templates/verify.js — they went stale once
 * (four atoms absent since the v2 consolidation) and were repaired by hand.
 */
function archetypePicks(answers, mappings) {
  const archetype = lookup(mappings['product-type'], answers.productType, 'productType');
  return archetype?.components?.length ? archetype.components : null;
}

module.exports = { resolveIntent, archetypePicks, TIER2_KEYS };
