// =============================================================================
// Bottom Nav — Frame Pattern Mock
// =============================================================================
// Mobile bottom navigation bar. 4 items with icons + labels.
// First item active (primary color), rest inactive.
// =============================================================================

function buildPatternBottomNav(lookups, defaultMode, page) {
  const { semColors, primSpacing, primHeight, primIconSize } = lookups;
  const config = CONFIG.components['bottom-nav'];
  const md = config.sizes.md;
  const itemStates = config.item.state;

  const frame = createSectionFrame('base.pattern-bottom-nav', lookups);
  addHeader(frame, 'Bottom Nav', 'Frame pattern — mobile bottom navigation. 3-5 items with icons and labels.');

  const bar = figma.createFrame();
  bar.name = 'bottom-nav-bar';
  bar.layoutMode = 'HORIZONTAL';
  bar.primaryAxisSizingMode = 'FIXED';
  bar.primaryAxisAlignItems = 'CENTER';
  bar.counterAxisAlignItems = 'CENTER';
  bar.resize(360, 64);

  const hPath = resolveHeight(md.height);
  if (hPath) {
    const hVar = primHeight[hPath];
    if (hVar) bar.setBoundVariable('height', hVar);
    bar.counterAxisSizingMode = 'FIXED';
  }

  const bgVar = semColors[config.variants.default.bg];
  if (bgVar) bar.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }, 'color', bgVar
  )];

  const borderVar = semColors[config.variants.default['border-top']];
  if (borderVar) {
    bar.strokes = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
    )];
    bar.strokeTopWeight = 1; bar.strokeRightWeight = 0; bar.strokeBottomWeight = 0; bar.strokeLeftWeight = 0;
    bar.strokeAlign = 'INSIDE';
  }

  const items = [
    { label: 'Home', active: true },
    { label: 'Search', active: false },
    { label: 'Inbox', active: false },
    { label: 'Profile', active: false }
  ];

  const iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/placeholder');

  for (const item of items) {
    const stateColors = itemStates[item.active ? 'active' : 'default'];
    const col = figma.createFrame();
    col.name = `item-${item.label.toLowerCase()}`;
    col.layoutMode = 'VERTICAL';
    col.primaryAxisAlignItems = 'CENTER';
    col.counterAxisAlignItems = 'CENTER';
    col.primaryAxisSizingMode = 'AUTO';
    col.fills = [];

    const gapPath = resolveScale(md.gap);
    if (gapPath) { const v = primSpacing[gapPath]; if (v) col.setBoundVariable('itemSpacing', v); }

    if (iconComp) {
      const inst = iconComp.createInstance();
      inst.name = 'icon';
      const iconPath = resolveIcon(md['icon-size']);
      const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
      if (iconSizeVar) { inst.setBoundVariable('width', iconSizeVar); inst.setBoundVariable('height', iconSizeVar); }
      const iconFgVar = semColors[stateColors['icon-fg']];
      if (iconFgVar) {
        const vecs = inst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
        const paint = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', iconFgVar)];
        for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
      }
      col.appendChild(inst);
    }

    const label = figma.createText();
    label.name = 'label';
    label.characters = item.label;
    applyTextStyle(label, 'label', 'sm');
    const fgVar = semColors[stateColors.fg];
    if (fgVar) label.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    col.appendChild(label);

    bar.appendChild(col);
    col.layoutSizingHorizontal = 'FILL';
    col.counterAxisSizingMode = 'FIXED';
    col.layoutSizingVertical = 'FILL';
  }

  frame.appendChild(bar);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Bottom Nav', count: 1 };
}
