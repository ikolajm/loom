/**
 * Generate icons.ts — unified icon system mapping config icon names to Lucide components.
 *
 * Scans all component configs for icon references (icon-slots, indicator-icon, trend icons)
 * and builds a typed map + size classes from standards.json.
 *
 * Output: components/icons.ts
 */
const fs = require('fs');
const path = require('path');
const { loadAllConfigs } = require('./shared');

// Map config icon names (after "icon/" prefix) to Lucide import names
const LUCIDE_MAP = {
  'placeholder': 'Star',
  'x': 'X',
  'chevron-down': 'ChevronDown',
  'chevron-up': 'ChevronUp',
  'chevron-left': 'ChevronLeft',
  'chevron-right': 'ChevronRight',
  'calendar': 'Calendar',
  'loader': 'Loader',
  'search': 'Search',
  'plus': 'Plus',
  'minus': 'Minus',
  'check': 'Check',
  'arrow-up': 'ArrowUp',
  'arrow-down': 'ArrowDown',
  'arrow-right': 'ArrowRight',
  'arrow-left': 'ArrowLeft',
  'upload': 'Upload',
  'sun': 'Sun',
  'moon': 'Moon',
  'monitor': 'Monitor',
};

/**
 * Recursively scan an object for icon references (strings starting with "icon/")
 * Returns a Set of icon names (without the "icon/" prefix)
 */
function scanForIcons(obj, found = new Set()) {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string' && obj.startsWith('icon/') && !obj.startsWith('icon/icon-')) {
      found.add(obj.replace('icon/', ''));
    }
    return found;
  }
  for (const val of Object.values(obj)) {
    scanForIcons(val, found);
  }
  return found;
}

function generate(configs, outputDir) {
  // Scan all component configs for icon references
  const iconNames = new Set();
  const configSources = [
    configs.buttonConfig, configs.formConfig, configs.feedbackConfig,
    configs.dataDisplayConfig, configs.layoutConfig, configs.navigationConfig,
    configs.compositeConfig,
  ];
  for (const source of configSources) {
    scanForIcons(source, iconNames);
  }

  // Always include these (used internally by templates)
  iconNames.add('check');
  iconNames.add('chevron-down');
  iconNames.add('x');
  iconNames.add('loader');
  iconNames.add('sun');
  iconNames.add('moon');
  iconNames.add('monitor');

  // Build icon size classes from standards
  const iconSizes = configs.standards.sizing['icon-size'];
  const sizeEntries = Object.entries(iconSizes).map(([token, px]) => {
    const pxNum = parseInt(px);
    // Map px to Tailwind size class: 12→3, 16→4, 20→5, 24→6, 32→8
    const twSize = pxNum / 4;
    return [token, `size-${twSize}`];
  });

  // Build Lucide imports
  const sortedIcons = [...iconNames].sort();
  const lucideImports = sortedIcons
    .map(name => LUCIDE_MAP[name])
    .filter(Boolean);
  const uniqueImports = [...new Set(lucideImports)].sort();

  // Build icon map entries
  const mapEntries = sortedIcons
    .filter(name => LUCIDE_MAP[name])
    .map(name => `  '${name}': ${LUCIDE_MAP[name]},`);

  const output = `/**
 * icons.ts — Generated icon system
 * Maps config icon names to Lucide React components.
 * Do not edit manually — regenerate from config.
 */
import {
  ${uniqueImports.join(',\n  ')},
  type LucideIcon,
} from 'lucide-react';

/** Map of config icon names to Lucide components */
export const iconMap: Record<string, LucideIcon> = {
${mapEntries.join('\n')}
};

/** Icon size classes from standards.json — maps icon tokens to Tailwind size utilities */
export const iconSizeClass: Record<string, string> = {
${sizeEntries.map(([token, cls]) => `  '${token}': '${cls}',`).join('\n')}
};

/** Get a Lucide component by config icon name. Returns undefined if not found. */
export function getIcon(name: string): LucideIcon | undefined {
  // Strip "icon/" prefix if present
  const key = name.startsWith('icon/') ? name.slice(5) : name;
  return iconMap[key];
}

/** Get a Tailwind size class for an icon size token. */
export function getIconSizeClass(token: string): string {
  // Strip "icon/" prefix if present
  const key = token.startsWith('icon/') ? token.slice(5) : token;
  return iconSizeClass[key] || 'size-5';
}

// Re-export commonly used icons for direct import
export {
  ${uniqueImports.join(',\n  ')},
};
`;

  const outPath = path.join(outputDir, 'components', 'icons.ts');
  fs.writeFileSync(outPath, output);
  console.log(`  icons.ts (${sortedIcons.length} icons, ${sizeEntries.length} sizes)`);
  return sortedIcons.length;
}

module.exports = { generate, LUCIDE_MAP };
