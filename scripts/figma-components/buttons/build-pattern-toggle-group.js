// =============================================================================
// Toggle Group — Frame Pattern Mock
// =============================================================================
// Row of toggle buttons sharing borders. Shows sm/md/lg sizes with 3 items each.
// First and last items get outer radius, inner items have no radius.
// =============================================================================

function buildPatternToggleGroup(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights, layoutVars } = lookups;
  const config = CONFIG.components['toggle-group'];
  const toggleConfig = CONFIG.components['toggle'];
  // v2 toggle-group exposes segmented/spaced variants (no `default`). The mock
  // shows the default (segmented) — shared borders, outer radius only.
  const colors = config.variants[config.default.variant];

  const frame = createSectionFrame('base.pattern-toggle-group', lookups);
  addHeader(frame, 'Toggle Group', 'Frame pattern — row of toggle buttons sharing borders. Segmented control. Shown at sm / md / lg.');

  const items = ['Option A', 'Option B', 'Option C'];
  const states = ['pressed', 'unpressed', 'unpressed'];
  const labelGapVar = layoutVars['layout/spacing/label-gap'];
  const mutedFgVar = layoutVars['layout/page-foreground-muted'];

  for (const [sizeName, sz] of Object.entries(config.sizes)) {
    const toggleSz = toggleConfig.sizes[sizeName];
    if (!toggleSz) continue;

    // Tier wrapper: label + component, tight gap
    const tierGroup = figma.createFrame();
    tierGroup.name = `tier-${sizeName}`;
    tierGroup.layoutMode = 'VERTICAL';
    tierGroup.primaryAxisSizingMode = 'AUTO';
    tierGroup.counterAxisSizingMode = 'AUTO';
    tierGroup.fills = [];
    if (labelGapVar) tierGroup.setBoundVariable('itemSpacing', labelGapVar);

    // Tier label
    const tierLabel = figma.createText();
    tierLabel.name = 'tier-label';
    tierLabel.characters = sizeName;
    applyTextStyle(tierLabel, 'label', 'sm');
    if (mutedFgVar) tierLabel.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', mutedFgVar
    )];
    tierGroup.appendChild(tierLabel);

    const group = figma.createFrame();
    group.name = `toggle-group-${sizeName}`;
    group.layoutMode = 'HORIZONTAL';
    group.primaryAxisSizingMode = 'AUTO';
    group.counterAxisSizingMode = 'AUTO';
    group.itemSpacing = 0;
    group.fills = [];

    const radVar = semRadius[sz.radius];
    const borderVar = semColors[colors.border];

    for (let i = 0; i < items.length; i++) {
      const stateColors = toggleConfig.state[states[i]];

      const item = figma.createFrame();
      item.name = `toggle-item-${i}`;
      item.layoutMode = 'HORIZONTAL';
      item.primaryAxisAlignItems = 'CENTER';
      item.counterAxisAlignItems = 'CENTER';
      item.primaryAxisSizingMode = 'AUTO';
      item.counterAxisSizingMode = 'AUTO';

      // Height from toggle-group config
      const hPath = resolveHeight(sz.height);
      if (hPath) {
        const hVar = heights ? heights[hPath] : primSpacing[hPath];
        if (hVar) item.setBoundVariable('height', hVar);
      }

      // Padding from toggle config (per size tier)
      const xp = resolveScale(toggleSz['x-padding']);
      if (xp) { const v = primSpacing[xp]; if (v) { item.setBoundVariable('paddingLeft', v); item.setBoundVariable('paddingRight', v); } }
      const yp = resolveScale(toggleSz['y-padding']);
      if (yp) { const v = primSpacing[yp]; if (v) { item.setBoundVariable('paddingTop', v); item.setBoundVariable('paddingBottom', v); } }

      // Background
      const bgVar = stateColors.bg === 'transparent' ? null : semColors[stateColors.bg];
      if (bgVar) item.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', bgVar
      )];
      else item.fills = [];

      // Border
      if (borderVar) {
        item.strokes = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
        )];
        item.strokeWeight = 1;
      }

      // Radius — only on outer edges
      if (radVar) {
        if (i === 0) { item.setBoundVariable('topLeftRadius', radVar); item.setBoundVariable('bottomLeftRadius', radVar); }
        if (i === items.length - 1) { item.setBoundVariable('topRightRadius', radVar); item.setBoundVariable('bottomRightRadius', radVar); }
      }

      // Label — font size from toggle config per tier
      const fgVar = semColors[stateColors.fg];
      const text = figma.createText();
      text.name = 'label';
      text.characters = items[i];
      applyTextStyle(text, 'action', sizeName);
      if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', fgVar
      )];
      item.appendChild(text);

      group.appendChild(item);
    }

    tierGroup.appendChild(group);
    frame.appendChild(tierGroup);
  }

  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Toggle Group', count: Object.keys(config.sizes).length };
}
