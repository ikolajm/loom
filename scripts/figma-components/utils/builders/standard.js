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

  const inst = styleIconInstance(iconComp.createInstance(), fgVar, iconSizeVar);
  inst.name = slotName;

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
 * Resolve a component config into an ordered list of variant entries, each
 * { namePrefix, colors: { bg, fg, border }, label }. Two config shapes:
 *
 *  - Orthogonal (button, badge): independent `treatments` × `colors` axes.
 *    Each color declares { bg, fg, text, border }; each treatment is a fixed
 *    consumer of those refs — filled → bg/fg, outline → border + text,
 *    ghost → text only. This mirrors shared.js TREATMENT_CLASSES so the Figma
 *    variant set matches the code catalog exactly. Expands to a multi-property
 *    Figma variant set (variant=<treatment>, color=<name>).
 *  - Single-axis (toggle, fab, toast…): the lone `variants` or `state` block,
 *    used verbatim.
 *
 * @param {object} compConfig - The component's config object (resolved, no $base)
 * @returns {Array<{ namePrefix: string, colors: object, label: string }>}
 */
function resolveVariantEntries(compConfig) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  if (compConfig.treatments && compConfig.colors) {
    // The color axis is exposed under different prop names per atom
    // (button → "color", badge → "state"). Derive it from the default block so
    // the component variant names match the preview's default selector — which
    // is built from those same default keys.
    const dflt = compConfig.default || {};
    const colorAxisKey = Object.keys(dflt).find(k => k !== 'variant' && k !== 'size') || 'color';
    const TREATMENTS = {
      filled:  (c) => ({ bg: c.bg, fg: c.fg, border: null }),
      outline: (c) => ({ bg: null, fg: c.text, border: c.border }),
      ghost:   (c) => ({ bg: null, fg: c.text, border: null }),
    };
    const entries = [];
    for (const treatment of compConfig.treatments) {
      const resolve = TREATMENTS[treatment];
      if (!resolve) continue;
      for (const [colorName, c] of Object.entries(compConfig.colors)) {
        if (colorName.startsWith('$')) continue;
        entries.push({
          namePrefix: `variant=${treatment}, ${colorAxisKey}=${colorName}`,
          colors: resolve(c),
          label: cap(colorName),
        });
      }
    }
    return entries;
  }

  const variantKey = compConfig.state ? 'state' : 'variants';
  const prefix = variantKey === 'state' ? 'state' : 'variant';
  const entries = [];
  for (const [varName, colors] of Object.entries(compConfig[variantKey])) {
    if (varName.startsWith('$')) continue;
    entries.push({ namePrefix: `${prefix}=${varName}`, colors, label: cap(varName) });
  }
  return entries;
}

/**
 * Position an orthogonal variant set as a grid: one row per treatment, one column per
 * color, sizes stacked in the cell. Variants are generated treatment → color → size, so
 * index i is at treatment floor(i/(nColors*nSizes)), color floor(i/nSizes)%nColors,
 * size i%nSizes. Columns share a width across all rows so the color axis stays aligned.
 */
function layoutOrthogonalGrid(set, nTreatments, nColors, nSizes) {
  const GAP = 16;
  const ROW_GAP = 48;
  const kids = set.children;
  const at = (t, c, s) => kids[t * nColors * nSizes + c * nSizes + s];

  const colWidths = [];
  for (let c = 0; c < nColors; c++) {
    let w = 0;
    for (let t = 0; t < nTreatments; t++) {
      for (let s = 0; s < nSizes; s++) w = Math.max(w, at(t, c, s).width);
    }
    colWidths.push(w);
  }

  let y = 0;
  let totalW = 0;
  for (let t = 0; t < nTreatments; t++) {
    let x = 0;
    let rowH = 0;
    for (let c = 0; c < nColors; c++) {
      let cy = y;
      for (let s = 0; s < nSizes; s++) {
        const node = at(t, c, s);
        node.x = x;
        node.y = cy;
        cy += node.height + GAP;
      }
      rowH = Math.max(rowH, cy - y - GAP);
      x += colWidths[c] + GAP;
    }
    totalW = Math.max(totalW, x - GAP);
    y += rowH + ROW_GAP;
  }

  set.resize(totalW, y - ROW_GAP);
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
  const { semColors, semRadius, primSpacing, heights, primIconSize, primBW } = lookups;
  const variants = [];
  const iconSlots = compConfig['icon-slots'];

  // Component-level width (e.g. text-field width: "280px")
  const compWidth = parsePx(compConfig.width);

  // Variant matrix — orthogonal (treatment × color) or single-axis. See
  // resolveVariantEntries; orthogonal atoms become a multi-property Figma set.
  const variantEntries = resolveVariantEntries(compConfig);

  for (const entry of variantEntries) {
    const colors = entry.colors;
    const bgVar = colors.bg ? semColors[colors.bg] : null;
    const fgVar = colors.fg ? semColors[colors.fg] : null;

    for (const [sizeName, sz] of Object.entries(compConfig.sizes)) {
      if (sizeName.startsWith('$')) continue;
      const comp = figma.createComponent();
      comp.name = `${entry.namePrefix}, size=${sizeName}`;
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
        const hVar = heights[hPath];
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
      label.characters = entry.label;

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
  set.fills = [];

  const sizeNames = Object.keys(compConfig.sizes).filter(k => !k.startsWith('$'));
  const isOrthogonal = compConfig.treatments && compConfig.colors;
  if (isOrthogonal) {
    const colorNames = Object.keys(compConfig.colors).filter(k => !k.startsWith('$'));
    const treatments = compConfig.treatments.filter(t => ['filled', 'outline', 'ghost'].includes(t));
    set.layoutMode = 'NONE';
    layoutOrthogonalGrid(set, treatments.length, colorNames.length, sizeNames.length);
  } else {
    set.layoutMode = 'VERTICAL';
    set.itemSpacing = 8;
    set.primaryAxisSizingMode = 'AUTO';
    set.counterAxisSizingMode = 'AUTO';
  }

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
