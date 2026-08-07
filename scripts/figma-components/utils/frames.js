// =============================================================================
// Frame Construction + Icon Slots
// =============================================================================
// Section frames, headers, interactive previews, base/preview frame pairs,
// and icon slot creation. Shared by all shape builders.
// Depends on: lookups.js (setDefaultMode)
// =============================================================================

/**
 * Create a section frame following layout.json pattern.
 * Returns the frame — caller adds children.
 */
function createSectionFrame(name, lookups) {
  const { layoutVars } = lookups;
  const bgVar = layoutVars["layout/frame-background"];
  const padVar = layoutVars["layout/frame-padding"];
  const radVar = layoutVars["layout/frame-radius"];
  const sectionGapVar = layoutVars["layout/spacing/section-gap"];

  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.clipsContent = false;
  frame.minWidth = 400;

  if (bgVar) frame.fills = [figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.96 } }, "color", bgVar
  )];
  if (padVar) {
    frame.setBoundVariable("paddingTop", padVar);
    frame.setBoundVariable("paddingRight", padVar);
    frame.setBoundVariable("paddingBottom", padVar);
    frame.setBoundVariable("paddingLeft", padVar);
  }
  if (radVar) {
    frame.setBoundVariable("topLeftRadius", radVar);
    frame.setBoundVariable("topRightRadius", radVar);
    frame.setBoundVariable("bottomLeftRadius", radVar);
    frame.setBoundVariable("bottomRightRadius", radVar);
  }
  if (sectionGapVar) frame.setBoundVariable("itemSpacing", sectionGapVar);

  return frame;
}

/**
 * Add a Header LG instance to a frame.
 * @param {FrameNode} frame - Parent frame
 * @param {string} title - Header title text
 * @param {string|null} description - Description text, or null to hide
 * @returns {InstanceNode} The header instance
 */
function addHeader(frame, title, description) {
  const headerSet = figma.root.findOne(n => n.type === "COMPONENT_SET" && n.name === "template/header");
  const headerLgDiv = headerSet.findChild(n => n.name === "size=lg, divider=on");
  const inst = headerLgDiv.createInstance();
  frame.appendChild(inst);
  inst.layoutSizingHorizontal = "FILL";

  const titleNode = inst.findOne(n => n.name === "title" && n.type === "TEXT");
  if (titleNode) titleNode.characters = title;

  if (description) {
    const descNode = inst.findOne(n => n.name === "description" && n.type === "TEXT");
    if (descNode) descNode.characters = description;
  } else {
    const descPropKey = Object.keys(inst.componentProperties).find(k => k.includes("showDescription"));
    if (descPropKey) inst.setProperties({ [descPropKey]: false });
  }

  return inst;
}

/**
 * Create an interactive preview frame pattern with a component instance inside.
 * Auto-height with 68px bottom padding for Try Me clearance.
 * @param {InstanceNode|null} componentInstance - Component to showcase, or null for empty
 * @param {object} lookups - Variable lookups
 * @returns {FrameNode} The interactive preview frame
 */
function createInteractivePreview(componentInstance, lookups) {
  const { layoutVars, semColors, semRadius, primBW } = lookups;
  const surface1Var = layoutVars["layout/surface-1"];
  const onSurfaceVar = semColors["color/surface/on-surface"];
  const radComp = semRadius["radius/component"];
  const bw2 = primBW["border-width/2"];
  const tryMeComp = figma.root.findOne(n => n.type === "COMPONENT" && n.name === "template/try-me-button");

  const ip = figma.createFrame();
  ip.name = "interactive-preview";
  ip.resize(500, 100);
  ip.layoutMode = "VERTICAL";
  ip.primaryAxisSizingMode = "AUTO";
  ip.counterAxisSizingMode = "AUTO";
  ip.primaryAxisAlignItems = "CENTER";
  ip.counterAxisAlignItems = "CENTER";
  ip.paddingTop = 24;
  ip.paddingRight = 40;
  ip.paddingBottom = 68;
  ip.paddingLeft = 40;

  if (surface1Var) ip.fills = [figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0.93, g: 0.93, b: 0.93 } }, "color", surface1Var
  )];
  if (onSurfaceVar) ip.strokes = [figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0.098, g: 0.094, b: 0.106 } }, "color", onSurfaceVar
  )];
  if (bw2) ip.setBoundVariable("strokeWeight", bw2);
  ip.dashPattern = [8, 8];
  if (radComp) {
    ip.setBoundVariable("topLeftRadius", radComp);
    ip.setBoundVariable("topRightRadius", radComp);
    ip.setBoundVariable("bottomLeftRadius", radComp);
    ip.setBoundVariable("bottomRightRadius", radComp);
  }

  // Component instance
  if (componentInstance) {
    ip.appendChild(componentInstance);
  }

  // Try Me button — absolute bottom-right
  if (tryMeComp) {
    const tm = tryMeComp.createInstance();
    ip.appendChild(tm);
    tm.layoutPositioning = "ABSOLUTE";
    tm.constraints = { horizontal: "MAX", vertical: "MAX" };
    tm.x = ip.width - tm.width - 12;
    tm.y = ip.height - tm.height - 12;
  }

  return ip;
}

/**
 * Create a complete preview frame: section frame + header (no description) + interactive preview.
 * @param {string} componentName - Used for frame name and header title
 * @param {InstanceNode|null} componentInstance - Component to preview
 * @param {object} lookups - Variable lookups
 * @param {string} defaultMode - Mode name to apply ("light" or "dark")
 * @returns {FrameNode}
 */
function createPreviewFrame(componentName, componentInstance, lookups, defaultMode) {
  const frame = createSectionFrame(`preview.${componentName}`, lookups);
  addHeader(frame, `${componentName.charAt(0).toUpperCase() + componentName.slice(1)} Preview`, null);

  const ip = createInteractivePreview(componentInstance, lookups);
  frame.appendChild(ip);
  ip.layoutSizingHorizontal = "FILL";

  setDefaultMode(frame, defaultMode);
  return frame;
}

/**
 * Create a complete base frame: section frame + header (with description) + component set.
 * @param {string} componentName - Used for frame name and header title
 * @param {string} description - Semantic description
 * @param {ComponentSetNode} componentSet - The component set to include
 * @param {object} lookups - Variable lookups
 * @param {string} defaultMode - Mode name
 * @returns {FrameNode}
 */
function createBaseFrame(componentName, description, componentSet, lookups, defaultMode) {
  const frame = createSectionFrame(`base.${componentName}`, lookups);
  addHeader(frame, componentName.charAt(0).toUpperCase() + componentName.slice(1), description);
  frame.appendChild(componentSet);
  setDefaultMode(frame, defaultMode);
  return frame;
}

/**
 * Create an icon slot (leading or trailing) with boolean visibility toggle.
 * Uses flattened filled vectors for reliable color inheritance on swap.
 * @param {ComponentNode} comp - Parent component
 * @param {string} slotName - "leading-icon" or "trailing-icon"
 * @param {Variable} fgVar - Foreground color variable (for icon fill)
 * @param {Variable} iconSizeVar - Icon size variable
 * @param {string} propName - Boolean property name ("showLeadingIcon" or "showTrailingIcon")
 * @returns {InstanceNode} The icon instance (already appended to comp)
 */
// Style an icon instance in place: bind size, and recolor its vectors to a
// foreground variable. Catalog icons are stroked vectors (Lucide-style), so
// color binds to strokes with fills cleared. Single source of truth for icon
// recoloring — every builder that places an icon goes through here.
// The icon set is stroke-based, so colour binds to strokes and fills are cleared.
function styleIconInstance(inst, fgVar, iconSizeVar) {
  if (iconSizeVar) {
    inst.setBoundVariable("width", iconSizeVar);
    inst.setBoundVariable("height", iconSizeVar);
  }
  if (fgVar) {
    const vecs = inst.findAll(n => n.type === "VECTOR" || n.type === "BOOLEAN_OPERATION" || n.type === "LINE" || n.type === "ELLIPSE" || n.type === "RECTANGLE");
    const paint = [figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }, "color", fgVar
    )];
    for (const vec of vecs) {
      vec.strokes = paint;
      vec.fills = [];
    }
  }
  return inst;
}

// Create a sized, colored icon instance by component name, falling back to
// icon/placeholder. Returns null if no icon component exists in the file.
function makeIcon(iconName, fgVar, iconSizeVar) {
  let iconComp = figma.root.findOne(n => n.type === "COMPONENT" && n.name === iconName);
  if (!iconComp) iconComp = figma.root.findOne(n => n.type === "COMPONENT" && n.name === "icon/placeholder");
  if (!iconComp) return null;
  return styleIconInstance(iconComp.createInstance(), fgVar, iconSizeVar);
}

function createIconSlot(comp, slotName, fgVar, iconSizeVar, propName) {
  const placeholderIcon = figma.root.findOne(n => n.type === "COMPONENT" && n.name === "icon/placeholder");
  if (!placeholderIcon) throw new Error("icon/placeholder not found");

  const inst = styleIconInstance(placeholderIcon.createInstance(), fgVar, iconSizeVar);
  inst.name = slotName;
  inst.visible = false;
  comp.appendChild(inst);

  // Add boolean property and link visibility
  const propKey = comp.addComponentProperty(propName, "BOOLEAN", false);
  inst.componentPropertyReferences = { "visible": propKey };

  return inst;
}

// Close (X) affordance for overlay mocks (dialog, sheet) — the built-in close
// behind `showClose` (default true) in v2. Returns a sized, colored icon/x
// instance for the caller to append; null if no icon component is present.
function createCloseIcon(fgVar, iconSizeVar) {
  const inst = makeIcon("icon/x", fgVar, iconSizeVar);
  if (inst) inst.name = "close";
  return inst;
}
