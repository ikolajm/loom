// =============================================================================
// Calendar — Frame Pattern Mock
// =============================================================================
// Month grid with header (nav arrows + month label) and day cells.
// Demonstrates md size with sample month. Selected day + today highlighted.
// =============================================================================

function buildPatternCalendar(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing } = lookups;
  const config = CONFIG.components.calendar;
  const colors = config.variants.default;
  const md = config.sizes.md;
  const dayStates = config.day.state;

  const frame = createSectionFrame('base.pattern-calendar', lookups);
  addHeader(frame, 'Calendar', 'Frame pattern — month grid for date selection. Day cells with selected/today states.');

  const cal = figma.createFrame();
  cal.name = 'calendar-mock';
  cal.layoutMode = 'VERTICAL';
  cal.primaryAxisSizingMode = 'AUTO';
  cal.counterAxisSizingMode = 'FIXED';
  cal.resize(parsePx(md.width), cal.height);

  const bgVar = semColors[colors.bg];
  if (bgVar) cal.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }, 'color', bgVar
  )];

  const radVar = semRadius[md.radius];
  if (radVar) { cal.setBoundVariable('topLeftRadius', radVar); cal.setBoundVariable('topRightRadius', radVar); cal.setBoundVariable('bottomLeftRadius', radVar); cal.setBoundVariable('bottomRightRadius', radVar); }

  const xp = resolveScale(md['x-padding']); if (xp) { const v = primSpacing[xp]; if (v) { cal.setBoundVariable('paddingLeft', v); cal.setBoundVariable('paddingRight', v); } }
  const yp = resolveScale(md['y-padding']); if (yp) { const v = primSpacing[yp]; if (v) { cal.setBoundVariable('paddingTop', v); cal.setBoundVariable('paddingBottom', v); } }
  const gap = resolveScale(md.gap); if (gap) { const v = primSpacing[gap]; if (v) cal.setBoundVariable('itemSpacing', v); }

  // Header row (month + arrows)
  const header = figma.createFrame();
  header.name = 'header';
  header.layoutMode = 'HORIZONTAL';
  header.primaryAxisSizingMode = 'AUTO';
  header.counterAxisSizingMode = 'AUTO';
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';
  header.fills = [];

  const fgVar = semColors[colors.fg];
  const monthText = figma.createText();
  monthText.name = 'month-label';
  monthText.characters = 'April 2026';
  applyTextStyle(monthText, 'title', 'md');
  if (fgVar) monthText.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', fgVar
  )];
  header.appendChild(monthText);
  cal.appendChild(header);
  header.layoutSizingHorizontal = 'FILL';

  // Day grid (simplified — 2 rows to demonstrate states)
  const days = [
    { num: '14', state: 'default' },
    { num: '15', state: 'default' },
    { num: '16', state: 'today' },
    { num: '17', state: 'selected' },
    { num: '18', state: 'default' },
    { num: '19', state: 'default' },
    { num: '20', state: 'default' },
  ];

  const row = figma.createFrame();
  row.name = 'day-row';
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisSizingMode = 'AUTO';
  row.counterAxisSizingMode = 'AUTO';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';
  row.fills = [];

  const cellHeightPath = resolveHeight(md['cell-size']);
  const dayRadVar = semRadius[md['day-radius']];

  for (const day of days) {
    const cell = figma.createFrame();
    cell.name = `day-${day.num}`;
    cell.layoutMode = 'HORIZONTAL';
    cell.primaryAxisAlignItems = 'CENTER';
    cell.counterAxisAlignItems = 'CENTER';
    cell.primaryAxisSizingMode = 'FIXED';
    cell.counterAxisSizingMode = 'FIXED';

    const hVar = cellHeightPath ? primSpacing[cellHeightPath] : null;
    if (hVar) { cell.setBoundVariable('width', hVar); cell.setBoundVariable('height', hVar); }
    else cell.resize(32, 32);

    if (dayRadVar) { cell.setBoundVariable('topLeftRadius', dayRadVar); cell.setBoundVariable('topRightRadius', dayRadVar); cell.setBoundVariable('bottomLeftRadius', dayRadVar); cell.setBoundVariable('bottomRightRadius', dayRadVar); }

    const sc = dayStates[day.state];
    const cellBg = sc.bg === 'transparent' ? null : semColors[sc.bg];
    if (cellBg) cell.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.8 } }, 'color', cellBg
    )];
    else cell.fills = [];

    if (sc.border) {
      const bVar = semColors[sc.border];
      if (bVar) { cell.strokes = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', bVar)]; cell.strokeWeight = 1; }
    }

    const cellFg = semColors[sc.fg];
    const numText = figma.createText();
    numText.name = 'num';
    numText.characters = day.num;
    applyTextStyle(numText, 'body', 'md');
    if (cellFg) numText.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', cellFg
    )];
    cell.appendChild(numText);
    row.appendChild(cell);
  }

  cal.appendChild(row);
  row.layoutSizingHorizontal = 'FILL';
  frame.appendChild(cal);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Calendar', count: 1 };
}
