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
let __figmaStyles = null;           // Map<family, Set<style>> — from the same call
const __fontFallback = 'Inter';
const __fontWarned = new Set();
const __styleWarned = new Set();

async function ensureFontIndex() {
  if (__figmaFonts) return;
  const list = await figma.listAvailableFontsAsync();
  __figmaFonts = new Set();
  __figmaStyles = new Map();
  // listAvailableFontsAsync returns family *and* style. Keeping only the family is what
  // forced FONT_WEIGHT_OVERRIDES to exist: with no idea which styles a family ships,
  // fontStyle() had to guess a name and loadFontAsync threw when the guess was wrong.
  for (const f of list) {
    const { family, style } = f.fontName;
    __figmaFonts.add(family);
    if (!__figmaStyles.has(family)) __figmaStyles.set(family, new Set());
    __figmaStyles.get(family).add(style);
  }
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
async function reportFontParity(families, textStyles) {
  await ensureFontIndex();
  console.log('— Font parity check (this Figma) —');
  for (const role of Object.keys(families)) {
    const fam = families[role];
    console.log(__figmaFonts.has(fam)
      ? `  ✓ ${role}: ${fam}`
      : `  ⚠ ${role}: ${fam} — not available here, will substitute ${__fontFallback}`);
  }
  // Family availability was the wrong question on its own. Space Mono is present in
  // Figma and the check said ✓, then step 14 died loading "Space Mono SemiBold" — a
  // style the family does not ship. Report the weights the ramp actually asks for.
  if (!textStyles) return;
  const wanted = new Map();
  for (const def of Object.values(textStyles)) {
    const fam = resolveFamily(families[def.font]);
    wanted.set(fam + '\u0000' + def.weight, [fam, def.weight]);
  }
  console.log('— Weights this ramp asks for —');
  for (const [fam, weight] of [...wanted.values()].sort((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1])) {
    const ideal = __idealStyle(weight);
    const chosen = fontStyle(weight, fam);
    console.log(chosen === ideal
      ? `  ✓ ${fam} ${weight} → ${chosen}`
      : `  ⚠ ${fam} ${weight} → "${chosen}" (no ${ideal} in this Figma; the browser resolves it the same way)`);
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

// Figma style name → the numeric weight it stands for, normalised so "SemiBold",
// "Semi Bold" and "semibold" are one key.
const __STYLE_WEIGHTS = {
  thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300,
  regular: 400, normal: 400, book: 400, text: 400,
  medium: 500, semibold: 600, demibold: 600,
  bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900,
};
const __normStyle = (s) => String(s).toLowerCase().replace(/[\s._-]/g, '');

function __idealStyle(weight) {
  if (weight >= 700) return 'Bold';
  if (weight >= 600) return 'SemiBold';
  if (weight >= 500) return 'Medium';
  return 'Regular';
}

/**
 * Pick the style to load for a numeric weight.
 *
 * The ladder alone guesses a name and lets loadFontAsync throw when the family does not
 * ship it — which is how a Space Mono brand died at step 14 on "Space Mono SemiBold".
 * The override table was the workaround, and it is a list of the four families someone
 * had already crashed on; the fifth crashes the same way.
 *
 * So: snap to the nearest weight the family actually ships. This is not a new policy —
 * it is what the browser already does. Google serves Space Mono at 400 and 700 only, and
 * silently drops the 500 and 600 the <link> asks for, so CSS font matching resolves
 * 600 → 700 and 500 → 400. Snapping makes the Figma file agree with the rendered page
 * instead of refusing to build.
 *
 * An explicit override still wins — it is how a human pins a choice the nearest-weight
 * rule would get wrong.
 */
function fontStyle(weight, familyName) {
  const overrides = familyName && FONT_WEIGHT_OVERRIDES[familyName];
  if (overrides && overrides[weight]) return overrides[weight];

  const ideal = __idealStyle(weight);
  const available = familyName && __figmaStyles && __figmaStyles.get(familyName);
  if (!available) return ideal;           // no index yet (or family absent) — ladder as before
  if (available.has(ideal)) return ideal;

  // Italics excluded: a ramp asking for 600 wants a heavier upright, never a slanted one.
  // Ties go heavier, matching CSS font matching for weights at or above 400.
  let best = null;
  let bestWeight = null;
  for (const style of available) {
    const n = __normStyle(style);
    if (n.includes('italic') || n.includes('oblique')) continue;
    const w = __STYLE_WEIGHTS[n];
    if (w == null) continue;
    if (best === null) { best = style; bestWeight = w; continue; }
    const d = Math.abs(w - weight);
    const bd = Math.abs(bestWeight - weight);
    if (d < bd || (d === bd && w > bestWeight)) { best = style; bestWeight = w; }
  }
  if (best === null) return ideal;

  const key = familyName + '\u0000' + weight;
  if (!__styleWarned.has(key)) {
    console.warn(`⚠ "${familyName}" ships no ${ideal} (${weight}) — using "${best}". The page resolves it the same way, so this is parity, not a downgrade.`);
    __styleWarned.add(key);
  }
  return best;
}

/**
 * em-based letter-spacing → Figma percent. Returns a bare number; the caller
 * supplies the `{ value, unit }` envelope.
 */
function parseLetterSpacing(val) {
  return parseFloat(String(val).replace('em', '') || '0') * 100;
}
