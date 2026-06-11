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
    '/* Sphere-neutral source shared with the Figma scaffold. The frame COLORS are per-mode, keyed */',
    '/* by data-theme so one attribute on a frame swaps both its chrome and its components in */',
    '/* lockstep; mode-independent layout (spacing/padding/accent) lives in :root. */',
    ':root {',
  ];
  const push = (name, val) => lines.push(`  --doc-${name}: ${val};`);

  // Mode-independent: canvas, layout geometry, doc accent, spacing hierarchy.
  push('page-bg', layout.page.background);
  push('frame-padding', resolveSpace(layout.frame.padding));
  push('frame-radius', resolveRadius(layout.frame.radius));
  push('frame-min-width', layout.frame['min-width']);
  // Doc accent = the consumer's own primary, so every scaffold reads as entirely theirs
  // (no separate brand decision). layout.json's accent stays for the Figma sphere.
  push('accent', 'var(--primary)');
  push('on-accent', 'var(--on-primary)');
  for (const [key, val] of Object.entries(layout.spacing)) {
    if (key.startsWith('$')) continue;
    push(key, resolveSpace(val));
  }
  lines.push('}');

  // Per-mode frame colors. Light = the top-level frame/surface/outline; dark = the `dark` block.
  const frameColorBlock = (selector, frame, surface, outline) => {
    lines.push('', `${selector} {`);
    push('frame-bg', frame.background);
    push('frame-fg', frame.foreground);
    push('frame-fg-muted', frame['foreground-muted']);
    push('surface-1', surface['surface-1']);
    push('surface-2', surface['surface-2']);
    push('outline', outline.default);
    push('outline-subtle', outline.subtle);
    lines.push('}');
  };
  frameColorBlock('[data-theme="light"]', layout.frame, layout.surface, layout.outline);
  if (layout.dark) {
    frameColorBlock('[data-theme="dark"]', layout.dark.frame, layout.dark.surface, layout.dark.outline);
  }

  return lines.join('\n') + '\n';
}

module.exports = { generate };

if (require.main === module) {
  process.stdout.write(generate());
}
