// =============================================================================
// Top Bar — Frame Pattern Mock
// =============================================================================
// App header with title, nav icon (left), action icons (right).
// Shows default (flat + border) and elevated (shadow) variants.
// =============================================================================

function buildPatternTopBar(lookups, defaultMode, page) {
  const { semColors, primSpacing, heights, primIconSize, layoutVars } = lookups;
  const config = CONFIG.components['top-bar'];
  const md = config.sizes.md;

  const frame = createSectionFrame('base.pattern-top-bar', lookups);
  addHeader(frame, 'Top Bar', 'Frame pattern — app header with title and action icons. Default and elevated variants.');

  const examples = figma.createFrame();
  examples.name = 'top-bar-examples';
  examples.layoutMode = 'VERTICAL';
  examples.primaryAxisSizingMode = 'AUTO';
  examples.counterAxisSizingMode = 'AUTO';
  examples.fills = [];
  const groupGapVar = layoutVars['layout/spacing/component-group-gap'];
  if (groupGapVar) examples.setBoundVariable('itemSpacing', groupGapVar);

  for (const [variantName, colors] of Object.entries(config.variants)) {
    const bar = figma.createFrame();
    bar.name = `top-bar-${variantName}`;
    bar.layoutMode = 'HORIZONTAL';
    bar.primaryAxisSizingMode = 'FIXED';
    bar.counterAxisAlignItems = 'CENTER';
    bar.resize(360, 56);

    const hPath = resolveHeight(md.height);
    if (hPath) {
      const hVar = heights[hPath];
      if (hVar) bar.setBoundVariable('height', hVar);
      bar.counterAxisSizingMode = 'FIXED';
    }

    const bgVar = semColors[colors.bg];
    if (bgVar) bar.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }, 'color', bgVar
    )];

    if (colors['border-bottom'] && colors['border-bottom'] !== 'none') {
      const borderVar = semColors[colors['border-bottom']];
      if (borderVar) {
        bar.strokes = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
        )];
        bar.strokeTopWeight = 0; bar.strokeRightWeight = 0; bar.strokeBottomWeight = 1; bar.strokeLeftWeight = 0;
        bar.strokeAlign = 'INSIDE';
      }
    }

    if (colors.shadow) {
      const styles = figma.getLocalEffectStyles();
      const styleName = colors.shadow.replace('effects/shadow-', 'shadow/');
      const effectStyle = styles.find(s => s.name === styleName);
      if (effectStyle) bar.effectStyleId = effectStyle.id;
    }

    const xpPath = resolveScale(md['x-padding']);
    if (xpPath) { const v = primSpacing[xpPath]; if (v) { bar.setBoundVariable('paddingLeft', v); bar.setBoundVariable('paddingRight', v); } }
    const gapPath = resolveScale(md.gap);
    if (gapPath) { const v = primSpacing[gapPath]; if (v) bar.setBoundVariable('itemSpacing', v); }

    const fgVar = semColors[colors.fg];

    // Menu icon placeholder (left)
    const iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/placeholder');
    if (iconComp) {
      const menuIcon = iconComp.createInstance();
      menuIcon.name = 'nav-icon';
      const iconPath = resolveIcon(md['icon-size']);
      const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
      if (iconSizeVar) { menuIcon.setBoundVariable('width', iconSizeVar); menuIcon.setBoundVariable('height', iconSizeVar); }
      if (fgVar) {
        const vecs = menuIcon.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
        const paint = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', fgVar)];
        for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
      }
      bar.appendChild(menuIcon);
    }

    // Title
    const title = figma.createText();
    title.name = 'title';
    title.characters = variantName.charAt(0).toUpperCase() + variantName.slice(1);
    applyTextStyle(title, 'title', 'md');
    if (fgVar) title.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }, 'color', fgVar
    )];
    bar.appendChild(title);
    title.layoutSizingHorizontal = 'FILL';

    // Action icons (right)
    if (iconComp) {
      for (let i = 0; i < 2; i++) {
        const actionIcon = iconComp.createInstance();
        actionIcon.name = `action-icon-${i}`;
        const iconPath = resolveIcon(md['icon-size']);
        const iconSizeVar = iconPath ? primIconSize[iconPath] : null;
        if (iconSizeVar) { actionIcon.setBoundVariable('width', iconSizeVar); actionIcon.setBoundVariable('height', iconSizeVar); }
        if (fgVar) {
          const vecs = actionIcon.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
          const paint = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', fgVar)];
          for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
        }
        bar.appendChild(actionIcon);
      }
    }

    examples.appendChild(bar);
  }

  frame.appendChild(examples);
  setDefaultMode(frame, defaultMode);

  return { name: 'Pattern Top Bar', count: 2 };
}
