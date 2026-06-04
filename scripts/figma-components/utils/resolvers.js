// =============================================================================
// Config Resolution Helpers
// =============================================================================
// Translate config token syntax to Figma variable paths and numeric values.
// Used by shape builders to read component configs directly.
// =============================================================================

/**
 * Resolve "{scale.N}" → "spacing/N" variable path.
 * Returns null if not a scale reference.
 */
function resolveScale(val) {
  if (!val || typeof val !== 'string') return null;
  const m = val.match(/^\{scale\.(\d+)\}$/);
  return m ? `spacing/${m[1]}` : null;
}

/**
 * Resolve "height/ch-N" → "height/N" variable path.
 */
function resolveHeight(val) {
  if (!val || typeof val !== 'string') return null;
  return val.startsWith('height/ch-') ? val.replace('ch-', '') : null;
}

/**
 * Resolve "icon/icon-N" → "icon/N" variable path.
 */
function resolveIcon(val) {
  if (!val || typeof val !== 'string') return null;
  return val.startsWith('icon/icon-') ? val.replace('icon-', '') : null;
}

/**
 * Parse "Npx" string → number N. Returns null if not px format.
 */
function parsePx(val) {
  if (!val || typeof val !== 'string') return null;
  const m = val.match(/^(\d+(?:\.\d+)?)px$/);
  return m ? parseFloat(m[1]) : null;
}

/**
 * Font weight number → Figma font style name.
 * Default mapping covers most Google Fonts. Only add overrides for fonts
 * with non-standard style names (e.g. "Semi Bold" vs "SemiBold").
 * Figma's loadFontAsync will throw if a style name is wrong — add the
 * font to FONT_WEIGHT_OVERRIDES when that happens.
 */
const FONT_WEIGHT_OVERRIDES = {
  "JetBrains Mono": { 600: "Medium" },
  "Inter": { 600: "Semi Bold" },
  "Space Grotesk": { 600: "Bold" },
  "Cinzel": { 500: "Regular", 600: "Bold" },
};

function fontStyle(weight, familyName) {
  const overrides = familyName && FONT_WEIGHT_OVERRIDES[familyName];
  if (overrides && overrides[weight]) return overrides[weight];
  if (weight >= 700) return 'Bold';
  if (weight >= 600) return 'SemiBold';
  if (weight >= 500) return 'Medium';
  return 'Regular';
}

/**
 * Parse letter-spacing value ("0.01em", "0") → Figma percent value.
 */
function parseLetterSpacing(val) {
  return parseFloat(String(val).replace('em', '') || '0') * 100;
}

/**
 * Apply a Figma text style to a text node by family/tier name.
 * Looks up "{family}/{tier}" (e.g. "action/md", "body/sm") from local text styles.
 * Falls back to raw fontSize/lineHeight if style not found.
 *
 * @param {TextNode} textNode - The text node to style
 * @param {string} family - Text style family (action, body, label, input, title, display)
 * @param {string} tier - Size tier (sm, md, lg)
 */
function applyTextStyle(textNode, family, tier) {
  const styleName = `${family}/${tier}`;
  const styles = figma.getLocalTextStyles();
  const style = styles.find(s => s.name === styleName);
  if (style) {
    textNode.textStyleId = style.id;
  }
}

/**
 * Resolve $base inheritance — deep-merges base config into child config.
 *
 * Merge semantics are key-aware:
 *   - `sizes`: per-tier REPLACEMENT. If the child defines sizes.sm, it fully
 *     replaces the base's sizes.sm (textarea drops height/icons from text-field).
 *   - All other objects (state, checked, active, icon-slots, typography):
 *     per-entry ADDITIVE MERGE. Child properties merge into base entries
 *     (select adds indicator to text-field's state.default).
 *   - Scalars / non-overlapping keys: child wins if present, base as fallback.
 *
 * Meta keys ($base, $note from base) are stripped. Child's own $note/$exception kept.
 *
 * @param {object} allComponents - Full components config (CONFIG.components)
 * @param {string} configKey - The component key to resolve (e.g. "input")
 * @returns {object} Fully resolved config with no $base reference
 */
function resolveBase(allComponents, configKey) {
  const config = allComponents[configKey];
  if (!config || !config['$base']) return config;

  const base = allComponents[config['$base']];
  if (!base) return config;

  const merged = {};
  const allKeys = new Set([...Object.keys(base), ...Object.keys(config)]);

  for (const key of allKeys) {
    // Skip $base itself; skip base's meta keys (child keeps its own)
    if (key === '$base') continue;
    if (key.startsWith('$') && !(key in config)) continue;

    const baseVal = base[key];
    const childVal = config[key];

    // Child-only key
    if (baseVal === undefined) { merged[key] = childVal; continue; }
    // Base-only key
    if (childVal === undefined) { merged[key] = baseVal; continue; }
    // Child overrides with non-object or base is non-object
    if (typeof childVal !== 'object' || childVal === null || Array.isArray(childVal) ||
        typeof baseVal !== 'object' || baseVal === null || Array.isArray(baseVal)) {
      merged[key] = childVal;
      continue;
    }

    // Both are objects — merge strategy depends on key
    if (key === 'sizes') {
      // Per-tier replacement: child's tier replaces base's tier entirely
      merged[key] = {};
      const allTiers = new Set([...Object.keys(baseVal), ...Object.keys(childVal)]);
      for (const tier of allTiers) {
        merged[key][tier] = tier in childVal ? childVal[tier] : baseVal[tier];
      }
    } else {
      // Additive merge: one level deep
      merged[key] = {};
      const allSubKeys = new Set([...Object.keys(baseVal), ...Object.keys(childVal)]);
      for (const sk of allSubKeys) {
        const bv = baseVal[sk];
        const cv = childVal[sk];
        if (cv !== undefined && bv !== undefined &&
            typeof cv === 'object' && cv !== null && !Array.isArray(cv) &&
            typeof bv === 'object' && bv !== null && !Array.isArray(bv)) {
          // Merge leaf objects (e.g. state.default entries)
          merged[key][sk] = { ...bv, ...cv };
        } else {
          merged[key][sk] = cv !== undefined ? cv : bv;
        }
      }
    }
  }

  return merged;
}
