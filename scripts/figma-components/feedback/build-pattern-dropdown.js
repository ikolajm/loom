// =============================================================================
// Dropdown Menu — Frame Pattern Mock
// =============================================================================
// List of item-rows with hover state on one item.
// Surface-2 bg, shadow-2, component radius.
// =============================================================================

function buildPatternDropdown(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primHeight } = lookups;
  const config = CONFIG.components['dropdown-menu'];
  const colors = config.variants.default;
  const md = config.sizes.md;

  function getEffectStyle(ref) {
    if (!ref) return null;
    const styles = figma.getLocalEffectStyles();
    return styles.find(s => s.name === ref.replace('effects/shadow-', 'shadow/')) || null;
  }

  const frame = createSectionFrame('base.pattern-dropdown', lookups);
  addHeader(frame, 'Dropdown Menu', 'Frame pattern — item list with hover state. Surface-2 bg, shadow-2.');

  const menu = figma.createFrame();
  menu.name = 'dropdown-mock';
  menu.layoutMode = 'VERTICAL';
  menu.primaryAxisSizingMode = 'AUTO';
  menu.counterAxisSizingMode = 'FIXED';
  menu.resize(200, menu.height);

  // Background
  const bgVar = semColors[colors.bg];
  if (bgVar) menu.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.92, g: 0.92, b: 0.92 } }, 'color', bgVar
  )];

  // Radius
  const radVar = semRadius[md.radius];
  if (radVar) { menu.setBoundVariable('topLeftRadius', radVar); menu.setBoundVariable('topRightRadius', radVar); menu.setBoundVariable('bottomLeftRadius', radVar); menu.setBoundVariable('bottomRightRadius', radVar); }

  // Padding
  const yp = resolveScale(md['y-padding']); if (yp) { const v = primSpacing[yp]; if (v) { menu.setBoundVariable('paddingTop', v); menu.setBoundVariable('paddingBottom', v); } }

  // Gap
  const gp = resolveScale(md.gap); if (gp) { const v = primSpacing[gp]; if (v) menu.setBoundVariable('itemSpacing', v); }

  // Shadow
  const es = getEffectStyle(colors.shadow); if (es) menu.effectStyleId = es.id;

  // Items
  const items = ['Edit', 'Duplicate', 'Archive', 'Delete'];
  const fgVar = semColors[colors.fg];
  const hoverBgVar = semColors[colors['hover-bg']];
  const fontSize = parsePx(md['font-size']);
  const lineHeight = parsePx(md['line-height']);

  // Item height
  const itemHeightPath = resolveHeight(md['item-height']);
  const itemHeightVar = itemHeightPath ? primHeight[itemHeightPath] : null;

  for (let i = 0; i < items.length; i++) {
    const row = figma.createFrame();
    row.name = `item-${items[i].toLowerCase()}`;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisAlignItems = 'CENTER';

    if (itemHeightVar) {
      row.setBoundVariable('height', itemHeightVar);
      row.counterAxisSizingMode = 'FIXED';
    }

    // X-padding
    const xp = resolveScale(md['x-padding']); if (xp) { const v = primSpacing[xp]; if (v) { row.setBoundVariable('paddingLeft', v); row.setBoundVariable('paddingRight', v); } }

    // Hover state on second item
    if (i === 1 && hoverBgVar) {
      row.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }, 'color', hoverBgVar
      )];
    } else {
      row.fills = [];
    }

    const text = figma.createText();
    text.name = 'label';
    text.characters = items[i];
    applyTextStyle(text, 'action', 'md');
    if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    row.appendChild(text);
    menu.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
  }

  frame.appendChild(menu);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Dropdown', count: 1 };
}
