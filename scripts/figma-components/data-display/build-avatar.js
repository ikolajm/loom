// =============================================================================
// Avatar — Custom Component Builder
// =============================================================================
// shape (circle/rounded) × size (sm/md/lg/xl) = 8 variants.
// Primary-container fill, uppercase initials centered.
// Must explicitly resize after variable binding (Figma FIXED sizing gotcha).
// =============================================================================

function buildAvatar(lookups, defaultMode, page) {
  const { semColors, semRadius, primHeight } = lookups;
  const config = CONFIG.components.avatar;
  const colors = config.variants.default;
  const bgVar = semColors[colors.bg];
  const fgVar = semColors[colors.fg];
  const variants = [];

  // Size → pixel lookup for explicit resize
  const sizePx = { sm: 24, md: 32, lg: 40, xl: 48 };

  for (const [shapeName, shapeConfig] of Object.entries(config.shapes)) {
    const radVar = semRadius[shapeConfig.radius];

    for (const [sizeName, sz] of Object.entries(config.sizes)) {
      const comp = figma.createComponent();
      comp.name = `shape=${shapeName}, size=${sizeName}`;
      comp.layoutMode = 'HORIZONTAL';
      comp.primaryAxisAlignItems = 'CENTER';
      comp.counterAxisAlignItems = 'CENTER';
      comp.primaryAxisSizingMode = 'FIXED';
      comp.counterAxisSizingMode = 'FIXED';

      // Size — bind variable then explicitly resize (Figma gotcha)
      const hPath = resolveHeight(sz.size);
      const px = sizePx[sizeName] || 32;
      if (hPath) {
        const hVar = primHeight[hPath];
        if (hVar) {
          comp.setBoundVariable('width', hVar);
          comp.setBoundVariable('height', hVar);
        }
      }
      comp.resize(px, px);

      // Background
      if (bgVar) comp.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.7, g: 0.7, b: 0.9 } }, 'color', bgVar
      )];

      // Radius
      if (radVar) {
        comp.setBoundVariable('topLeftRadius', radVar);
        comp.setBoundVariable('topRightRadius', radVar);
        comp.setBoundVariable('bottomLeftRadius', radVar);
        comp.setBoundVariable('bottomRightRadius', radVar);
      }

      // Initials text
      const text = figma.createText();
      text.name = 'initials';
      text.characters = 'AB';
      const avatarFamily = resolveFamily(CONFIG_FONTS.body);
      text.fontName = { family: avatarFamily, style: fontStyle(config.typography['font-weight'], avatarFamily) };
      text.fontSize = parsePx(sz['font-size']);
      text.lineHeight = { value: parsePx(sz['line-height']), unit: 'PIXELS' };
      text.textCase = 'UPPER';
      if (fgVar) text.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.5 } }, 'color', fgVar
      )];
      comp.appendChild(text);

      variants.push(comp);
    }
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'Avatar';
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  createBaseFrame('avatar', 'Initials avatar. Circle or rounded shape, 4 sizes.', set, lookups, defaultMode);

  const defaultVariant = set.findChild(n => n.name === 'shape=circle, size=md');
  createPreviewFrame('avatar', defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: 'Avatar', count: set.children.length };
}
