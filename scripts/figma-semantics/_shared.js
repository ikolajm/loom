// =============================================================================
// Shared Utilities for Figma Semantic Variable Generation
// =============================================================================
// NOT runtime-imported — inlined at the top of each script.
// Semantic variables ALIAS primitive variables. The key operation is:
//   semanticVar.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: primitiveVar.id })
// =============================================================================

/**
 * Build a lookup map from variable name → variable object for a given collection.
 */
function buildLookup(collectionName) {
  const collections = figma.variables.getLocalVariableCollections();
  const col = collections.find(c => c.name === collectionName);
  if (!col) throw new Error(`Collection "${collectionName}" not found. Run primitive scripts first.`);
  const lookup = {};
  for (const varId of col.variableIds) {
    const v = figma.variables.getVariableById(varId);
    lookup[v.name] = v;
  }
  return lookup;
}

/**
 * Create a semantic variable that aliases a primitive variable.
 */
function createAlias(collection, name, type, modeId, primitiveVar, scopes, codeSyntax) {
  const v = figma.variables.createVariable(name, collection, type);
  v.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: primitiveVar.id });
  v.scopes = scopes;
  if (codeSyntax) v.setVariableCodeSyntax("WEB", codeSyntax);
  return v;
}

/**
 * Create a semantic variable with a direct value (not aliased).
 * Used for values that don't map to primitives (e.g., #FFFFFF, rgba, max-width).
 */
function createDirect(collection, name, type, value, modeId, scopes, codeSyntax) {
  const v = figma.variables.createVariable(name, collection, type);
  v.setValueForMode(modeId, value);
  v.scopes = scopes;
  if (codeSyntax) v.setVariableCodeSyntax("WEB", codeSyntax);
  return v;
}

/**
 * Convert hex to Figma color (for direct color values like #FFFFFF).
 */
function hexToFigmaColor(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
  };
}

/**
 * Parse rgba() string to Figma color object.
 */
function rgbaToFigmaColor(rgba) {
  const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*(\d*\.?\d+)?\s*\)/);
  if (!match) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: parseInt(match[1]) / 255,
    g: parseInt(match[2]) / 255,
    b: parseInt(match[3]) / 255,
    a: match[4] !== undefined ? parseFloat(match[4]) : 1
  };
}
