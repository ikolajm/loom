// =============================================================================
// Alert Dialog — Frame Pattern Mock
// =============================================================================
// Stricter dialog for destructive confirmations. No dismiss on click-outside.
// Demonstrates md size with title, description, cancel + destructive buttons.
// =============================================================================

function buildPatternAlertDialog(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing } = lookups;
  const config = CONFIG.components['alert-dialog'];
  const colors = config.variants.default;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-alert-dialog', lookups);
  addHeader(frame, 'Alert Dialog', 'Frame pattern — destructive confirmation dialog. No dismiss on click-outside.');

  const dialog = figma.createFrame();
  dialog.name = 'alert-dialog-mock';
  dialog.layoutMode = 'VERTICAL';
  dialog.primaryAxisSizingMode = 'AUTO';
  dialog.counterAxisSizingMode = 'FIXED';
  dialog.resize(parsePx(md['max-width']), dialog.height);

  const bgVar = semColors[colors.bg];
  if (bgVar) dialog.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.15, g: 0.15, b: 0.15 } }, 'color', bgVar
  )];

  const radVar = semRadius[md.radius];
  if (radVar) { dialog.setBoundVariable('topLeftRadius', radVar); dialog.setBoundVariable('topRightRadius', radVar); dialog.setBoundVariable('bottomLeftRadius', radVar); dialog.setBoundVariable('bottomRightRadius', radVar); }

  const xp = resolveScale(md['x-padding']); if (xp) { const v = primSpacing[xp]; if (v) { dialog.setBoundVariable('paddingLeft', v); dialog.setBoundVariable('paddingRight', v); } }
  const yp = resolveScale(md['y-padding']); if (yp) { const v = primSpacing[yp]; if (v) { dialog.setBoundVariable('paddingTop', v); dialog.setBoundVariable('paddingBottom', v); } }
  const gap = resolveScale(md.gap); if (gap) { const v = primSpacing[gap]; if (v) dialog.setBoundVariable('itemSpacing', v); }

  const fgVar = semColors[colors.fg];

  // Title
  const title = figma.createText();
  title.name = 'title';
  title.characters = 'Are you sure?';
  applyTextStyle(title, 'title', 'md');
  if (fgVar) title.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', fgVar
  )];
  dialog.appendChild(title);

  // Description
  const desc = figma.createText();
  desc.name = 'description';
  desc.characters = 'This action cannot be undone. This will permanently delete your data.';
  applyTextStyle(desc, 'body', 'md');
  if (fgVar) desc.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.7, g: 0.7, b: 0.7 } }, 'color', fgVar
  )];
  dialog.appendChild(desc);
  desc.layoutSizingHorizontal = 'FILL';

  // Button row
  const buttons = figma.createFrame();
  buttons.name = 'actions';
  buttons.layoutMode = 'HORIZONTAL';
  buttons.primaryAxisSizingMode = 'AUTO';
  buttons.counterAxisSizingMode = 'AUTO';
  buttons.primaryAxisAlignItems = 'MAX';
  buttons.itemSpacing = 8;
  buttons.fills = [];

  for (const label of ['Cancel', 'Delete']) {
    const btn = figma.createFrame();
    btn.name = `btn-${label.toLowerCase()}`;
    btn.layoutMode = 'HORIZONTAL';
    btn.primaryAxisAlignItems = 'CENTER';
    btn.counterAxisAlignItems = 'CENTER';
    btn.primaryAxisSizingMode = 'AUTO';
    btn.counterAxisSizingMode = 'AUTO';
    btn.paddingLeft = 16; btn.paddingRight = 16;
    btn.paddingTop = 8; btn.paddingBottom = 8;

    const btnRadVar = semRadius['radius/component'];
    if (btnRadVar) { btn.setBoundVariable('topLeftRadius', btnRadVar); btn.setBoundVariable('topRightRadius', btnRadVar); btn.setBoundVariable('bottomLeftRadius', btnRadVar); btn.setBoundVariable('bottomRightRadius', btnRadVar); }

    if (label === 'Delete') {
      const errBg = semColors['color/error/error'];
      if (errBg) btn.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.8, g: 0.2, b: 0.2 } }, 'color', errBg)];
    } else {
      const surfBg = semColors['color/surface/surface-3'];
      if (surfBg) btn.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }, 'color', surfBg)];
    }

    const btnText = figma.createText();
    btnText.name = 'label';
    btnText.characters = label;
    applyTextStyle(btnText, 'action', 'md');
    const btnFg = label === 'Delete' ? semColors['color/common/on-color'] : fgVar;
    if (btnFg) btnText.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', btnFg)];
    btn.appendChild(btnText);
    buttons.appendChild(btn);
  }

  dialog.appendChild(buttons);
  buttons.layoutSizingHorizontal = 'FILL';
  frame.appendChild(dialog);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Alert Dialog', count: 1 };
}
