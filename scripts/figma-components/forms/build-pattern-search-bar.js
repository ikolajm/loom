// =============================================================================
// Search Bar — Frame Pattern Mock
// =============================================================================
// Input box with a leading search icon, placeholder text, and a trailing clear X.
// Browse reference: representative md, text-field sizing.
// =============================================================================

function buildPatternSearchBar(lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, heights, primIconSize } = lookups;
  const config = CONFIG.components['search-bar'];
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-search-bar', lookups);
  addHeader(frame, 'Search Bar', 'Frame pattern — search input with a leading search icon and clearable trailing X. Shown at md.');

  const box = figma.createFrame();
  box.name = 'search-bar-md';
  box.layoutMode = 'HORIZONTAL';
  box.counterAxisAlignItems = 'CENTER';
  box.primaryAxisSizingMode = 'FIXED';
  box.counterAxisSizingMode = 'FIXED';
  box.resize(280, box.height);
  box.itemSpacing = 8;

  const hPath = resolveHeight(md.height);
  if (hPath) { const v = heights[hPath]; if (v) box.setBoundVariable('height', v); }

  const padPath = resolveScale('{scale.4}');
  if (padPath) { const v = primSpacing[padPath]; if (v) { box.setBoundVariable('paddingLeft', v); box.setBoundVariable('paddingRight', v); } }

  const radVar = semRadius['radius/input'];
  if (radVar) {
    box.setBoundVariable('topLeftRadius', radVar);
    box.setBoundVariable('topRightRadius', radVar);
    box.setBoundVariable('bottomLeftRadius', radVar);
    box.setBoundVariable('bottomRightRadius', radVar);
  }

  const bgVar = semColors['color/surface/surface'];
  if (bgVar) box.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bgVar
  )];
  const borderVar = semColors['color/outline/outline-subtle'];
  if (borderVar) {
    box.strokes = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
    )];
    box.strokeWeight = 1;
  }

  const iconPath = resolveIcon('icon/icon-2');
  const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
  const mutedVar = semColors['color/surface/on-surface-variant'];

  const searchIcon = makeIcon('icon/search', mutedVar, iconSizeVar);
  if (searchIcon) { searchIcon.name = 'search-icon'; box.appendChild(searchIcon); }

  const placeholder = figma.createText();
  placeholder.name = 'placeholder';
  placeholder.characters = 'Search...';
  applyTextStyle(placeholder, 'input', 'md');
  if (mutedVar) placeholder.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', mutedVar
  )];
  box.appendChild(placeholder);
  placeholder.layoutSizingHorizontal = 'FILL';

  const clearIcon = makeIcon('icon/x', mutedVar, iconSizeVar);
  if (clearIcon) { clearIcon.name = 'clear-icon'; box.appendChild(clearIcon); }

  frame.appendChild(box);
  setDefaultMode(frame, defaultMode);
  return { name: 'Pattern Search Bar', count: 1 };
}
