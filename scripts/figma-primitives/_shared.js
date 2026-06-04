// =============================================================================
// Shared Utilities for Figma Primitive Variable Generation
// =============================================================================
// NOT runtime-imported — Figma Plugin API has no module system.
// This file is the canonical source. Inline these functions at the top of each
// collection script so every script is fully self-contained.
// =============================================================================

// --- Type Converters ---

/**
 * Convert hex color string to Figma RGBA object (0-1 floats).
 * Supports #RGB, #RRGGBB, #RRGGBBAA formats.
 */
function hexToFigmaColor(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

/**
 * Convert px string to number. Passthrough for bare numbers.
 * "16px" → 16, "0" → 0, 16 → 16
 */
function pxToNumber(val) {
  if (typeof val === 'number') return val;
  return parseFloat(val);
}

// --- Pipeline Helper ---

/**
 * Create a variable with full pipeline: create → set value → set scopes → set code syntax.
 *
 * @param {VariableCollection} collection - The Figma variable collection
 * @param {string} name - Variable name (slash-separated, e.g. "color/primary/500")
 * @param {string} type - Figma variable type: "COLOR", "FLOAT", or "STRING"
 * @param {*} value - The value (already converted to Figma format)
 * @param {string} modeId - The mode ID to set the value for
 * @param {string[]} scopes - Array of scope strings (e.g. ["FRAME_FILL", "SHAPE_FILL"])
 * @param {string|null} codeSyntax - CSS custom property string (e.g. "var(--color-primary-500)") or null to skip
 * @returns {Variable} The created Figma variable
 */
function createVar(collection, name, type, value, modeId, scopes, codeSyntax) {
  const v = figma.variables.createVariable(name, collection, type);
  v.setValueForMode(modeId, value);
  v.scopes = scopes;
  if (codeSyntax) v.setVariableCodeSyntax("WEB", codeSyntax);
  return v;
}
