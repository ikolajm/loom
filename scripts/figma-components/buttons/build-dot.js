// =============================================================================
// Dot — Custom Component Builder
// =============================================================================
// Status/severity indicator dot — a small colored circle keyed by state.
// state (6 colors) × size (3) = 18 variants. Always a circle (radius/pill).
// Standalone primitive (own atom in v2); compose into badges, banners,
// list items, subheadings, nav. For a notification count bubble, use Badge size="sm".
// =============================================================================

function buildDot(lookups, defaultMode, page) {
  const { semColors, semRadius, primIconSize } = lookups;
  const config = CONFIG.components.dot;
  const pillVar = semRadius['radius/pill'];
  const variants = [];

  for (const [stateName, st] of Object.entries(config.state)) {
    if (stateName.startsWith('$')) continue;
    const bgVar = semColors[st.bg];

    for (const [sizeName, sz] of Object.entries(config.sizes)) {
      if (sizeName.startsWith('$')) continue;
      const comp = figma.createComponent();
      comp.name = `state=${stateName}, size=${sizeName}`;
      comp.layoutMode = 'HORIZONTAL';
      comp.primaryAxisSizingMode = 'FIXED';
      comp.counterAxisSizingMode = 'FIXED';

      // Square dimensions from the icon-size token; radius/pill makes it round.
      const sizePath = resolveIcon(sz.size);
      const sizeVar = sizePath ? primIconSize[sizePath] : null;
      if (sizeVar) {
        comp.setBoundVariable('width', sizeVar);
        comp.setBoundVariable('height', sizeVar);
      }

      if (bgVar) comp.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', bgVar
      )];

      if (pillVar) {
        comp.setBoundVariable('topLeftRadius', pillVar);
        comp.setBoundVariable('topRightRadius', pillVar);
        comp.setBoundVariable('bottomLeftRadius', pillVar);
        comp.setBoundVariable('bottomRightRadius', pillVar);
      }

      variants.push(comp);
    }
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'Dot';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  createBaseFrame('dot', 'Status/severity indicator dot. Standalone primitive — compose into badges, alerts, list items, nav.', set, lookups, defaultMode);

  const defaultVariant = set.findChild(n => n.name === 'state=default, size=md');
  createPreviewFrame('dot', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'Dot', count: set.children.length };
}
