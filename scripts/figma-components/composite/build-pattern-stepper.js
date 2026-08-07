// =============================================================================
// Stepper — Frame Pattern Mock
// =============================================================================
// Horizontal multi-step indicator. Shows 4 steps: completed, active, incomplete.
// Step indicators are circles with connectors between them.
// =============================================================================

function buildPatternStepper(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights, primBW } = lookups;
  const config = CONFIG.components.stepper;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-stepper', lookups);
  addHeader(frame, 'Stepper', 'Frame pattern — multi-step progress indicator with completed/active/incomplete states.');

  const strip = figma.createFrame();
  strip.name = 'stepper';
  strip.layoutMode = 'HORIZONTAL';
  strip.primaryAxisSizingMode = 'AUTO';
  strip.counterAxisSizingMode = 'AUTO';
  strip.counterAxisAlignItems = 'CENTER';
  strip.fills = [];

  const gapPath = resolveScale(md.gap);
  if (gapPath) { const v = primSpacing[gapPath]; if (v) strip.setBoundVariable('itemSpacing', v); }

  const steps = [
    { label: 'Account', state: 'completed' },
    { label: 'Profile', state: 'completed' },
    { label: 'Settings', state: 'active' },
    { label: 'Review', state: 'incomplete' }
  ];

  const indicatorPath = resolveHeight(md['indicator-size']);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stateColors = config['step-state'][step.state];

    // Step column (indicator + label)
    const col = figma.createFrame();
    col.name = `step-${step.label.toLowerCase()}`;
    col.layoutMode = 'VERTICAL';
    col.primaryAxisAlignItems = 'CENTER';
    col.counterAxisAlignItems = 'CENTER';
    col.primaryAxisSizingMode = 'AUTO';
    col.counterAxisSizingMode = 'AUTO';
    col.fills = [];
    col.itemSpacing = 4;

    // Indicator circle
    const indicator = figma.createFrame();
    indicator.name = 'indicator';
    indicator.layoutMode = 'HORIZONTAL';
    indicator.primaryAxisAlignItems = 'CENTER';
    indicator.counterAxisAlignItems = 'CENTER';

    if (indicatorPath) {
      const hVar = heights[indicatorPath];
      if (hVar) {
        indicator.setBoundVariable('width', hVar);
        indicator.setBoundVariable('height', hVar);
      }
      indicator.primaryAxisSizingMode = 'FIXED';
      indicator.counterAxisSizingMode = 'FIXED';
    }

    const indBgVar = semColors[stateColors['indicator-bg']];
    if (indBgVar) indicator.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', indBgVar
    )];

    const pillRadVar = semRadius['radius/pill'];
    if (pillRadVar) {
      indicator.setBoundVariable('topLeftRadius', pillRadVar);
      indicator.setBoundVariable('topRightRadius', pillRadVar);
      indicator.setBoundVariable('bottomLeftRadius', pillRadVar);
      indicator.setBoundVariable('bottomRightRadius', pillRadVar);
    }

    // Step number
    const num = figma.createText();
    num.name = 'number';
    num.characters = String(i + 1);
    applyTextStyle(num, 'label', 'md');
    num.textAlignHorizontal = 'CENTER';
    const indFgVar = semColors[stateColors['indicator-fg']];
    if (indFgVar) num.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', indFgVar
    )];
    indicator.appendChild(num);

    col.appendChild(indicator);

    // Label
    const label = figma.createText();
    label.name = 'label';
    label.characters = step.label;
    applyTextStyle(label, 'label', 'md');
    const labelFgVar = semColors[stateColors['label-fg']];
    if (labelFgVar) label.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', labelFgVar
    )];
    col.appendChild(label);

    strip.appendChild(col);

    // Connector line (between steps, not after last)
    if (i < steps.length - 1) {
      const connector = figma.createFrame();
      connector.name = 'connector';
      connector.resize(40, 2);
      const connVar = semColors[stateColors.connector];
      if (connVar) connector.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', connVar
      )];
      strip.appendChild(connector);
    }
  }

  frame.appendChild(strip);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Stepper', count: 1 };
}
