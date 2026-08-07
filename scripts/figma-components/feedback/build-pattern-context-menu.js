// =============================================================================
// Context Menu — Frame Pattern Mock
// =============================================================================
// Right-click menu. Same visual styling as dropdown-menu, different trigger.
// Demonstrates md size with items, separator, and keyboard shortcuts.
// =============================================================================

function buildPatternContextMenu(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights } = lookups;
  const config = CONFIG.components['context-menu'];
  const colors = config.variants.default;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-context-menu', lookups);
  addHeader(frame, 'Context Menu', 'Frame pattern — right-click triggered menu. Shares dropdown-menu styling.');

  const menu = figma.createFrame();
  menu.name = 'context-menu-mock';
  menu.layoutMode = 'VERTICAL';
  menu.primaryAxisSizingMode = 'AUTO';
  menu.counterAxisSizingMode = 'FIXED';
  menu.resize(200, menu.height);

  const bgVar = semColors[colors.bg];
  if (bgVar) menu.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.15, g: 0.15, b: 0.15 } }, 'color', bgVar
  )];

  const radVar = semRadius[md.radius];
  if (radVar) { menu.setBoundVariable('topLeftRadius', radVar); menu.setBoundVariable('topRightRadius', radVar); menu.setBoundVariable('bottomLeftRadius', radVar); menu.setBoundVariable('bottomRightRadius', radVar); }

  function getEffectStyle(ref) {
    if (!ref) return null;
    const styles = figma.getLocalEffectStyles();
    return styles.find(s => s.name === ref.replace('effects/shadow-', 'shadow/')) || null;
  }
  const es = getEffectStyle(colors.shadow); if (es) menu.effectStyleId = es.id;

  const yp = resolveScale(md['y-padding']); if (yp) { const v = primSpacing[yp]; if (v) { menu.setBoundVariable('paddingTop', v); menu.setBoundVariable('paddingBottom', v); } }
  const gap = resolveScale(md.gap); if (gap) { const v = primSpacing[gap]; if (v) menu.setBoundVariable('itemSpacing', v); }

  const fgVar = semColors[colors.fg];
  const hoverBgVar = semColors[colors['hover-bg']];
  const items = [
    { label: 'Cut', shortcut: 'Cmd+X', hover: false },
    { label: 'Copy', shortcut: 'Cmd+C', hover: true },
    { label: 'Paste', shortcut: 'Cmd+V', hover: false },
    { label: 'sep', shortcut: null, hover: false },
    { label: 'Delete', shortcut: null, hover: false },
  ];

  for (const item of items) {
    if (item.label === 'sep') {
      const sep = figma.createFrame();
      sep.name = 'separator';
      sep.resize(200, 1);
      sep.layoutAlign = 'STRETCH';
      const sepColor = semColors['color/outline/outline-subtle'];
      if (sepColor) sep.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }, 'color', sepColor)];
      menu.appendChild(sep);
      continue;
    }

    const row = figma.createFrame();
    row.name = `item-${item.label.toLowerCase()}`;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.primaryAxisAlignItems = 'SPACE_BETWEEN';
    row.counterAxisAlignItems = 'CENTER';

    const ihVar = heights[resolveHeight(md['item-height'])];
    if (ihVar) row.setBoundVariable('height', ihVar);
    const ixp = resolveScale(md['x-padding']); if (ixp) { const v = primSpacing[ixp]; if (v) { row.setBoundVariable('paddingLeft', v); row.setBoundVariable('paddingRight', v); } }

    if (item.hover && hoverBgVar) row.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }, 'color', hoverBgVar)];
    else row.fills = [];

    const text = figma.createText();
    text.name = 'label';
    text.characters = item.label;
    applyTextStyle(text, 'action', 'md');
    if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', fgVar)];
    row.appendChild(text);

    if (item.shortcut) {
      const sc = figma.createText();
      sc.name = 'shortcut';
      sc.characters = item.shortcut;
      applyTextStyle(sc, 'label', 'sm');
      const scFg = semColors['color/surface/on-surface-variant'];
      if (scFg) sc.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', scFg)];
      row.appendChild(sc);
    }

    menu.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
  }

  frame.appendChild(menu);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Context Menu', count: 1 };
}
