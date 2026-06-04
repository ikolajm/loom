// =============================================================================
// Combobox — Frame Pattern Mock
// =============================================================================
// Text input trigger + dropdown panel with filterable items.
// Shows sm/md/lg: trigger (text-field base) with chevron + open dropdown with 3 items.
// Search input height/text scales per size tier.
// =============================================================================

function buildPatternCombobox(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primHeight, primIconSize, layoutVars } = lookups;
  const config = CONFIG.components.combobox;
  const baseConfig = resolveBase(CONFIG.components, 'combobox');
  const dropdown = config.dropdown;

  const frame = createSectionFrame('base.pattern-combobox', lookups);
  addHeader(frame, 'Combobox', 'Frame pattern — text input trigger with filterable dropdown. Shown at sm / md / lg.');

  const inputSet = page.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Input');
  const items = ['Option One', 'Option Two', 'Option Three'];
  const labelGapVar = layoutVars['layout/spacing/label-gap'];
  const mutedFgVar = layoutVars['layout/page-foreground-muted'];

  for (const [sizeName, itemSz] of Object.entries(config.item.sizes)) {
    const baseSz = baseConfig.sizes[sizeName];
    if (!baseSz) continue;

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

    const wrapper = figma.createFrame();
    wrapper.name = `combobox-${sizeName}`;
    wrapper.layoutMode = 'VERTICAL';
    wrapper.primaryAxisSizingMode = 'AUTO';
    wrapper.counterAxisSizingMode = 'FIXED';
    wrapper.resize(280, wrapper.height);
    wrapper.fills = [];
    wrapper.clipsContent = false;
    wrapper.itemSpacing = 0;

    // --- Trigger (real Input component instance, size-matched) ---
    const inputVariant = inputSet ? inputSet.findChild(n => n.name === `state=default, size=${sizeName}`) : null;
    if (inputVariant) {
      const trigger = inputVariant.createInstance();
      trigger.name = 'trigger';
      wrapper.appendChild(trigger);
      trigger.layoutSizingHorizontal = 'FILL';
    }

    // --- Dropdown panel ---
    const panel = figma.createFrame();
    panel.name = 'dropdown';
    panel.layoutMode = 'VERTICAL';
    panel.primaryAxisSizingMode = 'AUTO';
    panel.counterAxisSizingMode = 'AUTO';
    panel.itemSpacing = 0;

    const panelBgVar = semColors[dropdown.bg];
    if (panelBgVar) panel.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', panelBgVar
    )];

    const panelRadVar = semRadius[dropdown.radius];
    if (panelRadVar) {
      panel.setBoundVariable('topLeftRadius', panelRadVar);
      panel.setBoundVariable('topRightRadius', panelRadVar);
      panel.setBoundVariable('bottomLeftRadius', panelRadVar);
      panel.setBoundVariable('bottomRightRadius', panelRadVar);
    }

    if (dropdown.shadow) {
      const styles = figma.getLocalEffectStyles();
      const styleName = dropdown.shadow.replace('effects/shadow-', 'shadow/');
      const effectStyle = styles.find(s => s.name === styleName);
      if (effectStyle) panel.effectStyleId = effectStyle.id;
    }

    // --- Search input row (size-conditional) ---
    const searchRow = figma.createFrame();
    searchRow.name = 'search';
    searchRow.layoutMode = 'HORIZONTAL';
    searchRow.counterAxisAlignItems = 'CENTER';
    searchRow.primaryAxisSizingMode = 'AUTO';
    searchRow.fills = [];

    // Search input height matches size tier
    const searchHPath = resolveHeight(baseSz.height);
    if (searchHPath) {
      const shVar = primHeight[searchHPath];
      if (shVar) searchRow.setBoundVariable('height', shVar);
      searchRow.counterAxisSizingMode = 'FIXED';
    }

    // Search padding scales with size
    const searchPxPath = resolveScale(baseSz['x-padding'] || (sizeName === 'sm' ? '{scale.2}' : sizeName === 'lg' ? '{scale.4}' : '{scale.3}'));
    if (searchPxPath) {
      const v = primSpacing[searchPxPath];
      if (v) { searchRow.setBoundVariable('paddingLeft', v); searchRow.setBoundVariable('paddingRight', v); }
    }

    const searchLabel = figma.createText();
    searchLabel.name = 'search-placeholder';
    searchLabel.characters = 'Search...';
    applyTextStyle(searchLabel, 'body', sizeName);
    const searchFgVar = semColors['color/surface/on-surface-variant'];
    if (searchFgVar) searchLabel.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', searchFgVar
    )];
    searchRow.appendChild(searchLabel);
    searchLabel.layoutSizingHorizontal = 'FILL';

    panel.appendChild(searchRow);
    searchRow.layoutSizingHorizontal = 'FILL';

    // Search border separator
    const borderVar = semColors['color/outline/outline-subtle'];
    if (borderVar) {
      searchRow.strokes = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
      )];
      searchRow.strokeTopWeight = 0; searchRow.strokeRightWeight = 0;
      searchRow.strokeBottomWeight = 1; searchRow.strokeLeftWeight = 0;
      searchRow.strokeAlign = 'INSIDE';
    }

    // --- Dropdown items ---
    const panelFgVar = semColors[dropdown.fg];
    const hoverBgVar = semColors[dropdown['hover-bg']];

    for (let i = 0; i < items.length; i++) {
      const item = figma.createFrame();
      item.name = `item-${i}`;
      item.layoutMode = 'HORIZONTAL';
      item.counterAxisAlignItems = 'CENTER';
      item.primaryAxisSizingMode = 'AUTO';

      const ihPath = resolveHeight(itemSz.height);
      if (ihPath) {
        const ihVar = primHeight[ihPath];
        if (ihVar) item.setBoundVariable('height', ihVar);
        item.counterAxisSizingMode = 'FIXED';
      }

      const ixpPath = resolveScale(itemSz['x-padding']);
      if (ixpPath) {
        const v = primSpacing[ixpPath];
        if (v) { item.setBoundVariable('paddingLeft', v); item.setBoundVariable('paddingRight', v); }
      }

      if (i === 0 && hoverBgVar) {
        item.fills = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }, 'color', hoverBgVar
        )];
      } else {
        item.fills = [];
      }

      const label = figma.createText();
      label.name = 'label';
      label.characters = items[i];
      applyTextStyle(label, 'body', sizeName);
      if (panelFgVar) label.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', panelFgVar
      )];
      item.appendChild(label);
      label.layoutSizingHorizontal = 'FILL';

      panel.appendChild(item);
      item.layoutSizingHorizontal = 'FILL';
    }

    wrapper.appendChild(panel);
    panel.layoutSizingHorizontal = 'FILL';

    tierGroup.appendChild(wrapper);
    frame.appendChild(tierGroup);
  }

  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Combobox', count: Object.keys(config.item.sizes).length };
}
