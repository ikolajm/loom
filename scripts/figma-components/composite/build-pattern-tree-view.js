// =============================================================================
// Tree View — Frame Pattern Mock
// =============================================================================
// Hierarchical list with expandable nodes. Shows 2 levels deep
// with selected and expanded states.
// =============================================================================

function buildPatternTreeView(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights, primIconSize } = lookups;
  const config = CONFIG.components['tree-view'];
  const md = config.sizes.md;
  const itemStates = config.item.state;

  const frame = createSectionFrame('base.pattern-tree-view', lookups);
  addHeader(frame, 'Tree View', 'Frame pattern — hierarchical list with expand/collapse and selection.');

  const tree = figma.createFrame();
  tree.name = 'tree-view';
  tree.layoutMode = 'VERTICAL';
  tree.primaryAxisSizingMode = 'AUTO';
  tree.counterAxisSizingMode = 'FIXED';
  tree.resize(280, tree.height);
  tree.fills = [];
  tree.itemSpacing = 0;

  const items = [
    { label: 'src', depth: 0, state: 'default', isParent: true },
    { label: 'components', depth: 1, state: 'default', isParent: true },
    { label: 'Button.tsx', depth: 2, state: 'selected' },
    { label: 'Card.tsx', depth: 2, state: 'default' },
    { label: 'utils', depth: 1, state: 'default' },
    { label: 'pages', depth: 0, state: 'default' }
  ];

  const indentPx = parsePx(md.indent) || 20;
  const iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/placeholder');

  for (const item of items) {
    const stateColors = itemStates[item.state];
    const row = figma.createFrame();
    row.name = `item-${item.label}`;
    row.layoutMode = 'HORIZONTAL';
    row.counterAxisAlignItems = 'CENTER';
    row.primaryAxisSizingMode = 'AUTO';

    const hPath = resolveHeight(md['item-height']);
    if (hPath) {
      const hVar = heights[hPath];
      if (hVar) row.setBoundVariable('height', hVar);
      row.counterAxisSizingMode = 'FIXED';
    }

    // Indent based on depth
    row.paddingLeft = (item.depth * indentPx) + 8;

    const xpPath = resolveScale(md['x-padding']);
    if (xpPath) { const v = primSpacing[xpPath]; if (v) row.setBoundVariable('paddingRight', v); }
    const gapPath = resolveScale(md.gap);
    if (gapPath) { const v = primSpacing[gapPath]; if (v) row.setBoundVariable('itemSpacing', v); }

    const bgVar = stateColors.bg === 'transparent' ? null : semColors[stateColors.bg];
    if (bgVar) {
      row.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }, 'color', bgVar
      )];
    } else {
      row.fills = [];
    }

    // tree items don't use radius

    // Expand icon (parent nodes only) — chevron-down, all shown expanded
    if (item.isParent) {
      const chevronComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/chevron-down');
      if (chevronComp) {
        const expandIcon = chevronComp.createInstance();
        expandIcon.name = 'expand-icon';
        const eiPath = resolveIcon(md['expand-icon']);
        const eiVar = eiPath ? primIconSize[eiPath] : null;
        if (eiVar) { expandIcon.setBoundVariable('width', eiVar); expandIcon.setBoundVariable('height', eiVar); }
        const iconFgVar = semColors[stateColors['icon-fg']];
        if (iconFgVar) {
          const vecs = expandIcon.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
          const paint = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', iconFgVar)];
          for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
        }
        row.appendChild(expandIcon);
      }
    }

    // File/folder icon
    if (iconComp) {
      const fileIcon = iconComp.createInstance();
      fileIcon.name = 'icon';
      const iconPath = resolveIcon(md['icon-size']);
      const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
      if (iconSizeVar) { fileIcon.setBoundVariable('width', iconSizeVar); fileIcon.setBoundVariable('height', iconSizeVar); }
      const iconFgVar = semColors[stateColors['icon-fg']];
      if (iconFgVar) {
        const vecs = fileIcon.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
        const paint = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', iconFgVar)];
        for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
      }
      row.appendChild(fileIcon);
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

    tree.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
  }

  frame.appendChild(tree);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Tree View', count: 1 };
}
