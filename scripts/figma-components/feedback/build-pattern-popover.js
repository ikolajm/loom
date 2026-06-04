// =============================================================================
// Popover — Frame Pattern Mock
// =============================================================================
// Larger overlay with shadow-2, surface-bright bg, card radius.
// Auto-sized to fit content. Demonstrates md size.
// =============================================================================

function buildPatternPopover(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing } = lookups;
  const config = CONFIG.components.popover;
  const colors = config.variants.default;
  const md = config.sizes.md;

  function getEffectStyle(ref) {
    if (!ref) return null;
    const styles = figma.getLocalEffectStyles();
    return styles.find(s => s.name === ref.replace('effects/shadow-', 'shadow/')) || null;
  }

  const frame = createSectionFrame('base.pattern-popover', lookups);
  addHeader(frame, 'Popover', 'Frame pattern — content overlay for rich interactions. Surface-bright bg, shadow-2.');

  const popover = figma.createFrame();
  popover.name = 'popover-mock';
  popover.layoutMode = 'VERTICAL';
  popover.primaryAxisSizingMode = 'AUTO';
  popover.counterAxisSizingMode = 'FIXED';
  popover.resize(280, popover.height);

  // Background
  const bgVar = semColors[colors.bg];
  if (bgVar) popover.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }, 'color', bgVar
  )];

  // Radius
  const radVar = semRadius[md.radius];
  if (radVar) { popover.setBoundVariable('topLeftRadius', radVar); popover.setBoundVariable('topRightRadius', radVar); popover.setBoundVariable('bottomLeftRadius', radVar); popover.setBoundVariable('bottomRightRadius', radVar); }

  // Padding + gap
  const xp = resolveScale(md['x-padding']); if (xp) { const v = primSpacing[xp]; if (v) { popover.setBoundVariable('paddingLeft', v); popover.setBoundVariable('paddingRight', v); } }
  const yp = resolveScale(md['y-padding']); if (yp) { const v = primSpacing[yp]; if (v) { popover.setBoundVariable('paddingTop', v); popover.setBoundVariable('paddingBottom', v); } }
  const gp = resolveScale(md.gap); if (gp) { const v = primSpacing[gp]; if (v) popover.setBoundVariable('itemSpacing', v); }

  // Shadow
  const es = getEffectStyle(colors.shadow); if (es) popover.effectStyleId = es.id;

  // Content
  const fgVar = semColors[colors.fg];
  const title = figma.createText(); title.name = 'title'; title.characters = 'Popover Title';
  applyTextStyle(title, 'title', 'sm');
  if (fgVar) title.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar)];
  popover.appendChild(title); title.layoutSizingHorizontal = 'FILL';

  const body = figma.createText(); body.name = 'body'; body.characters = 'Additional context or actions displayed in a popover overlay.';
  applyTextStyle(body, 'body', 'md');
  if (fgVar) body.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar)];
  popover.appendChild(body); body.layoutSizingHorizontal = 'FILL';

  frame.appendChild(popover);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Popover', count: 1 };
}
