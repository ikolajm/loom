// =============================================================================
// Table — Frame Pattern Mock
// =============================================================================
// Header row (surface-3, Medium weight) + alternating data rows.
// Rounded corners via clipsContent on container. outline-subtle border.
// =============================================================================

function buildPatternTable(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing } = lookups;
  const tableConfig = CONFIG.components.table;
  const colors = tableConfig.variants.default;
  const md = tableConfig.sizes.md;
  const headerTypo = tableConfig.typography.header;
  const cellTypo = tableConfig.typography.cell;

  const fontSize = parsePx(md['font-size']);
  const lineHeight = parsePx(md['line-height']);

  // Section frame
  const frame = createSectionFrame('base.pattern-table', lookups);
  addHeader(frame, 'Table', 'Frame pattern — header row + alternating data rows with rounded corners.');

  // Table container
  const table = figma.createFrame();
  table.name = 'table-container';
  table.layoutMode = 'VERTICAL';
  table.primaryAxisSizingMode = 'AUTO';
  table.counterAxisSizingMode = 'FIXED';
  table.resize(500, table.height);
  table.itemSpacing = 0;
  table.fills = [];
  table.clipsContent = true;

  // Radius
  const radVar = semRadius['radius/component'];
  if (radVar) {
    table.setBoundVariable('topLeftRadius', radVar);
    table.setBoundVariable('topRightRadius', radVar);
    table.setBoundVariable('bottomLeftRadius', radVar);
    table.setBoundVariable('bottomRightRadius', radVar);
  }

  // Border
  const borderVar = semColors[colors.border];
  if (borderVar) {
    table.strokes = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
    )];
    table.strokeWeight = 1;
  }

  // Column definitions and data
  const columns = ['Name', 'Status', 'Amount'];
  const rows = [
    ['Acme Corp', 'Active', '$1,200'],
    ['Globex Inc', 'Pending', '$840'],
    ['Initech', 'Active', '$2,100']
  ];

  // Helper: create a table row
  function createRow(cells, bgVarRef, fgVarRef, weight) {
    const row = figma.createFrame();
    row.name = 'row';
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.counterAxisAlignItems = 'CENTER';

    // Background
    const bg = semColors[bgVarRef];
    if (bg) row.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bg
    )];

    // Padding
    const xpPath = resolveScale(md['x-padding']);
    if (xpPath) {
      const v = primSpacing[xpPath];
      if (v) { row.setBoundVariable('paddingLeft', v); row.setBoundVariable('paddingRight', v); }
    }
    const ypPath = resolveScale(md['y-padding']);
    if (ypPath) {
      const v = primSpacing[ypPath];
      if (v) { row.setBoundVariable('paddingTop', v); row.setBoundVariable('paddingBottom', v); }
    }

    // Foreground color
    const fg = semColors[fgVarRef];

    for (const cellText of cells) {
      const cell = figma.createFrame();
      cell.name = 'cell';
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisSizingMode = 'AUTO';
      cell.counterAxisSizingMode = 'AUTO';
      cell.fills = [];

      const text = figma.createText();
      text.name = 'text';
      text.characters = cellText;
      applyTextStyle(text, weight >= 500 ? 'label' : 'body', 'md');
      if (fg) text.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fg
      )];

      cell.appendChild(text);
      row.appendChild(cell);
      cell.layoutSizingHorizontal = 'FILL';
    }

    return row;
  }

  // Header row
  const headerRow = createRow(columns, colors['header-bg'], colors['header-fg'], headerTypo['font-weight']);
  headerRow.name = 'header-row';
  table.appendChild(headerRow);
  headerRow.layoutSizingHorizontal = 'FILL';

  // Data rows — alternating backgrounds
  for (let i = 0; i < rows.length; i++) {
    const bgRef = i % 2 === 0 ? colors['row-bg'] : colors['alt-row-bg'];
    const dataRow = createRow(rows[i], bgRef, colors['row-fg'], cellTypo['font-weight']);
    dataRow.name = `item-row`;
    table.appendChild(dataRow);
    dataRow.layoutSizingHorizontal = 'FILL';
  }

  frame.appendChild(table);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Table', count: 1 };
}
