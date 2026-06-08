/**
 * Shared config loading, Tailwind class mappers, and component registry.
 * Used by all code-template generators.
 */
const fs = require('fs');
const path = require('path');

// --- Config loading ---
const CONFIG_ROOT = path.resolve(__dirname, '../../spec/config');
const load = (rel) => JSON.parse(fs.readFileSync(path.join(CONFIG_ROOT, rel), 'utf-8'));

function loadAllConfigs() {
  return {
    standards: load('standards.json'),
    sizing: load('base/sizing.json'),
    typography: load('base/typography.json'),
    colors: load('base/colors.json'),
    effects: load('base/effects.json'),
    buttonConfig: load('components/button.json'),
    formConfig: load('components/form.json'),
    feedbackConfig: load('components/feedback.json'),
    dataDisplayConfig: load('components/data-display.json'),
    layoutConfig: load('components/layout.json'),
    navigationConfig: load('components/navigation.json'),
    compositeConfig: load('components/composite.json'),
  };
}

// Shared icon-slot wrapper class — the span that holds a leading/trailing/standalone icon and
// makes its svg fill the slot. Interpolated into component templates so the literal lives once.
const ICON_SLOT_CLASS = 'shrink-0 [&>svg]:size-full';

// --- Tailwind class mappers ---

function colorToClass(colorPath, prefix = 'bg') {
  if (!colorPath) return null;
  if (colorPath === 'transparent') return `${prefix}-transparent`;
  if (colorPath === 'currentColor') return `${prefix}-current`;
  const parts = colorPath.split('/');
  const role = parts[parts.length - 1];
  return `${prefix}-${role}`;
}

function scaleToValue(val) {
  if (!val || typeof val !== 'string') return null;
  const m = val.match(/^\{scale\.(\d+)\}$/);
  return m ? m[1] : null;
}

/** Resolve a padding/spacing value to a Tailwind class suffix. Handles both {scale.N} and raw values like "2px". */
function spacingToClass(val, prefix) {
  if (!val) return null;
  const scale = scaleToValue(val);
  if (scale) return `${prefix}-${scale}`;
  // Raw value (e.g. "2px") → arbitrary value
  if (typeof val === 'string' && val.match(/^\d/)) return `${prefix}-[${val}]`;
  return null;
}

function heightToClass(val) {
  if (!val || typeof val !== 'string') return null;
  if (val.startsWith('height/')) return val.replace('height/', '');
  // Scale reference: {scale.N} → N (maps to Tailwind h-N)
  const scale = scaleToValue(val);
  if (scale) return scale;
  return null;
}

function radiusToClass(val) {
  if (!val || typeof val !== 'string') return null;
  if (val.startsWith('radius/')) return val.replace('radius/', '');
  return null;
}

function shadowToClass(val) {
  if (!val || typeof val !== 'string') return null;
  const m = val.match(/effects\/shadow-(\d)/);
  if (!m) return null;
  const level = parseInt(m[1]);
  if (level === 0) return null;
  return `shadow-[var(--shadow-${level})]`;
}

function borderWidthToClass(val) {
  if (!val || typeof val !== 'string') return null;
  const m = val.match(/border-width\/bw-(\d)/);
  if (!m) return null;
  const w = parseInt(m[1]);
  return w === 1 ? 'border' : `border-${w}`;
}

function maxWidthToClass(val) {
  if (!val || typeof val !== 'string') return null;
  if (val === '100%') return 'max-w-full';
  return `max-w-[${val}]`;
}

function iconSizeToClass(val) {
  if (!val || typeof val !== 'string') return null;
  if (val.startsWith('icon/')) return `size-${val.replace('icon/', '')}`;
  return null;
}

function fontWeightToClass(w) {
  if (!w) return null;
  const map = { 400: 'font-normal', 500: 'font-medium', 600: 'font-semibold', 700: 'font-bold' };
  return map[w] || null;
}

function letterSpacingToClass(ls) {
  if (!ls || ls === '0' || ls === 'normal') return null;
  return `tracking-[${ls}]`;
}

// --- Variant/size style builders ---

function buildVariantStyles(variants) {
  const styles = {};
  for (const [name, colors] of Object.entries(variants)) {
    const classes = [];
    const bg = colorToClass(colors.bg, 'bg');
    const fg = colorToClass(colors.fg, 'text');
    const border = colors.border && colors.border !== 'none' ? colorToClass(colors.border, 'border') : null;
    const shadow = shadowToClass(colors.shadow);
    if (bg) classes.push(bg);
    if (fg) classes.push(fg);
    if (border) classes.push(border, 'border');
    if (colors.border === 'none') classes.push('border-0');
    // Directional borders
    const borderBottom = colors['border-bottom'] && colors['border-bottom'] !== 'none' ? colorToClass(colors['border-bottom'], 'border') : null;
    if (borderBottom) classes.push(borderBottom, 'border-b');
    const borderTop = colors['border-top'] && colors['border-top'] !== 'none' ? colorToClass(colors['border-top'], 'border') : null;
    if (borderTop) classes.push(borderTop, 'border-t');
    const borderRight = colors['border-right'] && colors['border-right'] !== 'none' ? colorToClass(colors['border-right'], 'border') : null;
    if (borderRight) classes.push(borderRight, 'border-r');
    const borderLeft = colors['border-left'] && colors['border-left'] !== 'none' ? colorToClass(colors['border-left'], 'border') : null;
    if (borderLeft) classes.push(borderLeft, 'border-l');
    if (shadow) classes.push(shadow);
    styles[name] = classes.join(' ');
  }
  return styles;
}

/**
 * Map a role-token path (color/primary/on-primary) to its runtime CSS variable — var(--on-primary).
 * The token pipeline emits role tokens to :root as --{role} (e.g. --primary, --on-surface, --outline).
 * NOTE: it must be --{role}, NOT --color-{role}: the @theme block is `@theme inline`, which inlines
 * values into utilities and does NOT register --color-* on :root, so only --{role} resolves at runtime.
 */
function colorToVar(colorPath) {
  if (!colorPath || colorPath === 'transparent') return null;
  const role = colorPath.split('/').pop();
  return `var(--${role})`;
}

/**
 * Catalog-wide treatment vocabulary for orthogonal atoms. A treatment is a fixed consumer
 * of the per-color CSS vars (--v-bg/--v-fg for the solid fill, --v-text/--v-border for the
 * line/text). The color axis sets those vars; the treatment reads them — so variant and color
 * are independent CVA axes (no N×M compound matrix). Shared by Button (filled/outline/ghost)
 * and Badge (filled/outline/dot); each atom picks the treatments it exposes via `treatments`.
 */
const TREATMENT_CLASSES = {
  filled: 'bg-[color:var(--v-bg)] text-[color:var(--v-fg)]',
  outline: 'bg-transparent border border-[color:var(--v-border)] text-[color:var(--v-text)]',
  ghost: 'bg-transparent text-[color:var(--v-text)]',
  dot: 'bg-[color:var(--v-border)]',
};

/**
 * Build the per-color CSS-variable declaration classes for an orthogonal atom.
 * Each color is declared ONCE as { bg, fg, text, border } token paths; this emits the
 * Tailwind arbitrary-property classes that set --v-bg/--v-fg/--v-text/--v-border on the
 * element. The treatment classes (TREATMENT_CLASSES) then consume them.
 *
 * Returns { colorNames, varClass } where varClass[name] is the declaration string.
 * Axis-name-agnostic — the caller names the CVA dimension ('color' for Button, 'state' for Badge).
 */
function buildColorVars(colorsCfg) {
  const colorNames = Object.keys(colorsCfg).filter((k) => !k.startsWith('$'));
  const varClass = {};
  for (const name of colorNames) {
    const c = colorsCfg[name] || {};
    const parts = [];
    const bg = colorToVar(c.bg);
    const fg = colorToVar(c.fg);
    const text = colorToVar(c.text);
    const border = colorToVar(c.border);
    if (bg) parts.push(`[--v-bg:${bg}]`);
    if (fg) parts.push(`[--v-fg:${fg}]`);
    if (text) parts.push(`[--v-text:${text}]`);
    if (border) parts.push(`[--v-border:${border}]`);
    varClass[name] = parts.join(' ');
  }
  return { colorNames, varClass };
}

function buildSizeStyles(sizes) {
  const styles = {};
  for (const [name, sz] of Object.entries(sizes)) {
    if (name.startsWith('$')) continue; // skip $exception notes
    const classes = [];
    // Icon-sized components (spinner etc.) — size: "icon/icon-N"
    if (sz.size && typeof sz.size === 'string' && sz.size.startsWith('icon/')) {
      classes.push(`size-${sz.size.replace('icon/', '')}`);
    }
    // Square size via height token (e.g. icon-button)
    if (sz.size && typeof sz.size === 'string' && sz.size.startsWith('height/')) {
      classes.push(`size-${sz.size.replace('height/', '')}`);
    }
    // Height — height/ch-N
    const h = heightToClass(sz.height);
    if (h) classes.push(`h-${h}`);
    // Min-height (e.g. textarea)
    if (sz['min-height']) classes.push(`min-h-[${sz['min-height']}]`);
    // Padding — handles both {scale.N} and raw values
    const px = spacingToClass(sz['x-padding'], 'px');
    if (px) classes.push(px);
    const py = spacingToClass(sz['y-padding'], 'py');
    if (py) classes.push(py);
    // Gap
    const gap = spacingToClass(sz.gap, 'gap');
    if (gap) classes.push(gap);
    // Border radius
    const rad = radiusToClass(sz.radius);
    if (rad) classes.push(`rounded-${rad}`);
    // Shadow per size (e.g. FAB)
    const shadow = shadowToClass(sz.shadow);
    if (shadow) classes.push(shadow);
    // Border-width
    const bw = borderWidthToClass(sz['border-width']);
    if (bw) classes.push(bw);
    // Max-width (Dialog, Sheet, etc.)
    const mw = maxWidthToClass(sz['max-width']);
    if (mw) classes.push(mw);
    // Width (Sidebar, ColorPicker, etc.)
    if (sz.width && !sz.size) classes.push(`w-[${sz.width}]`);
    styles[name] = classes.join(' ');
  }
  return styles;
}

// --- $base inheritance resolver ---

function resolveBase(allComponents, configKey) {
  const config = allComponents[configKey];
  if (!config || !config['$base']) return config;
  const base = allComponents[config['$base']];
  if (!base) return config;
  const merged = {};
  for (const key of new Set([...Object.keys(base), ...Object.keys(config)])) {
    if (key === '$base' || key.startsWith('$')) continue;
    const bv = base[key], cv = config[key];
    if (bv === undefined) { merged[key] = cv; continue; }
    if (cv === undefined) { merged[key] = bv; continue; }
    if (typeof cv !== 'object' || cv === null || typeof bv !== 'object' || bv === null) { merged[key] = cv; continue; }
    if (key === 'sizes') {
      merged[key] = {};
      for (const t of new Set([...Object.keys(bv), ...Object.keys(cv)])) merged[key][t] = t in cv ? cv[t] : bv[t];
    } else {
      merged[key] = {};
      for (const sk of new Set([...Object.keys(bv), ...Object.keys(cv)])) {
        const b2 = bv[sk], c2 = cv[sk];
        if (c2 !== undefined && b2 !== undefined && typeof c2 === 'object' && typeof b2 === 'object') {
          merged[key][sk] = { ...b2, ...c2 };
        } else {
          merged[key][sk] = c2 !== undefined ? c2 : b2;
        }
      }
    }
  }
  return merged;
}

// --- Component registry ---

function getComponentRegistry(configs) {
  const { buttonConfig, formConfig, feedbackConfig, dataDisplayConfig, layoutConfig, navigationConfig, compositeConfig } = configs;
  return {
    // === Actions ===
    'Button': { source: buttonConfig, key: 'button', element: 'button', htmlType: 'ButtonHTMLAttributes<HTMLButtonElement>', textFamily: 'action', category: 'Actions', template: 'cva-only', primitive: '@radix-ui/react-slot' },
    // IconButton removed — use <Button variant="ghost" size="icon"> instead
    'FAB': { source: buttonConfig, key: 'fab', element: 'button', htmlType: 'ButtonHTMLAttributes<HTMLButtonElement>', iconOnly: true, textFamily: 'action', category: 'Actions', template: 'cva-only', primitive: null },
    'FabMenu': { source: buttonConfig, key: 'fab-menu', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, textFamily: 'action', category: 'Actions', template: 'cva-only', primitive: null },
    'Badge': { source: buttonConfig, key: 'badge', element: 'span', htmlType: 'HTMLAttributes<HTMLElement>', textFamily: 'label', category: 'Actions', template: 'cva-only', primitive: '@radix-ui/react-slot' },
    'Dot': { source: buttonConfig, key: 'dot', element: 'span', htmlType: 'HTMLAttributes<HTMLSpanElement>', noInteractive: true, noIconSlots: true, noChildren: true, variantKey: 'state', textFamily: null, category: 'Feedback', template: 'cva-only', primitive: null },
    'Toggle': { source: buttonConfig, key: 'toggle', element: 'button', htmlType: 'ButtonHTMLAttributes<HTMLButtonElement>', textFamily: 'action', category: 'Actions', template: 'radix', primitive: '@radix-ui/react-toggle', variantKey: 'state' },
    'ToggleGroup': { source: buttonConfig, key: 'toggle-group', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'row', noIconSlots: true, textFamily: 'body', category: 'Actions', template: 'radix', primitive: '@radix-ui/react-toggle-group' },

    // === Inputs ===
    'Input': { source: formConfig, key: 'input', baseKey: 'text-field', element: 'input', htmlType: 'InputHTMLAttributes<HTMLInputElement>', selfClosing: true, formControl: true, textFamily: 'input', category: 'Inputs', template: 'cva-only', primitive: null, variantKey: 'state' },
    'Select': { source: formConfig, key: 'select', baseKey: 'text-field', element: 'select', htmlType: 'SelectHTMLAttributes<HTMLSelectElement>', noIconSlots: true, textFamily: 'input', category: 'Inputs', template: 'radix', primitive: '@radix-ui/react-select', variantKey: 'state' },
    'Textarea': { source: formConfig, key: 'textarea', baseKey: 'text-field', element: 'textarea', htmlType: 'TextareaHTMLAttributes<HTMLTextAreaElement>', noIconSlots: true, formControl: true, textFamily: 'input', category: 'Inputs', template: 'cva-only', primitive: null, variantKey: 'state' },
    'DatePicker': { source: formConfig, key: 'date-picker', baseKey: 'text-field', element: 'input', htmlType: 'InputHTMLAttributes<HTMLInputElement>', selfClosing: true, inputType: 'date', textFamily: 'input', category: 'Inputs', template: 'lib', primitive: 'react-day-picker', variantKey: 'state' },
    'Checkbox': { source: formConfig, key: 'checkbox', baseKey: 'toggle-base', element: 'input', htmlType: 'InputHTMLAttributes<HTMLInputElement>', selfClosing: true, noIconSlots: true, variantKey: 'checked', inputType: 'checkbox', textFamily: 'body', category: 'Inputs', template: 'radix', primitive: '@radix-ui/react-checkbox' },
    'Radio': { source: formConfig, key: 'radio', baseKey: 'toggle-base', element: 'input', htmlType: 'InputHTMLAttributes<HTMLInputElement>', selfClosing: true, noIconSlots: true, variantKey: 'checked', inputType: 'radio', textFamily: 'body', category: 'Inputs', template: 'radix', primitive: '@radix-ui/react-radio-group' },
    'Switch': { source: formConfig, key: 'switch', element: 'button', htmlType: 'ButtonHTMLAttributes<HTMLButtonElement>', noIconSlots: true, noChildren: true, variantKey: 'active', role: 'switch', textFamily: 'body', category: 'Inputs', template: 'radix', primitive: '@radix-ui/react-switch' },
    'Combobox': { source: formConfig, key: 'combobox', baseKey: 'text-field', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, textFamily: 'input', category: 'Inputs', template: 'lib', primitive: 'cmdk' },
    'Slider': { source: formConfig, key: 'slider', element: 'input', htmlType: 'InputHTMLAttributes<HTMLInputElement>', selfClosing: true, noIconSlots: true, inputType: 'range', textFamily: 'body', category: 'Inputs', template: 'radix', primitive: '@radix-ui/react-slider' },
    'FileUpload': { source: formConfig, key: 'file-upload', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', layout: 'stack', textFamily: 'body', category: 'Inputs', template: 'cva-only', primitive: null },
    'InputOTP': { source: formConfig, key: 'input-otp', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'row', noIconSlots: true, textFamily: 'input', category: 'Inputs', template: 'cva-only', primitive: null },
    'Label': { source: formConfig, key: 'label', element: 'label', htmlType: 'LabelHTMLAttributes<HTMLLabelElement>', noInteractive: true, layout: 'row', textFamily: 'action', category: 'Inputs', template: 'cva-only', primitive: null },
    'HelperText': { source: formConfig, key: 'helper-text', element: 'p', htmlType: 'HTMLAttributes<HTMLParagraphElement>', noInteractive: true, layout: 'row', textFamily: 'label', category: 'Inputs', template: 'cva-only', primitive: null },
    'FormField': { source: formConfig, key: 'form-field', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noIconSlots: true, noChildren: true, textFamily: 'body', category: 'Inputs', template: 'cva-only', primitive: null },
    'Calendar': { source: formConfig, key: 'calendar', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, textFamily: 'body', category: 'Inputs', template: 'lib', primitive: 'react-day-picker' },
    'Rating': { source: formConfig, key: 'rating', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noIconSlots: true, textFamily: null, category: 'Inputs', template: 'lib', primitive: null },
    'TimePicker': { source: formConfig, key: 'time-picker', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noIconSlots: true, textFamily: 'input', category: 'Inputs', template: 'lib', primitive: null },
    'SearchBar': { source: formConfig, key: 'search-bar', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noIconSlots: true, textFamily: 'input', category: 'Inputs', template: 'lib', primitive: null },

    // === Layout ===
    'Card': { source: layoutConfig, key: 'card', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', textFamily: 'body', category: 'Layout', template: 'cva-only', primitive: null },
    'Dialog': { source: layoutConfig, key: 'dialog', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noChildren: true, layout: 'stack', role: 'dialog', textFamily: 'body', category: 'Layout', template: 'radix', primitive: '@radix-ui/react-dialog' },
    'Table': { source: layoutConfig, key: 'table', element: 'table', htmlType: 'TableHTMLAttributes<HTMLTableElement>', noInteractive: true, noChildren: true, layout: 'block', noIconSlots: true, textFamily: 'body', category: 'Layout', template: 'cva-only', primitive: null },
    'Sheet': { source: layoutConfig, key: 'sheet', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noChildren: true, layout: 'stack', role: 'dialog', textFamily: 'body', category: 'Layout', template: 'radix', primitive: '@radix-ui/react-dialog' },
    'Separator': { source: layoutConfig, key: 'separator', element: 'hr', htmlType: 'HTMLAttributes<HTMLHRElement>', noInteractive: true, noIconSlots: true, noChildren: true, minimal: true, textFamily: 'body', category: 'Layout', template: 'radix', primitive: '@radix-ui/react-separator' },
    'AlertDialog': { source: layoutConfig, key: 'alert-dialog', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noChildren: true, layout: 'stack', role: 'alertdialog', noIconSlots: true, textFamily: 'body', category: 'Layout', template: 'radix', primitive: '@radix-ui/react-alert-dialog' },
    'Toolbar': { source: layoutConfig, key: 'toolbar', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'row', noIconSlots: true, textFamily: 'body', category: 'Layout', template: 'cva-only', primitive: null },

    // === Feedback ===
    'Toast': { source: feedbackConfig, key: 'toast', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', layout: 'row', role: 'status', textFamily: 'action', category: 'Feedback', template: 'radix', primitive: '@radix-ui/react-toast' },
    'Alert': { source: feedbackConfig, key: 'alert', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', layout: 'row', role: 'alert', noInteractive: true, textFamily: 'body', category: 'Feedback', template: 'cva-only', primitive: null },
    'Tooltip': { source: feedbackConfig, key: 'tooltip', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noIconSlots: true, role: 'tooltip', textFamily: 'label', category: 'Feedback', template: 'radix', primitive: '@radix-ui/react-tooltip' },
    'Popover': { source: feedbackConfig, key: 'popover', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, textFamily: 'body', category: 'Feedback', template: 'radix', primitive: '@radix-ui/react-popover' },
    'DropdownMenu': { source: feedbackConfig, key: 'dropdown-menu', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, role: 'menu', textFamily: 'body', category: 'Feedback', template: 'radix', primitive: '@radix-ui/react-dropdown-menu' },
    'Skeleton': { source: feedbackConfig, key: 'skeleton', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noIconSlots: true, noChildren: true, minimal: true, textFamily: 'body', category: 'Feedback', template: 'cva-only', primitive: null },
    'ProgressBar': { source: feedbackConfig, key: 'progress-bar', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'block', noIconSlots: true, role: 'progressbar', textFamily: 'body', category: 'Feedback', template: 'radix', primitive: '@radix-ui/react-progress' },
    'BadgeDot': { source: feedbackConfig, key: 'badge-dot', element: 'span', htmlType: 'HTMLAttributes<HTMLSpanElement>', noInteractive: true, noIconSlots: true, textFamily: 'label', category: 'Feedback', template: 'cva-only', primitive: null },
    'EmptyState': { source: feedbackConfig, key: 'empty-state', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, textFamily: 'body', category: 'Feedback', template: 'cva-only', primitive: null },
    'ContextMenu': { source: feedbackConfig, key: 'context-menu', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, role: 'menu', textFamily: 'body', category: 'Feedback', template: 'radix', primitive: '@radix-ui/react-context-menu' },
    'HoverCard': { source: feedbackConfig, key: 'hover-card', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, textFamily: 'body', category: 'Feedback', template: 'radix', primitive: '@radix-ui/react-hover-card' },
    'Spinner': { source: feedbackConfig, key: 'spinner', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noIconSlots: true, noChildren: true, textFamily: null, sizeSkipKeys: ['border-width'], category: 'Feedback', template: 'cva-only', primitive: null },

    // === Data Display ===
    'Avatar': { source: dataDisplayConfig, key: 'avatar', element: 'span', htmlType: 'HTMLAttributes<HTMLSpanElement>', noInteractive: true, noIconSlots: true, textFamily: 'label', category: 'Data Display', template: 'radix', primitive: '@radix-ui/react-avatar' },
    'ListItem': { source: dataDisplayConfig, key: 'list-item', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', layout: 'row', baseExtra: 'cursor-pointer', textFamily: null, category: 'Data Display', template: 'cva-only', primitive: null },
    'Accordion': { source: dataDisplayConfig, key: 'accordion', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, textFamily: 'body', category: 'Data Display', template: 'radix', primitive: '@radix-ui/react-accordion' },
    'Kbd': { source: dataDisplayConfig, key: 'kbd', element: 'kbd', htmlType: 'HTMLAttributes<HTMLElement>', noInteractive: true, noIconSlots: true, textFamily: 'label', category: 'Data Display', template: 'cva-only', primitive: null },
    'Collapsible': { source: dataDisplayConfig, key: 'collapsible', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, textFamily: 'body', category: 'Data Display', template: 'radix', primitive: '@radix-ui/react-collapsible' },
    'AvatarGroup': { source: dataDisplayConfig, key: 'avatar-group', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'row', noIconSlots: true, textFamily: 'label', category: 'Data Display', template: 'lib', primitive: null },
    'NumberDisplay': { source: dataDisplayConfig, key: 'number', element: 'span', htmlType: 'HTMLAttributes<HTMLSpanElement>', noInteractive: true, noIconSlots: true, textFamily: 'body', category: 'Data Display', template: 'lib', primitive: null },
    'RelativeTime': { source: dataDisplayConfig, key: 'relative-time', element: 'time', htmlType: 'HTMLAttributes<HTMLElement>', noInteractive: true, noIconSlots: true, textFamily: 'body', category: 'Data Display', template: 'lib', primitive: null },
    'VideoPlayer': { source: dataDisplayConfig, key: 'video-player', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, noIconSlots: true, textFamily: 'body', category: 'Data Display', template: 'lib', primitive: null },

    // === Navigation ===
    'TopBar': { source: navigationConfig, key: 'top-bar', element: 'header', htmlType: 'HTMLAttributes<HTMLElement>', noInteractive: true, layout: 'row', noIconSlots: true, textFamily: 'title', category: 'Navigation', template: 'cva-only', primitive: null },
    'Sidebar': { source: navigationConfig, key: 'sidebar', element: 'nav', htmlType: 'HTMLAttributes<HTMLElement>', noInteractive: true, layout: 'stack', noIconSlots: true, textFamily: null, category: 'Navigation', template: 'cva-only', primitive: null },
    'Tabs': { source: navigationConfig, key: 'tabs', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'row', noIconSlots: true, role: 'tablist', textFamily: 'action', category: 'Navigation', template: 'radix', primitive: '@radix-ui/react-tabs' },
    'BottomNav': { source: navigationConfig, key: 'bottom-nav', element: 'nav', htmlType: 'HTMLAttributes<HTMLElement>', noInteractive: true, layout: 'row', baseExtra: 'justify-around w-full', noIconSlots: true, textFamily: 'label', category: 'Navigation', template: 'cva-only', primitive: null },
    'Breadcrumbs': { source: navigationConfig, key: 'breadcrumbs', element: 'nav', htmlType: 'HTMLAttributes<HTMLElement>', noInteractive: true, layout: 'row', noIconSlots: true, textFamily: 'body', category: 'Navigation', template: 'cva-only', primitive: null },
    'Pagination': { source: navigationConfig, key: 'pagination', element: 'nav', htmlType: 'HTMLAttributes<HTMLElement>', noInteractive: true, layout: 'row', noIconSlots: true, textFamily: 'body', category: 'Navigation', template: 'cva-only', primitive: null },
    'NavigationMenu': { source: navigationConfig, key: 'navigation-menu', element: 'nav', htmlType: 'HTMLAttributes<HTMLElement>', noInteractive: true, layout: 'row', noIconSlots: true, textFamily: 'body', category: 'Navigation', template: 'radix', primitive: '@radix-ui/react-navigation-menu' },
    'CommandPalette': { source: navigationConfig, key: 'command-palette', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, role: 'dialog', textFamily: 'body', category: 'Navigation', template: 'lib', primitive: 'cmdk' },

    // === Composite ===
    'Stepper': { source: compositeConfig, key: 'stepper', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'row', noIconSlots: true, variantKey: 'step-state', textFamily: 'body', category: 'Composite', template: 'cva-only', primitive: null },
    'Carousel': { source: compositeConfig, key: 'carousel', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, textFamily: 'body', category: 'Composite', template: 'lib', primitive: 'embla-carousel-react' },
    'TreeView': { source: compositeConfig, key: 'tree-view', element: 'div', htmlType: 'HTMLAttributes<HTMLDivElement>', noInteractive: true, layout: 'stack', noIconSlots: true, role: 'tree', variantKey: 'item', textFamily: 'body', category: 'Composite', template: 'cva-only', primitive: null },
  };
}

// --- Typography extraction ---

function buildTypographyClasses(config) {
  const typo = config.typography;
  if (!typo) return '';
  const classes = [];
  const fw = fontWeightToClass(typo['font-weight']);
  if (fw) classes.push(fw);
  const ls = letterSpacingToClass(typo['letter-spacing']);
  if (ls) classes.push(ls);
  if (typo['text-transform'] && typo['text-transform'] !== 'none') {
    classes.push(typo['text-transform']);
  }
  return classes.join(' ');
}

// --- Display name formatting ---

function formatDisplayName(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

module.exports = {
  loadAllConfigs,
  colorToClass,
  scaleToValue,
  spacingToClass,
  heightToClass,
  radiusToClass,
  shadowToClass,
  borderWidthToClass,
  maxWidthToClass,
  iconSizeToClass,
  fontWeightToClass,
  letterSpacingToClass,
  buildVariantStyles,
  colorToVar,
  TREATMENT_CLASSES,
  ICON_SLOT_CLASS,
  buildColorVars,
  buildSizeStyles,
  buildTypographyClasses,
  resolveBase,
  getComponentRegistry,
  formatDisplayName,
};
