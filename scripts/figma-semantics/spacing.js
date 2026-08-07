// =============================================================================
// semantic.spacing — Categorical spacing values aliasing primitive spacing scale
// Source: config/base/spacing.json → categories
// Architecture: config/figma/variable-collections.json → semantic.spacing
//
// CONFIG injected by orchestrator: spacing.json categories object
// Each value is either "{scale.N}" (alias) or a direct value like "1280px"
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
function createDirect(collection, name, type, value, modeId, scopes, codeSyntax) {
  const v = figma.variables.createVariable(name, collection, type);
  v.setValueForMode(modeId, value);
  v.scopes = scopes;
  if (codeSyntax) v.setVariableCodeSyntax("WEB", codeSyntax);
  return v;
}
function pxToNumber(val) { if (typeof val === 'number') return val; return parseFloat(val); }

// --- Pipeline ---
const primitives = buildLookup("primitives.spacing");
const SCOPES = ["GAP", "WIDTH_HEIGHT"];
const collection = figma.variables.createVariableCollection("semantic.spacing");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;

// These roles have no CSS counterpart and will not get one: layout spacing is written
// as Tailwind utilities in the atoms, never as --spacing-{category}-{variant} variables.
// The utility is therefore the only writable reference. An unmapped property gets no
// code syntax rather than a fabricated one.
const UTILITY = { "x-padding": "px", "y-padding": "py", "gap": "gap", "max-width": "max-w" };

for (const [category, variants] of Object.entries(CONFIG)) {
  for (const [variant, properties] of Object.entries(variants)) {
    for (const [prop, value] of Object.entries(properties)) {
      const varName = `spacing/${category}/${variant}/${prop}`;
      const utility = UTILITY[prop] || null;

      if (typeof value === 'string' && value.startsWith('{scale.')) {
        // Alias: {scale.N} → primitives.spacing spacing/N
        const step = value.match(/\{scale\.(\d+)\}/)[1];
        const primVar = primitives[`spacing/${step}`];
        if (!primVar) throw new Error(`Primitive spacing/${step} not found for ${varName}`);
        createAlias(collection, varName, "FLOAT", modeId, primVar, SCOPES, utility ? `${utility}-${step}` : null);
      } else {
        // Direct value (e.g., max-width: "1280px") — no scale step, so an arbitrary-value utility
        createDirect(collection, varName, "FLOAT", pxToNumber(value), modeId, SCOPES, utility ? `${utility}-[${value}]` : null);
      }
      count++;
    }
  }
}

return `semantic.spacing: ${count} variables created`;
