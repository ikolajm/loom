// =============================================================================
// Tabs — Frame Pattern Mock
// =============================================================================
// Horizontal tab strip with active indicator (bottom border).
// Shows sm/md/lg sizes with 4 tabs, one active.
// =============================================================================

function buildPatternTabs(lookups, defaultMode, page) {
  const { semColors, primSpacing, heights, primBW, layoutVars } = lookups;
  const config = CONFIG.components.tabs;
  const colors = config.variants.default;

  const frame = createSectionFrame('base.pattern-tabs', lookups);
  addHeader(frame, 'Tabs', 'Frame pattern — horizontal tab strip with active indicator. Shown at sm / md / lg.');

  const tabs = [
    { label: 'Overview', active: true },
    { label: 'Activity', active: false },
    { label: 'Settings', active: false },
    { label: 'Members', active: false }
  ];

  const activeFgVar = semColors[colors['active-fg']];
  const inactiveFgVar = semColors[colors['inactive-fg']];
  const indicatorVar = semColors[colors.indicator];
  const labelGapVar = layoutVars['layout/spacing/label-gap'];
  const mutedFgVar = layoutVars['layout/page-foreground-muted'];

  for (const [sizeName, sz] of Object.entries(config.sizes)) {
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

    const tabStrip = figma.createFrame();
    tabStrip.name = `tab-strip-${sizeName}`;
    tabStrip.layoutMode = 'HORIZONTAL';
    tabStrip.primaryAxisSizingMode = 'AUTO';
    tabStrip.counterAxisSizingMode = 'AUTO';
    tabStrip.fills = [];
    tabStrip.itemSpacing = 0;

    for (const tab of tabs) {
      const tabFrame = figma.createFrame();
      tabFrame.name = `tab-${tab.label.toLowerCase()}`;
      tabFrame.layoutMode = 'HORIZONTAL';
      tabFrame.primaryAxisAlignItems = 'CENTER';
      tabFrame.counterAxisAlignItems = 'CENTER';
      tabFrame.fills = [];

      // Height per size tier
      const hPath = resolveHeight(sz.height);
      if (hPath) {
        const hVar = heights[hPath];
        if (hVar) tabFrame.setBoundVariable('height', hVar);
        tabFrame.counterAxisSizingMode = 'FIXED';
      }

      // Padding per size tier
      const xpPath = resolveScale(sz['x-padding']);
      if (xpPath) { const v = primSpacing[xpPath]; if (v) { tabFrame.setBoundVariable('paddingLeft', v); tabFrame.setBoundVariable('paddingRight', v); } }

      // Active indicator (bottom border)
      if (tab.active && indicatorVar) {
        tabFrame.strokes = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.8 } }, 'color', indicatorVar
        )];
        tabFrame.strokeTopWeight = 0; tabFrame.strokeRightWeight = 0;
        tabFrame.strokeBottomWeight = 2; tabFrame.strokeLeftWeight = 0;
        tabFrame.strokeAlign = 'INSIDE';
      }

      // Label — font size per tier
      const label = figma.createText();
      label.name = 'label';
      label.characters = tab.label;
      applyTextStyle(label, 'action', sizeName);
      const fgVar = tab.active ? activeFgVar : inactiveFgVar;
      if (fgVar) label.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
      )];
      tabFrame.appendChild(label);

      tabStrip.appendChild(tabFrame);
    }

    tierGroup.appendChild(tabStrip);
    frame.appendChild(tierGroup);
  }

  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Tabs', count: Object.keys(config.sizes).length };
}
