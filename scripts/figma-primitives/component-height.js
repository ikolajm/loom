// =============================================================================
// primitives.component-height — Component height primitive variables
// Source: config/standards.json → sizing.component-height
// Architecture: config/figma/variable-collections.json → primitives.component-height
//
// CONFIG injected by orchestrator: { "ch-0": "20px", "ch-1": "24px", ... }
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
const SCOPES = ["WIDTH_HEIGHT"];
const collection = figma.variables.createVariableCollection("primitives.component-height");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
for (const [token, px] of Object.entries(CONFIG)) {
  const step = token.replace("ch-", "");
  createVar(collection, `height/${step}`, "FLOAT", pxToNumber(px), modeId, SCOPES, `var(--${token})`);
  count++;
}

return `primitives.component-height: ${count} variables created`;
