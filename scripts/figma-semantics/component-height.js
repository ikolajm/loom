// =============================================================================
// semantic.component-height — Control height roles aliasing primitive heights
// Source: config/base/sizing.json → component-height
// Architecture: config/figma/variable-collections.json → semantic.component-height
//
// CONFIG injected by orchestrator:
//   { "control": { "sm": "ch-3", "md": "ch-5", "lg": "ch-7" },
//     "row": { "sm": "ch-5", ... }, ... }
//
// The role ladder is what a project's `controlHeight` answer actually selects —
// compact / standard / touch resolve to different ch-* steps behind the same role
// names. Without this collection the Figma file states heights as raw primitives,
// so two projects with opposite ladders paste identical height variables and a
// designer cannot see that button/md and text-field/md are one decision.
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
const primitives = buildLookup("primitives.component-height");
const SCOPES = ["WIDTH_HEIGHT"];
const collection = figma.variables.createVariableCollection("semantic.component-height");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
for (const [role, tiers] of Object.entries(CONFIG)) {
  for (const [tier, token] of Object.entries(tiers)) {
    // token is "ch-5" → primitive variable name is "height/5"
    const step = token.replace("ch-", "");
    const primVar = primitives[`height/${step}`];
    if (!primVar) throw new Error(`Primitive height/${step} not found for role "${role}/${tier}"`);
    createAlias(collection, `height/${role}/${tier}`, "FLOAT", modeId, primVar, SCOPES, `var(--height-${role}-${tier})`);
    count++;
  }
}

return `semantic.component-height: ${count} variables created`;
