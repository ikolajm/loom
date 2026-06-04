// =============================================================================
// primitives.border-width — Border width primitive variables
// Source: config/standards.json → sizing.border-width
// Architecture: config/figma/variable-collections.json → primitives.border-width
//
// CONFIG injected by orchestrator: { "bw-0": "0px", "bw-1": "1px", ... }
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
const SCOPES = ["STROKE_FLOAT"];
const collection = figma.variables.createVariableCollection("primitives.border-width");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
for (const [token, px] of Object.entries(CONFIG)) {
  const step = token.replace("bw-", "");
  createVar(collection, `border-width/${step}`, "FLOAT", pxToNumber(px), modeId, SCOPES, `var(--${token})`);
  count++;
}

return `primitives.border-width: ${count} variables created`;
