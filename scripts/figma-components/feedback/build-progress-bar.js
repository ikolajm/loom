// =============================================================================
// Progress Bar — Custom Component Builder
// =============================================================================
// Track + fill bar. 4 variants × 3 sizes = 12 variants.
// No text, no icon slots. Fill width demonstrates ~60% progress.
// =============================================================================

function buildProgressBar(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing } = lookups;
  const config = CONFIG.components['progress-bar'];
  const variants = [];

  for (const [varName, colors] of Object.entries(config.variants)) {
    const trackBgVar = semColors[colors['track-bg']];
    const fillBgVar = semColors[colors['fill-bg']];

    for (const [sizeName, sz] of Object.entries(config.sizes)) {
      const heightPath = resolveScale(sz.height);
      const heightPx = heightPath ? null : 8; // fallback
      const radVar = semRadius[sz.radius];

      // Track (outer container)
      const comp = figma.createComponent();
      comp.name = `variant=${varName}, size=${sizeName}`;
      comp.layoutMode = 'HORIZONTAL';
      comp.primaryAxisSizingMode = 'FIXED';
      comp.counterAxisSizingMode = 'AUTO';
      comp.resize(200, comp.height);

      if (trackBgVar) comp.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }, 'color', trackBgVar
      )];

      if (radVar) {
        comp.setBoundVariable('topLeftRadius', radVar);
        comp.setBoundVariable('topRightRadius', radVar);
        comp.setBoundVariable('bottomLeftRadius', radVar);
        comp.setBoundVariable('bottomRightRadius', radVar);
      }

      // Fill bar (child frame, ~60% width)
      const fill = figma.createFrame();
      fill.name = 'fill';
      fill.resize(120, 8);

      if (heightPath) {
        const hVar = primSpacing[heightPath];
        if (hVar) {
          comp.setBoundVariable('height', hVar);
          fill.setBoundVariable('height', hVar);
        }
      } else {
        comp.resize(200, heightPx);
        fill.resize(120, heightPx);
      }

      if (fillBgVar) fill.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.8 } }, 'color', fillBgVar
      )];

      if (radVar) {
        fill.setBoundVariable('topLeftRadius', radVar);
        fill.setBoundVariable('topRightRadius', radVar);
        fill.setBoundVariable('bottomLeftRadius', radVar);
        fill.setBoundVariable('bottomRightRadius', radVar);
      }

      comp.appendChild(fill);
      variants.push(comp);
    }
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'Progress Bar';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  createBaseFrame('progress-bar', 'Track + fill bar. Fill width set per-instance.', set, lookups, defaultMode);

  const defaultVariant = set.findChild(n => n.name === 'variant=default, size=md');
  createPreviewFrame('progress-bar', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'Progress Bar', count: set.children.length };
}
