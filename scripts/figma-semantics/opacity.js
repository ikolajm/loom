// =============================================================================
// semantic.opacity — State opacity roles
// Source: config/standards.json → effects.opacity
// Architecture: config/figma/variable-collections.json → semantic.opacity
//
// The one semantic collection that does NOT alias a primitive. Opacity has no
// underlying scale — `disabled` and `muted` are role names with nothing beneath
// them — so there is no primitives.opacity to point at, and inventing one would
// have meant calling two role names "primitives" and teaching the next reader
// that the layer names carry no information.
//
// CONFIG injected by orchestrator: { "disabled": 0.5, "muted": 0.7 }
// =============================================================================

// --- Inlined from _shared.js ---
function createDirect(collection, name, type, value, modeId, scopes, codeSyntax) {
  const v = figma.variables.createVariable(name, collection, type);
  v.setValueForMode(modeId, value);
  v.scopes = scopes;
  if (codeSyntax) v.setVariableCodeSyntax("WEB", codeSyntax);
  return v;
}

// --- Pipeline ---
const SCOPES = ["OPACITY"];
const collection = figma.variables.createVariableCollection("semantic.opacity");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
for (const [role, value] of Object.entries(CONFIG)) {
  if (role.startsWith("$")) continue;
  // Figma stores opacity as a 0-1 float, which is the form standards.json already
  // holds — no conversion, unlike every px-valued primitive collection.
  createDirect(collection, `opacity/${role}`, "FLOAT", value, modeId, SCOPES, `var(--opacity-${role})`);
  count++;
}

return `semantic.opacity: ${count} variables created`;
