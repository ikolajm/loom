// =============================================================================
// Card — Frame Pattern Mock
// =============================================================================
// 3 visual examples side by side: default, elevated, outline.
// Demonstrates surface treatment (bg, border, shadow, radius, padding).
// NOT a component — frame pattern for per-project application.
// =============================================================================

function buildPatternCard(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, layoutVars } = lookups;
  const cardConfig = CONFIG.components.card;
  const md = cardConfig.sizes.md;

  // Section frame (base only — no preview for pattern mocks)
  const frame = createSectionFrame('base.pattern-card', lookups);
  addHeader(frame, 'Card', 'Frame pattern — surface treatment with bg, border, shadow, radius. 3 variants: default, elevated, outline.');

  // Examples container — horizontal row, clipsContent off for shadow visibility
  const examples = figma.createFrame();
  examples.name = 'card-examples';
  examples.layoutMode = 'HORIZONTAL';
  examples.primaryAxisSizingMode = 'AUTO';
  examples.counterAxisSizingMode = 'AUTO';
  examples.fills = [];
  examples.clipsContent = false;
  const groupGapVar = layoutVars['layout/spacing/component-group-gap'];
  if (groupGapVar) examples.setBoundVariable('itemSpacing', groupGapVar);

  // Effect style lookup helper
  function getEffectStyle(configRef) {
    if (!configRef || configRef === 'none') return null;
    const styles = figma.getLocalEffectStyles();
    // effects/shadow-1 → shadow/1
    const styleName = configRef.replace('effects/shadow-', 'shadow/');
    return styles.find(s => s.name === styleName) || null;
  }

  for (const [variantName, colors] of Object.entries(cardConfig.variants)) {
    const card = figma.createFrame();
    card.name = `card-${variantName}`;
    card.layoutMode = 'VERTICAL';
    card.primaryAxisSizingMode = 'AUTO';
    card.counterAxisSizingMode = 'FIXED';
    card.resize(240, card.height);

    // Background
    if (colors.bg === 'transparent') {
      card.fills = [];
    } else {
      const bgVar = semColors[colors.bg];
      if (bgVar) card.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bgVar
      )];
    }

    // Border
    if (colors.border && colors.border !== 'none') {
      const borderVar = semColors[colors.border];
      if (borderVar) {
        card.strokes = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
        )];
        card.strokeWeight = 1;
      }
    }

    // Shadow (effect style)
    const effectStyle = getEffectStyle(colors.shadow);
    if (effectStyle) card.effectStyleId = effectStyle.id;

    // Radius
    const radVar = semRadius[md.radius];
    if (radVar) {
      card.setBoundVariable('topLeftRadius', radVar);
      card.setBoundVariable('topRightRadius', radVar);
      card.setBoundVariable('bottomLeftRadius', radVar);
      card.setBoundVariable('bottomRightRadius', radVar);
    }

    // Padding
    const xpPath = resolveScale(md['x-padding']);
    if (xpPath) {
      const v = primSpacing[xpPath];
      if (v) { card.setBoundVariable('paddingLeft', v); card.setBoundVariable('paddingRight', v); }
    }
    const ypPath = resolveScale(md['y-padding']);
    if (ypPath) {
      const v = primSpacing[ypPath];
      if (v) { card.setBoundVariable('paddingTop', v); card.setBoundVariable('paddingBottom', v); }
    }

    // Gap
    const gapPath = resolveScale(md.gap);
    if (gapPath) {
      const v = primSpacing[gapPath];
      if (v) card.setBoundVariable('itemSpacing', v);
    }

    // Content — variant label + body text
    const fgVar = semColors[colors.fg];

    const title = figma.createText();
    title.name = 'title';
    title.characters = variantName.charAt(0).toUpperCase() + variantName.slice(1);
    applyTextStyle(title, 'title', 'md');
    if (fgVar) title.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    card.appendChild(title);

    const body = figma.createText();
    body.name = 'body';
    body.characters = `Card with ${variantName} surface treatment.`;
    applyTextStyle(body, 'body', 'md');
    if (fgVar) body.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    card.appendChild(body);
    body.layoutSizingHorizontal = 'FILL';

    examples.appendChild(card);
  }

  frame.appendChild(examples);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Card', count: 3 };
}
