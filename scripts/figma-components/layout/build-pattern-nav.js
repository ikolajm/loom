// =============================================================================
// Nav — Frame Pattern Mock
// =============================================================================
// TODO: This script references CONFIG.components.nav which was removed from
// layout.json. Superseded by top-bar in navigation.json. Needs rewrite to
// read from CONFIG.components['top-bar'] when Phase 3 work resumes.
// =============================================================================
// Horizontal navigation bar with active/inactive link states.
// Active link: primary color + underline. Inactive: on-surface.
// Surface background, outline-subtle border-bottom.
// =============================================================================

function buildPatternNav(lookups, defaultMode, page) {
  const { semColors, primSpacing, primHeight, primBW } = lookups;
  const navConfig = CONFIG.components.nav;
  const colors = navConfig.variants.default;
  const md = navConfig.sizes.md;
  const typo = navConfig.typography;

  // Section frame
  const frame = createSectionFrame('base.pattern-nav', lookups);
  addHeader(frame, 'Nav', 'Frame pattern — horizontal navigation bar with active link highlighting.');

  // Nav bar
  const navBar = figma.createFrame();
  navBar.name = 'nav-bar';
  navBar.layoutMode = 'HORIZONTAL';
  navBar.primaryAxisSizingMode = 'AUTO';
  navBar.counterAxisAlignItems = 'CENTER';

  // Height
  const hPath = resolveHeight(md.height);
  if (hPath) {
    const hVar = primHeight[hPath];
    if (hVar) navBar.setBoundVariable('height', hVar);
    navBar.counterAxisSizingMode = 'FIXED';
  }

  // Background
  const bgVar = semColors[colors.bg];
  if (bgVar) navBar.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bgVar
  )];

  // X-padding
  const xpPath = resolveScale(md['x-padding']);
  if (xpPath) {
    const v = primSpacing[xpPath];
    if (v) { navBar.setBoundVariable('paddingLeft', v); navBar.setBoundVariable('paddingRight', v); }
  }

  // Gap
  const gapPath = resolveScale(md.gap);
  if (gapPath) {
    const v = primSpacing[gapPath];
    if (v) navBar.setBoundVariable('itemSpacing', v);
  }

  // Border-bottom only
  const borderVar = semColors[colors['border-bottom']];
  if (borderVar) {
    navBar.strokes = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
    )];
    navBar.strokeTopWeight = 0;
    navBar.strokeRightWeight = 0;
    navBar.strokeBottomWeight = 1;
    navBar.strokeLeftWeight = 0;
    navBar.strokeAlign = 'INSIDE';
  }

  // Nav links
  const links = [
    { label: 'Home', active: true },
    { label: 'About', active: false },
    { label: 'Services', active: false },
    { label: 'Contact', active: false }
  ];

  const fgVar = semColors[colors.fg];
  const activeFgVar = semColors[colors['active-fg']];
  const fontSize = parsePx(md['font-size']);
  const lineHeight = parsePx(md['line-height']);

  for (const link of links) {
    const text = figma.createText();
    text.name = link.label.toLowerCase();
    text.characters = link.label;
    applyTextStyle(text, 'action', 'md');

    if (link.active) {
      if (activeFgVar) text.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.8 } }, 'color', activeFgVar
      )];
      text.textDecoration = 'UNDERLINE';
    } else {
      if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
      )];
    }

    navBar.appendChild(text);
  }

  frame.appendChild(navBar);
  navBar.layoutSizingHorizontal = 'FILL';
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Nav', count: 1 };
}
