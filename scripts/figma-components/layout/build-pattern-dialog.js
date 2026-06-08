// =============================================================================
// Dialog — Frame Pattern Mock
// =============================================================================
// Scrim overlay + centered dialog box demonstration.
// Container uses no auto-layout — scrim and dialog are manually positioned.
// Dialog box: surface-2 bg, radius/modal, shadow-3, padded content.
// =============================================================================

function buildPatternDialog(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primIconSize } = lookups;
  const dialogConfig = CONFIG.components.dialog;
  const colors = dialogConfig.variants.default;
  const md = dialogConfig.sizes.md;

  // Effect style lookup
  function getEffectStyle(configRef) {
    if (!configRef || configRef === 'none') return null;
    const styles = figma.getLocalEffectStyles();
    const styleName = configRef.replace('effects/shadow-', 'shadow/');
    return styles.find(s => s.name === styleName) || null;
  }

  // Section frame
  const frame = createSectionFrame('base.pattern-dialog', lookups);
  addHeader(frame, 'Dialog', 'Frame pattern — modal overlay with scrim and centered dialog box.');

  // Mock container — represents the viewport, NO auto-layout
  const containerW = 560;
  const containerH = 360;
  const container = figma.createFrame();
  container.name = 'dialog-mock';
  container.resize(containerW, containerH);
  container.layoutMode = 'NONE';
  container.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
  container.clipsContent = true;

  // Scrim overlay — full size of container
  const scrim = figma.createRectangle();
  scrim.name = 'scrim-overlay';
  scrim.resize(containerW, containerH);
  scrim.x = 0;
  scrim.y = 0;
  const scrimVar = semColors[colors.overlay];
  if (scrimVar) {
    scrim.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', scrimVar
    )];
  }
  scrim.opacity = 0.32;
  container.appendChild(scrim);

  // Dialog box — auto-layout for content, manually centered in container
  // ~80% of container width for realistic proportions
  const dialogWidth = Math.round(containerW * 0.8);
  const dialogBox = figma.createFrame();
  dialogBox.name = 'dialog-box';
  dialogBox.layoutMode = 'VERTICAL';
  dialogBox.primaryAxisSizingMode = 'AUTO';
  dialogBox.counterAxisSizingMode = 'FIXED';
  dialogBox.resize(dialogWidth, dialogBox.height);
  dialogBox.primaryAxisAlignItems = 'MIN';
  dialogBox.counterAxisAlignItems = 'MIN';

  // Background
  const bgVar = semColors[colors.bg];
  if (bgVar) dialogBox.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }, 'color', bgVar
  )];

  // Radius
  const radVar = semRadius[md.radius];
  if (radVar) {
    dialogBox.setBoundVariable('topLeftRadius', radVar);
    dialogBox.setBoundVariable('topRightRadius', radVar);
    dialogBox.setBoundVariable('bottomLeftRadius', radVar);
    dialogBox.setBoundVariable('bottomRightRadius', radVar);
  }

  // Shadow
  const effectStyle = getEffectStyle(colors.shadow);
  if (effectStyle) dialogBox.effectStyleId = effectStyle.id;

  // Padding
  const xpPath = resolveScale(md['x-padding']);
  if (xpPath) {
    const v = primSpacing[xpPath];
    if (v) { dialogBox.setBoundVariable('paddingLeft', v); dialogBox.setBoundVariable('paddingRight', v); }
  }
  const ypPath = resolveScale(md['y-padding']);
  if (ypPath) {
    const v = primSpacing[ypPath];
    if (v) { dialogBox.setBoundVariable('paddingTop', v); dialogBox.setBoundVariable('paddingBottom', v); }
  }

  // Gap
  const gapPath = resolveScale(md.gap);
  if (gapPath) {
    const v = primSpacing[gapPath];
    if (v) dialogBox.setBoundVariable('itemSpacing', v);
  }

  // Dialog content
  const fgVar = semColors[colors.fg];

  // Header row — title + built-in close (X). showClose defaults true in v2.
  const headerRow = figma.createFrame();
  headerRow.name = 'header';
  headerRow.layoutMode = 'HORIZONTAL';
  headerRow.primaryAxisSizingMode = 'AUTO';
  headerRow.counterAxisSizingMode = 'AUTO';
  headerRow.counterAxisAlignItems = 'CENTER';
  headerRow.itemSpacing = 12;
  headerRow.fills = [];

  const title = figma.createText();
  title.name = 'title';
  title.characters = 'Confirm Action';
  applyTextStyle(title, 'title', 'md');
  if (fgVar) title.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
  )];
  headerRow.appendChild(title);
  title.layoutSizingHorizontal = 'FILL';

  const closeIconSizeVar = primIconSize[resolveIcon('icon/icon-2')];
  const closeMutedVar = semColors['color/surface/on-surface-variant'];
  const closeX = createCloseIcon(closeMutedVar, closeIconSizeVar);
  if (closeX) headerRow.appendChild(closeX);

  dialogBox.appendChild(headerRow);
  headerRow.layoutSizingHorizontal = 'FILL';

  const body = figma.createText();
  body.name = 'body';
  body.characters = 'Are you sure you want to proceed? This action cannot be undone.';
  applyTextStyle(body, 'body', 'md');
  if (fgVar) body.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
  )];
  dialogBox.appendChild(body);
  body.layoutSizingHorizontal = 'FILL';

  // Button row — right-aligned
  const btnRow = figma.createFrame();
  btnRow.name = 'button-row';
  btnRow.layoutMode = 'HORIZONTAL';
  btnRow.primaryAxisSizingMode = 'AUTO';
  btnRow.counterAxisSizingMode = 'AUTO';
  btnRow.primaryAxisAlignItems = 'MAX';
  btnRow.itemSpacing = 12;
  btnRow.fills = [];

  const cancelText = figma.createText();
  cancelText.name = 'cancel';
  cancelText.characters = 'Cancel';
  applyTextStyle(cancelText, 'action', 'md');
  if (fgVar) cancelText.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
  )];
  btnRow.appendChild(cancelText);

  const confirmText = figma.createText();
  confirmText.name = 'confirm';
  confirmText.characters = 'Confirm';
  applyTextStyle(confirmText, 'action', 'md');
  const primaryVar = semColors['color/primary/primary'];
  if (primaryVar) confirmText.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.8 } }, 'color', primaryVar
  )];
  btnRow.appendChild(confirmText);

  dialogBox.appendChild(btnRow);
  btnRow.layoutSizingHorizontal = 'FILL';

  // Add dialog to container, then center it manually
  container.appendChild(dialogBox);
  // Center horizontally and vertically after content has sized the dialog
  dialogBox.x = Math.round((containerW - dialogBox.width) / 2);
  dialogBox.y = Math.round((containerH - dialogBox.height) / 2);

  frame.appendChild(container);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Dialog', count: 1 };
}
