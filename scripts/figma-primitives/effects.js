// =============================================================================
// primitives.effects — Shadow property primitive variables
// Source: config/base/effects.json → shadow-properties
// Architecture: config/figma/variable-collections.json → primitives.effects
//
// CONFIG injected by orchestrator:
//   { "1": { "offset-x": 0, "offset-y": 1, "blur": 2, "spread": 0, "alpha": 0.08 }, ... }
// =============================================================================

// --- Inlined from _shared.js ---
function createVar(collection, name, type, value, modeId, scopes, codeSyntax) {
  const v = figma.variables.createVariable(name, collection, type);
  v.setValueForMode(modeId, value);
  v.scopes = scopes;
  if (codeSyntax) v.setVariableCodeSyntax("WEB", codeSyntax);
  return v;
}

// --- Pipeline ---
const SCOPES = ["EFFECT_FLOAT"];
const collection = figma.variables.createVariableCollection("primitives.effects");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
for (const [level, props] of Object.entries(CONFIG)) {
  for (const [prop, value] of Object.entries(props)) {
    // Each sub-property points at the composite: CSS ships one --shadow-N string,
    // never a variable per offset, so the level is the only writable reference.
    createVar(collection, `shadow/${level}/${prop}`, "FLOAT", value, modeId, SCOPES, `var(--shadow-${level})`);
    count++;
  }
}

return `primitives.effects: ${count} variables created`;
