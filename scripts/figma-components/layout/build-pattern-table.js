// =============================================================================
// Table — Frame Pattern Mock
// =============================================================================
// Modern content-first treatment: no header fill, no zebra striping, no outer
// grid. Muted header (on-surface-variant, Medium weight) + light per-row bottom
// borders (outline-subtle) as the only structuring device. NOT a component —
// frame pattern for per-project application.
// =============================================================================

function buildPatternTable(lookups, defaultMode, page) {
  const { semColors, primSpacing } = lookups;
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
  table.clipsContent = false;

  // Content-first: no outer grid (no container border/radius). Structure comes
  // from light per-row bottom borders, not an enclosing box.
  const borderVar = semColors[colors.border];

  // Column definitions and data
  const columns = ['Name', 'Status', 'Amount'];
  const rows = [
    ['Acme Corp', 'Active', '$1,200'],
    ['Globex Inc', 'Pending', '$840'],
    ['Initech', 'Active', '$2,100']
  ];

  // Helper: create a content-first table row — transparent bg, light bottom
  // border for row separation (the only structuring device).
  function createRow(cells, fgVarRef, weight) {
    const row = figma.createFrame();
    row.name = 'row';
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.counterAxisAlignItems = 'CENTER';
    row.fills = [];

    // Light bottom border only — no fill, no outer grid.
    if (borderVar) {
      row.strokes = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
      )];
      row.strokeAlign = 'INSIDE';
      row.strokeTopWeight = 0;
      row.strokeBottomWeight = 1;
      row.strokeLeftWeight = 0;
      row.strokeRightWeight = 0;
    }

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

  // Header row — muted (on-surface-variant), medium weight, bottom border.
  const headerRow = createRow(columns, colors['header-fg'], headerTypo['font-weight']);
  headerRow.name = 'header-row';
  table.appendChild(headerRow);
  headerRow.layoutSizingHorizontal = 'FILL';

  // Data rows — no zebra; light bottom border separates each.
  for (let i = 0; i < rows.length; i++) {
    const dataRow = createRow(rows[i], colors['row-fg'], cellTypo['font-weight']);
    dataRow.name = `item-row`;
    table.appendChild(dataRow);
    dataRow.layoutSizingHorizontal = 'FILL';
  }

  frame.appendChild(table);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Table', count: 1 };
}
