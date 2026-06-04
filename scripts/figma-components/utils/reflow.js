// =============================================================================
// Page Reflow Utilities
// =============================================================================
// Position frames on the canvas after generation.
// No dependencies on other utils modules.
// =============================================================================

/**
 * Read the frame-group-gap from figma.layout variable.
 * Resolves aliases. Falls back to 64px.
 */
function getFrameGap() {
  let gap = 64;
  const cols = figma.variables.getLocalVariableCollections();
  const layoutCol = cols.find(c => c.name === "figma.layout");
  if (layoutCol) {
    const modeId = layoutCol.modes[0].modeId;
    for (const varId of layoutCol.variableIds) {
      const v = figma.variables.getVariableById(varId);
      if (v.name === "layout/spacing/frame-group-gap") {
        const val = v.valuesByMode[modeId];
        if (typeof val === "number") {
          gap = val;
        } else if (val && val.type === "VARIABLE_ALIAS") {
          const target = figma.variables.getVariableById(val.id);
          if (target) {
            const tv = target.valuesByMode[Object.keys(target.valuesByMode)[0]];
            if (typeof tv === "number") gap = tv;
          }
        }
      }
    }
  }
  return gap;
}

/**
 * Reflow frames vertically in a single column.
 * For Core page and any page with independent stacked sections.
 * @param {PageNode} page - The page to reflow
 */
function reflowVertical(page) {
  const frames = page.children
    .filter(n => n.type === "FRAME")
    .sort((a, b) => a.y - b.y);
  if (frames.length === 0) return;

  const gap = getFrameGap();
  let y = 0;

  for (const frame of frames) {
    frame.x = 0;
    frame.y = y;
    y += frame.height + gap;
  }
}

/**
 * Reflow base+preview frame pairs in rows.
 * For component pages with side-by-side base and preview frames.
 * @param {PageNode} page - The page to reflow
 * @param {string[]} componentOrder - Array of component names in display order
 */
function reflowPaired(page, componentOrder) {
  const allFrames = page.children.filter(n => n.type === "FRAME");
  const gap = getFrameGap();
  let y = 0;

  for (const name of componentOrder) {
    const base = allFrames.find(f => f.name === `base.${name}`);
    const preview = allFrames.find(f => f.name === `preview.${name}`);
    if (!base) continue;

    base.x = 0;
    base.y = y;
    if (preview) {
      preview.x = base.width + gap;
      preview.y = y;
    }
    y += Math.max(base.height, preview ? preview.height : 0) + gap;
  }
}
