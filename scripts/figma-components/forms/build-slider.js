// =============================================================================
// Slider — Custom Component Builder
// =============================================================================
// Track + thumb. 1 variant × 3 sizes = 3 variants.
// Track fill demonstrates ~40% progress. Thumb is a circle on the track.
// =============================================================================

function buildSlider(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing } = lookups;
  const config = CONFIG.components.slider;
  const colors = config.variants.default;
  const trackBgVar = semColors[colors['track-bg']];
  const fillBgVar = semColors[colors['fill-bg']];
  const thumbBgVar = semColors[colors['thumb-bg']];
  const variants = [];

  for (const [sizeName, sz] of Object.entries(config.sizes)) {
    const trackHeightPath = resolveScale(sz['track-height']);
    const thumbSize = parsePx(sz['thumb-size']);
    const radVar = semRadius[sz['track-radius']];
    const thumbRadVar = semRadius[sz['thumb-radius']];

    // Outer component — wraps track, positions thumb
    const comp = figma.createComponent();
    comp.name = `variant=default, size=${sizeName}`;
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.resize(200, thumbSize + 4);
    comp.fills = [];
    comp.primaryAxisAlignItems = 'CENTER';

    // Track
    const track = figma.createFrame();
    track.name = 'track';
    track.layoutMode = 'HORIZONTAL';
    track.primaryAxisSizingMode = 'FIXED';
    track.counterAxisSizingMode = 'AUTO';
    track.resize(200, 8);

    if (trackHeightPath) {
      const hVar = primSpacing[trackHeightPath];
      if (hVar) track.setBoundVariable('height', hVar);
    }

    if (trackBgVar) track.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }, 'color', trackBgVar
    )];

    if (radVar) {
      track.setBoundVariable('topLeftRadius', radVar);
      track.setBoundVariable('topRightRadius', radVar);
      track.setBoundVariable('bottomLeftRadius', radVar);
      track.setBoundVariable('bottomRightRadius', radVar);
    }

    // Fill portion (~40%)
    const fill = figma.createFrame();
    fill.name = 'fill';
    fill.resize(100, 8);
    if (trackHeightPath) {
      const hVar = primSpacing[trackHeightPath];
      if (hVar) fill.setBoundVariable('height', hVar);
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
    track.appendChild(fill);

    comp.appendChild(track);
    track.layoutSizingHorizontal = 'FILL';

    // Thumb — absolute positioned, centered vertically, at 50% track width
    const thumb = figma.createEllipse();
    thumb.name = 'thumb';
    thumb.resize(thumbSize, thumbSize);
    if (thumbBgVar) thumb.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.8 } }, 'color', thumbBgVar
    )];
    comp.appendChild(thumb);
    thumb.layoutPositioning = 'ABSOLUTE';
    thumb.x = 100 - (thumbSize / 2);
    thumb.y = (comp.height - thumbSize) / 2;

    variants.push(comp);
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'Slider';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  createBaseFrame('slider', 'Track + thumb slider. Fill width and thumb position set per-instance.', set, lookups, defaultMode);

  const defaultVariant = set.findChild(n => n.name === 'variant=default, size=md');
  createPreviewFrame('slider', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'Slider', count: set.children.length };
}
