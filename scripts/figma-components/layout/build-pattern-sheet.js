// =============================================================================
// Sheet / Drawer — Frame Pattern Mock
// =============================================================================
// Shows a bottom sheet example with drag handle and content area.
// Surface-2 bg, scrim overlay, modal radius on top corners.
// =============================================================================

function buildPatternSheet(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primIconSize } = lookups;
  const config = CONFIG.components.sheet;
  const colors = config.variants.default;
  const md = config.sizes.md;
  const handle = config.handle;

  const frame = createSectionFrame('base.pattern-sheet', lookups);
  addHeader(frame, 'Sheet / Drawer', 'Frame pattern — overlay panel with drag handle. Bottom sheet and side drawer variants.');

  // Container simulating a screen with scrim
  const screen = figma.createFrame();
  screen.name = 'sheet-example';
  screen.resize(320, 400);
  screen.layoutMode = 'VERTICAL';
  screen.primaryAxisAlignItems = 'MAX';
  screen.counterAxisAlignItems = 'MIN';
  screen.primaryAxisSizingMode = 'FIXED';
  screen.counterAxisSizingMode = 'FIXED';

  // Scrim
  const overlayVar = semColors[colors.overlay];
  if (overlayVar) screen.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', overlayVar
  )];

  // Sheet panel
  const sheet = figma.createFrame();
  sheet.name = 'sheet-panel';
  sheet.layoutMode = 'VERTICAL';
  sheet.primaryAxisSizingMode = 'AUTO';
  sheet.counterAxisAlignItems = 'CENTER';
  sheet.resize(320, sheet.height);

  const bgVar = semColors[colors.bg];
  if (bgVar) sheet.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bgVar
  )];

  // Top corners only
  const radVar = semRadius[md.radius];
  if (radVar) {
    sheet.setBoundVariable('topLeftRadius', radVar);
    sheet.setBoundVariable('topRightRadius', radVar);
  }

  if (colors.shadow) {
    const styles = figma.getLocalEffectStyles();
    const styleName = colors.shadow.replace('effects/shadow-', 'shadow/');
    const effectStyle = styles.find(s => s.name === styleName);
    if (effectStyle) sheet.effectStyleId = effectStyle.id;
  }

  const xpPath = resolveScale(md['x-padding']);
  if (xpPath) { const v = primSpacing[xpPath]; if (v) { sheet.setBoundVariable('paddingLeft', v); sheet.setBoundVariable('paddingRight', v); } }
  const ypPath = resolveScale(md['y-padding']);
  if (ypPath) { const v = primSpacing[ypPath]; if (v) { sheet.setBoundVariable('paddingTop', v); sheet.setBoundVariable('paddingBottom', v); } }
  const gapPath = resolveScale(md.gap);
  if (gapPath) { const v = primSpacing[gapPath]; if (v) sheet.setBoundVariable('itemSpacing', v); }

  // Drag handle
  const handleBar = figma.createFrame();
  handleBar.name = 'drag-handle';
  const handleWidthPath = resolveScale(handle.width);
  const handleHeightPath = resolveScale(handle.height);
  handleBar.resize(40, 4);
  if (handleWidthPath) { const v = primSpacing[handleWidthPath]; if (v) handleBar.setBoundVariable('width', v); }
  if (handleHeightPath) { const v = primSpacing[handleHeightPath]; if (v) handleBar.setBoundVariable('height', v); }
  const handleBgVar = semColors[handle.bg];
  if (handleBgVar) handleBar.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', handleBgVar
  )];
  const handleRadVar = semRadius[handle.radius];
  if (handleRadVar) {
    handleBar.setBoundVariable('topLeftRadius', handleRadVar);
    handleBar.setBoundVariable('topRightRadius', handleRadVar);
    handleBar.setBoundVariable('bottomLeftRadius', handleRadVar);
    handleBar.setBoundVariable('bottomRightRadius', handleRadVar);
  }
  sheet.appendChild(handleBar);

  // Content placeholder
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
  title.characters = 'Sheet Title';
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

  sheet.appendChild(headerRow);
  headerRow.layoutSizingHorizontal = 'FILL';

  const body = figma.createText();
  body.name = 'body';
  body.characters = 'Sheet content area. Dismiss via scrim click, escape, or drag down.';
  applyTextStyle(body, 'body', 'md');
  if (fgVar) body.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
  )];
  sheet.appendChild(body);
  body.layoutSizingHorizontal = 'FILL';

  screen.appendChild(sheet);
  sheet.layoutSizingHorizontal = 'FILL';

  frame.appendChild(screen);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Sheet', count: 1 };
}
