// =============================================================================
// Video Player — Frame Pattern Mock
// =============================================================================
// The code atom is a styled native container — browser owns the controls; Loom owns the
// box (rounded clip, aspect-ratio, object-fit). The Figma mock is that container: rounded
// surface-1 boxes at each aspect ratio with a centered play glyph. No controls (native).
// =============================================================================

function buildPatternVideoPlayer(lookups, defaultMode, page) {
  const { semColors, semRadius } = lookups;

  const boxBgVar = semColors['color/surface/surface-1'];
  const glyphVar = semColors['color/surface/on-surface-variant'];
  const labelVar = semColors['color/surface/on-surface-variant'];
  const radVar = semRadius['radius/component'];

  const frame = createSectionFrame('base.pattern-video-player', lookups);
  addHeader(frame, 'Video Player', 'Frame pattern — styled native container (rounded clip + aspect ratio). Browser owns the controls; shown empty so the box chrome reads.');

  // height held constant across ratios so the row aligns
  const boxes = [
    { label: '16/9', w: 224, h: 126 },
    { label: '4/3', w: 168, h: 126 },
    { label: '1/1', w: 126, h: 126 },
  ];

  const row = figma.createFrame();
  row.name = 'video-player-mock';
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisSizingMode = 'AUTO';
  row.counterAxisSizingMode = 'AUTO';
  row.counterAxisAlignItems = 'MIN';
  row.itemSpacing = 16;
  row.fills = [];

  for (const b of boxes) {
    const cell = figma.createFrame();
    cell.name = b.label;
    cell.layoutMode = 'VERTICAL';
    cell.primaryAxisSizingMode = 'AUTO';
    cell.counterAxisSizingMode = 'AUTO';
    cell.counterAxisAlignItems = 'CENTER';
    cell.itemSpacing = 8;
    cell.fills = [];

    const box = figma.createFrame();
    box.name = 'container';
    box.resize(b.w, b.h);
    box.layoutMode = 'HORIZONTAL';
    box.primaryAxisSizingMode = 'FIXED';
    box.counterAxisSizingMode = 'FIXED';
    box.primaryAxisAlignItems = 'CENTER';
    box.counterAxisAlignItems = 'CENTER';
    box.clipsContent = true;
    if (boxBgVar) box.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', boxBgVar
    )];
    if (radVar) {
      box.setBoundVariable('topLeftRadius', radVar);
      box.setBoundVariable('topRightRadius', radVar);
      box.setBoundVariable('bottomLeftRadius', radVar);
      box.setBoundVariable('bottomRightRadius', radVar);
    }

    const glyph = figma.createText();
    glyph.name = 'play';
    glyph.characters = '▶';
    applyTextStyle(glyph, 'title', 'lg');
    if (glyphVar) glyph.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }, 'color', glyphVar
    )];
    box.appendChild(glyph);
    cell.appendChild(box);

    const label = figma.createText();
    label.name = 'label';
    label.characters = b.label;
    applyTextStyle(label, 'body', 'sm');
    if (labelVar) label.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }, 'color', labelVar
    )];
    cell.appendChild(label);

    row.appendChild(cell);
  }

  frame.appendChild(row);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Video Player', count: 1 };
}
