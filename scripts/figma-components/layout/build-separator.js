// =============================================================================
// Separator — Custom Component Builder
// =============================================================================
// 2 variants: horizontal and vertical.
// Simple colored rectangle — height or width bound to border-width variable.
// No sizes axis — orientation is the only variant property.
//
// Must run as the first custom script on the Layout page.
// =============================================================================

function buildSeparator(lookups, defaultMode, page) {
  const { semColors, primBW } = lookups;
  const config = CONFIG.components.separator;

  const colorVar = semColors[config.color];
  // border-width/bw-1 → border-width/1
  const bwPath = config.width.replace('/bw-', '/');
  const bwVar = primBW[bwPath];

  const variants = [];

  // Horizontal separator: full width, bw-1 height
  const hComp = figma.createComponent();
  hComp.name = 'orientation=horizontal';
  hComp.resize(200, 1);
  if (colorVar) hComp.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', colorVar
  )];
  if (bwVar) hComp.setBoundVariable('height', bwVar);
  variants.push(hComp);

  // Vertical separator: bw-1 width, auto height
  const vComp = figma.createComponent();
  vComp.name = 'orientation=vertical';
  vComp.resize(1, 40);
  if (colorVar) vComp.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', colorVar
  )];
  if (bwVar) vComp.setBoundVariable('width', bwVar);
  variants.push(vComp);

  // Combine into component set
  const set = figma.combineAsVariants(variants, page);
  set.name = 'Separator';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  // Base + preview frames
  createBaseFrame('separator', 'Divider line. Horizontal between sections, vertical between inline items.', set, lookups, defaultMode);

  const defaultVariant = set.findChild(n => n.name === 'orientation=horizontal');
  createPreviewFrame('separator', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'Separator', count: set.children.length };
}
