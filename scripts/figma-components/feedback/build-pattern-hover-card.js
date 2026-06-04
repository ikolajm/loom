// =============================================================================
// Hover Card — Frame Pattern Mock
// =============================================================================
// Hover-triggered preview card. Richer than tooltip — supports structured
// content (title, description, metadata). Demonstrates md size.
// =============================================================================

function buildPatternHoverCard(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing } = lookups;
  const config = CONFIG.components['hover-card'];
  const colors = config.variants.default;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-hover-card', lookups);
  addHeader(frame, 'Hover Card', 'Frame pattern — hover-triggered preview. Rich content, card-like appearance.');

  const card = figma.createFrame();
  card.name = 'hover-card-mock';
  card.layoutMode = 'VERTICAL';
  card.primaryAxisSizingMode = 'AUTO';
  card.counterAxisSizingMode = 'FIXED';
  card.resize(parsePx(md['max-width']), card.height);

  const bgVar = semColors[colors.bg];
  if (bgVar) card.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }, 'color', bgVar
  )];

  if (colors.border) {
    const borderVar = semColors[colors.border];
    if (borderVar) { card.strokes = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }, 'color', borderVar)]; card.strokeWeight = 1; }
  }

  const radVar = semRadius[md.radius];
  if (radVar) { card.setBoundVariable('topLeftRadius', radVar); card.setBoundVariable('topRightRadius', radVar); card.setBoundVariable('bottomLeftRadius', radVar); card.setBoundVariable('bottomRightRadius', radVar); }

  function getEffectStyle(ref) {
    if (!ref) return null;
    const styles = figma.getLocalEffectStyles();
    return styles.find(s => s.name === ref.replace('effects/shadow-', 'shadow/')) || null;
  }
  const es = getEffectStyle(colors.shadow); if (es) card.effectStyleId = es.id;

  const xp = resolveScale(md['x-padding']); if (xp) { const v = primSpacing[xp]; if (v) { card.setBoundVariable('paddingLeft', v); card.setBoundVariable('paddingRight', v); } }
  const yp = resolveScale(md['y-padding']); if (yp) { const v = primSpacing[yp]; if (v) { card.setBoundVariable('paddingTop', v); card.setBoundVariable('paddingBottom', v); } }
  const gap = resolveScale(md.gap); if (gap) { const v = primSpacing[gap]; if (v) card.setBoundVariable('itemSpacing', v); }

  const fgVar = semColors[colors.fg];

  const title = figma.createText();
  title.name = 'title';
  title.characters = '@jacobikola';
  applyTextStyle(title, 'title', 'sm');
  if (fgVar) title.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
  )];
  card.appendChild(title);

  const desc = figma.createText();
  desc.name = 'description';
  desc.characters = 'Designer, developer, creative entrepreneur. Building tools and systems.';
  applyTextStyle(desc, 'body', 'sm');
  const descFg = semColors['color/surface/on-surface-variant'];
  if (descFg) desc.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', descFg
  )];
  card.appendChild(desc);
  desc.layoutSizingHorizontal = 'FILL';

  frame.appendChild(card);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Hover Card', count: 1 };
}
