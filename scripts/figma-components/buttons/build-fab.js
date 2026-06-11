// =============================================================================
// FAB — Custom Component Builder
// =============================================================================
// Floating action button. Icon-only square + extended (icon + label) variant.
// 1 color variant × 3 sizes × 2 types (standard/extended) = 6 variants.
// Uses primary-container fill for softer presence than button.
// =============================================================================

function buildFab(lookups, defaultMode, page) {
  const { semColors, semRadius, primHeight, primIconSize, primSpacing } = lookups;
  const config = CONFIG.components.fab;
  const colors = config.variants.default;
  const bgVar = semColors[colors.bg];
  const fgVar = semColors[colors.fg];
  const variants = [];

  for (const [sizeName, sz] of Object.entries(config.sizes)) {
    const radVar = semRadius[sz.radius];

    // Effect style for shadow
    let effectStyle = null;
    if (sz.shadow) {
      const styles = figma.getLocalEffectStyles();
      const styleName = sz.shadow.replace('effects/shadow-', 'shadow/');
      effectStyle = styles.find(s => s.name === styleName) || null;
    }

    // --- Standard FAB (icon only, square) ---
    const stdComp = figma.createComponent();
    stdComp.name = `type=standard, size=${sizeName}`;
    stdComp.layoutMode = 'HORIZONTAL';
    stdComp.primaryAxisAlignItems = 'CENTER';
    stdComp.counterAxisAlignItems = 'CENTER';

    const hPath = resolveHeight(sz.size);
    if (hPath) {
      const hVar = primHeight[hPath];
      if (hVar) {
        stdComp.setBoundVariable('width', hVar);
        stdComp.setBoundVariable('height', hVar);
      }
      stdComp.primaryAxisSizingMode = 'FIXED';
      stdComp.counterAxisSizingMode = 'FIXED';
    }

    if (bgVar) stdComp.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', bgVar
    )];

    if (radVar) {
      stdComp.setBoundVariable('topLeftRadius', radVar);
      stdComp.setBoundVariable('topRightRadius', radVar);
      stdComp.setBoundVariable('bottomLeftRadius', radVar);
      stdComp.setBoundVariable('bottomRightRadius', radVar);
    }

    if (effectStyle) stdComp.effectStyleId = effectStyle.id;

    // Icon
    const iconRef = sz['icon-size'];
    const iconPath = resolveIcon(iconRef);
    const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
    const stdIcon = makeIcon('icon/placeholder', fgVar, iconSizeVar);
    if (stdIcon) { stdIcon.name = 'icon'; stdComp.appendChild(stdIcon); }
    variants.push(stdComp);

    // --- Extended FAB (icon + label) ---
    const extSz = config.extended[sizeName];
    if (extSz) {
      const extComp = figma.createComponent();
      extComp.name = `type=extended, size=${sizeName}`;
      extComp.layoutMode = 'HORIZONTAL';
      extComp.primaryAxisSizingMode = 'AUTO';
      extComp.counterAxisAlignItems = 'CENTER';

      const extHPath = resolveHeight(extSz.height);
      if (extHPath) {
        const hVar = primHeight[extHPath];
        if (hVar) extComp.setBoundVariable('height', hVar);
        extComp.counterAxisSizingMode = 'FIXED';
      }

      const xpPath = resolveScale(extSz['x-padding']);
      if (xpPath) {
        const v = primSpacing[xpPath];
        if (v) { extComp.setBoundVariable('paddingLeft', v); extComp.setBoundVariable('paddingRight', v); }
      }

      const gapPath = resolveScale(extSz.gap);
      if (gapPath) {
        const v = primSpacing[gapPath];
        if (v) extComp.setBoundVariable('itemSpacing', v);
      }

      if (bgVar) extComp.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', bgVar
      )];

      if (radVar) {
        extComp.setBoundVariable('topLeftRadius', radVar);
        extComp.setBoundVariable('topRightRadius', radVar);
        extComp.setBoundVariable('bottomLeftRadius', radVar);
        extComp.setBoundVariable('bottomRightRadius', radVar);
      }

      if (effectStyle) extComp.effectStyleId = effectStyle.id;

      // Icon
      const extIcon = makeIcon('icon/placeholder', fgVar, iconSizeVar);
      if (extIcon) { extIcon.name = 'icon'; extComp.appendChild(extIcon); }

      // Label
      const label = figma.createText();
      label.name = 'label';
      label.characters = 'Create';
      applyTextStyle(label, 'action', sizeName);
      if (fgVar) label.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', fgVar
      )];
      extComp.appendChild(label);

      variants.push(extComp);
    }
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'FAB';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  createBaseFrame('fab', 'Floating action button. One per screen. Standard (icon) or extended (icon + label).', set, lookups, defaultMode);

  const defaultVariant = set.findChild(n => n.name === 'type=standard, size=md');
  createPreviewFrame('fab', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'FAB', count: set.children.length };
}
