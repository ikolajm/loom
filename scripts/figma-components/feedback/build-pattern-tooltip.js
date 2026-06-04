// =============================================================================
// Tooltip — Frame Pattern Mock
// =============================================================================
// Small overlay with shadow-1, surface-bright bg, component radius.
// Demonstrates md size with sample text.
// =============================================================================

function buildPatternTooltip(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing } = lookups;
  const config = CONFIG.components.tooltip;
  const colors = config.variants.default;
  const md = config.sizes.md;

  function getEffectStyle(ref) {
    if (!ref) return null;
    const styles = figma.getLocalEffectStyles();
    return styles.find(s => s.name === ref.replace('effects/shadow-', 'shadow/')) || null;
  }

  const frame = createSectionFrame('base.pattern-tooltip', lookups);
  addHeader(frame, 'Tooltip', 'Frame pattern — small overlay for hover hints. Surface-bright bg, shadow-1.');

  const tooltip = figma.createFrame();
  tooltip.name = 'tooltip-mock';
  tooltip.layoutMode = 'HORIZONTAL';
  tooltip.primaryAxisSizingMode = 'AUTO';
  tooltip.counterAxisSizingMode = 'AUTO';

  // Background
  const bgVar = semColors[colors.bg];
  if (bgVar) tooltip.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }, 'color', bgVar
  )];

  // Radius
  const radVar = semRadius[md.radius];
  if (radVar) { tooltip.setBoundVariable('topLeftRadius', radVar); tooltip.setBoundVariable('topRightRadius', radVar); tooltip.setBoundVariable('bottomLeftRadius', radVar); tooltip.setBoundVariable('bottomRightRadius', radVar); }

  // Padding
  const xp = resolveScale(md['x-padding']); if (xp) { const v = primSpacing[xp]; if (v) { tooltip.setBoundVariable('paddingLeft', v); tooltip.setBoundVariable('paddingRight', v); } }
  const yp = resolveScale(md['y-padding']); if (yp) { const v = primSpacing[yp]; if (v) { tooltip.setBoundVariable('paddingTop', v); tooltip.setBoundVariable('paddingBottom', v); } }

  // Shadow
  const es = getEffectStyle(colors.shadow); if (es) tooltip.effectStyleId = es.id;

  // Text
  const fgVar = semColors[colors.fg];
  const text = figma.createText();
  text.name = 'label';
  text.characters = 'Helpful tooltip text';
  applyTextStyle(text, 'label', 'sm');
  if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
  )];
  tooltip.appendChild(text);

  frame.appendChild(tooltip);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Tooltip', count: 1 };
}
