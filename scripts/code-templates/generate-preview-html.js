/**
 * Generates docs/preview.html — the substrate canvas as a static page.
 *
 * Same split the TSX preview established, and for the same reason. The **token half**
 * (ramps, roles, type, spacing, radius) is generated from the configs, because a
 * hand-written page listing the type roles silently stops being true the day one is
 * added and nothing fails. The **class strip** is hand-written below: it is prose as
 * much as markup, the shortest honest answer to "how do I use this without a
 * framework", and generating it would produce an exhaustive matrix nobody reads.
 *
 * What changed in the port is the substrate under it. The TSX page rendered the token
 * half through Tailwind utilities — `bg-primary`, `text-on-primary` — which existed only
 * through the `@theme` bridge. With the bridge gone those resolve to nothing, so the
 * swatches read the custom properties directly. That is also the more honest test: the
 * custom properties are what ships.
 *
 * Page-local layout is a <style> block under the `pv-` prefix, kept deliberately apart
 * from anything Loom emits so the page cannot flatter the layer by styling it. If a Loom
 * class is doing the work, it is a Loom class in the markup.
 *
 * Written to docs/ rather than the output directory: this page is read in the repo, by
 * someone deciding what they are about to override.
 */
const { loadConfig: load } = require('../config-paths');

const colors = load('base/colors.json');
const typography = load('base/typography.json');
const standards = load('standards.json');
const sizing = load('base/sizing.json');

const RAMP_FAMILIES = ['primary', 'secondary', 'accent', 'neutral', 'error', 'success', 'warning', 'info'];

// Roles a consumer can check by eye: a fill with the on-color that belongs to it.
const ROLE_GROUPS = [
  ['Primary', [['primary', 'on-primary'], ['primary-container', 'on-primary-container']]],
  ['Secondary', [['secondary', 'on-secondary'], ['secondary-container', 'on-secondary-container']]],
  ['Neutral', [['neutral', 'on-neutral'], ['neutral-container', 'on-neutral-container']]],
  ['Surfaces', [['surface', 'on-surface'], ['surface-1', 'on-surface'], ['surface-2', 'on-surface'], ['surface-3', 'on-surface']]],
  ['Semantic', [['error', 'on-error'], ['success', 'on-success'], ['warning', 'on-warning'], ['info', 'on-info']]],
];

const TONES = ['primary', 'secondary', 'neutral', 'error', 'success', 'warning', 'info'];
const SIZES = ['sm', 'md', 'lg'];

// A swatch label has to stay readable on every stop of every ramp. The TSX preview did
// this with `mix-blend-mode: difference` over white, which inverts the background — and
// an inverted mid-tone lands back near the luminance it started from, so contrast
// collapsed in the middle of each ramp, where the ramps are most used. Measured across
// the palette it put 33 of 84 stops under 4.5:1, the worst at 1.01:1. Choosing black or
// white by relative luminance puts none under 4.5:1, worst case 4.74:1.
const channel = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// 0.179 is where black and white swap as the better foreground in sRGB.
const inkOn = (hex) => (luminance(hex) > 0.179 ? '#000' : '#fff');

const NL = '\n';

// --- Composition -------------------------------------------------------------
// Every section is a heading over a body, every lede the same muted paragraph, every
// gap the same dashed box. All of them were spelled out by hand a dozen times before
// they were functions — identical markup repeated is only ever an opportunity for one
// copy to drift from the rest.

const section = (title, body) => `  <section class="pv-section">
    <h2 class="text-title-md text-on-surface-variant">${title}</h2>
${body}
  </section>`;

const lede = (text) => `    <p class="text-body-sm text-on-surface-variant">
      ${text}
    </p>`;

const row = (body) => `    <div class="pv-row">
${body}
    </div>`;

// A gap holds a label, a lede and the demonstration. One indent deeper than a section,
// so its lede is re-indented rather than given a second definition.
const gap = (label, text, body) => `    <div class="pv-gap">
      <span class="text-label-md">${label}</span>
${lede(text).replace(/^ {4}/gm, '      ')}
${body}
    </div>`;

// --- The generated half ------------------------------------------------------

function ramps() {
  return RAMP_FAMILIES.filter((f) => colors.palette[f]).map((f) => {
    const swatches = Object.entries(colors.palette[f]).map(([s, hex]) =>
      `        <div class="pv-shade" style="background: var(--color-${f}-${s}); color: ${inkOn(hex)}"><span>${s}</span></div>`
    ).join(NL);
    return `    <div class="pv-ramp">
      <span class="text-label-sm text-on-surface-variant">${f}</span>
      <div class="pv-ramp-row">
${swatches}
      </div>
    </div>`;
  }).join(NL);
}

function roleGroups() {
  return ROLE_GROUPS.map(([label, pairs]) => {
    const cards = pairs.map(([bg, fg]) =>
      `        <div class="pv-role" style="background: var(--${bg}); color: var(--${fg})"><span class="text-label-sm">${bg}</span></div>`
    ).join(NL);
    return `    <div class="pv-group">
      <span class="text-label-md text-on-surface-variant">${label}</span>
      <div class="pv-row">
${cards}
      </div>
    </div>`;
  }).join(NL);
}

function typeStyles() {
  const rows = [];
  for (const family of Object.keys(typography.textStyles)) {
    for (const tier of ['lg', 'md', 'sm']) {
      if (!typography.textStyles[family][tier]) continue;
      rows.push(`    <div class="pv-type-row">
      <span class="pv-key text-label-sm text-on-surface-variant">${family}-${tier}</span>
      <span class="text-${family}-${tier}">The quick brown fox</span>
    </div>`);
    }
  }
  return rows.join(NL);
}

function spacing() {
  return Object.keys(standards.spacing.scale).filter((s) => s !== '0').map((s) =>
    `    <div class="pv-space-row">
      <span class="pv-key text-label-sm text-on-surface-variant">${s}</span>
      <div class="pv-space-bar" style="width: var(--space-${s})"></div>
    </div>`
  ).join(NL);
}

function radius() {
  return Object.keys(sizing['border-radius'] || {}).map((n) =>
    `      <div class="pv-radius">
        <div class="pv-radius-box" style="border-radius: var(--radius-${n})"></div>
        <span class="text-label-sm text-on-surface-variant">${n}</span>
      </div>`
  ).join(NL);
}

// Every tone against every treatment. Generated because this is exactly the list that
// must not drift — a tone added without a swatch here is a tone nobody ever looks at.
function toneMatrix() {
  return TONES.map((t) => row(
    `      <span class="pv-key text-label-sm text-on-surface-variant">${t}</span>
      <span class="badge treat-filled tone-${t}" data-size="md">filled</span>
      <span class="badge treat-filled tone-${t}-soft" data-size="md">filled soft</span>
      <span class="badge treat-outline tone-${t}" data-size="md">outline</span>
      <span class="badge treat-ghost tone-${t}" data-size="md">ghost</span>
      <span class="badge treat-dot tone-${t}" data-size="md">dot</span>`
  )).join(NL);
}

// --- The hand-written half ---------------------------------------------------
// Shown, not listed. Each block is the smallest markup that proves one rule.

const CLASS_STRIP = [
  section('Surface and elevation', [
    lede(`Which plane, and how far off it. Separate classes because the two vary
      independently. Elevation renders as nothing when shadow depth is flat.`),
    row(`      <div class="card surface-1 elevate-1" data-size="md">surface-1 &middot; elevate-1</div>
      <div class="card surface-2 elevate-2" data-size="md">surface-2 &middot; elevate-2</div>
      <div class="card surface-3 elevate-3" data-size="md">surface-3 &middot; elevate-3</div>`),
  ].join(NL)),

  section('Control states', [
    lede(`Focus, validity and disabled come from one class. Validity keys off
      <code>aria-invalid</code>, so styling cannot drift from what a screen reader
      reads. Tab through these rather than reading them.`),
    row(`      <div class="pv-field"><input class="input control" data-size="md" placeholder="focus me"></div>
      <div class="pv-field"><input class="input control" data-size="md" aria-invalid value="invalid"></div>
      <div class="pv-field"><input class="input control" data-size="md" disabled value="disabled"></div>`),
  ].join(NL)),

  section('Sizes', [
    lede(`Every component class ramps on <code>data-size</code>. Padding, radius and the
      type role move together, so a tier cannot disagree with itself.`),
    row(SIZES.map((z) => `      <span class="badge treat-filled tone-primary-soft" data-size="${z}">${z}</span>`).join(NL)),
    row(SIZES.map((z) => `      <button class="button treat-filled tone-primary interactive control" data-size="${z}">${z}</button>`).join(NL)),
  ].join(NL)),

  section('Loading', [
    lede(`The spinner carries the layer's only animation; the skeleton is deliberately
      static, because it earns its place by reserving layout rather than by moving. Set
      reduced motion at the OS and reload: the spinner keeps turning on purpose.`),
    row(`      <span class="spinner" data-size="md" data-variant="default"></span>
      <div class="pv-field"><span class="skeleton" data-variant="default" style="height: var(--space-6)"></span></div>`),
  ].join(NL)),

  section('Table', [
    lede(`Ruled, not framed &mdash; add a border yourself rather than removing one. Rows
      shade on hover; the header repeats across pages in print.`),
    `    <table class="table" data-size="md">
      <thead>
        <tr><th>Stylesheet</th><th>Carries</th></tr>
      </thead>
      <tbody>
        <tr><td>tokens.css</td><td>values</td></tr>
        <tr><td>loom.css</td><td>what you compose with</td></tr>
        <tr><td>loom.components.css</td><td>what they compose into</td></tr>
      </tbody>
    </table>`,
  ].join(NL)),

  section('Known gaps', [
    lede(`This page renders the class layer, so a gap in the class layer shows up here
      as nothing. These are open work, not defects in the page.`),
    gap('dialog has no class',
      `Its panel, overlay, header and sizing live in the atom's TSX as utilities that
        resolved only through the Tailwind bridge. Below is that markup with the classes
        it would use; nothing styles it. Compare against the card above.`,
      `      <div class="dialog" data-size="md">
        <div class="dialog-header">
          <span class="dialog-title">Unstyled</span>
          <span class="dialog-description">This block has no rule behind it.</span>
        </div>
      </div>`),
    gap('focus-ring reaches .control but not .interactive',
      `Tab to both. The first takes a ring, the second does not, though it is the class
        a consumer reaches for when styling a button.`,
      `      <div class="pv-row">
        <button class="button treat-outline tone-neutral control" data-size="md">control</button>
        <button class="button treat-outline tone-neutral interactive" data-size="md">interactive</button>
      </div>`),
    gap('tone without treatment renders nothing',
      `The axes are orthogonal, so either alone is silent &mdash; no error, no visible
        result. Only the pair produces anything.`,
      `      <div class="pv-row">
        <span class="badge tone-primary" data-size="md">tone only</span>
        <span class="badge treat-filled" data-size="md">treatment only</span>
        <span class="badge treat-filled tone-primary" data-size="md">both</span>
      </div>`),
  ].join(NL)),
].join(NL + NL);

// --- Page-local layout -------------------------------------------------------
// Prefixed so it cannot be mistaken for something Loom ships, and kept to layout only.
// If this block ever sets colour, type or state, the page has started flattering the
// layer instead of testing it.
const PAGE_CSS = `    :root { color-scheme: light dark; }
    body { max-width: 64rem; margin: 0 auto; padding: var(--space-8) var(--space-5); }
    .pv-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-10); }
    .pv-section { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-10); }
    .pv-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
    .pv-group { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
    .pv-key { flex: 0 0 8rem; }
    .pv-field { width: 14rem; }
    .pv-ramp { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-3); }
    .pv-ramp-row { display: flex; flex-wrap: wrap; }
    .pv-shade { flex: 0 0 3.5rem; height: 2.5rem; display: flex; align-items: flex-end; justify-content: center; }
    .pv-shade span { font-size: 0.6875rem; }
    .pv-role { width: 10rem; height: 5rem; display: flex; flex-direction: column; justify-content: flex-end; padding: var(--space-3); border-radius: var(--radius-card); }
    .pv-type-row { display: flex; align-items: baseline; gap: var(--space-4); }
    .pv-space-row { display: flex; align-items: center; gap: var(--space-4); }
    .pv-space-bar { height: var(--space-4); background: var(--primary); border-radius: var(--br-1); }
    .pv-radius { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
    .pv-radius-box { width: 5rem; height: 5rem; background: var(--surface-2); border: var(--bw-1) solid var(--outline); }
    .pv-gap { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4); border: var(--bw-1) dashed var(--outline); border-radius: var(--radius-card); }`;

const THEME_SCRIPT = `    // The only script on the page, and it does one thing: flip the attribute the
    // alternate-mode block keys off, so both modes can be checked without a rebuild.
    (function () {
      var el = document.documentElement;
      var btn = document.getElementById('pv-theme');
      function label() { btn.textContent = 'Theme: ' + (el.dataset.theme || 'default'); }
      btn.addEventListener('click', function () {
        el.dataset.theme = el.dataset.theme === 'dark' ? 'light' : 'dark';
        label();
      });
      label();
    })();`;

function generate() {
  const body = [
    section('Ramps', ramps()),
    section('Colour roles', roleGroups()),
    section('Typography', typeStyles()),
    section('Spacing', spacing()),
    section('Radius', row(radius())),
    section('Tone and treatment', [
      lede(`A tone sets four custom properties; a treatment reads them. Independent
        axes, so adding either is one rule rather than a matrix.`),
      toneMatrix(),
    ].join(NL)),
    CLASS_STRIP,
  ].join(NL + NL);

  return `<!doctype html>
<!--
  Loom substrate canvas — generated by scripts/code-templates/generate-preview-html.js.
  Regenerate rather than editing.

  Three stylesheets in load-bearing order and nothing else underneath. No framework, no
  build step, no utility layer: what renders here is what a consumer gets. It collapses
  to one import when main.css lands.

  Run the generate script first — the stylesheets it links are build output.
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Loom substrate</title>
<link rel="stylesheet" href="../generated/tokens.css">
<link rel="stylesheet" href="../generated/loom.css">
<link rel="stylesheet" href="../generated/loom.components.css">
<style>
${PAGE_CSS}
</style>
</head>
<body>
  <header class="pv-head">
    <div>
      <h1 class="text-display-sm">Loom substrate</h1>
      <p class="text-body-sm text-on-surface-variant">Tokens above, the class layer below. This is the surface you override.</p>
    </div>
    <button type="button" id="pv-theme" class="button treat-outline tone-neutral interactive control" data-size="md">Theme</button>
  </header>

${body}

  <script>
${THEME_SCRIPT}
  </script>
</body>
</html>
`;
}

module.exports = { generate };
