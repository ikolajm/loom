// =============================================================================
// semantic.radius — Semantic border-radius roles aliasing primitive radius values
// Source: config/base/sizing.json → border-radius
// Architecture: config/figma/variable-collections.json → semantic.radius
//
// CONFIG injected by orchestrator:
//   { "component": "br-2", "card": "br-3", "input": "br-2", "modal": "br-4", "pill": "br-999" }
// =============================================================================

// --- Inlined from _shared.js ---
function buildLookup(collectionName) {
  const collections = figma.variables.getLocalVariableCollections();
  const col = collections.find(c => c.name === collectionName);
  if (!col) throw new Error(`Collection "${collectionName}" not found. Run primitive scripts first.`);
  const lookup = {};
  for (const varId of col.variableIds) { const v = figma.variables.getVariableById(varId); lookup[v.name] = v; }
  return lookup;
}
function createAlias(collection, name, type, modeId, primitiveVar, scopes, codeSyntax) {
  const v = figma.variables.createVariable(name, collection, type);
  v.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: primitiveVar.id });
  v.scopes = scopes;
  if (codeSyntax) v.setVariableCodeSyntax("WEB", codeSyntax);
  return v;
}

// --- Pipeline ---
const primitives = buildLookup("primitives.radius");
const SCOPES = ["CORNER_RADIUS"];
const collection = figma.variables.createVariableCollection("semantic.radius");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
for (const [role, token] of Object.entries(CONFIG)) {
  // token is "br-2" → primitive variable name is "radius/2"
  const step = token.replace("br-", "");
  const primVar = primitives[`radius/${step}`];
  if (!primVar) throw new Error(`Primitive radius/${step} not found for role "${role}"`);
  createAlias(collection, `radius/${role}`, "FLOAT", modeId, primVar, SCOPES, `var(--radius-${role})`);
  count++;
}

return `semantic.radius: ${count} variables created`;
