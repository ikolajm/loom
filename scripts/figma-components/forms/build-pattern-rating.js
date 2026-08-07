// =============================================================================
// Rating — Frame Pattern Mock
// =============================================================================
// A row of star icons — filled (primary) up to the value, outline beyond.
// Browse reference: representative md, value 3 of 5.
// =============================================================================

function buildPatternRating(lookups, defaultMode, page) {
  const { semColors, primSpacing, primIconSize } = lookups;
  const config = CONFIG.components.rating;
  const md = config.sizes.md;
  const max = 5;
  const value = 3;

  const frame = createSectionFrame('base.pattern-rating', lookups);
  addHeader(frame, 'Rating', 'Frame pattern — star rating. Filled (primary) up to the value, outline beyond. Shown at md.');

  const row = figma.createFrame();
  row.name = 'rating-md';
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisSizingMode = 'AUTO';
  row.counterAxisSizingMode = 'AUTO';
  row.counterAxisAlignItems = 'CENTER';
  row.fills = [];
  const gapPath = resolveScale(md.gap);
  if (gapPath) { const v = primSpacing[gapPath]; if (v) row.setBoundVariable('itemSpacing', v); }

  const iconPath = resolveIcon(md['icon-size']);
  const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
  const filledVar = semColors['color/primary/primary'];
  const emptyVar = semColors['color/outline/outline'];

  for (let i = 0; i < max; i++) {
    const filled = i < value;
    const inst = makeIcon('icon/star', filled ? filledVar : emptyVar, iconSizeVar, filled);
    if (inst) {
      inst.name = filled ? 'star-filled' : 'star-empty';
      row.appendChild(inst);
    }
  }

  frame.appendChild(row);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Rating', count: max };
}
