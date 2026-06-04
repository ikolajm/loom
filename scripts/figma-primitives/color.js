// =============================================================================
// primitives.color — Color palette primitive variables
// Source: config/base/colors.json → palette
// Architecture: config/figma/variable-collections.json → primitives.color
//
// CONFIG injected by orchestrator: { primary: { "50": "#hex", ... }, secondary: {...}, ... }
// =============================================================================

// --- Inlined from _shared.js ---
function hexToFigmaColor(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}
function createVar(collection, name, type, value, modeId, scopes, codeSyntax) {
  const v = figma.variables.createVariable(name, collection, type);
  v.setValueForMode(modeId, value);
  v.scopes = scopes;
  if (codeSyntax) v.setVariableCodeSyntax("WEB", codeSyntax);
  return v;
}

// --- Pipeline ---
const SCOPES = ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
const collection = figma.variables.createVariableCollection("primitives.color");
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, "default");

let count = 0;
for (const [family, shades] of Object.entries(CONFIG)) {
  for (const [shade, hex] of Object.entries(shades)) {
    createVar(
      collection,
      `color/${family}/${shade}`,
      "COLOR",
      hexToFigmaColor(hex),
      modeId,
      SCOPES,
      `var(--color-${family}-${shade})`
    );
    count++;
  }
}

return `primitives.color: ${count} variables created`;
