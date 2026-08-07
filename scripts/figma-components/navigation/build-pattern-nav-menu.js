// =============================================================================
// Navigation Menu — Frame Pattern Mock
// =============================================================================
// Horizontal menu bar with items. Shows active item highlighted.
// For site-level navigation (marketing, content sites).
// =============================================================================

function buildPatternNavMenu(lookups, defaultMode, page) {
  const { semColors, primSpacing, heights } = lookups;
  const config = CONFIG.components['navigation-menu'];
  const colors = config.variants.default;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-nav-menu', lookups);
  addHeader(frame, 'Navigation Menu', 'Frame pattern — horizontal menu bar for site-level navigation.');

  const menuBar = figma.createFrame();
  menuBar.name = 'nav-menu';
  menuBar.layoutMode = 'HORIZONTAL';
  menuBar.primaryAxisSizingMode = 'AUTO';
  menuBar.counterAxisSizingMode = 'AUTO';
  menuBar.counterAxisAlignItems = 'CENTER';
  menuBar.fills = [];
  menuBar.itemSpacing = 0;

  const items = [
    { label: 'Products', active: true },
    { label: 'Solutions', active: false },
    { label: 'Pricing', active: false },
    { label: 'Resources', active: false }
  ];

  const activeFgVar = semColors[colors['active-fg']];
  const fgVar = semColors[colors.fg];
  const hoverBgVar = semColors[colors['hover-bg']];

  for (const item of items) {
    const menuItem = figma.createFrame();
    menuItem.name = `item-${item.label.toLowerCase()}`;
    menuItem.layoutMode = 'HORIZONTAL';
    menuItem.primaryAxisAlignItems = 'CENTER';
    menuItem.counterAxisAlignItems = 'CENTER';

    const hPath = resolveHeight(md['item-height']);
    if (hPath) {
      const hVar = heights[hPath];
      if (hVar) menuItem.setBoundVariable('height', hVar);
      menuItem.counterAxisSizingMode = 'FIXED';
    }

    const xpPath = resolveScale(md['item-x-padding']);
    if (xpPath) { const v = primSpacing[xpPath]; if (v) { menuItem.setBoundVariable('paddingLeft', v); menuItem.setBoundVariable('paddingRight', v); } }

    menuItem.fills = [];

    const label = figma.createText();
    label.name = 'label';
    label.characters = item.label;
    applyTextStyle(label, 'action', 'md');
    const textVar = item.active ? activeFgVar : fgVar;
    if (textVar) label.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', textVar
    )];
    menuItem.appendChild(label);

    menuBar.appendChild(menuItem);
  }

  frame.appendChild(menuBar);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Nav Menu', count: 1 };
}
