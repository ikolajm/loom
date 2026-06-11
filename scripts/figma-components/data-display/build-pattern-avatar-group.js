// =============================================================================
// Avatar Group — Frame Pattern Mock
// =============================================================================
// Stacked avatars (md, 32px) overlapping via negative itemSpacing, each carrying a
// surface ring so adjacent edges read. A +N counter (surface-2 fill, muted text) closes
// an overflowed stack. Two rows: a plain stack and a max=3 + overflow stack.
// Mirrors the code atom (composition over avatar; ring + overlap are structural).
// =============================================================================

function buildPatternAvatarGroup(lookups, defaultMode, page) {
  const { semColors } = lookups;

  const avatarBgVar = semColors['color/primary/primary-container'];
  const avatarFgVar = semColors['color/primary/on-primary-container'];
  const ringVar = semColors['color/surface/surface-1'];
  const overflowBgVar = semColors['color/surface/surface-2'];
  const overflowFgVar = semColors['color/surface/on-surface-variant'];

  const frame = createSectionFrame('base.pattern-avatar-group', lookups);
  addHeader(frame, 'Avatar Group', 'Frame pattern — stacked avatars over a surface ring; +N counter closes an overflowed stack. Size forwards to children in code.');

  // One avatar circle (md). `overflow` flag switches to the muted +N counter styling.
  function makeAvatar(label, overflow) {
    const a = figma.createFrame();
    a.name = overflow ? 'overflow' : 'avatar';
    a.resize(32, 32);
    a.layoutMode = 'HORIZONTAL';
    a.primaryAxisSizingMode = 'FIXED';
    a.counterAxisSizingMode = 'FIXED';
    a.primaryAxisAlignItems = 'CENTER';
    a.counterAxisAlignItems = 'CENTER';
    a.cornerRadius = 9999;

    const bg = overflow ? overflowBgVar : avatarBgVar;
    if (bg) a.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.7, g: 0.7, b: 0.9 } }, 'color', bg
    )];

    // Surface ring (the stack-separation device)
    if (ringVar) {
      a.strokes = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', ringVar
      )];
      a.strokeWeight = 2;
      a.strokeAlign = 'OUTSIDE';
    }

    const t = figma.createText();
    t.name = 'initials';
    t.characters = label;
    applyTextStyle(t, 'label', 'sm');
    if (!overflow) t.textCase = 'UPPER';
    const fg = overflow ? overflowFgVar : avatarFgVar;
    if (fg) t.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.5 } }, 'color', fg
    )];
    a.appendChild(t);
    return a;
  }

  // One overlapping stack — negative itemSpacing pulls the circles together.
  function makeStack(name, members, overflowLabel) {
    const stack = figma.createFrame();
    stack.name = name;
    stack.layoutMode = 'HORIZONTAL';
    stack.primaryAxisSizingMode = 'AUTO';
    stack.counterAxisSizingMode = 'AUTO';
    stack.counterAxisAlignItems = 'CENTER';
    stack.itemSpacing = -8;
    stack.fills = [];
    for (const m of members) stack.appendChild(makeAvatar(m, false));
    if (overflowLabel) stack.appendChild(makeAvatar(overflowLabel, true));
    return stack;
  }

  const rows = figma.createFrame();
  rows.name = 'avatar-group-mock';
  rows.layoutMode = 'VERTICAL';
  rows.primaryAxisSizingMode = 'AUTO';
  rows.counterAxisSizingMode = 'AUTO';
  rows.itemSpacing = 16;
  rows.fills = [];

  rows.appendChild(makeStack('stacked', ['JI', 'AB', 'CD']));
  rows.appendChild(makeStack('max=3 + overflow', ['JI', 'AB', 'CD'], '+2'));

  frame.appendChild(rows);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Avatar Group', count: 1 };
}
