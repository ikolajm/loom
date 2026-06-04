// =============================================================================
// Effect Styles — Figma shadow effect styles bound to primitives.effects variables
// Source: config/base/effects.json → shadow + shadow-properties
// Architecture: config/figma/variable-collections.json → styles.effect-styles
//
// CONFIG injected by orchestrator:
//   { shadow: { "shadow-0": "none", "shadow-1": "0 1px 2px rgba(...)", ... },
//     properties: { "1": { "offset-x": 0, "offset-y": 1, "blur": 2, "spread": 0, "alpha": 0.08 }, ... } }
//
// shadow-0 = no effects. shadow-1 through shadow-3 bind individual properties
// (offsetY, radius/blur, spread) to primitives.effects FLOAT variables.
// Shadow color is set directly — not bindable to variables (Figma limitation).
// =============================================================================

// --- Helpers ---
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

// --- Pipeline ---
const effectPrimitives = buildLookup("primitives.effects");
let count = 0;

// shadow/0 — empty effects (no shadow)
const shadow0 = figma.createEffectStyle();
shadow0.name = "shadow/0";
shadow0.effects = [];
count++;

// shadow/1 through shadow/3 — bound to primitives
for (const [level, props] of Object.entries(CONFIG.properties)) {
  const style = figma.createEffectStyle();
  style.name = `shadow/${level}`;

  // Create the base effect with direct values
  const effect = {
    type: "DROP_SHADOW",
    color: { r: 0, g: 0, b: 0, a: props.alpha },
    offset: { x: props["offset-x"], y: props["offset-y"] },
    radius: props.blur,
    spread: props.spread,
    visible: true,
    blendMode: "NORMAL"
  };

  // Bind all individual properties to primitive variables
  const boundVariables = {};
  const offsetXVar = effectPrimitives[`shadow/${level}/offset-x`];
  const offsetYVar = effectPrimitives[`shadow/${level}/offset-y`];
  const blurVar = effectPrimitives[`shadow/${level}/blur`];
  const spreadVar = effectPrimitives[`shadow/${level}/spread`];

  if (offsetXVar) boundVariables.offsetX = { type: "VARIABLE_ALIAS", id: offsetXVar.id };
  if (offsetYVar) boundVariables.offsetY = { type: "VARIABLE_ALIAS", id: offsetYVar.id };
  if (blurVar) boundVariables.radius = { type: "VARIABLE_ALIAS", id: blurVar.id };
  if (spreadVar) boundVariables.spread = { type: "VARIABLE_ALIAS", id: spreadVar.id };

  effect.boundVariables = boundVariables;

  // Must reassign the entire effects array (setBoundVariable doesn't work on effect styles)
  style.effects = [effect];
  count++;
}

return `Effect styles: ${count} created (shadow/0 through shadow/${Object.keys(CONFIG.properties).length})`;
