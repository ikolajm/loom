// =============================================================================
// primitives.icon-size — Icon size primitive variables
// Source: config/standards.json → sizing.icon-size
// Architecture: config/figma/variable-collections.json → primitives.icon-size
//
// CONFIG injected by orchestrator: { "icon-0": "12px", "icon-1": "16px", ... }
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
const collection = figma.variables.createVariableCollection("primitives.icon-size");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
for (const [token, px] of Object.entries(CONFIG)) {
  const step = token.replace("icon-", "");
  createVar(collection, `icon/${step}`, "FLOAT", pxToNumber(px), modeId, SCOPES, `var(--${token})`);
  count++;
}

return `primitives.icon-size: ${count} variables created`;
