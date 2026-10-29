// =============================================================================
// semantic.color — Semantic color roles, in the brand's one mode
// Source: config/standards.json → colors.modes[mode]
// Architecture: config/figma/variable-collections.json → semantic.color
//
// CONFIG injected by orchestrator:
//   { mode: "dark",
//     roles: { primary: { primary: "{palette.primary.300}", ... }, ... } }
//
// Values are either:
//   - "{palette.family.shade}" → alias to primitives.color color/family/shade
//   - "#FFFFFF" → direct hex color
//   - "rgba(0, 0, 0, 0.3)" → direct rgba color
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
function hexToFigmaColor(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return { r: parseInt(hex.slice(0, 2), 16) / 255, g: parseInt(hex.slice(2, 4), 16) / 255, b: parseInt(hex.slice(4, 6), 16) / 255, a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1 };
}
function rgbaToFigmaColor(rgba) {
  const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*(\d*\.?\d+)?\s*\)/);
  if (!match) return { r: 0, g: 0, b: 0, a: 1 };
  return { r: parseInt(match[1]) / 255, g: parseInt(match[2]) / 255, b: parseInt(match[3]) / 255, a: match[4] !== undefined ? parseFloat(match[4]) : 1 };
}

/**
 * Resolve a role value to either an alias reference or a direct Figma color.
 * Returns { alias: primitiveVar } or { direct: figmaColorObj }
 */
function resolveValue(value, primitives) {
  if (typeof value === 'string' && value.startsWith('{palette.')) {
    const match = value.match(/\{palette\.(\w+)\.(\w+)\}/);
    if (match) {
      const primName = `color/${match[1]}/${match[2]}`;
      const primVar = primitives[primName];
      if (primVar) return { alias: primVar };
      throw new Error(`Primitive ${primName} not found for value "${value}"`);
    }
  }
  if (typeof value === 'string' && value.startsWith('#')) {
    return { direct: hexToFigmaColor(value) };
  }
  if (typeof value === 'string' && value.startsWith('rgba')) {
    return { direct: rgbaToFigmaColor(value) };
  }
  throw new Error(`Cannot resolve color value: "${value}"`);
}

// --- Pipeline ---
const primitives = buildLookup("primitives.color");
const SCOPES = ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];

const collection = figma.variables.createVariableCollection("semantic.color");

// One mode, named for the brand's answer.
const modeId = collection.modes[0].modeId;
collection.renameMode(modeId, CONFIG.mode);

let count = 0;
for (const [group, roles] of Object.entries(CONFIG.roles)) {
  for (const [role, value] of Object.entries(roles)) {
    const v = figma.variables.createVariable(`color/${group}/${role}`, collection, "COLOR");
    v.scopes = SCOPES;
    v.setVariableCodeSyntax("WEB", `var(--${role})`);
    const resolved = resolveValue(value, primitives);
    if (resolved.alias) {
      v.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: resolved.alias.id });
    } else {
      v.setValueForMode(modeId, resolved.direct);
    }
    count++;
  }
}

return `semantic.color: ${count} variables created (${CONFIG.mode} mode)`;
