// =============================================================================
// Sidebar — Frame Pattern Mock
// =============================================================================
// Vertical navigation panel with items. Shows active, default, and hover states.
// Surface bg, border-right, primary-container active highlight.
// =============================================================================

function buildPatternSidebar(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primHeight, primIconSize } = lookups;
  const config = CONFIG.components.sidebar;
  const md = config.sizes.md;
  const itemStates = config.item.state;

  const frame = createSectionFrame('base.pattern-sidebar', lookups);
  addHeader(frame, 'Sidebar', 'Frame pattern — vertical navigation with active/default/hover item states.');

  const sidebar = figma.createFrame();
  sidebar.name = 'sidebar-example';
  sidebar.layoutMode = 'VERTICAL';
  sidebar.primaryAxisSizingMode = 'AUTO';
  sidebar.counterAxisSizingMode = 'FIXED';
  sidebar.resize(parsePx(md.width) || 256, sidebar.height);

  const bgVar = semColors[config.variants.default.bg];
  if (bgVar) sidebar.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }, 'color', bgVar
  )];

  const borderVar = semColors[config.variants.default['border-right']];
  if (borderVar) {
    sidebar.strokes = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
    )];
    sidebar.strokeTopWeight = 0; sidebar.strokeRightWeight = 1; sidebar.strokeBottomWeight = 0; sidebar.strokeLeftWeight = 0;
    sidebar.strokeAlign = 'INSIDE';
  }

  const xpPath = resolveScale(md['x-padding']);
  if (xpPath) { const v = primSpacing[xpPath]; if (v) { sidebar.setBoundVariable('paddingLeft', v); sidebar.setBoundVariable('paddingRight', v); } }
  sidebar.paddingTop = 8; sidebar.paddingBottom = 8;
  sidebar.itemSpacing = 2;

  const items = [
    { label: 'Dashboard', state: 'active' },
    { label: 'Projects', state: 'default' },
    { label: 'Settings', state: 'hover' },
    { label: 'Users', state: 'default' },
    { label: 'Analytics', state: 'default' }
  ];

  const iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/placeholder');

  for (const item of items) {
    const stateColors = itemStates[item.state];
    const row = figma.createFrame();
    row.name = `item-${item.label.toLowerCase()}`;
    row.layoutMode = 'HORIZONTAL';
    row.counterAxisAlignItems = 'CENTER';
    row.primaryAxisSizingMode = 'AUTO';

    const ihPath = resolveHeight(md['item-height']);
    if (ihPath) {
      const hVar = primHeight[ihPath];
      if (hVar) row.setBoundVariable('height', hVar);
      row.counterAxisSizingMode = 'FIXED';
    }

    const ixpPath = resolveScale(md['item-x-padding']);
    if (ixpPath) { const v = primSpacing[ixpPath]; if (v) { row.setBoundVariable('paddingLeft', v); row.setBoundVariable('paddingRight', v); } }
    const igPath = resolveScale(md['item-gap']);
    if (igPath) { const v = primSpacing[igPath]; if (v) row.setBoundVariable('itemSpacing', v); }

    const itemRadVar = semRadius[md['item-radius']];
    if (itemRadVar) {
      row.setBoundVariable('topLeftRadius', itemRadVar);
      row.setBoundVariable('topRightRadius', itemRadVar);
      row.setBoundVariable('bottomLeftRadius', itemRadVar);
      row.setBoundVariable('bottomRightRadius', itemRadVar);
    }

    const itemBgVar = stateColors.bg === 'transparent' ? null : semColors[stateColors.bg];
    if (itemBgVar) row.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }, 'color', itemBgVar
    )];
    else row.fills = [];

    // Icon
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
      row.appendChild(inst);
    }

    // Label
    const label = figma.createText();
    label.name = 'label';
    label.characters = item.label;
    applyTextStyle(label, 'action', 'md');
    const fgVar = semColors[stateColors.fg];
    if (fgVar) label.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    row.appendChild(label);
    label.layoutSizingHorizontal = 'FILL';

    sidebar.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
  }

  frame.appendChild(sidebar);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Sidebar', count: 1 };
}
