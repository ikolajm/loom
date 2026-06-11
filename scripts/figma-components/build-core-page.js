// =============================================================================
// Core Page — Color palette, typography samples, surface elevations
// =============================================================================
// Runs AFTER templates.js (System Components, icons, header, etc. already exist).
// Adds showcase sections to the existing Core page:
//   1. Color palette swatches (all families with shades)
//   2. Typography samples (6 families × 3 tiers)
//   3. Surface elevation steps (light + dark)
// =============================================================================

// Load project fonts — text styles bind these, Figma needs them loaded for text mutations.
// safeLoadFont substitutes Inter for any family this Figma can't render (logged once).
for (const family of Object.values(CONFIG_FONTS)) {
  await safeLoadFont(family, "Regular");
}
// Load all weights used by text styles
for (const [, def] of Object.entries(CONFIG.typography.textStyles)) {
  const familyName = resolveFamily(CONFIG_FONTS[def.font]);
  const style = fontStyle(def.weight, familyName);
  await figma.loadFontAsync({ family: familyName, style });
}

const lookups = getAllLookups();
const { semColors, semRadius, primSpacing, layoutVars } = lookups;

const page = figma.root.children.find(p => p.name === "Core");
if (!page) throw new Error("Core page not found — run templates.js first");
await figma.setCurrentPageAsync(page);

const results = [];

// --- Helpers ---
const textStyles = figma.getLocalTextStyles();
function getTextStyle(name) { return textStyles.find(s => s.name === name) || null; }
function primColor(path) {
  const cols = figma.variables.getLocalVariableCollections();
  const col = cols.find(c => c.name === "primitives.color");
  if (!col) return null;
  for (const vid of col.variableIds) {
    const v = figma.variables.getVariableById(vid);
    if (v.name === path) return v;
  }
  return null;
}

// --- 1. Color Palette ---
const paletteFrame = createSectionFrame("base.color-palette", lookups);
addHeader(paletteFrame, "Color Palette", "All color families with shade values. Primitives — not semantic roles.");

const swatchW = 120;
const swatchH = 60;
const swatchRadVar = semRadius[CONFIG.colorPalette.swatch.radius];
const labelStyle = getTextStyle("label/sm");
const bodyStyle = getTextStyle("body/sm");
const fgVar = layoutVars["layout/page-foreground"];
const fgMutedVar = layoutVars["layout/page-foreground-muted"];

for (const [familyName, familyDef] of Object.entries(CONFIG.colorPalette.families)) {
  // Family section
  const familyFrame = figma.createFrame();
  familyFrame.name = `palette-${familyName}`;
  familyFrame.layoutMode = "VERTICAL";
  familyFrame.primaryAxisSizingMode = "AUTO";
  familyFrame.counterAxisSizingMode = "AUTO";
  familyFrame.fills = [];
  const compGap = primSpacing["spacing/4"];
  if (compGap) familyFrame.setBoundVariable("itemSpacing", compGap);

  // Family header (sm, no divider)
  const headerSet = figma.root.findOne(n => n.type === "COMPONENT_SET" && n.name === "template/header");
  const headerSmNoDiv = headerSet.findChild(n => n.name === "size=sm, divider=off");
  if (headerSmNoDiv) {
    const hInst = headerSmNoDiv.createInstance();
    familyFrame.appendChild(hInst);
    hInst.layoutSizingHorizontal = "FILL";
    const titleNode = hInst.findOne(n => n.name === "title" && n.type === "TEXT");
    if (titleNode) titleNode.characters = familyName.charAt(0).toUpperCase() + familyName.slice(1);
    if (familyDef.description) {
      const descNode = hInst.findOne(n => n.name === "description" && n.type === "TEXT");
      if (descNode) descNode.characters = familyDef.description;
    } else {
      const descPropKey = Object.keys(hInst.componentProperties).find(k => k.includes("showDescription"));
      if (descPropKey) hInst.setProperties({ [descPropKey]: false });
    }
  }

  // Swatch row
  const swatchRow = figma.createFrame();
  swatchRow.name = "swatches";
  swatchRow.layoutMode = "HORIZONTAL";
  swatchRow.layoutWrap = "WRAP";
  swatchRow.primaryAxisSizingMode = "AUTO";
  swatchRow.counterAxisSizingMode = "AUTO";
  swatchRow.itemSpacing = 8;
  swatchRow.counterAxisSpacing = 8;
  swatchRow.fills = [];

  const shades = familyDef.shades || familyDef.tones || [];
  for (const shade of shades) {
    const swatchBlock = figma.createFrame();
    swatchBlock.name = `${familyName}-${shade}`;
    swatchBlock.layoutMode = "VERTICAL";
    swatchBlock.primaryAxisSizingMode = "AUTO";
    swatchBlock.counterAxisSizingMode = "AUTO";
    swatchBlock.itemSpacing = 4;
    swatchBlock.fills = [];

    // Color swatch
    const swatch = figma.createFrame();
    swatch.name = "swatch";
    swatch.resize(swatchW, swatchH);
    swatch.primaryAxisSizingMode = "FIXED";
    swatch.counterAxisSizingMode = "FIXED";

    const colorVar = primColor(`color/${familyName}/${shade}`);
    if (colorVar) {
      swatch.fills = [figma.variables.setBoundVariableForPaint(
        { type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }, "color", colorVar
      )];
    }

    if (swatchRadVar) {
      swatch.setBoundVariable("topLeftRadius", swatchRadVar);
      swatch.setBoundVariable("topRightRadius", swatchRadVar);
      swatch.setBoundVariable("bottomLeftRadius", swatchRadVar);
      swatch.setBoundVariable("bottomRightRadius", swatchRadVar);
    }

    swatchBlock.appendChild(swatch);

    // Shade label
    const shadeLabel = figma.createText();
    shadeLabel.name = "shade";
    shadeLabel.characters = String(shade);
    if (labelStyle) shadeLabel.textStyleId = labelStyle.id;
    if (fgVar) shadeLabel.fills = [figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }, "color", fgVar
    )];
    swatchBlock.appendChild(shadeLabel);

    swatchRow.appendChild(swatchBlock);
  }

  familyFrame.appendChild(swatchRow);
  paletteFrame.appendChild(familyFrame);
}

setDefaultMode(paletteFrame, DEFAULT_MODE);
results.push("Color Palette: " + Object.keys(CONFIG.colorPalette.families).length + " families");

// --- 2. Typography Samples ---
const typoFrame = createSectionFrame("base.typography", lookups);
addHeader(typoFrame, "Typography", "6 text style families × 3 size tiers. Components bind to a family; size prop selects the tier.");

const tiers = ["sm", "md", "lg"];
for (const [familyName, familyDef] of Object.entries(CONFIG.typography.textStyles)) {
  const familySection = figma.createFrame();
  familySection.name = `type-${familyName}`;
  familySection.layoutMode = "VERTICAL";
  familySection.primaryAxisSizingMode = "AUTO";
  familySection.counterAxisSizingMode = "AUTO";
  familySection.fills = [];
  const labelGap = primSpacing["spacing/2"];
  if (labelGap) familySection.setBoundVariable("itemSpacing", labelGap);

  // Family label
  const fLabel = figma.createText();
  fLabel.name = "family-label";
  fLabel.characters = familyName;
  if (labelStyle) fLabel.textStyleId = labelStyle.id;
  if (fgMutedVar) fLabel.fills = [figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }, "color", fgMutedVar
  )];
  familySection.appendChild(fLabel);

  for (const tier of tiers) {
    const ts = getTextStyle(`${familyName}/${tier}`);
    const sample = figma.createText();
    sample.name = `${familyName}-${tier}`;
    sample.characters = `${familyName}/${tier} — The quick brown fox jumps over the lazy dog.`;
    if (ts) sample.textStyleId = ts.id;
    if (fgVar) sample.fills = [figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }, "color", fgVar
    )];
    familySection.appendChild(sample);
  }

  typoFrame.appendChild(familySection);
}

setDefaultMode(typoFrame, DEFAULT_MODE);
results.push("Typography: " + Object.keys(CONFIG.typography.textStyles).length + " families");

// --- 3. Surface Elevations ---
const surfaceFrame = createSectionFrame("base.surfaces", lookups);
addHeader(surfaceFrame, "Surface Elevations", "Progressive elevation from dim to bright. Used for layering content areas.");

const surfaceRow = figma.createFrame();
surfaceRow.name = "surface-steps";
surfaceRow.layoutMode = "HORIZONTAL";
surfaceRow.primaryAxisSizingMode = "AUTO";
surfaceRow.counterAxisSizingMode = "AUTO";
surfaceRow.itemSpacing = 8;
surfaceRow.fills = [];

const surfaceLevels = ["surface", "surface-1", "surface-2", "surface-3"];
for (const level of surfaceLevels) {
  const block = figma.createFrame();
  block.name = level;
  block.layoutMode = "VERTICAL";
  block.primaryAxisSizingMode = "AUTO";
  block.counterAxisSizingMode = "AUTO";
  block.itemSpacing = 4;
  block.fills = [];

  const swatch = figma.createFrame();
  swatch.name = "swatch";
  swatch.resize(100, 60);
  swatch.primaryAxisSizingMode = "FIXED";
  swatch.counterAxisSizingMode = "FIXED";

  const surfVar = semColors[`color/surface/${level}`];
  if (surfVar) swatch.fills = [figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }, "color", surfVar
  )];
  if (swatchRadVar) {
    swatch.setBoundVariable("topLeftRadius", swatchRadVar);
    swatch.setBoundVariable("topRightRadius", swatchRadVar);
    swatch.setBoundVariable("bottomLeftRadius", swatchRadVar);
    swatch.setBoundVariable("bottomRightRadius", swatchRadVar);
  }
  // Add subtle border so light swatches are visible on light frame
  const outlineVar = layoutVars["layout/outline-subtle"];
  if (outlineVar) {
    swatch.strokes = [figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }, "color", outlineVar
    )];
    swatch.strokeWeight = 1;
  }
  block.appendChild(swatch);

  const label = figma.createText();
  label.name = "label";
  label.characters = level;
  if (labelStyle) label.textStyleId = labelStyle.id;
  if (fgVar) label.fills = [figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }, "color", fgVar
  )];
  block.appendChild(label);

  surfaceRow.appendChild(block);
}

surfaceFrame.appendChild(surfaceRow);
setDefaultMode(surfaceFrame, DEFAULT_MODE);
results.push("Surfaces: " + surfaceLevels.length + " levels");

// --- Reflow ---
// Core page has: System Components (from templates), then our 3 sections
const coreOrder = ["color-palette", "typography", "surfaces"];
const allFrames = page.children.filter(n => n.type === "FRAME");
const gap = getFrameGap();

// System Components frame stays at top, our sections go below
const sysFrame = allFrames.find(f => f.name === "System Components");
let y = sysFrame ? sysFrame.y + sysFrame.height + gap : 0;

for (const name of coreOrder) {
  const frame = allFrames.find(f => f.name === `base.${name}`);
  if (!frame) continue;
  frame.x = 0;
  frame.y = y;
  y += frame.height + gap;
}

return "Core page: " + results.join(", ");
