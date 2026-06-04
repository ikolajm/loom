// =============================================================================
// Standard Component Builder
// =============================================================================
// Data-driven builder for the "label in a styled box" component shape.
// Reads directly from component config — no manual translation needed.
//
// Covers: button, badge, chip, input, select, date-picker, textarea, toast,
//         alert, stat, label, helper-text.
//
// Depends on: resolvers.js, frames.js, lookups.js
// =============================================================================

/**
 * Create an icon slot — toggled (boolean visibility) or persistent (always visible).
 * Persistent icons use a specific named icon component instead of placeholder.
 *
 * @param {ComponentNode} comp - Parent component
 * @param {string} slotName - "leading-icon" or "trailing-icon"
 * @param {Variable} fgVar - Foreground color variable
 * @param {Variable} iconSizeVar - Icon size variable
 * @param {object} slotConfig - Icon slot config ({ default-visible, default-icon, persistent })
 * @param {string} propName - Boolean property name (ignored for persistent)
 */
function createStandardIconSlot(comp, slotName, fgVar, iconSizeVar, slotConfig, propName) {
  // Find the icon component — persistent slots use a named icon, toggled use placeholder
  const iconName = slotConfig['default-icon'] || 'icon/placeholder';
  // Try exact name first, fall back to searching by suffix
  let iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === iconName);
  if (!iconComp) {
    // icon/chevron-down → look for "chevron-down" under icon components
    const shortName = iconName.replace('icon/', '');
    iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === `icon/${shortName}`);
  }
  if (!iconComp) iconComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/placeholder');
  if (!iconComp) return;

  const inst = iconComp.createInstance();
  inst.name = slotName;

  if (iconSizeVar) {
    inst.setBoundVariable('width', iconSizeVar);
    inst.setBoundVariable('height', iconSizeVar);
  }

  if (fgVar) {
    const vecs = inst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
    const paint = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', fgVar
    )];
    for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
  }

  if (slotConfig.persistent) {
    // Persistent: always visible, no boolean toggle
    inst.visible = true;
    comp.appendChild(inst);
  } else {
    // Toggled: hidden by default, boolean property controls visibility
    inst.visible = false;
    comp.appendChild(inst);
    const propKey = comp.addComponentProperty(propName, 'BOOLEAN', false);
    inst.componentPropertyReferences = { 'visible': propKey };
  }

  return inst;
}

/**
 * Build a standard component from a descriptor + config.
 *
 * @param {object} descriptor - { name, configKey, description }
 * @param {object} compConfig - The component's config object (fully resolved, no $base)
 * @param {object} lookups - Variable lookups from getAllLookups()
 * @param {string} defaultMode - "light" or "dark"
 * @param {PageNode} page - Target page
 * @returns {{ name: string, count: number }}
 */
function buildStandardComponent(descriptor, compConfig, lookups, defaultMode, page) {
  const { semColors, semRadius, primSpacing, primHeight, primIconSize, primBW } = lookups;
  const variantKey = compConfig.state ? 'state' : 'variants';
  const variantDefs = compConfig[variantKey];
  const variants = [];
  const iconSlots = compConfig['icon-slots'];

  // Component-level width (e.g. text-field width: "280px")
  const compWidth = parsePx(compConfig.width);

  for (const [varName, colors] of Object.entries(variantDefs)) {
    const bgVar = colors.bg ? semColors[colors.bg] : null;
    const fgVar = colors.fg ? semColors[colors.fg] : null;

    for (const [sizeName, sz] of Object.entries(compConfig.sizes)) {
      const comp = figma.createComponent();
      comp.name = `${variantKey === 'state' ? 'state' : 'variant'}=${varName}, size=${sizeName}`;
      comp.layoutMode = 'HORIZONTAL';
      comp.primaryAxisSizingMode = 'AUTO';
      comp.counterAxisAlignItems = 'CENTER';
      comp.primaryAxisAlignItems = 'CENTER';

      // Width — fixed if config specifies
      if (compWidth) {
        comp.resize(compWidth, comp.height);
        comp.primaryAxisSizingMode = 'FIXED';
      }

      // Height — fixed from variable, or min-height, or auto
      const hPath = resolveHeight(sz.height);
      if (hPath) {
        const hVar = primHeight[hPath];
        if (hVar) comp.setBoundVariable('height', hVar);
        comp.counterAxisSizingMode = 'FIXED';
      } else if (sz['min-height']) {
        // Textarea: vertical layout for text wrapping, top-left alignment.
        // Switch to VERTICAL first — this flips axis semantics:
        //   primaryAxis = vertical (height), counterAxis = horizontal (width)
        comp.layoutMode = 'VERTICAL';
        comp.minHeight = parsePx(sz['min-height']);
        comp.primaryAxisSizingMode = 'AUTO';
        comp.primaryAxisAlignItems = 'MIN';
        comp.counterAxisAlignItems = 'MIN';
        // If component has a fixed width, lock the counter axis (now horizontal)
        if (compWidth) {
          comp.counterAxisSizingMode = 'FIXED';
        }
      } else {
        comp.counterAxisSizingMode = 'AUTO';
      }

      // X-padding
      const xpPath = resolveScale(sz['x-padding']);
      if (xpPath) {
        const v = primSpacing[xpPath];
        if (v) { comp.setBoundVariable('paddingLeft', v); comp.setBoundVariable('paddingRight', v); }
      }

      // Y-padding — scale reference or hardcoded px
      const ypPath = resolveScale(sz['y-padding']);
      if (ypPath) {
        const v = primSpacing[ypPath];
        if (v) { comp.setBoundVariable('paddingTop', v); comp.setBoundVariable('paddingBottom', v); }
      } else {
        const ypPx = parsePx(sz['y-padding']);
        if (ypPx !== null) { comp.paddingTop = ypPx; comp.paddingBottom = ypPx; }
      }

      // Gap
      const gapPath = resolveScale(sz.gap);
      if (gapPath) {
        const v = primSpacing[gapPath];
        if (v) comp.setBoundVariable('itemSpacing', v);
      }

      // Radius
      const radVar = semRadius[sz.radius];
      if (radVar) {
        comp.setBoundVariable('topLeftRadius', radVar);
        comp.setBoundVariable('topRightRadius', radVar);
        comp.setBoundVariable('bottomLeftRadius', radVar);
        comp.setBoundVariable('bottomRightRadius', radVar);
      }

      // Shadow (per-size effect style, e.g. toast shadow-3)
      if (sz.shadow) {
        const styles = figma.getLocalEffectStyles();
        const styleName = sz.shadow.replace('effects/shadow-', 'shadow/');
        const effectStyle = styles.find(s => s.name === styleName);
        if (effectStyle) comp.effectStyleId = effectStyle.id;
      }

      // Border (if defined in variant colors)
      if (colors.border) {
        const borderVar = semColors[colors.border];
        if (borderVar) {
          comp.strokes = [figma.variables.setBoundVariableForPaint(
            { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
          )];
          comp.strokeWeight = 1;
        }
      }

      // Background fill
      if (bgVar) comp.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', bgVar
      )];

      // Resolve icon size for this size tier
      const iconRef = sz['icon-size'] || sz.icon;
      const iconPath = resolveIcon(iconRef);
      const iconSizeVar = iconPath ? primIconSize[iconPath] : null;

      // Leading icon slot — only if icon-slots declared AND icon-size available
      if (iconSlots && iconSlots.leading && iconSizeVar) {
        createStandardIconSlot(comp, 'leading-icon', fgVar, iconSizeVar, iconSlots.leading, 'showLeadingIcon');
      }

      // Label — bind to text style family/{size} (e.g. action/md)
      const label = figma.createText();
      label.name = 'label';
      label.characters = varName.charAt(0).toUpperCase() + varName.slice(1);

      // Look up text style by family/tier name
      const textStyleName = `${descriptor.textFamily || 'body'}/${sizeName}`;
      const allTextStyles = figma.getLocalTextStyles();
      const textStyle = allTextStyles.find(s => s.name === textStyleName);

      if (textStyle) {
        // Bind to text style — font family, size, line-height, weight all come from the style
        label.textStyleId = textStyle.id;
      } else {
        // Fallback: apply text style by name (requires text styles generated in step 12)
        applyTextStyle(label, descriptor.textFamily || 'body', sizeName);
      }

      if (fgVar) label.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', fgVar
      )];
      comp.appendChild(label);
      label.layoutSizingHorizontal = "FILL";

      // Trailing icon slot — only if icon-slots declared AND (icon-size available OR persistent)
      if (iconSlots && iconSlots.trailing && (iconSizeVar || iconSlots.trailing.persistent)) {
        createStandardIconSlot(comp, 'trailing-icon', fgVar, iconSizeVar, iconSlots.trailing, 'showTrailingIcon');
      }

      variants.push(comp);
    }
  }

  // Combine into component set
  const set = figma.combineAsVariants(variants, page);
  set.name = descriptor.name;
  set.layoutMode = 'VERTICAL';
  set.itemSpacing = 8;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [];

  // Base frame
  createBaseFrame(descriptor.configKey, descriptor.description, set, lookups, defaultMode);

  // Preview — resolve default variant selector from config
  const dflt = compConfig.default;
  const selectorParts = [];
  for (const [k, v] of Object.entries(dflt)) {
    if (k !== 'size') selectorParts.push(`${k}=${v}`);
  }
  selectorParts.push(`size=${dflt.size}`);
  const selector = selectorParts.join(', ');
  const defaultVariant = set.findChild(n => n.name === selector);
  createPreviewFrame(descriptor.configKey, defaultVariant ? defaultVariant.createInstance() : null, lookups, defaultMode);

  return { name: descriptor.name, count: set.children.length };
}
