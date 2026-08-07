// =============================================================================
// Dropdown Menu — Frame Pattern Mock
// =============================================================================
// One menu per size tier, each a list of item-rows with hover state on one item.
// Surface-2 bg, shadow-2, component radius.
//
// The size ladder is built from config rather than pinned to md. The code atom has
// always carried sm/md/lg — distinct item heights off the menu-item ladder, distinct
// padding and type — and this pattern rendered only md, so the Figma file understated
// what the component offers and read as though no ladder existed.
// =============================================================================

function buildPatternDropdown(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights } = lookups;
  const config = CONFIG.components['dropdown-menu'];
  const colors = config.variants.default;
  const sizeNames = Object.keys(config.sizes).filter((k) => !k.startsWith('$'));

  function getEffectStyle(ref) {
    if (!ref) return null;
    const styles = figma.getLocalEffectStyles();
    return styles.find(s => s.name === ref.replace('effects/shadow-', 'shadow/')) || null;
  }

  const frame = createSectionFrame('base.pattern-dropdown', lookups);
  addHeader(frame, 'Dropdown Menu', `Frame pattern — item list with hover state. Surface-2 bg, shadow-2. ${sizeNames.length} sizes, item height off the menu-item ladder.`);

  // Named sizesRow, not row — the item loop below already binds `row` per item.
  const sizesRow = figma.createFrame();
  sizesRow.name = 'dropdown-sizes';
  sizesRow.layoutMode = 'HORIZONTAL';
  sizesRow.primaryAxisSizingMode = 'AUTO';
  sizesRow.counterAxisSizingMode = 'AUTO';
  sizesRow.counterAxisAlignItems = 'MIN';
  sizesRow.itemSpacing = 32;
  sizesRow.fills = [];

  for (const sizeName of sizeNames) {
  const md = config.sizes[sizeName];

  const menu = figma.createFrame();
  menu.name = `dropdown-mock-${sizeName}`;
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

  // Item height
  const itemHeightPath = resolveHeight(md['item-height']);
  const itemHeightVar = itemHeightPath ? heights[itemHeightPath] : null;

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
    applyTextStyle(text, ...((md.text || 'body/' + sizeName).split('/')));
    if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    row.appendChild(text);
    menu.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
  }

  // Label the tier so the ladder is legible without measuring.
  const column = figma.createFrame();
  column.name = `size-${sizeName}`;
  column.layoutMode = 'VERTICAL';
  column.primaryAxisSizingMode = 'AUTO';
  column.counterAxisSizingMode = 'AUTO';
  column.itemSpacing = 8;
  column.fills = [];

  const caption = figma.createText();
  caption.name = 'size-label';
  caption.characters = sizeName;
  applyTextStyle(caption, 'label', 'sm');
  const captionVar = semColors['color/surface/on-surface-variant'];
  if (captionVar) caption.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', captionVar
  )];

  column.appendChild(caption);
  column.appendChild(menu);
  sizesRow.appendChild(column);
  }

  frame.appendChild(sizesRow);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Dropdown', count: sizeNames.length };
}
