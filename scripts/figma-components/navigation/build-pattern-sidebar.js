// =============================================================================
// Sidebar — Frame Pattern Mock
// =============================================================================
// Vertical navigation panel with items. Shows the default (labeled) and rail
// (icon-only, narrow) variants side by side, with active/default/hover item
// states. Surface bg, border-right, primary-container active highlight.
// =============================================================================

function buildPatternSidebar(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights, primIconSize } = lookups;
  const config = CONFIG.components.sidebar;
  const md = config.sizes.md;
  const itemStates = config.item.state;

  const frame = createSectionFrame('base.pattern-sidebar', lookups);
  addHeader(frame, 'Sidebar', 'Frame pattern — default (labeled) + rail (icon-only) variants. Active/default/hover item states.');

  const iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/placeholder');

  const items = [
    { label: 'Dashboard', state: 'active' },
    { label: 'Projects', state: 'default' },
    { label: 'Settings', state: 'hover' },
    { label: 'Users', state: 'default' },
    { label: 'Analytics', state: 'default' }
  ];

  // One item row. `rail` drops the label and centers the icon in the narrow column.
  function buildItem(item, rail) {
    const stateColors = itemStates[item.state];
    const row = figma.createFrame();
    row.name = `item-${item.label.toLowerCase()}`;
    row.layoutMode = 'HORIZONTAL';
    row.counterAxisAlignItems = 'CENTER';
    row.primaryAxisSizingMode = 'AUTO';
    if (rail) row.primaryAxisAlignItems = 'CENTER';

    const ihPath = resolveHeight(md['item-height']);
    if (ihPath) {
      const hVar = heights[ihPath];
      if (hVar) row.setBoundVariable('height', hVar);
      row.counterAxisSizingMode = 'FIXED';
    }

    if (rail) {
      row.paddingLeft = 0; row.paddingRight = 0;
    } else {
      const ixpPath = resolveScale(md['item-x-padding']);
      if (ixpPath) { const v = primSpacing[ixpPath]; if (v) { row.setBoundVariable('paddingLeft', v); row.setBoundVariable('paddingRight', v); } }
    }
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

    // Label — default variant only (rail is icon-only)
    if (!rail) {
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
    }

    return row;
  }

  // One sidebar column. `rail` narrows it to rail-width and drops item padding.
  function buildColumn(name, widthPx, rail) {
    const col = figma.createFrame();
    col.name = name;
    col.layoutMode = 'VERTICAL';
    col.primaryAxisSizingMode = 'AUTO';
    col.counterAxisSizingMode = 'FIXED';
    col.resize(widthPx, col.height);

    const bgVar = semColors[config.variants.default.bg];
    if (bgVar) col.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }, 'color', bgVar
    )];

    const borderVar = semColors[config.variants.default['border-right']];
    if (borderVar) {
      col.strokes = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
      )];
      col.strokeTopWeight = 0; col.strokeRightWeight = 1; col.strokeBottomWeight = 0; col.strokeLeftWeight = 0;
      col.strokeAlign = 'INSIDE';
    }

    const xpPath = resolveScale(md['x-padding']);
    if (xpPath) { const v = primSpacing[xpPath]; if (v) { col.setBoundVariable('paddingLeft', v); col.setBoundVariable('paddingRight', v); } }
    col.paddingTop = 8; col.paddingBottom = 8;
    col.itemSpacing = 2;

    for (const item of items) {
      const row = buildItem(item, rail);
      col.appendChild(row);
      row.layoutSizingHorizontal = 'FILL';
    }
    return col;
  }

  // Default + rail, side by side.
  const wrap = figma.createFrame();
  wrap.name = 'sidebar-variants';
  wrap.layoutMode = 'HORIZONTAL';
  wrap.primaryAxisSizingMode = 'AUTO';
  wrap.counterAxisSizingMode = 'AUTO';
  wrap.counterAxisAlignItems = 'MIN';
  wrap.itemSpacing = 24;
  wrap.fills = [];
  wrap.appendChild(buildColumn('sidebar-default', parsePx(md.width) || 256, false));
  wrap.appendChild(buildColumn('sidebar-rail', parsePx(md['rail-width']) || 64, true));

  frame.appendChild(wrap);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Sidebar', count: 2 };
}
