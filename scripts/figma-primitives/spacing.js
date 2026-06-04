// =============================================================================
// primitives.spacing — Spacing scale variables
// Source: config/standards.json → spacing.scale
// Architecture: config/figma/variable-collections.json → primitives.spacing
//
// CONFIG injected by orchestrator: { "0": "0", "1": "4px", ... }
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
const SCOPES = ["GAP", "WIDTH_HEIGHT"];
const collection = figma.variables.createVariableCollection("primitives.spacing");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
for (const [step, px] of Object.entries(CONFIG)) {
  createVar(collection, `spacing/${step}`, "FLOAT", pxToNumber(px), modeId, SCOPES, `var(--spacing-${step})`);
  count++;
}

return `primitives.spacing: ${count} variables created`;
