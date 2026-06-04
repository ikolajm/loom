// =============================================================================
// Empty State — Frame Pattern Mock
// =============================================================================
// Icon + heading + description + action button placeholder.
// Shows the md size centered in a container.
// =============================================================================

function buildPatternEmptyState(lookups, defaultMode, page) {
  const { semColors, primSpacing, primIconSize } = lookups;
  const config = CONFIG.components['empty-state'];
  const colors = config.variants.default;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-empty-state', lookups);
  addHeader(frame, 'Empty State', 'Frame pattern — placeholder when a view has no content. Icon + heading + description + optional action.');

  const container = figma.createFrame();
  container.name = 'empty-state-example';
  container.layoutMode = 'VERTICAL';
  container.primaryAxisSizingMode = 'AUTO';
  container.counterAxisSizingMode = 'FIXED';
  container.primaryAxisAlignItems = 'CENTER';
  container.counterAxisAlignItems = 'CENTER';
  container.resize(320, container.height);
  container.fills = [];

  const gapPath = resolveScale(md.gap);
  if (gapPath) { const v = primSpacing[gapPath]; if (v) container.setBoundVariable('itemSpacing', v); }

  // Icon placeholder
  const iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/placeholder');
  if (iconComp) {
    const inst = iconComp.createInstance();
    inst.name = 'icon';
    const iconPath = resolveIcon(md['icon-size']);
    const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
    if (iconSizeVar) { inst.setBoundVariable('width', iconSizeVar); inst.setBoundVariable('height', iconSizeVar); }
    const iconFgVar = semColors[colors['icon-fg']];
    if (iconFgVar) {
      const vecs = inst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
      const paint = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', iconFgVar)];
      for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
    }
    container.appendChild(inst);
  }

  // Heading
  const headingFgVar = semColors[colors['heading-fg']];
  const heading = figma.createText();
  heading.name = 'heading';
  heading.characters = 'No items yet';
  applyTextStyle(heading, 'title', 'md');
  heading.textAlignHorizontal = 'CENTER';
  if (headingFgVar) heading.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', headingFgVar
  )];
  container.appendChild(heading);

  // Description
  const descFgVar = semColors[colors['description-fg']];
  const desc = figma.createText();
  desc.name = 'description';
  desc.characters = 'Create your first item to get started.';
  applyTextStyle(desc, 'body', 'md');
  desc.textAlignHorizontal = 'CENTER';
  if (descFgVar) desc.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', descFgVar
  )];
  container.appendChild(desc);
  desc.layoutSizingHorizontal = 'FILL';

  frame.appendChild(container);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Empty State', count: 1 };
}
