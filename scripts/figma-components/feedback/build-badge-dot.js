// =============================================================================
// Badge Dot — Custom Component Builder
// =============================================================================
// Notification indicator dot. 1 variant × 3 sizes = 3 variants.
// Error color fill, pill radius. Optional count text.
// =============================================================================

function buildBadgeDot(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing } = lookups;
  const config = CONFIG.components['badge-dot'];
  const colors = config.variants.default;
  const bgVar = semColors[colors.bg];
  const fgVar = colors.fg ? semColors[colors.fg] : null;
  const variants = [];

  for (const [sizeName, sz] of Object.entries(config.sizes)) {
    if (sizeName.startsWith('$')) continue; // skip $exception
    const dimPath = resolveScale(sz.size);
    const radVar = semRadius[sz.radius];

    const comp = figma.createComponent();
    comp.name = `variant=default, size=${sizeName}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';

    // Size from spacing scale
    if (dimPath) {
      const dimVar = primSpacing[dimPath];
      if (dimVar) {
        comp.setBoundVariable('width', dimVar);
        comp.setBoundVariable('height', dimVar);
        comp.primaryAxisSizingMode = 'FIXED';
        comp.counterAxisSizingMode = 'FIXED';
      }
    }

    // Background
    if (bgVar) comp.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.8, g: 0.1, b: 0.1 } }, 'color', bgVar
    )];

    // Radius
    if (radVar) {
      comp.setBoundVariable('topLeftRadius', radVar);
      comp.setBoundVariable('topRightRadius', radVar);
      comp.setBoundVariable('bottomLeftRadius', radVar);
      comp.setBoundVariable('bottomRightRadius', radVar);
    }

    // Count text (hidden by default, toggleable)
    if (sz['font-size']) {
      const text = figma.createText();
      text.name = 'count';
      text.characters = '1';
      applyTextStyle(text, 'label', sizeName);
      if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', fgVar
      )];
      text.visible = false;
      comp.appendChild(text);
      const propKey = comp.addComponentProperty('showCount', 'BOOLEAN', false);
      text.componentPropertyReferences = { 'visible': propKey };
    }

    variants.push(comp);
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'Badge Dot';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  createBaseFrame('badge-dot', 'Notification indicator dot. Count text toggleable.', set, lookups, defaultMode);

  const defaultVariant = set.findChild(n => n.name === 'variant=default, size=md');
  createPreviewFrame('badge-dot', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'Badge Dot', count: set.children.length };
}
