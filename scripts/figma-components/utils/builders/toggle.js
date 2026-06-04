// =============================================================================
// Toggle Component Builder
// =============================================================================
// Data-driven builder for fixed-size binary controls.
// Handles three shapes via descriptor metadata:
//   - square: checkbox (rounded rect + check icon when active)
//   - circle: radio (circle + inner dot when active)
//   - switch: track + thumb (alignment flips between states)
//
// All toggle components use FIXED sizing on both axes.
//
// Covers: checkbox, radio, switch.
//
// Depends on: resolvers.js, frames.js, lookups.js
// =============================================================================

/**
 * Build a toggle component from a descriptor + config.
 *
 * @param {object} descriptor - { name, configKey, description, shape }
 *   shape: "square" (checkbox), "circle" (radio), "switch"
 * @param {object} compConfig - Fully resolved config (no $base)
 * @param {object} lookups - Variable lookups from getAllLookups()
 * @param {string} defaultMode - "light" or "dark"
 * @param {PageNode} page - Target page
 * @returns {{ name: string, count: number }}
 */
function buildToggleComponent(descriptor, compConfig, lookups, defaultMode, page) {
  const { semColors, semRadius } = lookups;
  const shape = descriptor.shape;

  // Detect state axis: "checked" (checkbox/radio) or "active" (switch)
  const stateKey = compConfig.checked ? 'checked' : 'active';
  const stateDefs = compConfig[stateKey];
  const variants = [];

  for (const [stateName, colors] of Object.entries(stateDefs)) {
    for (const [sizeName, sz] of Object.entries(compConfig.sizes)) {

      if (shape === 'switch') {
        // --- SWITCH: track + thumb ---
        const trackW = parsePx(sz.width);
        const trackH = parsePx(sz.height);
        const trackBgVar = semColors[colors['track-bg']];
        const thumbBgVar = semColors[colors['thumb-bg']];
        const radVar = semRadius[sz.radius];

        const comp = figma.createComponent();
        comp.name = `${stateKey}=${stateName}, size=${sizeName}`;
        comp.resize(trackW, trackH);
        comp.layoutMode = 'HORIZONTAL';
        comp.primaryAxisSizingMode = 'FIXED';
        comp.counterAxisSizingMode = 'FIXED';
        comp.counterAxisAlignItems = 'CENTER';

        // Alignment flips for on/off state
        const isActive = stateName === 'true';
        comp.primaryAxisAlignItems = isActive ? 'MAX' : 'MIN';

        // Track padding — 2px inset for thumb breathing room
        comp.paddingTop = 2;
        comp.paddingBottom = 2;
        comp.paddingLeft = 2;
        comp.paddingRight = 2;

        // Track fill
        if (trackBgVar) comp.fills = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', trackBgVar
        )];

        // Track radius
        if (radVar) {
          comp.setBoundVariable('topLeftRadius', radVar);
          comp.setBoundVariable('topRightRadius', radVar);
          comp.setBoundVariable('bottomLeftRadius', radVar);
          comp.setBoundVariable('bottomRightRadius', radVar);
        }

        // Thumb — circle sized to fit within track minus padding
        const thumbSize = trackH - 4; // 2px padding each side
        const thumb = figma.createEllipse();
        thumb.name = 'thumb';
        thumb.resize(thumbSize, thumbSize);
        if (thumbBgVar) thumb.fills = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', thumbBgVar
        )];
        comp.appendChild(thumb);

        variants.push(comp);

      } else {
        // --- CHECKBOX / RADIO: single fixed-size indicator ---
        const dim = parsePx(sz.size);
        const bgVar = colors.bg ? semColors[colors.bg] : null;
        const fgVar = colors.fg ? semColors[colors.fg] : null;
        const borderVar = colors.border ? semColors[colors.border] : null;

        // Resolve radius from component config (not from size tier)
        const radVar = compConfig.radius ? semRadius[compConfig.radius] : null;

        const comp = figma.createComponent();
        comp.name = `${stateKey}=${stateName}, size=${sizeName}`;
        comp.resize(dim, dim);
        comp.layoutMode = 'HORIZONTAL';
        comp.primaryAxisSizingMode = 'FIXED';
        comp.counterAxisSizingMode = 'FIXED';
        comp.primaryAxisAlignItems = 'CENTER';
        comp.counterAxisAlignItems = 'CENTER';

        // Background fill
        if (bgVar) comp.fills = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', bgVar
        )];

        // Border
        if (borderVar) {
          comp.strokes = [figma.variables.setBoundVariableForPaint(
            { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }, 'color', borderVar
          )];
          comp.strokeWeight = 1;
        }

        // Radius
        if (radVar) {
          comp.setBoundVariable('topLeftRadius', radVar);
          comp.setBoundVariable('topRightRadius', radVar);
          comp.setBoundVariable('bottomLeftRadius', radVar);
          comp.setBoundVariable('bottomRightRadius', radVar);
        }

        // Indicator — only when checked/active is true
        const isChecked = stateName === 'true';
        if (isChecked) {
          if (shape === 'square') {
            // Checkbox: check icon sized proportionally
            const checkComp = figma.root.findOne(n => n.type === 'COMPONENT' && n.name === 'icon/check');
            if (checkComp) {
              const inst = checkComp.createInstance();
              inst.name = 'check-indicator';
              const iconDim = Math.round(dim * 0.7);
              inst.resize(iconDim, iconDim);
              if (fgVar) {
                const vecs = inst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE');
                const paint = [figma.variables.setBoundVariableForPaint(
                  { type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', fgVar
                )];
                for (const vec of vecs) { vec.strokes = paint; vec.fills = []; }
              }
              comp.appendChild(inst);
            }
          } else if (shape === 'circle') {
            // Radio: inner dot sized proportionally
            const dotSize = Math.round(dim * 0.4);
            const dot = figma.createEllipse();
            dot.name = 'dot-indicator';
            dot.resize(dotSize, dotSize);
            if (fgVar) dot.fills = [figma.variables.setBoundVariableForPaint(
              { type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', fgVar
            )];
            comp.appendChild(dot);
          }
        }

        variants.push(comp);
      }
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

  // Preview — resolve default variant selector
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
