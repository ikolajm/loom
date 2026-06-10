// =============================================================================
// Text Styles — Figma text styles bound to primitives.typography variables
// Source: config/base/typography.json → families + textStyles
// Architecture: config/figma/variable-collections.json → styles.text-styles
//
// CONFIG injected by orchestrator:
//   { families: { heading: "Inter", body: "Inter" },
//     textStyles: { display: { font: "heading", weight: 700, ...,
//                   sm: { size: "24px", "line-height": "32px" }, ... }, ... } }
//
// Creates one Figma text style per family × tier (e.g., "display/lg", "action/sm").
// Each binds fontSize, lineHeight, fontFamily, fontWeight to primitives.typography variables.
// Letter-spacing is set directly (not bindable in Figma).
// =============================================================================

// --- Helpers ---
function buildLookup(collectionName) {
  const collections = figma.variables.getLocalVariableCollections();
  const col = collections.find(c => c.name === collectionName);
  if (!col) throw new Error(`Collection "${collectionName}" not found. Run primitive scripts first.`);
  const lookup = {};
  for (const varId of col.variableIds) {
    const v = figma.variables.getVariableById(varId);
    lookup[v.name] = v;
  }
  return lookup;
}

function pxToNumber(val) {
  if (typeof val === 'number') return val;
  return parseFloat(val);
}

/**
 * Map numeric font weight to Figma style name for font loading.
 * Default mapping covers most Google Fonts. Only add overrides for fonts
 * with non-standard style names. Figma's loadFontAsync will throw if a
 * style name is wrong — add the font to FONT_WEIGHT_OVERRIDES when that happens.
 */
const FONT_WEIGHT_OVERRIDES = {
  "JetBrains Mono": { 600: "Medium" },
  "Inter": { 600: "Semi Bold" },
  "Cinzel": { 500: "Regular", 600: "Bold" },
};

function weightToStyleName(familyName, weight) {
  const overrides = FONT_WEIGHT_OVERRIDES[familyName];
  if (overrides && overrides[weight]) return overrides[weight];
  if (weight >= 700) return 'Bold';
  if (weight >= 600) return 'SemiBold';
  if (weight >= 500) return 'Medium';
  return 'Regular';
}

/**
 * Parse em-based letter-spacing to Figma percentage format.
 * "-0.02em" at 48px = -0.02 * 48 = -0.96px
 * Figma letterSpacing uses { value: N, unit: "PIXELS" } or { value: N, unit: "PERCENT" }
 * We'll use PERCENT since em is relative: -0.02em = -2%
 */
function parseLetterSpacing(lsValue) {
  if (!lsValue || lsValue === "0") return { value: 0, unit: "PERCENT" };
  const num = parseFloat(lsValue);
  // em → percent: -0.02em = -2%
  return { value: num * 100, unit: "PERCENT" };
}

// --- Pipeline ---
const typoPrimitives = buildLookup("primitives.typography");
const tiers = ['sm', 'md', 'lg'];

// Authoritative font-parity check + index (substitutes Inter for fonts this Figma lacks).
await reportFontParity(CONFIG.families);

// Collect unique font+weight combinations for loading
const fontsToLoad = new Set();
for (const [family, def] of Object.entries(CONFIG.textStyles)) {
  const familyName = resolveFamily(CONFIG.families[def.font]);
  const styleName = weightToStyleName(familyName, def.weight);
  fontsToLoad.add(JSON.stringify({ family: familyName, style: styleName }));
}

// Load all required fonts
for (const fontJson of fontsToLoad) {
  await figma.loadFontAsync(JSON.parse(fontJson));
}

let count = 0;

for (const [family, def] of Object.entries(CONFIG.textStyles)) {
  const familyName = resolveFamily(CONFIG.families[def.font]);
  const styleName = weightToStyleName(familyName, def.weight);

  for (const tier of tiers) {
    const tierDef = def[tier];
    if (!tierDef) continue;

    const style = figma.createTextStyle();
    style.name = `${family}/${tier}`;

    style.fontName = { family: familyName, style: styleName };
    style.fontSize = pxToNumber(tierDef.size);
    style.lineHeight = { value: pxToNumber(tierDef["line-height"]), unit: "PIXELS" };
    style.letterSpacing = { value: parseLetterSpacing(def["letter-spacing"]), unit: "PERCENT" };

    const sizeVar = typoPrimitives[`type/${family}/${tier}/size`];
    const heightVar = typoPrimitives[`type/${family}/${tier}/height`];
    const weightVar = typoPrimitives[`type/${family}/weight`];
    const familyVar = typoPrimitives[`type/family/${def.font}`];

    if (sizeVar) style.setBoundVariable("fontSize", sizeVar);
    if (heightVar) style.setBoundVariable("lineHeight", heightVar);
    if (weightVar) style.setBoundVariable("fontWeight", weightVar);
    if (familyVar) style.setBoundVariable("fontFamily", familyVar);

    count++;
  }
}

return `Text styles: ${count} created`;
