/**
 * Generates preview-page.tsx — the substrate canvas.
 *
 * Two halves, deliberately produced differently.
 *
 * The **token half** (ramps, roles, type, spacing, radius) is generated from the configs,
 * because it is a list that must not drift: a hand-written page listing eleven type roles
 * silently stops being true the day a twelfth is added, and nothing fails. Generated, the
 * page cannot disagree with the tokens it exists to verify.
 *
 * The **class strip** is hand-written below. It is prose as much as markup — the shortest
 * honest answer to "how do I use this without React", and the only place the composition
 * rules (tone sets, treatment reads, `.control` carries state) are shown rather than
 * described. Generating it would produce an exhaustive matrix nobody reads.
 *
 * One constraint governs both: Tailwind v4 scans source for literal class strings, so a
 * name built at runtime (`bg-${role}`) silently resolves to nothing. Every class here is
 * emitted as a literal for that reason — which generation preserves, since the generator
 * writes the literal into the file.
 */
const { loadConfig: load } = require('../config-paths');

const colors = load('base/colors.json');
const typography = load('base/typography.json');
const standards = load('standards.json');

const RAMP_FAMILIES = ['primary', 'secondary', 'accent', 'neutral', 'error', 'success', 'warning', 'info'];

// Roles a consumer can actually check by eye: a fill with its own on-color.
const ROLE_GROUPS = [
  ['Primary', [['primary', 'on-primary'], ['primary-container', 'on-primary-container']]],
  ['Secondary', [['secondary', 'on-secondary'], ['secondary-container', 'on-secondary-container']]],
  ['Neutral', [['neutral', 'on-neutral'], ['neutral-container', 'on-neutral-container']]],
  ['Surfaces', [['surface', 'on-surface'], ['surface-1', 'on-surface'], ['surface-2', 'on-surface'], ['surface-3', 'on-surface']]],
  ['Semantic', [['error', 'on-error'], ['success', 'on-success'], ['warning', 'on-warning'], ['info', 'on-info']]],
];

function ramps() {
  const rows = RAMP_FAMILIES.filter((f) => colors.palette[f]).map((f) => {
    const shades = Object.keys(colors.palette[f]);
    const swatches = shades
      .map((s) => `        { shade: '${s}', value: 'var(--color-${f}-${s})' },`)
      .join('\n');
    return `  {\n    family: '${f}',\n    shades: [\n${swatches}\n    ],\n  },`;
  });
  return `const RAMPS: { family: string; shades: { shade: string; value: string }[] }[] = [\n${rows.join('\n')}\n];`;
}

function roleGroups() {
  const groups = ROLE_GROUPS.map(([label, pairs]) => {
    const roles = pairs
      .map(([bg, fg]) => `      { name: '${bg}', className: 'bg-${bg} text-${fg}' },`)
      .join('\n');
    return `  {\n    label: '${label}',\n    roles: [\n${roles}\n    ],\n  },`;
  });
  return `const COLOR_GROUPS: { label: string; roles: { name: string; className: string }[] }[] = [\n${groups.join('\n')}\n];`;
}

function typeStyles() {
  const rows = [];
  for (const family of Object.keys(typography.textStyles)) {
    for (const tier of ['lg', 'md', 'sm']) {
      if (!typography.textStyles[family][tier]) continue;
      rows.push(`  { name: '${family}-${tier}', className: 'text-${family}-${tier}' },`);
    }
  }
  return `const TYPE_STYLES = [\n${rows.join('\n')}\n];`;
}

function spacing() {
  const steps = Object.keys(standards.spacing.scale).filter((s) => s !== '0');
  return `const SPACING = [${steps.map((s) => `'${s}'`).join(', ')}];`;
}

function radius() {
  const names = Object.keys(load('base/sizing.json')['border-radius'] || {});
  const rows = names.map((n) => `  { name: '${n}', className: 'rounded-${n}' },`);
  return `const RADIUS = [\n${rows.join('\n')}\n];`;
}

// --- The hand-written half ---------------------------------------------------
// Shown, not listed. Each block is the smallest markup that proves one rule.
const CLASS_STRIP = `
      <Section title="Tone × treatment">
        <p className="text-body-sm text-on-surface-variant">
          A tone sets four custom properties; a treatment reads them. Independent axes —
          adding either is one rule, not a matrix.
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="badge treat-filled tone-primary-soft" data-size="md">filled · primary-soft</span>
          <span className="badge treat-filled tone-error-soft" data-size="md">filled · error-soft</span>
          <span className="badge treat-outline tone-success" data-size="md">outline · success</span>
          <span className="badge treat-outline tone-neutral" data-size="md">outline · neutral</span>
        </div>
      </Section>

      <Section title="Surface × elevation">
        <p className="text-body-sm text-on-surface-variant">
          Which plane, and how far off it. Separate classes because the two vary
          independently. Elevation renders as nothing when shadowDepth is flat.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="card surface-1 elevate-1" data-size="md">surface-1 · elevate-1</div>
          <div className="card surface-2 elevate-2" data-size="md">surface-2 · elevate-2</div>
          <div className="card surface-3 elevate-3" data-size="md">surface-3 · elevate-3</div>
        </div>
      </Section>

      <Section title="Control states">
        <p className="text-body-sm text-on-surface-variant">
          Focus, validity and disabled come from one class. Validity keys off
          <code> aria-invalid</code>, so styling cannot drift from what a screen reader reads.
        </p>
        {/* Each field is boxed by its wrapper, not by itself: .input is width:100%, the
            way the atom it replaced was, so a bare row of them would stack. */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56"><input className="input control" data-size="md" placeholder="focus me" /></div>
          <div className="w-56"><input className="input control" data-size="md" aria-invalid defaultValue="invalid" /></div>
          <div className="w-56"><input className="input control" data-size="md" disabled defaultValue="disabled" /></div>
        </div>
      </Section>

      <Section title="Sizes">
        <p className="text-body-sm text-on-surface-variant">
          Every component class ramps on <code>data-size</code>. Padding, radius and the
          type role move together, so a tier cannot disagree with itself.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge treat-filled tone-primary-soft" data-size="sm">sm</span>
          <span className="badge treat-filled tone-primary-soft" data-size="md">md</span>
          <span className="badge treat-filled tone-primary-soft" data-size="lg">lg</span>
        </div>
      </Section>

      <Section title="Table">
        <p className="text-body-sm text-on-surface-variant">
          Ruled, not framed — add a border yourself rather than removing one. Rows shade on
          hover; the header repeats across pages in print.
        </p>
        <table className="table" data-size="md">
          <thead>
            <tr><th>Role</th><th>Carries</th></tr>
          </thead>
          <tbody>
            <tr><td>tokens.css</td><td>values</td></tr>
            <tr><td>loom.css</td><td>what you compose with</td></tr>
            <tr><td>loom.components.css</td><td>what they compose into</td></tr>
          </tbody>
        </table>
      </Section>
`;

function generate() {
  return `'use client';

/**
 * Loom substrate canvas — generated. Regenerate rather than editing.
 *
 * The top half is your token set rendered through the same utilities your code uses: if
 * it looks right, the tokens.css -> @theme wiring is working in your build. The bottom
 * half is the class layer, which is also its documentation — the markup shown is the
 * markup you write, in React or a template or anything else that emits HTML.
 *
 * Delete src/app/preview/ once your brand has landed.
 */

import { useState } from 'react';

${ramps()}

${roleGroups()}

${typeStyles()}

${spacing()}

${radius()}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title-md text-on-surface-variant">{title}</h2>
      {children}
    </section>
  );
}

export default function PreviewPage() {
  // Theme is local to this page rather than read from a provider. The page is for
  // inspecting a substrate, not for driving the app, and keeping it self-contained means
  // it mounts anywhere that renders React with no provider wired up.
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  return (
    <main data-theme={mode} className="min-h-screen bg-surface text-on-surface px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-display-sm">Loom substrate</h1>
            <p className="text-body-sm text-on-surface-variant">
              Tokens above, the class layer below. Delete <code>src/app/preview/</code> when your brand is confirmed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className="interactive control rounded-pill border border-outline bg-surface-1 px-4 py-2 text-action-md text-on-surface"
          >
            Theme: {mode}
          </button>
        </header>

        <Section title="Ramps">
          <div className="flex flex-col gap-3">
            {RAMPS.map((r) => (
              <div key={r.family} className="flex flex-col gap-1">
                <span className="text-label-sm text-on-surface-variant">{r.family}</span>
                <div className="flex flex-wrap">
                  {r.shades.map((s) => (
                    <div key={s.shade} className="flex h-10 w-14 items-end justify-center pb-1" style={{ backgroundColor: s.value }}>
                      <span className="text-label-sm mix-blend-difference text-white">{s.shade}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Color roles">
          <div className="flex flex-col gap-6">
            {COLOR_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <span className="text-label-md text-on-surface-variant">{group.label}</span>
                <div className="flex flex-wrap gap-3">
                  {group.roles.map((role) => (
                    <div
                      key={role.name}
                      className={\`\${role.className} flex h-20 w-40 flex-col justify-end rounded-card border border-outline-subtle p-3\`}
                    >
                      <span className="text-label-sm">{role.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="flex flex-col gap-3">
            {TYPE_STYLES.map((style) => (
              <div key={style.name} className="flex items-baseline gap-4">
                <span className="w-28 shrink-0 text-label-sm text-on-surface-variant">{style.name}</span>
                <span className={style.className}>The quick brown fox</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Spacing">
          <div className="flex flex-col gap-2">
            {SPACING.map((step) => (
              <div key={step} className="flex items-center gap-4">
                <span className="w-12 shrink-0 text-label-sm text-on-surface-variant">{step}</span>
                <div className="h-4 rounded-1 bg-primary" style={{ width: \`var(--space-\${step})\` }} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Radius">
          <div className="flex flex-wrap gap-4">
            {RADIUS.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div className={\`\${r.className} h-20 w-20 bg-surface-2 border border-outline\`} />
                <span className="text-label-sm text-on-surface-variant">{r.name}</span>
              </div>
            ))}
          </div>
        </Section>
${CLASS_STRIP}
      </div>
    </main>
  );
}
`;
}

module.exports = { generate };
