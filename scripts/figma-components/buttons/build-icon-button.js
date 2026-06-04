// =============================================================================
// Icon Button — Custom Component Builder
// =============================================================================
// Square button with icon only, no label. Ghost default for structural actions.
// 4 variants × 3 sizes = 12 combinations.
// Cannot use standard builder — no label, square dimensions.
// =============================================================================

function buildIconButton(lookups, defaultMode, page) {
  const { semColors, semRadius, primHeight, primIconSize } = lookups;
  const config = CONFIG.components['icon-button'];
  const variants = [];

  for (const [varName, colors] of Object.entries(config.variants)) {
    const bgVar = colors.bg === 'transparent' ? null : semColors[colors.bg];
    const fgVar = semColors[colors.fg];

    for (const [sizeName, sz] of Object.entries(config.sizes)) {
      const comp = figma.createComponent();
      comp.name = `variant=${varName}, size=${sizeName}`;
      comp.layoutMode = 'HORIZONTAL';
      comp.primaryAxisAlignItems = 'CENTER';
      comp.counterAxisAlignItems = 'CENTER';

      // Square dimensions from size
      const hPath = resolveHeight(sz.size);
      if (hPath) {
        const hVar = primHeight[hPath];
        if (hVar) {
          comp.setBoundVariable('width', hVar);
          comp.setBoundVariable('height', hVar);
        }
        comp.primaryAxisSizingMode = 'FIXED';
        comp.counterAxisSizingMode = 'FIXED';
      }

      // Radius
      const radVar = semRadius[sz.radius];
      if (radVar) {
        comp.setBoundVariable('topLeftRadius', radVar);
        comp.setBoundVariable('topRightRadius', radVar);
        comp.setBoundVariable('bottomLeftRadius', radVar);
        comp.setBoundVariable('bottomRightRadius', radVar);
      }

      // Background — ghost is transparent
      if (bgVar) {
        comp.fills = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', bgVar
        )];
      } else {
        comp.fills = [];
      }

      // Icon placeholder
      const iconRef = sz['icon-size'];
      const iconPath = resolveIcon(iconRef);
      const iconSizeVar = iconPath ? primIconSize[iconPath] : null;

      let iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/placeholder');
      if (iconComp) {
        const inst = iconComp.createInstance();
        inst.name = 'icon';
        if (iconSizeVar) {
          inst.setBoundVariable('width', iconSizeVar);
          inst.setBoundVariable('height', iconSizeVar);
        }
        if (fgVar) {
          const vecs = inst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
          const paint = [figma.variables.setBoundVariableForPaint(
            { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', fgVar
          )];
          for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
        }
        comp.appendChild(inst);
      }

      variants.push(comp);
    }
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'Icon Button';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  createBaseFrame('icon-button', 'Square icon-only button. Ghost default for structural actions (close, dismiss, collapse).', set, lookups, defaultMode);

  const defaultVariant = set.findChild(n => n.name === 'variant=ghost, size=md');
  createPreviewFrame('icon-button', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'Icon Button', count: set.children.length };
}
