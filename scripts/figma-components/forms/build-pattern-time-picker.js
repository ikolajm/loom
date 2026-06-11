// =============================================================================
// Time Picker — Frame Pattern Mock
// =============================================================================
// Three composed select boxes (hour : minute : period), each a bordered box with
// a value + chevron. Option A — composes the Select shape. Browse reference: md.
// =============================================================================

function buildPatternTimePicker(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primHeight, primIconSize } = lookups;
  // Time picker delegates sizing to Select, which extends the text-field base.
  const baseConfig = resolveBase(CONFIG.components, 'select');
  const md = baseConfig.sizes.md;

  const frame = createSectionFrame('base.pattern-time-picker', lookups);
  addHeader(frame, 'Time Picker', 'Frame pattern — three composed selects (hour : minute : period). Shown at md.');

  const row = figma.createFrame();
  row.name = 'time-picker-md';
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisSizingMode = 'AUTO';
  row.counterAxisSizingMode = 'AUTO';
  row.counterAxisAlignItems = 'CENTER';
  row.fills = [];
  row.itemSpacing = 8;

  const segments = ['09', '30', 'AM'];
  const iconPath = resolveIcon('icon/icon-2');
  const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
  const radVar = semRadius['radius/input'];
  const bgVar = semColors['color/surface/surface'];
  const borderVar = semColors['color/outline/outline-subtle'];
  const fgVar = semColors['color/surface/on-surface'];
  const mutedVar = semColors['color/surface/on-surface-variant'];
  const hPath = resolveHeight(md.height);
  const padPath = resolveScale('{scale.3}');

  for (let i = 0; i < segments.length; i++) {
    const box = figma.createFrame();
    box.name = `select-${i}`;
    box.layoutMode = 'HORIZONTAL';
    box.counterAxisAlignItems = 'CENTER';
    box.primaryAxisSizingMode = 'AUTO';
    box.counterAxisSizingMode = 'FIXED';
    box.itemSpacing = 4;

    if (hPath) { const v = primHeight[hPath]; if (v) box.setBoundVariable('height', v); }
    if (padPath) { const v = primSpacing[padPath]; if (v) { box.setBoundVariable('paddingLeft', v); box.setBoundVariable('paddingRight', v); } }
    if (radVar) {
      box.setBoundVariable('topLeftRadius', radVar);
      box.setBoundVariable('topRightRadius', radVar);
      box.setBoundVariable('bottomLeftRadius', radVar);
      box.setBoundVariable('bottomRightRadius', radVar);
    }
    if (bgVar) box.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bgVar
    )];
    if (borderVar) {
      box.strokes = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
      )];
      box.strokeWeight = 1;
    }

    const value = figma.createText();
    value.name = 'value';
    value.characters = segments[i];
    applyTextStyle(value, 'input', 'md');
    if (fgVar) value.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    box.appendChild(value);

    const chevron = makeIcon('icon/chevron-down', mutedVar, iconSizeVar);
    if (chevron) { chevron.name = 'chevron'; box.appendChild(chevron); }

    row.appendChild(box);

    // Colon between hour and minute.
    if (i === 0) {
      const sep = figma.createText();
      sep.name = 'separator';
      sep.characters = ':';
      applyTextStyle(sep, 'input', 'md');
      if (mutedVar) sep.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', mutedVar
      )];
      row.appendChild(sep);
    }
  }

  frame.appendChild(row);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Time Picker', count: 3 };
}
