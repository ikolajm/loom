#!/usr/bin/env node
/**
 * generate-doc-layout.js — emit the gallery presentation layer as CSS vars.
 *
 * `presentation/layout.json` is the single sphere-neutral source for "what we have to work with":
 * it branches into Design (the Figma scaffold) and Development (this dev gallery). This is the Dev
 * sphere consuming that shared source as a peer — deriving `--doc-*` custom properties from it
 * (not hardcoding), so the gallery and the Figma file stay in lockstep.
 *
 * Colors are emitted as direct hex (the doc layer is hue-neutral + mode-independent by design —
 * client components showcase against it). Spacing {scale.N} refs resolve to px via standards.json.
 * Radius refs map to the already-generated --radius-* token vars.
 */
const fs = require('fs');
const path = require('path');

const CONFIG_ROOT = path.resolve(__dirname, '../../spec/config');
const load = (rel) => JSON.parse(fs.readFileSync(path.join(CONFIG_ROOT, rel), 'utf-8'));

function generate() {
  const layout = load('presentation/layout.json');
  const standards = load('standards.json');
  const scale = standards.spacing.scale;

  // {scale.N} -> px string
  const resolveSpace = (val) => {
    const m = typeof val === 'string' && val.match(/^\{scale\.(\d+)\}$/);
    return m ? scale[m[1]] : val;
  };
  // "radius/card" -> var(--radius-card)
  const resolveRadius = (val) =>
    typeof val === 'string' && val.startsWith('radius/') ? `var(--${val.replace('/', '-')})` : val;

  const lines = [
    '/* === Doc layout — gallery presentation layer (derived from presentation/layout.json) === */',
    '/* Sphere-neutral source shared with the Figma scaffold. Hue-neutral + mode-independent: */',
    '/* client components showcase against these frames. */',
    ':root {',
  ];

  const push = (name, val) => lines.push(`  --doc-${name}: ${val};`);

  // Frame
  push('page-bg', layout.page.background);
  push('frame-bg', layout.frame.background);
  push('frame-fg', layout.frame.foreground);
  push('frame-fg-muted', layout.frame['foreground-muted']);
  push('frame-padding', resolveSpace(layout.frame.padding));
  push('frame-radius', resolveRadius(layout.frame.radius));
  push('frame-min-width', layout.frame['min-width']);

  // Surfaces (nesting) + outlines
  push('surface-1', layout.surface['surface-1']);
  push('surface-2', layout.surface['surface-2']);
  push('outline', layout.outline.default);
  push('outline-subtle', layout.outline.subtle);

  // Doc accent (agency branding — the interactive-preview frame + Try Me)
  push('accent', layout.accent.color);
  push('on-accent', layout.accent['on-accent']);

  // Spacing hierarchy: frame-group > section > component-group > component > label > description
  for (const [key, val] of Object.entries(layout.spacing)) {
    if (key.startsWith('$')) continue;
    push(key, resolveSpace(val));
  }

  lines.push('}');
  return lines.join('\n') + '\n';
}

module.exports = { generate };

if (require.main === module) {
  process.stdout.write(generate());
}
