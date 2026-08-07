// =============================================================================
// Avatar Group — Frame Pattern Mock
// =============================================================================
// Stacked avatars overlapping via negative itemSpacing, each carrying a surface ring
// so adjacent edges read. A +N counter (surface-2 fill, muted text) closes an
// overflowed stack. One row per avatar size, each showing a plain stack and an
// overflowed one. Mirrors the code atom (composition over avatar; ring + overlap
// are structural).
//
// Sizes come from the avatar config rather than a pinned 32px. The code atom takes a
// `size` prop and forwards it to its children through cloneElement, so every avatar
// tier is reachable — this pattern rendered one size and read as though the component
// had none. Overlap scales with the tier for the same reason: a fixed -8px pulls a
// 24px stack much harder than a 48px one.
// =============================================================================

function buildPatternAvatarGroup(lookups, defaultMode, page) {
  const { semColors, heights } = lookups;
  const avatarSizes = CONFIG.components.avatar.sizes;
  const sizeNames = Object.keys(avatarSizes).filter((k) => !k.startsWith('$'));
  const sizePx = { sm: 24, md: 32, lg: 40, xl: 48 };

  const avatarBgVar = semColors['color/primary/primary-container'];
  const avatarFgVar = semColors['color/primary/on-primary-container'];
  const ringVar = semColors['color/surface/surface-1'];
  const overflowBgVar = semColors['color/surface/surface-2'];
  const overflowFgVar = semColors['color/surface/on-surface-variant'];

  const frame = createSectionFrame('base.pattern-avatar-group', lookups);
  addHeader(frame, 'Avatar Group', 'Frame pattern — stacked avatars over a surface ring; +N counter closes an overflowed stack. Size forwards to children in code.');

  // One avatar circle at `sizeName`. `overflow` switches to the muted +N counter styling.
  function makeAvatar(label, overflow, sizeName) {
    const sz = avatarSizes[sizeName];
    const px = sizePx[sizeName] || 32;
    const a = figma.createFrame();
    a.name = overflow ? 'overflow' : 'avatar';
    // Bind the variable, then resize explicitly — the same Figma gotcha build-avatar.js
    // documents: a bound width/height does not lay the frame out on creation.
    const hPath = resolveHeight(sz.size);
    if (hPath) {
      const hVar = heights[hPath];
      if (hVar) { a.setBoundVariable('width', hVar); a.setBoundVariable('height', hVar); }
    }
    a.resize(px, px);
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
    // Config font-size wins over the style's — avatar has four tiers and the label
    // ramp has three, so the tier cannot be mapped one-to-one.
    const fs = parsePx(sz['font-size']);
    if (fs) t.fontSize = fs;
    if (!overflow) t.textCase = 'UPPER';
    const fg = overflow ? overflowFgVar : avatarFgVar;
    if (fg) t.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.5 } }, 'color', fg
    )];
    a.appendChild(t);
    return a;
  }

  // One overlapping stack — negative itemSpacing pulls the circles together. The
  // overlap is a quarter of the avatar so the ring reads the same at every tier.
  function makeStack(name, members, overflowLabel, sizeName) {
    const stack = figma.createFrame();
    stack.name = name;
    stack.layoutMode = 'HORIZONTAL';
    stack.primaryAxisSizingMode = 'AUTO';
    stack.counterAxisSizingMode = 'AUTO';
    stack.counterAxisAlignItems = 'CENTER';
    stack.itemSpacing = -Math.round((sizePx[sizeName] || 32) / 4);
    stack.fills = [];
    for (const m of members) stack.appendChild(makeAvatar(m, false, sizeName));
    if (overflowLabel) stack.appendChild(makeAvatar(overflowLabel, true, sizeName));
    return stack;
  }

  const rows = figma.createFrame();
  rows.name = 'avatar-group-mock';
  rows.layoutMode = 'VERTICAL';
  rows.primaryAxisSizingMode = 'AUTO';
  rows.counterAxisSizingMode = 'AUTO';
  rows.itemSpacing = 16;
  rows.fills = [];

  for (const sizeName of sizeNames) {
    const line = figma.createFrame();
    line.name = `size-${sizeName}`;
    line.layoutMode = 'HORIZONTAL';
    line.primaryAxisSizingMode = 'AUTO';
    line.counterAxisSizingMode = 'AUTO';
    line.counterAxisAlignItems = 'CENTER';
    line.itemSpacing = 32;
    line.fills = [];

    const caption = figma.createText();
    caption.name = 'size-label';
    caption.characters = sizeName;
    applyTextStyle(caption, 'label', 'sm');
    const captionVar = semColors['color/surface/on-surface-variant'];
    if (captionVar) caption.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', captionVar
    )];

    line.appendChild(caption);
    line.appendChild(makeStack('stacked', ['JI', 'AB', 'CD'], null, sizeName));
    line.appendChild(makeStack('max=3 + overflow', ['JI', 'AB', 'CD'], '+2', sizeName));
    rows.appendChild(line);
  }

  frame.appendChild(rows);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Avatar Group', count: sizeNames.length };
}
