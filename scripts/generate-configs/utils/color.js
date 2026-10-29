/**
 * Color utility module for palette generation: hex conversion and shade generation.
 */

// --- Hex ↔ RGB, HSL → hex ---

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

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// --- Luminance and OKLCH ---
//
// Every ramp stop is placed by WCAG relative luminance, not by HSL lightness. HSL
// lightness is not perceived lightness: at the same L a yellow is several times
// brighter than a blue, so a shade number promised nothing about contrast and
// every role had to search its ramp for a passing stop. Placed by luminance, a
// shade has the same contrast against anything whatever the hue, so each role in
// standards.json names its shade outright and the contrast gates in verify.js
// check that the table holds.

const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const toGamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** @typedef {[number, number, number]} LinearRgb */

/** @returns {LinearRgb} */
function hexToLinear(hex) {
  const { r, g, b } = hexToRgb(hex);
  return [toLinear(r), toLinear(g), toLinear(b)];
}

function linearToHex([r, g, b]) {
  return rgbToHex(toGamma(r), toGamma(g), toGamma(b));
}

// OKLab matrices: Björn Ottosson, "A perceptual color space for image processing".
function linearToOklch([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { C: Math.hypot(a, bb), h: Math.atan2(bb, a) };
}

/** @returns {LinearRgb} */
function oklchToLinear(L, C, h) {
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
}

const inGamut = (rgb) => rgb.every((v) => v >= -1e-6 && v <= 1 + 1e-6);

// The most chroma sRGB can show at this lightness and hue.
function maxChroma(L, h) {
  let lo = 0, hi = 0.5;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear(L, mid, h))) lo = mid; else hi = mid;
  }
  return lo;
}

// The color at hue h whose luminance is targetY, keeping as much of the asked-for
// chroma as sRGB allows there. Clipping chroma is the cost of the method: a dark
// yellow cannot stay saturated and a light blue cannot either.
function colorAtLuminance(h, chroma, targetY) {
  let lo = 0, hi = 1, rgb;
  for (let i = 0; i < 40; i++) {
    const L = (lo + hi) / 2;
    rgb = oklchToLinear(L, Math.min(chroma, maxChroma(L, h)), h);
    if (luminance(rgb) < targetY) lo = L; else hi = L;
  }
  return linearToHex(rgb);
}

// The luminance of the grey at an HSL lightness, so shade N of any family matches
// neutral N, and the spacing of the ramp is the one Loom has always had.
const greyLuminance = (lightness) => toLinear(Math.round((lightness / 100) * 255) / 255);

// --- Palette Generation ---

/**
 * Lightness curve for shade generation: the grey whose luminance each shade takes.
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
 * Generate a full 50-900 palette from a single hex color: the input's OKLCH hue and
 * chroma at each shade's luminance, with chroma tapered at the ends of the ramp so
 * the light stops are tints rather than full-strength color.
 */
function generatePalette(hex) {
  const { C, h } = linearToOklch(hexToLinear(hex));
  const palette = {};

  for (const [shade, lightness] of Object.entries(SHADE_LIGHTNESS)) {
    let taper = 1;
    if (lightness > 85) taper = 0.5;
    else if (lightness > 70) taper = 0.7;
    else if (lightness < 20) taper = 0.8;
    palette[shade] = colorAtLuminance(h, C * taper, greyLuminance(lightness));
  }

  return palette;
}

/**
 * Generate MD3-style neutral palette using tone numbers. Tone N takes the luminance
 * of the grey at lightness N, tinted toward the primary's hue at a chroma low enough
 * to read as grey.
 */
const NEUTRAL_TONES = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 85, 90, 95];
const NEUTRAL_CHROMA = 0.012;

function generateNeutralPalette(primaryHex) {
  const { h } = linearToOklch(hexToLinear(primaryHex));
  const palette = {};

  for (const tone of NEUTRAL_TONES) {
    palette[String(tone)] = colorAtLuminance(h, NEUTRAL_CHROMA, greyLuminance(tone));
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

module.exports = {
  hexToRgb,
  rgbToHex,
  hslToHex,
  generatePalette,
  generateNeutralPalette,
  generateStatusPalette
};
