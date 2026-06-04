// =============================================================================
// Breadcrumbs — Frame Pattern Mock
// =============================================================================
// Horizontal trail with separator between items. Current page is plain text.
// =============================================================================

function buildPatternBreadcrumbs(lookups, defaultMode, page) {
  const { semColors, primSpacing } = lookups;
  const config = CONFIG.components.breadcrumbs;
  const colors = config.variants.default;
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-breadcrumbs', lookups);
  addHeader(frame, 'Breadcrumbs', 'Frame pattern — horizontal page hierarchy trail with separators.');

  const strip = figma.createFrame();
  strip.name = 'breadcrumbs';
  strip.layoutMode = 'HORIZONTAL';
  strip.primaryAxisSizingMode = 'AUTO';
  strip.counterAxisSizingMode = 'AUTO';
  strip.counterAxisAlignItems = 'CENTER';
  strip.fills = [];

  const gapPath = resolveScale(md.gap);
  if (gapPath) { const v = primSpacing[gapPath]; if (v) strip.setBoundVariable('itemSpacing', v); }

  const crumbs = ['Home', 'Projects', 'Design System', 'Tokens'];
  const linkFgVar = semColors[colors['link-fg']];
  const currentFgVar = semColors[colors['current-fg']];
  const sepFgVar = semColors[colors['separator-fg']];

  for (let i = 0; i < crumbs.length; i++) {
    const isCurrent = i === crumbs.length - 1;

    const text = figma.createText();
    text.name = isCurrent ? 'current' : `link-${i}`;
    text.characters = crumbs[i];
    applyTextStyle(text, 'action', 'md');

    const fgVar = isCurrent ? currentFgVar : linkFgVar;
    if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', fgVar
    )];

    // No underline — color distinction is sufficient
    strip.appendChild(text);

    // Separator (except after last item)
    if (!isCurrent) {
      const sep = figma.createText();
      sep.name = 'separator';
      sep.characters = config.separator || '/';
      applyTextStyle(sep, 'body', 'md');
      if (sepFgVar) sep.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', sepFgVar
      )];
      strip.appendChild(sep);
    }
  }

  frame.appendChild(strip);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Breadcrumbs', count: 1 };
}
