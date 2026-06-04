// =============================================================================
// Skeleton — Frame Pattern Mock
// =============================================================================
// 3 shape demonstrations: text line, avatar circle, card rectangle.
// Surface-3 fill, appropriate radius per shape.
// Shimmer animation is code-only — not represented in Figma.
// =============================================================================

function buildPatternSkeleton(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, layoutVars } = lookups;
  const config = CONFIG.components.skeleton;
  const bgVar = semColors[config.variants.default.bg];

  const frame = createSectionFrame('base.pattern-skeleton', lookups);
  addHeader(frame, 'Skeleton', 'Frame pattern — loading placeholders. 3 shapes: text, avatar, card. Shimmer is code-only.');

  // Examples container
  const examples = figma.createFrame();
  examples.name = 'skeleton-examples';
  examples.layoutMode = 'VERTICAL';
  examples.primaryAxisSizingMode = 'AUTO';
  examples.counterAxisSizingMode = 'FIXED';
  examples.resize(400, examples.height);
  examples.fills = [];
  const gapVar = layoutVars['layout/spacing/component-group-gap'];
  if (gapVar) examples.setBoundVariable('itemSpacing', gapVar);

  // Helper: create a skeleton shape
  function createShape(name, widthVal, heightRef, radiusRef) {
    const shape = figma.createFrame();
    shape.name = `skeleton-${name}`;
    shape.layoutMode = 'NONE';

    // Height from spacing scale
    const hPath = resolveScale(heightRef);
    const hPx = hPath ? null : 16;
    if (hPath) {
      const hVar = primSpacing[hPath];
      if (hVar) shape.setBoundVariable('height', hVar);
    } else {
      shape.resize(shape.width, hPx);
    }

    // Width — percentage or spacing scale
    if (widthVal === '100%') {
      // Will be set to FILL after appending
      shape.resize(400, shape.height);
    } else {
      const wPath = resolveScale(widthVal);
      if (wPath) {
        const wVar = primSpacing[wPath];
        if (wVar) shape.setBoundVariable('width', wVar);
      }
    }

    // Background
    if (bgVar) shape.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }, 'color', bgVar
    )];

    // Radius
    const radVar = semRadius[radiusRef];
    if (radVar) { shape.setBoundVariable('topLeftRadius', radVar); shape.setBoundVariable('topRightRadius', radVar); shape.setBoundVariable('bottomLeftRadius', radVar); shape.setBoundVariable('bottomRightRadius', radVar); }

    return shape;
  }

  // Text skeleton — full width, small height, component radius
  const textShape = createShape('text', config.shapes.text.width, config.shapes.text.height, config.shapes.text.radius);
  examples.appendChild(textShape);
  textShape.layoutSizingHorizontal = 'FILL';

  // Avatar skeleton — square (equal w/h from spacing scale), pill radius
  const avatarShape = createShape('avatar', config.shapes.avatar.width, config.shapes.avatar.height, config.shapes.avatar.radius);
  examples.appendChild(avatarShape);

  // Card skeleton — full width, tall height, card radius
  const cardShape = createShape('card', config.shapes.card.width, config.shapes.card.height, config.shapes.card.radius);
  examples.appendChild(cardShape);
  cardShape.layoutSizingHorizontal = 'FILL';

  frame.appendChild(examples);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Skeleton', count: 3 };
}
