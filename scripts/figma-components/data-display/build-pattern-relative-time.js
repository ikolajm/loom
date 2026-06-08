// =============================================================================
// Relative Time — Frame Pattern Mock
// =============================================================================
// Intl.RelativeTimeFormat is a code/logic primitive — its Figma representation is the
// rendered relative strings as text samples. (In code these are <time> elements computed
// after mount; here they're static text the browse reference can show.)
// =============================================================================

function buildPatternRelativeTime(lookups, defaultMode, page) {
  const { semColors } = lookups;

  const fgVar = semColors['color/surface/on-surface'];

  const frame = createSectionFrame('base.pattern-relative-time', lookups);
  addHeader(frame, 'Relative Time', 'Frame pattern — Intl.RelativeTimeFormat output as text samples. Renders in a <time> element; computes after mount in code.');

  const samples = ['just now', '2 hours ago', 'in 2 days', '3 weeks ago'];

  const list = figma.createFrame();
  list.name = 'relative-time-mock';
  list.layoutMode = 'VERTICAL';
  list.primaryAxisSizingMode = 'AUTO';
  list.counterAxisSizingMode = 'AUTO';
  list.itemSpacing = 8;
  list.fills = [];

  for (const s of samples) {
    const t = figma.createText();
    t.name = s;
    t.characters = s;
    applyTextStyle(t, 'body', 'md');
    if (fgVar) t.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    list.appendChild(t);
  }

  frame.appendChild(list);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Relative Time', count: 1 };
}
