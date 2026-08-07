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
 *
 * `heights` merges both height collections into one keyspace. They cannot collide:
 * primitives are named "height/N" and semantic roles "height/{role}/{tier}", and
 * resolveHeight() emits whichever form the config asked for. Builders bind to the
 * role wherever one exists, which is the point of semantic.component-height —
 * binding the primitive would put `ch-5` in the Figma inspector where the decision
 * is actually "control/md".
 */
function getAllLookups() {
  return {
    semColors: bLookup("semantic.color"),
    semRadius: bLookup("semantic.radius"),
    primSpacing: bLookup("primitives.spacing"),
    heights: Object.assign(
      bLookup("primitives.component-height"),
      bLookup("semantic.component-height")
    ),
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
