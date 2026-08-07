// =============================================================================
// Pagination — Frame Pattern Mock
// =============================================================================
// Numbered page navigation with active page highlighted.
// Shows prev chevron, page numbers 1-5, next chevron.
// =============================================================================

function buildPatternPagination(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights, primIconSize } = lookups;
  const config = CONFIG.components.pagination;
  const colors = config.variants.default;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-pagination', lookups);
  addHeader(frame, 'Pagination', 'Frame pattern — numbered page navigation with active highlight.');

  const strip = figma.createFrame();
  strip.name = 'pagination';
  strip.layoutMode = 'HORIZONTAL';
  strip.primaryAxisSizingMode = 'AUTO';
  strip.counterAxisSizingMode = 'AUTO';
  strip.counterAxisAlignItems = 'CENTER';
  strip.fills = [];

  const gapPath = resolveScale(md.gap);
  if (gapPath) { const v = primSpacing[gapPath]; if (v) strip.setBoundVariable('itemSpacing', v); }

  const pageItems = ['prev', '1', '2', '3', '4', '5', 'next'];
  const activePage = '2';

  const activeBgVar = semColors[colors['active-bg']];
  const activeFgVar = semColors[colors['active-fg']];
  const fgVar = semColors[colors.fg];
  const radVar = semRadius[md.radius];

  const iconPath = resolveIcon(md['icon-size']);
  const iconSizeVar = iconPath ? primIconSize[iconPath] : null;

  for (const p of pageItems) {
    const isNav = p === 'prev' || p === 'next';
    const isActive = p === activePage;

    const item = figma.createFrame();
    item.name = `page-${p}`;
    item.layoutMode = 'HORIZONTAL';
    item.primaryAxisAlignItems = 'CENTER';
    item.counterAxisAlignItems = 'CENTER';

    const hPath = resolveHeight(md['item-size']);
    if (hPath) {
      const hVar = heights[hPath];
      if (hVar) {
        item.setBoundVariable('width', hVar);
        item.setBoundVariable('height', hVar);
      }
      item.primaryAxisSizingMode = 'FIXED';
      item.counterAxisSizingMode = 'FIXED';
    }

    if (radVar) {
      item.setBoundVariable('topLeftRadius', radVar);
      item.setBoundVariable('topRightRadius', radVar);
      item.setBoundVariable('bottomLeftRadius', radVar);
      item.setBoundVariable('bottomRightRadius', radVar);
    }

    if (isActive && activeBgVar) {
      item.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.8 } }, 'color', activeBgVar
      )];
    } else {
      item.fills = [];
    }

    if (isNav) {
      // Use chevron icon for prev/next
      const iconName = p === 'prev' ? 'icon/chevron-left' : 'icon/chevron-right';
      const chevronComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === iconName);
      if (chevronComp) {
        const inst = chevronComp.createInstance();
        inst.name = 'icon';
        if (iconSizeVar) { inst.setBoundVariable('width', iconSizeVar); inst.setBoundVariable('height', iconSizeVar); }
        if (fgVar) {
          const vecs = inst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
          const paint = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', fgVar)];
          for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
        }
        item.appendChild(inst);
      }
    } else {
      // Page number
      const label = figma.createText();
      label.name = 'label';
      label.characters = p;
      applyTextStyle(label, 'action', 'md');
      label.textAlignHorizontal = 'CENTER';
      const textVar = isActive ? activeFgVar : fgVar;
      if (textVar) label.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', textVar
      )];
      item.appendChild(label);
    }

    strip.appendChild(item);
  }

  frame.appendChild(strip);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Pagination', count: 1 };
}
