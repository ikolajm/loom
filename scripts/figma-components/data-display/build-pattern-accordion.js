// =============================================================================
// Accordion — Frame Pattern Mock
// =============================================================================
// Each section is one container (header + content) with border-bottom on the
// container — so the border moves down when content expands (shadcn pattern).
// Typography differentiates header (Medium) from content (Regular).
// =============================================================================

function buildPatternAccordion(lookups, defaultMode, page) {
  const { semColors, primSpacing, heights, primIconSize } = lookups;
  const config = CONFIG.components.accordion;
  const colors = config.variants.default;
  const md = config.sizes.md;
  const headerTypo = config['header-typography'];

  const frame = createSectionFrame('base.pattern-accordion', lookups);
  addHeader(frame, 'Accordion', 'Frame pattern — collapsible sections with chevron indicator. Content is consumer-driven.');

  // Accordion outer container
  const accordion = figma.createFrame();
  accordion.name = 'accordion-mock';
  accordion.layoutMode = 'VERTICAL';
  accordion.primaryAxisSizingMode = 'AUTO';
  accordion.counterAxisSizingMode = 'FIXED';
  accordion.resize(400, accordion.height);
  accordion.itemSpacing = 0;
  accordion.fills = [];

  const fgVar = semColors['color/surface/on-surface'];
  const mutedVar = semColors['color/surface/on-surface-variant'];
  const borderVar = colors.border ? semColors[colors.border] : null;

  const sections = [
    { title: 'Section One', expanded: false },
    { title: 'Section Two', expanded: true },
    { title: 'Section Three', expanded: false }
  ];

  const fontSize = parsePx(md['header-font-size']);
  const lineHeight = parsePx(md['header-line-height']);

  // Chevron icon
  const chevronComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === config['indicator-icon']);
  const iconPath = resolveIcon(md.indicator);
  const iconSizeVar = iconPath ? primIconSize[iconPath] : null;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Section container — border-bottom lives here, wrapping header + content
    const sectionFrame = figma.createFrame();
    sectionFrame.name = `section-${i}`;
    sectionFrame.layoutMode = 'VERTICAL';
    sectionFrame.primaryAxisSizingMode = 'AUTO';
    sectionFrame.counterAxisSizingMode = 'AUTO';
    sectionFrame.itemSpacing = 0;
    sectionFrame.fills = [];

    // Border-bottom on the section container
    if (borderVar) {
      sectionFrame.strokes = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
      )];
      sectionFrame.strokeTopWeight = 0;
      sectionFrame.strokeRightWeight = 0;
      sectionFrame.strokeBottomWeight = 1;
      sectionFrame.strokeLeftWeight = 0;
      sectionFrame.strokeAlign = 'INSIDE';
    }

    // Header row (inside section container)
    const header = figma.createFrame();
    header.name = 'header';
    header.layoutMode = 'HORIZONTAL';
    header.primaryAxisSizingMode = 'AUTO';
    header.counterAxisAlignItems = 'CENTER';
    header.fills = [];

    // Height
    const hPath = resolveHeight(md['header-height']);
    if (hPath) {
      const hVar = heights[hPath];
      if (hVar) header.setBoundVariable('height', hVar);
      header.counterAxisSizingMode = 'FIXED';
    }

    // X-padding
    const xp = resolveScale(md['header-x-padding']);
    if (xp) { const v = primSpacing[xp]; if (v) { header.setBoundVariable('paddingLeft', v); header.setBoundVariable('paddingRight', v); } }

    // Gap
    const gp = resolveScale(md['header-gap']);
    if (gp) { const v = primSpacing[gp]; if (v) header.setBoundVariable('itemSpacing', v); }

    // Title text
    const title = figma.createText();
    title.name = 'title';
    title.characters = section.title;
    applyTextStyle(title, 'action', 'md');
    if (fgVar) title.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    header.appendChild(title);
    title.layoutSizingHorizontal = 'FILL';

    // Chevron indicator
    if (chevronComp) {
      const chevron = chevronComp.createInstance();
      chevron.name = 'indicator';
      if (iconSizeVar) {
        chevron.setBoundVariable('width', iconSizeVar);
        chevron.setBoundVariable('height', iconSizeVar);
      }
      if (fgVar) {
        const vecs = chevron.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
        const paint = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
        )];
        for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
      }
      if (section.expanded) chevron.rotation = -180;
      header.appendChild(chevron);
    }

    sectionFrame.appendChild(header);
    header.layoutSizingHorizontal = 'FILL';

    // Content area (only for expanded section)
    if (section.expanded) {
      const content = figma.createFrame();
      content.name = 'content-area';
      content.layoutMode = 'VERTICAL';
      content.primaryAxisSizingMode = 'AUTO';
      content.counterAxisSizingMode = 'AUTO';
      content.fills = [];

      // Content padding
      const cp = resolveScale(md['content-padding']);
      if (cp) {
        const v = primSpacing[cp];
        if (v) { content.setBoundVariable('paddingLeft', v); content.setBoundVariable('paddingRight', v); content.setBoundVariable('paddingTop', v); content.setBoundVariable('paddingBottom', v); }
      }

      const bodyText = figma.createText();
      bodyText.name = 'body';
      bodyText.characters = 'Expanded content area. Consumer-driven — any content can be placed here including text, forms, or nested components.';
      applyTextStyle(bodyText, 'body', 'md');
      if (mutedVar) bodyText.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }, 'color', mutedVar
      )];
      content.appendChild(bodyText);
      bodyText.layoutSizingHorizontal = 'FILL';

      sectionFrame.appendChild(content);
      content.layoutSizingHorizontal = 'FILL';
    }

    accordion.appendChild(sectionFrame);
    sectionFrame.layoutSizingHorizontal = 'FILL';
  }

  frame.appendChild(accordion);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Accordion', count: 1 };
}
