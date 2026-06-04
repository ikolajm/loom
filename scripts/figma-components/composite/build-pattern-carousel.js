// =============================================================================
// Carousel — Frame Pattern Mock
// =============================================================================
// Simplified pattern: single slide + dot indicators.
// Conveys layout intent — code template handles arrows, scrolling, Embla.
// =============================================================================

function buildPatternCarousel(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing } = lookups;
  const config = CONFIG.components.carousel;
  const md = config.sizes.md;
  const dots = config.navigation.dots;

  const frame = createSectionFrame('base.pattern-carousel', lookups);
  addHeader(frame, 'Carousel', 'Frame pattern — single slide with dot indicators. Arrows and scrolling are code-only.');

  const wrapper = figma.createFrame();
  wrapper.name = 'carousel-example';
  wrapper.layoutMode = 'VERTICAL';
  wrapper.primaryAxisSizingMode = 'AUTO';
  wrapper.counterAxisSizingMode = 'FIXED';
  wrapper.counterAxisAlignItems = 'CENTER';
  wrapper.resize(360, wrapper.height);
  wrapper.fills = [];
  wrapper.itemSpacing = 16;

  // Single slide
  const slide = figma.createFrame();
  slide.name = 'slide';
  slide.resize(360, 180);
  const slideBgVar = semColors['color/surface/surface-2'];
  if (slideBgVar) slide.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', slideBgVar
  )];
  const radVar = semRadius[md['slide-radius']];
  if (radVar) {
    slide.setBoundVariable('topLeftRadius', radVar);
    slide.setBoundVariable('topRightRadius', radVar);
    slide.setBoundVariable('bottomLeftRadius', radVar);
    slide.setBoundVariable('bottomRightRadius', radVar);
  }
  wrapper.appendChild(slide);

  // Dots row
  const dotsRow = figma.createFrame();
  dotsRow.name = 'dots';
  dotsRow.layoutMode = 'HORIZONTAL';
  dotsRow.primaryAxisSizingMode = 'AUTO';
  dotsRow.counterAxisSizingMode = 'AUTO';
  dotsRow.fills = [];

  const dotGapPath = resolveScale(dots.gap);
  if (dotGapPath) { const v = primSpacing[dotGapPath]; if (v) dotsRow.setBoundVariable('itemSpacing', v); }

  const dotSizePath = resolveScale(dots.size);
  const activeDotVar = semColors[dots['active-bg']];
  const defaultDotVar = semColors[dots['default-bg']];
  const dotRadVar = semRadius[dots.radius];

  for (let i = 0; i < 3; i++) {
    const dot = figma.createFrame();
    dot.name = `dot-${i}`;
    dot.resize(8, 8);
    if (dotSizePath) {
      const sVar = primSpacing[dotSizePath];
      if (sVar) { dot.setBoundVariable('width', sVar); dot.setBoundVariable('height', sVar); }
    }
    const dotBgVar = i === 0 ? activeDotVar : defaultDotVar;
    if (dotBgVar) dot.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', dotBgVar
    )];
    if (dotRadVar) {
      dot.setBoundVariable('topLeftRadius', dotRadVar);
      dot.setBoundVariable('topRightRadius', dotRadVar);
      dot.setBoundVariable('bottomLeftRadius', dotRadVar);
      dot.setBoundVariable('bottomRightRadius', dotRadVar);
    }
    dotsRow.appendChild(dot);
  }

  wrapper.appendChild(dotsRow);
  frame.appendChild(wrapper);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Carousel', count: 1 };
}
