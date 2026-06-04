// =============================================================================
// primitives.radius — Border radius primitive variables
// Source: config/standards.json → sizing.border-radius
// Architecture: config/figma/variable-collections.json → primitives.radius
//
// CONFIG injected by orchestrator: { "br-0": "0px", "br-1": "2px", ... }
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
const SCOPES = ["CORNER_RADIUS"];
const collection = figma.variables.createVariableCollection("primitives.radius");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
for (const [token, px] of Object.entries(CONFIG)) {
  const step = token.replace("br-", "");
  createVar(collection, `radius/${step}`, "FLOAT", pxToNumber(px), modeId, SCOPES, `var(--${token})`);
  count++;
}

return `primitives.radius: ${count} variables created`;
