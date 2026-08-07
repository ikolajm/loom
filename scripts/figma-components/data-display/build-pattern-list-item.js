// =============================================================================
// List Item — Frame Pattern Mock
// =============================================================================
// Structural shell with leading/content/trailing slots.
// Bordered variant shown with outline-subtle bottom borders.
// Content is consumer-driven — demonstrated with sample text.
// =============================================================================

function buildPatternListItem(lookups, defaultMode, page) {
  const { semColors, primSpacing, heights, layoutVars } = lookups;
  const config = CONFIG.components['list-item'];
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-list-item', lookups);
  addHeader(frame, 'List Item', 'Frame pattern — structural shell with leading, content, trailing slots. Content is consumer-driven.');

  // List container
  const list = figma.createFrame();
  list.name = 'list-mock';
  list.layoutMode = 'VERTICAL';
  list.primaryAxisSizingMode = 'AUTO';
  list.counterAxisSizingMode = 'FIXED';
  list.resize(400, list.height);
  list.itemSpacing = 0;
  list.fills = [];

  const items = [
    { leading: 'JD', title: 'John Doe', subtitle: 'john@example.com' },
    { leading: 'AS', title: 'Alice Smith', subtitle: 'alice@example.com' },
    { leading: 'BW', title: 'Bob Wilson', subtitle: 'bob@example.com' }
  ];

  const fgVar = semColors['color/surface/on-surface'];
  const mutedVar = semColors['color/surface/on-surface-variant'];
  const borderVar = semColors[config.variants.bordered.border];
  const avatarBgVar = semColors['color/primary/primary-container'];
  const avatarFgVar = semColors['color/primary/on-primary-container'];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const row = figma.createFrame();
    row.name = `list-item-${i}`;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisAlignItems = 'CENTER';

    // Height
    const hPath = resolveHeight(md.height);
    if (hPath) {
      const hVar = heights[hPath];
      if (hVar) row.setBoundVariable('height', hVar);
      row.counterAxisSizingMode = 'FIXED';
    }

    // X-padding
    const xp = resolveScale(md['x-padding']);
    if (xp) { const v = primSpacing[xp]; if (v) { row.setBoundVariable('paddingLeft', v); row.setBoundVariable('paddingRight', v); } }

    // Gap
    const gp = resolveScale(md.gap);
    if (gp) { const v = primSpacing[gp]; if (v) row.setBoundVariable('itemSpacing', v); }

    row.fills = [];

    // Bottom border (bordered variant)
    if (borderVar && i < items.length - 1) {
      row.strokes = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
      )];
      row.strokeTopWeight = 0;
      row.strokeRightWeight = 0;
      row.strokeBottomWeight = 1;
      row.strokeLeftWeight = 0;
      row.strokeAlign = 'INSIDE';
    }

    // Leading — avatar circle
    const avatar = figma.createFrame();
    avatar.name = 'leading';
    avatar.resize(32, 32);
    avatar.layoutMode = 'HORIZONTAL';
    avatar.primaryAxisSizingMode = 'FIXED';
    avatar.counterAxisSizingMode = 'FIXED';
    avatar.primaryAxisAlignItems = 'CENTER';
    avatar.counterAxisAlignItems = 'CENTER';
    avatar.cornerRadius = 9999;
    if (avatarBgVar) avatar.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.7, g: 0.7, b: 0.9 } }, 'color', avatarBgVar
    )];

    const initials = figma.createText();
    initials.name = 'initials';
    initials.characters = item.leading;
    applyTextStyle(initials, 'label', 'sm');
    initials.textCase = 'UPPER';
    if (avatarFgVar) initials.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.5 } }, 'color', avatarFgVar
    )];
    avatar.appendChild(initials);
    row.appendChild(avatar);

    // Content — title + subtitle
    const content = figma.createFrame();
    content.name = 'content';
    content.layoutMode = 'VERTICAL';
    content.primaryAxisSizingMode = 'AUTO';
    content.counterAxisSizingMode = 'AUTO';
    content.itemSpacing = 2;
    content.fills = [];

    const titleText = figma.createText();
    titleText.name = 'title';
    titleText.characters = item.title;
    applyTextStyle(titleText, 'title', 'sm');
    if (fgVar) titleText.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    content.appendChild(titleText);

    const subtitleText = figma.createText();
    subtitleText.name = 'subtitle';
    subtitleText.characters = item.subtitle;
    applyTextStyle(subtitleText, 'body', 'sm');
    if (mutedVar) subtitleText.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }, 'color', mutedVar
    )];
    content.appendChild(subtitleText);

    row.appendChild(content);
    content.layoutSizingHorizontal = 'FILL';

    list.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
  }

  frame.appendChild(list);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern List Item', count: 1 };
}
