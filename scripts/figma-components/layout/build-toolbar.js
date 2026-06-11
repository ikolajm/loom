// =============================================================================
// Toolbar — Frame Pattern Mock
// =============================================================================
// Horizontal container for grouped actions — houses buttons, toggles,
// separators, dropdowns. Children render as-is. Moved Buttons → Layout in v2.
// Shown at md with a few ghost action cells + a separator. NOT a component —
// frame pattern for per-project application.
// =============================================================================

function buildToolbar(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primIconSize } = lookups;
  const config = CONFIG.components.toolbar;
  const colors = config.variants.default;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.toolbar', lookups);
  addHeader(frame, 'Toolbar', 'Frame pattern — horizontal container for grouped actions (buttons, toggles, separators). Children render as-is.');

  function bindRadius(node, radVar) {
    if (!radVar) return;
    node.setBoundVariable('topLeftRadius', radVar);
    node.setBoundVariable('topRightRadius', radVar);
    node.setBoundVariable('bottomLeftRadius', radVar);
    node.setBoundVariable('bottomRightRadius', radVar);
  }

  const fgVar = semColors[colors.fg];
  const borderVar = semColors[colors.border];

  // The bar — surface-1 fill, subtle border, component radius, padded + gapped.
  const bar = figma.createFrame();
  bar.name = 'toolbar';
  bar.layoutMode = 'HORIZONTAL';
  bar.primaryAxisSizingMode = 'AUTO';
  bar.counterAxisSizingMode = 'AUTO';
  bar.counterAxisAlignItems = 'CENTER';

  const bgVar = semColors[colors.bg];
  if (bgVar) bar.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bgVar
  )];
  if (borderVar) {
    bar.strokes = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
    )];
    bar.strokeWeight = 1;
  }
  bindRadius(bar, semRadius['radius/component']);

  const xpPath = resolveScale(md['x-padding']);
  if (xpPath) { const v = primSpacing[xpPath]; if (v) { bar.setBoundVariable('paddingLeft', v); bar.setBoundVariable('paddingRight', v); } }
  const ypPath = resolveScale(md['y-padding']);
  if (ypPath) { const v = primSpacing[ypPath]; if (v) { bar.setBoundVariable('paddingTop', v); bar.setBoundVariable('paddingBottom', v); } }
  const gapPath = resolveScale(md.gap);
  if (gapPath) { const v = primSpacing[gapPath]; if (v) bar.setBoundVariable('itemSpacing', v); }

  // Ghost action cell — square with a centered icon placeholder.
  function actionItem() {
    const cell = figma.createFrame();
    cell.name = 'action';
    cell.layoutMode = 'HORIZONTAL';
    cell.primaryAxisAlignItems = 'CENTER';
    cell.counterAxisAlignItems = 'CENTER';
    cell.fills = [];
    bindRadius(cell, semRadius['radius/component']);

    const padPath = resolveScale('{scale.2}');
    if (padPath) {
      const v = primSpacing[padPath];
      if (v) { cell.setBoundVariable('paddingLeft', v); cell.setBoundVariable('paddingRight', v); cell.setBoundVariable('paddingTop', v); cell.setBoundVariable('paddingBottom', v); }
    }

    const iconPath = resolveIcon('icon/icon-2');
    const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
    const icon = makeIcon('icon/placeholder', fgVar, iconSizeVar);
    if (icon) { icon.name = 'icon'; cell.appendChild(icon); }
    return cell;
  }

  // Thin vertical separator between action groups.
  function separator() {
    const sep = figma.createFrame();
    sep.name = 'separator';
    sep.layoutMode = 'NONE';
    sep.resize(1, 20);
    if (borderVar) sep.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
    )];
    return sep;
  }

  bar.appendChild(actionItem());
  bar.appendChild(actionItem());
  bar.appendChild(actionItem());
  bar.appendChild(separator());
  bar.appendChild(actionItem());
  bar.appendChild(actionItem());

  frame.appendChild(bar);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Toolbar', count: 1 };
}
