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

// The page carries no icon library on purpose — taking one would be exactly the
// framework coupling it exists to avoid. These are drawn inline so each slot renders at
// the size a consumer's icon would: .icon-slot reserves var(--icon-size) and
// .icon-slot > svg fills it, which a text glyph never does.
const CLOSE_MARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const SPINNER_MARK = '<svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" aria-hidden="true">'
  + '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>'
  + '<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';

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
// Badge and button are shown as separate matrices, not mixed in a row. They declare
// different treatment sets — badge filled/outline, button filled/outline/ghost — and
// they now have different heights, so a mixed row reads as the two disagreeing rather
// than as one tone across two components.
function toneMatrix(kind) {
  const cells = kind === 'badge'
    ? (t) => `      <span class="badge treat-filled tone-${t}" data-size="md">filled</span>
      <span class="badge treat-filled tone-${t}-soft" data-size="md">filled soft</span>
      <span class="badge treat-outline tone-${t}" data-size="md">outline</span>
      <span class="badge treat-ghost tone-${t}" data-size="md">ghost</span>`
    : (t) => `      <button class="button treat-filled tone-${t} interactive control" data-size="md">filled</button>
      <button class="button treat-outline tone-${t} interactive control" data-size="md">outline</button>
      <button class="button treat-ghost tone-${t} interactive control" data-size="md">ghost</button>`;
  return TONES.map((t) => row(
    `      <span class="pv-key text-label-sm text-on-surface-variant">${t}</span>
${cells(t)}`
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
    row(`      <span class="spinner" data-size="md" data-variant="default">${SPINNER_MARK}</span>
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

  section('Dialog', [
    lede(`The panel is a class, so it renders in flow like anything else — shown inline
      here rather than as a screenshot of a modal. Placement is the separate
      <code>.dialog-fixed</code>, which is why the same class works on a native
      <code>&lt;dialog&gt;</code> the browser centres itself.`),
    `    <div class="dialog" data-size="md" data-variant="default" style="max-width: 100%">
      <div class="dialog-close">
        <button class="button treat-ghost tone-inherit interactive control" data-size="icon-sm" aria-label="Close">${CLOSE_MARK}</button>
      </div>
      <div class="dialog-header">
        <span class="dialog-title">Delete this project</span>
        <span class="dialog-description">This cannot be undone. Everything in it goes with it.</span>
      </div>
      <div class="dialog-footer">
        <button class="button treat-outline tone-neutral interactive control" data-size="md">Cancel</button>
        <button class="button treat-filled tone-error interactive control" data-size="md">Delete</button>
      </div>
    </div>`,
    lede(`The same class on a real <code>&lt;dialog&gt;</code>, opened with
      <code>showModal()</code>. No portal, no focus-trap library: the browser supplies the
      backdrop, the focus containment and Escape. Tab inside it — focus should not leave.`),
    row(`      <button class="button treat-filled tone-primary interactive control" data-size="md" id="pv-open">Open a native dialog</button>`),
    `    <dialog class="dialog" data-size="md" data-variant="default" id="pv-dialog">
      <div class="dialog-header">
        <span class="dialog-title">Native dialog</span>
        <span class="dialog-description">Centred and layered by the UA. The scrim is ::backdrop.</span>
      </div>
      <div class="dialog-footer">
        <button class="button treat-outline tone-neutral interactive control" data-size="md" id="pv-close">Close</button>
      </div>
    </dialog>`,
    lede(`And the third path, which is the one a headless dialog library takes: a plain
      <code>&lt;div&gt;</code> carrying <code>.dialog .dialog-fixed</code>, with
      <code>.dialog-overlay</code> behind it. No <code>&lt;dialog&gt;</code> element, so
      no <code>::backdrop</code> and no UA centring &mdash; both come from the two
      classes instead.

      This path was described here and never rendered, and it was broken:
      <code>.dialog:not(dialog)</code> weighs (0,1,1) because <code>:not()</code> takes
      its argument's specificity, which beat <code>.dialog-fixed</code> at (0,1,0) in the
      same layer. The panel took <code>position: relative</code>, laid out in flow at the
      end of the body, and a consumer saw the scrim with no panel. Rendering it is the
      only reason anyone would notice.`),
    row(`      <button class="button treat-filled tone-primary interactive control" data-size="md" id="pv-open-fixed">Open a portaled dialog</button>`),
    `    <div class="dialog-overlay" id="pv-overlay" hidden></div>
    <div class="dialog dialog-fixed" data-size="md" data-variant="default" id="pv-fixed" role="dialog" aria-modal="true" aria-labelledby="pv-fixed-title" hidden>
      <div class="dialog-header">
        <span class="dialog-title" id="pv-fixed-title">Portaled dialog</span>
        <span class="dialog-description">Centred by .dialog-fixed, scrimmed by .dialog-overlay. If this appears at the bottom of the page instead, the specificity bug is back.</span>
      </div>
      <div class="dialog-footer">
        <button class="button treat-outline tone-neutral interactive control" data-size="md" id="pv-close-fixed">Close</button>
      </div>
    </div>`,
  ].join(NL)),

  section('A removable filter is a button', [
    lede(`Badges are labels and never targets. A filter chip you can dismiss is one
      control with one intent &mdash; remove this filter &mdash; so it is a button with a
      trailing icon, not a label with a second control buried in it. The earlier split
      version gave one intent two tab stops and two accessible names.`),
    row(`      <button class="button treat-outline tone-neutral interactive control" data-size="md">
        Category: Design
        <span class="icon-slot">${CLOSE_MARK}</span>
      </button>
      <button class="button treat-outline tone-neutral interactive control" data-size="md">
        Status: Open
        <span class="icon-slot">${CLOSE_MARK}</span>
      </button>`),
    lede(`The label form, for comparison. No hover, no focus ring, no target floor.`),
    row(`      <span class="badge treat-filled tone-primary-soft" data-size="md">Design</span>
      <span class="badge treat-outline tone-neutral" data-size="md">Open</span>`),
  ].join(NL)),

  section('Form field', [
    lede(`A label, a control and its helper text as one column. The gap is the only thing
      the class carries &mdash; everything else composes. The second one is a plain
      <code>&lt;select&gt;</code>: the same two classes, no component, and the arrow is the
      UA's because <code>loom.base</code> takes <code>appearance</code> off buttons only.
      It follows the theme through <code>color-scheme</code>.`),
    row(`      <div class="pv-field">
        <div class="form-field">
          <label class="label" data-size="md" for="pv-input">Project name</label>
          <input class="input control" data-size="md" id="pv-input" placeholder="Acme rebrand">
          <span class="helper-text" data-size="md">Shown to everyone with access.</span>
        </div>
      </div>
      <div class="pv-field">
        <div class="form-field">
          <label class="label" data-size="md" for="pv-select">Source</label>
          <select class="input control" data-size="md" id="pv-select">
            <option value="">All sources</option>
            <option value="npr">NPR</option>
            <option value="guardian">The Guardian</option>
          </select>
          <span class="helper-text" data-size="md">A label can label this one.</span>
        </div>
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
    /* The hidden attribute is a UA rule and .dialog sets display: flex, which is an
       author rule — so any element carrying .dialog ignored hidden and rendered
       permanently. The portaled demo below was stuck open from the day it was written.
       Restoring what the attribute promises, scoped to this page: it touches no
       positioning or colour, so it cannot flatter the classes under test. The same trap
       is a consumer's the moment they hide a .dialog div; see docs/gotchas.md. */
    [hidden] { display: none !important; }
    .pv-details { padding: var(--space-3); border: var(--bw-1) solid var(--outline); border-radius: var(--radius-card); }
    .pv-scroll { height: 5rem; overflow-y: auto; padding: var(--space-3); border: var(--bw-1) solid var(--outline); border-radius: var(--radius-card); }`;

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

      var dlg = document.getElementById('pv-dialog');
      document.getElementById('pv-open').addEventListener('click', function () { dlg.showModal(); });
      document.getElementById('pv-close').addEventListener('click', function () { dlg.close(); });

      // The portaled path. The hidden attribute rather than a page-local class, so this
      // adds no CSS and cannot flatter the two classes it exists to check.
      var ov = document.getElementById('pv-overlay');
      var fx = document.getElementById('pv-fixed');
      function showFixed(on) { ov.hidden = !on; fx.hidden = !on; }
      document.getElementById('pv-open-fixed').addEventListener('click', function () { showFixed(true); });
      document.getElementById('pv-close-fixed').addEventListener('click', function () { showFixed(false); });
      ov.addEventListener('click', function () { showFixed(false); });
    })();`;

function generate() {
  const body = [
    section('Ramps', ramps()),
    section('Colour roles', roleGroups()),
    section('Typography', typeStyles()),
    section('Spacing', spacing()),
    section('Radius', row(radius())),
    section('Tone and treatment: badge', [
      lede(`A tone sets four custom properties; a treatment reads them. Independent axes,
        so adding either is one rule rather than a matrix. Badge declares filled and
        outline only, and a badge is a label &mdash; these are not targets and carry no
        height floor.`),
      toneMatrix('badge'),
    ].join(NL)),

    section('Tone and treatment: button', [
      lede(`The same two axes on the component that adds ghost. Ghost should read as text
        with no frame at all: if a border shows here, the UA's own button chrome is coming
        through and the normalization in <code>loom.base</code> is not reaching it. Every
        one of these is a target, so all of them sit on the 44px floor.`),
      toneMatrix('button'),
    ].join(NL)),
    CLASS_STRIP,
  ].join(NL + NL);

  return `<!doctype html>
<!--
  Loom substrate canvas — generated by scripts/code-templates/generate-preview-html.js.
  Regenerate rather than editing.

  One stylesheet, and nothing else underneath. No framework, no build step, no utility
  layer: what renders here is what a consumer gets. main.css imports the three in the
  order the cascade needs, which is the same order a consumer linking them directly has
  to keep.

  Run the generate script first — the stylesheets it links are build output.
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Loom substrate</title>
<link rel="stylesheet" href="../generated/main.css">
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
