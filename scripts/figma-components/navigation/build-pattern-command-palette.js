// =============================================================================
// Command Palette — Frame Pattern Mock
// =============================================================================
// Cmd+K overlay with search input and grouped result items.
// Shows the palette open with a search query and 3 results.
// =============================================================================

function buildPatternCommandPalette(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights } = lookups;
  const config = CONFIG.components['command-palette'];
  const colors = config.variants.default;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-command-palette', lookups);
  addHeader(frame, 'Command Palette', 'Frame pattern — Cmd+K search overlay with grouped results.');

  const palette = figma.createFrame();
  palette.name = 'command-palette';
  palette.layoutMode = 'VERTICAL';
  palette.primaryAxisSizingMode = 'AUTO';
  palette.counterAxisSizingMode = 'FIXED';
  palette.resize(parsePx(md['max-width']) || 560, palette.height);
  palette.itemSpacing = 0;

  const bgVar = semColors[colors.bg];
  if (bgVar) palette.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.15, g: 0.15, b: 0.15 } }, 'color', bgVar
  )];

  const borderVar = semColors[colors.border];
  if (borderVar) {
    palette.strokes = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }, 'color', borderVar
    )];
    palette.strokeWeight = 1;
  }

  const radVar = semRadius[md.radius];
  if (radVar) {
    palette.setBoundVariable('topLeftRadius', radVar);
    palette.setBoundVariable('topRightRadius', radVar);
    palette.setBoundVariable('bottomLeftRadius', radVar);
    palette.setBoundVariable('bottomRightRadius', radVar);
  }

  if (colors.shadow) {
    const styles = figma.getLocalEffectStyles();
    const styleName = colors.shadow.replace('effects/shadow-', 'shadow/');
    const effectStyle = styles.find(s => s.name === styleName);
    if (effectStyle) palette.effectStyleId = effectStyle.id;
  }

  // --- Search input ---
  const inputRow = figma.createFrame();
  inputRow.name = 'search-input';
  inputRow.layoutMode = 'HORIZONTAL';
  inputRow.counterAxisAlignItems = 'CENTER';
  inputRow.primaryAxisSizingMode = 'AUTO';
  inputRow.fills = [];

  const ihPath = resolveHeight(md['input-height']);
  if (ihPath) {
    const hVar = heights[ihPath];
    if (hVar) inputRow.setBoundVariable('height', hVar);
    inputRow.counterAxisSizingMode = 'FIXED';
  }

  const ixpPath = resolveScale(md['input-x-padding']);
  if (ixpPath) { const v = primSpacing[ixpPath]; if (v) { inputRow.setBoundVariable('paddingLeft', v); inputRow.setBoundVariable('paddingRight', v); } }

  const inputFgVar = semColors[config.input.fg];
  const searchText = figma.createText();
  searchText.name = 'query';
  searchText.characters = 'Search...';
  applyTextStyle(searchText, 'input', 'md');
  const phVar = semColors[config.input['placeholder-fg']];
  if (phVar) searchText.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', phVar
  )];
  inputRow.appendChild(searchText);
  searchText.layoutSizingHorizontal = 'FILL';

  palette.appendChild(inputRow);
  inputRow.layoutSizingHorizontal = 'FILL';

  // --- Divider ---
  if (borderVar) {
    const divider = figma.createFrame();
    divider.name = 'divider';
    divider.resize(560, 1);
    divider.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }, 'color', borderVar
    )];
    palette.appendChild(divider);
    divider.layoutSizingHorizontal = 'FILL';
  }

  // --- Group label ---
  const groupLabel = figma.createText();
  groupLabel.name = 'group-label';
  groupLabel.characters = 'PAGES';
  applyTextStyle(groupLabel, 'label', 'sm');
  const groupFgVar = semColors[config['group-label'].fg];
  if (groupFgVar) groupLabel.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', groupFgVar
  )];
  const glPad = figma.createFrame();
  glPad.name = 'group-label-wrap';
  glPad.layoutMode = 'HORIZONTAL';
  glPad.primaryAxisSizingMode = 'AUTO';
  glPad.counterAxisSizingMode = 'AUTO';
  glPad.fills = [];
  glPad.paddingTop = 8; glPad.paddingBottom = 4;
  const glxpPath = resolveScale(md['item-x-padding']);
  if (glxpPath) { const v = primSpacing[glxpPath]; if (v) { glPad.setBoundVariable('paddingLeft', v); glPad.setBoundVariable('paddingRight', v); } }
  glPad.appendChild(groupLabel);
  palette.appendChild(glPad);
  glPad.layoutSizingHorizontal = 'FILL';

  // --- Result items ---
  const results = ['Dashboard', 'Settings', 'User Management'];
  const itemFgVar = semColors[config.item.state.default.fg];
  const activeBgVar = semColors[config.item.state.active.bg];

  for (let i = 0; i < results.length; i++) {
    const item = figma.createFrame();
    item.name = `result-${i}`;
    item.layoutMode = 'HORIZONTAL';
    item.counterAxisAlignItems = 'CENTER';
    item.primaryAxisSizingMode = 'AUTO';

    const itemHPath = resolveHeight(md['item-height']);
    if (itemHPath) {
      const hVar = heights[itemHPath];
      if (hVar) item.setBoundVariable('height', hVar);
      item.counterAxisSizingMode = 'FIXED';
    }

    const itemXpPath = resolveScale(md['item-x-padding']);
    if (itemXpPath) { const v = primSpacing[itemXpPath]; if (v) { item.setBoundVariable('paddingLeft', v); item.setBoundVariable('paddingRight', v); } }

    // First item shows active/highlight state
    if (i === 0 && activeBgVar) {
      item.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }, 'color', activeBgVar
      )];
    } else {
      item.fills = [];
    }

    const label = figma.createText();
    label.name = 'label';
    label.characters = results[i];
    applyTextStyle(label, 'action', 'md');
    if (itemFgVar) label.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', itemFgVar
    )];
    item.appendChild(label);
    label.layoutSizingHorizontal = 'FILL';

    palette.appendChild(item);
    item.layoutSizingHorizontal = 'FILL';
  }

  frame.appendChild(palette);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Command Palette', count: 1 };
}
