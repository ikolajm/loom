// =============================================================================
// figma.layout — Documentation-specific layout variables
// Source: config/figma/layout.json
// Architecture: config/figma/variable-collections.json → figma.layout
//
// CONFIG injected by orchestrator: layout.json content
// Colors are DIRECT hex values (hue-neutral, mode-independent).
// Spacing/radius are ALIASES to primitives.spacing and semantic.radius.
// =============================================================================

// --- Helpers ---
function buildLookup(collectionName) {
  const collections = figma.variables.getLocalVariableCollections();
  const col = collections.find(c => c.name === collectionName);
  if (!col) throw new Error(`Collection "${collectionName}" not found.`);
  const lookup = {};
  for (const varId of col.variableIds) {
    const v = figma.variables.getVariableById(varId);
    lookup[v.name] = v;
  }
  return lookup;
}
function pxToNumber(val) { if (typeof val === 'number') return val; return parseFloat(val); }
function hexToFigmaColor(hex) {
  hex = hex.replace('#', '');
  return { r: parseInt(hex.slice(0, 2), 16) / 255, g: parseInt(hex.slice(2, 4), 16) / 255, b: parseInt(hex.slice(4, 6), 16) / 255, a: 1 };
}

// --- Pipeline ---
const primSpacing = buildLookup("primitives.spacing");
const semanticRadius = buildLookup("semantic.radius");

const collection = figma.variables.createVariableCollection("figma.layout");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
const COLOR_SCOPES = ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];

// --- COLOR variables (direct hex, not aliased) ---

// Frame colors
const directColors = {
  "layout/frame-background": CONFIG.frame.background,
  "layout/page-foreground": CONFIG.frame.foreground,
  "layout/page-foreground-muted": CONFIG.frame["foreground-muted"]
};

// Surface elevations
if (CONFIG.surface) {
  for (const [key, hex] of Object.entries(CONFIG.surface)) {
    if (key.startsWith("$")) continue;
    directColors[`layout/${key}`] = hex;
  }
}

// Outline
if (CONFIG.outline) {
  for (const [key, hex] of Object.entries(CONFIG.outline)) {
    directColors[`layout/outline${key === "default" ? "" : `-${key}`}`] = hex;
  }
}

// Accent
if (CONFIG.accent) {
  for (const [key, hex] of Object.entries(CONFIG.accent)) {
    if (key.startsWith("$")) continue;
    directColors[`layout/${key === "color" ? "accent" : `on-accent`}`] = hex;
  }
}

for (const [name, hex] of Object.entries(directColors)) {
  const v = figma.variables.createVariable(name, collection, "COLOR");
  v.setValueForMode(modeId, hexToFigmaColor(hex));
  v.scopes = COLOR_SCOPES;
  count++;
}

// --- FLOAT spacing variables (aliased to primitives.spacing) ---
const FLOAT_SCOPES = ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"];

for (const [prop, value] of Object.entries(CONFIG.spacing)) {
  if (prop.startsWith("$")) continue;
  const name = `layout/spacing/${prop}`;
  const v = figma.variables.createVariable(name, collection, "FLOAT");
  v.scopes = FLOAT_SCOPES;
  if (typeof value === 'string' && value.startsWith('{scale.')) {
    const step = value.match(/\{scale\.(\d+)\}/)[1];
    const primVar = primSpacing[`spacing/${step}`];
    if (primVar) v.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: primVar.id });
  } else {
    v.setValueForMode(modeId, pxToNumber(value));
  }
  count++;
}

// Frame padding
const paddingStep = CONFIG.frame.padding.match(/\{scale\.(\d+)\}/)?.[1];
if (paddingStep) {
  const v = figma.variables.createVariable("layout/frame-padding", collection, "FLOAT");
  v.scopes = FLOAT_SCOPES;
  const primVar = primSpacing[`spacing/${paddingStep}`];
  if (primVar) v.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: primVar.id });
  count++;
}

// Frame radius
const radiusVar = semanticRadius[CONFIG.frame.radius];
if (radiusVar) {
  const v = figma.variables.createVariable("layout/frame-radius", collection, "FLOAT");
  v.scopes = ["CORNER_RADIUS"];
  v.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: radiusVar.id });
  count++;
}

return `figma.layout: ${count} variables created`;
