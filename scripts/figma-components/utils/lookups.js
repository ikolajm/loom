// =============================================================================
// Variable Lookups + Mode Override
// =============================================================================
// Builds name→variable maps for Figma variable collections.
// Used by all builders and frame constructors.
// =============================================================================

/**
 * Build a name→variable lookup map for a collection.
 */
function bLookup(collectionName) {
  const cols = figma.variables.getLocalVariableCollections();
  const col = cols.find(c => c.name === collectionName);
  if (!col) throw new Error(`Collection "${collectionName}" not found`);
  const map = {};
  for (const varId of col.variableIds) {
    const v = figma.variables.getVariableById(varId);
    map[v.name] = v;
  }
  return map;
}

/**
 * Get all variable lookups needed for component generation.
 */
function getAllLookups() {
  return {
    semColors: bLookup("semantic.color"),
    semRadius: bLookup("semantic.radius"),
    primSpacing: bLookup("primitives.spacing"),
    primHeight: bLookup("primitives.component-height"),
    primIconSize: bLookup("primitives.icon-size"),
    primBW: bLookup("primitives.border-width"),
    layoutVars: bLookup("figma.layout")
  };
}

/**
 * Set the documentation layer's default mode on a frame.
 * Reads mode name from CONFIG.defaultMode (from layout.json → default-mode).
 * Applies to semantic.color collection.
 */
function setDefaultMode(frame, modeName) {
  const cols = figma.variables.getLocalVariableCollections();
  const semColor = cols.find(c => c.name === "semantic.color");
  if (!semColor) return;
  const mode = semColor.modes.find(m => m.name === modeName);
  if (!mode) return;
  frame.setExplicitVariableModeForCollection(semColor, mode.modeId);
}
