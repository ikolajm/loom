// =============================================================================
// primitives.typography — Typography property variables
// Source: config/base/typography.json → families + textStyles
// Architecture: config/figma/variable-collections.json → primitives.typography
//
// CONFIG injected by orchestrator:
//   { families: { heading: "Inter", body: "Inter" },
//     textStyles: { display: { font: "heading", weight: 700, ..., sm: {...}, md: {...}, lg: {...} }, ... } }
// =============================================================================

// --- Inlined from _shared.js ---
function pxToNumber(val) {
  if (typeof val === 'number') return val;
  return parseFloat(val);
}
function createVar(collection, name, type, value, modeId, scopes, codeSyntax) {
  const v = figma.variables.createVariable(name, collection, type);
  v.setValueForMode(modeId, value);
  v.scopes = scopes;
  if (codeSyntax) v.setVariableCodeSyntax("WEB", codeSyntax);
  return v;
}

// --- Pipeline ---
const collection = figma.variables.createVariableCollection("primitives.typography");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");
let count = 0;
const tiers = ['sm', 'md', 'lg'];

// Font families (STRING type)
for (const [role, family] of Object.entries(CONFIG.families)) {
  createVar(collection, `type/family/${role}`, "STRING", family, modeId, ["FONT_FAMILY"], `var(--font-${role})`);
  count++;
}

// Per-family, per-tier properties (FLOAT type)
for (const [family, def] of Object.entries(CONFIG.textStyles)) {
  // Family-level weight. Size, line-height and weight ship as literals inside the
  // .text-{family}-{tier} classes, not as variables, so the class is the code
  // reference for all three. Weight spans every tier of the family, hence the glob.
  createVar(collection, `type/${family}/weight`, "FLOAT", def.weight, modeId, ["FONT_WEIGHT"], `.text-${family}-*`);
  count++;

  for (const tier of tiers) {
    const tierDef = def[tier];
    if (!tierDef) continue;
    createVar(collection, `type/${family}/${tier}/size`, "FLOAT", pxToNumber(tierDef.size), modeId, ["FONT_SIZE"], `.text-${family}-${tier}`);
    createVar(collection, `type/${family}/${tier}/height`, "FLOAT", pxToNumber(tierDef["line-height"]), modeId, ["LINE_HEIGHT"], `.text-${family}-${tier}`);
    count += 2;
  }
}

return `primitives.typography: ${count} variables created`;
