/**
 * Color utility module for palette generation.
 * Handles hex/HSL conversion, shade generation, and complementary color derivation.
 */

// --- Hex ↔ HSL Conversion ---

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255
  };
}

function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const val = Math.round(Math.max(0, Math.min(1, n)) * 255);
    return val.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  if (s === 0) return { r: l, g: l, b: l };

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hue2rgb(p, q, h + 1/3),
    g: hue2rgb(p, q, h),
    b: hue2rgb(p, q, h - 1/3)
  };
}

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// --- Palette Generation ---

/**
 * Lightness curve for shade generation.
 * Maps shade numbers (50-900) to target lightness values.
 * Designed to produce perceptually even steps.
 */
const SHADE_LIGHTNESS = {
  50:  95,
  100: 90,
  200: 80,
  300: 65,
  400: 50,
  500: 42,
  600: 35,
  700: 28,
  800: 22,
  900: 15
};

/**
 * Generate a full 50-900 palette from a single hex color.
 * Preserves the input hue, adjusts saturation slightly per shade
 * (more saturated in mid-tones, less at extremes).
 */
function generatePalette(hex) {
  const { h, s } = hexToHsl(hex);
  const palette = {};

  for (const [shade, targetL] of Object.entries(SHADE_LIGHTNESS)) {
    // Saturation adjustment: reduce at extremes, boost in mid-tones
    let adjustedS = s;
    if (targetL > 85) adjustedS = s * 0.5;       // very light: desaturate
    else if (targetL > 70) adjustedS = s * 0.7;   // light: slightly desaturate
    else if (targetL < 20) adjustedS = s * 0.8;   // very dark: slightly desaturate

    adjustedS = Math.min(100, adjustedS);
    palette[shade] = hslToHex(h, adjustedS, targetL);
  }

  return palette;
}

/**
 * Generate MD3-style neutral palette using tone numbers.
 * Takes primary hue for subtle tinting, uses very low saturation (7%).
 */
const NEUTRAL_TONES = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 85, 90, 95];

function generateNeutralPalette(primaryHue) {
  const palette = {};
  const saturation = 7; // MD3: subtle tint from primary

  for (const tone of NEUTRAL_TONES) {
    // Tone number maps directly to lightness percentage
    palette[String(tone)] = hslToHex(primaryHue, saturation, tone);
  }

  return palette;
}

/**
 * Generate a status color palette (error/success/warning).
 * Uses a fixed hue with moderate saturation.
 */
function generateStatusPalette(hue) {
  return generatePalette(hslToHex(hue, 75, 42));
}

// --- Color Derivation ---

/**
 * Derive complementary color (opposite on color wheel).
 * Used for secondary when not provided.
 */
function deriveComplementary(hex) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex((h + 180) % 360, s * 0.85, l);
}

/**
 * Derive triadic color (120° rotation on color wheel).
 * Used for accent when not provided.
 */
function deriveTriadic(hex) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex((h + 120) % 360, s * 0.9, l);
}

module.exports = {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  generatePalette,
  generateNeutralPalette,
  generateStatusPalette,
  deriveComplementary,
  deriveTriadic
};
