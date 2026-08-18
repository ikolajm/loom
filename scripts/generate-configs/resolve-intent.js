/**
 * Tier 1 → Tier 2 resolution.
 *
 * `spec/direction-mappings.json` carries one intent block — `style-direction` — which
 * supplies Tier 2 values an answers file leaves absent.
 *
 * Precedence, general to specific — the more specific source wins:
 *
 *   styleDirection  <  hand-written answer
 *
 * There was a second supplier, `product-type`, filling the same fields. Two suppliers
 * for one value meant the resolved scale could not be stated without running the
 * generator and reading which layer won — the blocks genuinely conflicted, `dashboard`
 * saying `type-scale: compact` against its own first style-suggestion `clean` saying
 * `standard`. It was cut for that reason, not for size. See
 * docs/decisions/2026-08-18_class-layer-is-the-deliverable.md.
 *
 * Callers must resolve BEFORE handing answers to a generator. Two do: the `npm run
 * configs` entry point, and `verify.js`'s base-config-provenance check, which
 * regenerates the committed configs in memory from `answers.example.json`. Those two
 * paths must resolve identically or the check fails on a leak that isn't there.
 */

// Tier 2 keys this resolves, in answers-file casing, mapped to their key in the
// mapping block (which is kebab). Anything outside this set — colors, fonts,
// defaultMode — is not intent-derivable and passes through untouched.
//
// `controlHeight` stays in this set but no intent layer supplies it: the
// style-direction block carries no `control-height` key, so the key resolves from the
// answers file or falls to its default. That is deliberate — height is ergonomics, not
// style. It also means nothing infers a touch floor on your behalf any more; a phone
// product must answer `controlHeight: "touch"` itself, which the questionnaire states
// at the top of the field's entry.
const TIER2_KEYS = {
  edges: 'edges',
  density: 'density',
  shadowDepth: 'shadow-depth',
  typeScale: 'type-scale',
  controlHeight: 'control-height',
};

// The fallback layer, applied last and recorded as such. These were previously
// inlined at the CLI-flag parse (`args.edges || 'sharp'`), which made every flagless
// run look like an explicit answer — intent could never win.
const DEFAULTS = {
  edges: 'sharp',
  density: 'comfortable',
  shadowDepth: 'elevated',
  typeScale: 'standard',
  controlHeight: 'standard',
};

const named = (block) => Object.keys(block).filter((k) => !k.startsWith('$'));

function lookup(block, value, field) {
  if (value == null) return null;
  if (!Object.prototype.hasOwnProperty.call(block, value) || value.startsWith('$')) {
    throw new Error(`Unknown ${field}: "${value}". Valid: ${named(block).join(', ')}`);
  }
  return block[value];
}

/**
 * @returns {{answers: object, sources: object}} a copy of `answers` with every Tier 2
 * key filled, and a parallel map of where each value came from (for the run log).
 */
// `productType` is refused rather than ignored. Ignoring it is the dangerous failure:
// the archetype used to supply controlHeight, so a file saying `consumer-mobile` would
// keep generating and quietly drop from the touch ladder to `standard` — a 40px tap
// target with no message anywhere. An unknown key that changes nothing is a typo; this
// one changed something.
function rejectRemovedKeys(answers) {
  if (answers.productType == null) return;
  throw new Error(
    'productType was removed — styleDirection is the only intent field.\n' +
      '  Delete it, and set the values it used to supply directly:\n' +
      '    density, shadowDepth, typeScale  — or let styleDirection supply them\n' +
      '    controlHeight                    — answer it; nothing infers it any more.\n' +
      '                                       Ships to a phone? Answer "touch".'
  );
}

function resolveIntent(answers, mappings) {
  rejectRemovedKeys(answers);
  const resolved = { ...answers };
  const sources = {};

  const style = lookup(mappings['style-direction'], answers.styleDirection, 'styleDirection');

  for (const [key, mappingKey] of Object.entries(TIER2_KEYS)) {
    if (resolved[key] != null) {
      sources[key] = 'answers file';
      continue;
    }
    if (style && style[mappingKey] != null) {
      resolved[key] = style[mappingKey];
      sources[key] = `styleDirection: ${answers.styleDirection}`;
      continue;
    }
    resolved[key] = DEFAULTS[key];
    sources[key] = 'default';
  }

  return { answers: resolved, sources };
}

module.exports = { resolveIntent, TIER2_KEYS };
