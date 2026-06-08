// =============================================================================
// Number — Frame Pattern Mock
// =============================================================================
// Intl.NumberFormat is a code/logic primitive — its Figma representation is the set of
// rendered formats as text samples (label + formatted value rows). Values mirror the
// gallery stories so the browse reference matches what the code produces.
// =============================================================================

function buildPatternNumber(lookups, defaultMode, page) {
  const { semColors } = lookups;

  const fgVar = semColors['color/surface/on-surface'];
  const mutedVar = semColors['color/surface/on-surface-variant'];

  const frame = createSectionFrame('base.pattern-number', lookups);
  addHeader(frame, 'Number', 'Frame pattern — Intl.NumberFormat output as text samples. tabular-nums in code; RSC-safe.');

  const samples = [
    { label: 'decimal', value: '1,234,567.89' },
    { label: 'currency (USD)', value: '$1,299.99' },
    { label: 'currency (de-DE)', value: '1.299,99 €' },
    { label: 'percent', value: '42.67%' },
    { label: 'compact', value: '12K' },
    { label: 'unit', value: '72 mph' },
  ];

  const list = figma.createFrame();
  list.name = 'number-mock';
  list.layoutMode = 'VERTICAL';
  list.primaryAxisSizingMode = 'AUTO';
  list.counterAxisSizingMode = 'AUTO';
  list.itemSpacing = 8;
  list.fills = [];

  for (const s of samples) {
    const row = figma.createFrame();
    row.name = s.label;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.counterAxisAlignItems = 'BASELINE';
    row.itemSpacing = 12;
    row.fills = [];

    const value = figma.createText();
    value.name = 'value';
    value.characters = s.value;
    applyTextStyle(value, 'title', 'md');
    if (fgVar) value.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    row.appendChild(value);

    const label = figma.createText();
    label.name = 'label';
    label.characters = s.label;
    applyTextStyle(label, 'body', 'sm');
    if (mutedVar) label.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }, 'color', mutedVar
    )];
    row.appendChild(label);

    list.appendChild(row);
  }

  frame.appendChild(list);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Number', count: 1 };
}
