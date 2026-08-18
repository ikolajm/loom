/**
 * Shared helpers for the Figma styles steps.
 *
 * These lived in `figma-components/utils/resolvers.js` until the component pipeline was
 * cut. Step 14 (text styles) is the only remaining consumer, and it depended on them
 * through the assembled shared bundle rather than through its own file — which hid a
 * trap: `text-styles.js` carried its own copies of `FONT_WEIGHT_OVERRIDES`,
 * `weightToStyleName` and `parseLetterSpacing` above its `// --- Pipeline ---` marker,
 * and the assembler strips everything above that marker. The local copies never ran.
 *
 * That mattered because the two `parseLetterSpacing` implementations did not agree: the
 * dead local one returned `{ value, unit }` while this one returns a bare number, and
 * the call site wraps the result in `{ value: ..., unit: 'PERCENT' }`. Had the dead copy
 * ever won, every text style would have shipped a nested object where Figma expects a
 * number. One definition, in one place that obviously runs.
 */

// =============================================================================
// Font availability — Figma is the authoritative source for what it can render.
// Google Fonts and Figma's font set are NOT 1:1, so a configured font may be
// loadable in code (<link>) but absent here. resolveFamily() substitutes Inter
// (which Figma hosts) for any missing family — logged once — so the build
// degrades gracefully instead of throwing at loadFontAsync. The code side still
// loads the original font; only the Figma render falls back.
// =============================================================================
let __figmaFonts = null;            // Set of available family names, lazily populated
const __fontFallback = 'Inter';
const __fontWarned = new Set();

async function ensureFontIndex() {
  if (__figmaFonts) return;
  const list = await figma.listAvailableFontsAsync();
  __figmaFonts = new Set(list.map(f => f.fontName.family));
}

function resolveFamily(family) {
  if (!__figmaFonts || __figmaFonts.has(family)) return family;
  if (!__fontWarned.has(family)) {
    console.warn(`⚠ Font "${family}" is not available in this Figma — substituting "${__fontFallback}". Pick a Figma-available font, or upload "${family}" to your org and re-run.`);
    __fontWarned.add(family);
  }
  return __fontFallback;
}

// Load a font safely: ensures the index, substitutes Inter if missing, returns the
// family actually loaded (callers must set fontName to the returned value).
async function safeLoadFont(family, style) {
  await ensureFontIndex();
  const fam = resolveFamily(family);
  await figma.loadFontAsync({ family: fam, style });
  return fam;
}

// Authoritative preflight — call once before building typography to surface
// availability up front (the "Figma-side, paste-time" half of the parity check).
async function reportFontParity(families) {
  await ensureFontIndex();
  console.log('— Font parity check (this Figma) —');
  for (const role of Object.keys(families)) {
    const fam = families[role];
    console.log(__figmaFonts.has(fam)
      ? `  ✓ ${role}: ${fam}`
      : `  ⚠ ${role}: ${fam} — not available here, will substitute ${__fontFallback}`);
  }
}

/**
 * Numeric font weight → Figma style name. The default ladder covers most Google
 * Fonts; only add an override for a family whose style names differ, which
 * loadFontAsync will tell you about by throwing.
 */
const FONT_WEIGHT_OVERRIDES = {
  "JetBrains Mono": { 600: "Medium" },
  "Inter": { 600: "Semi Bold" },
  "Space Grotesk": { 600: "Bold" },
  "Cinzel": { 500: "Regular", 600: "Bold" },
};

function fontStyle(weight, familyName) {
  const overrides = familyName && FONT_WEIGHT_OVERRIDES[familyName];
  if (overrides && overrides[weight]) return overrides[weight];
  if (weight >= 700) return 'Bold';
  if (weight >= 600) return 'SemiBold';
  if (weight >= 500) return 'Medium';
  return 'Regular';
}

/**
 * em-based letter-spacing → Figma percent. Returns a bare number; the caller
 * supplies the `{ value, unit }` envelope.
 */
function parseLetterSpacing(val) {
  return parseFloat(String(val).replace('em', '') || '0') * 100;
}
