// =============================================================================
// Icon Components — Embedded Lucide icons as Figma components
// All icons: 16×16 frame, vector scaled from 24→16 (0.667 scale), centered
// Stroke-based, uses currentColor (inherits fill from parent)
//
// CONFIG injected by orchestrator: icon definitions array
// =============================================================================

// Lucide icons are 24×24 viewBox, we scale to 16×16
const FRAME_SIZE = 16;
const SCALE = FRAME_SIZE / 24;

// Target Core page
let page = figma.root.children.find(p => p.name === "Core");
if (!page) { page = figma.createPage(); page.name = "Core"; }
await figma.setCurrentPageAsync(page);

// Find or create Icons frame
let iconsFrame = page.findChild(n => n.name === "Icons" && n.type === "FRAME");
if (!iconsFrame) {
  iconsFrame = figma.createFrame();
  iconsFrame.name = "Icons";
  iconsFrame.layoutMode = "HORIZONTAL";
  iconsFrame.layoutWrap = "WRAP";
  iconsFrame.itemSpacing = 16;
  iconsFrame.counterAxisSpacing = 16;
  iconsFrame.paddingTop = 24;
  iconsFrame.paddingRight = 24;
  iconsFrame.paddingBottom = 24;
  iconsFrame.paddingLeft = 24;
  iconsFrame.primaryAxisSizingMode = "AUTO";
  iconsFrame.counterAxisSizingMode = "AUTO";
  iconsFrame.fills = [];
}

let count = 0;

for (const iconDef of CONFIG) {
  // Create component frame
  const comp = figma.createComponent();
  comp.name = `icon/${iconDef.name}`;
  comp.resize(FRAME_SIZE, FRAME_SIZE);
  comp.fills = [];
  comp.clipsContent = true;

  // Create the vector from SVG
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_SIZE}" height="${FRAME_SIZE}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconDef.svg}</svg>`;

  const node = figma.createNodeFromSvg(svgString);

  // Flatten to a single vector and move into component
  const vectors = node.findAll(n => n.type === "VECTOR" || n.type === "BOOLEAN_OPERATION" || n.type === "LINE" || n.type === "ELLIPSE" || n.type === "RECTANGLE" || n.type === "POLYGON" || n.type === "STAR");

  // Use the frame created by createNodeFromSvg — it contains properly scaled vectors
  // Move all children into the component
  while (node.children.length > 0) {
    const child = node.children[0];
    comp.appendChild(child);
  }
  node.remove();

  // Set constraints so vectors scale proportionally
  for (const child of comp.children) {
    child.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  }

  // Add component description
  comp.description = `Lucide icon: ${iconDef.name}`;

  // Move into icons frame
  iconsFrame.appendChild(comp);
  count++;
}

return `Icons: ${count} components created in Icons frame`;
