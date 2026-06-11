'use client';

/**
 * Loom foundation preview — a token-landing check, not a component gallery.
 *
 * Renders the design substrate (color roles, type scale, spacing, radius)
 * through the same Tailwind utilities the atoms consume — so if this page looks
 * right, your tokens.css → @theme wiring is working in your build. It imports no
 * atoms; browse component APIs in the Loom catalog-playground.
 *
 * Class names are written out in full on purpose: Tailwind v4 scans source for
 * literal class strings, so template-built names (`bg-${role}`) would silently
 * no-op. Keep them literal if you extend this page.
 *
 * This file is yours — delete the route (src/app/preview/) once you've confirmed
 * your brand landed. init.sh scaffolds it once and never overwrites it.
 */

import { useTheme } from '@/components/providers/ThemeProvider';

const COLOR_GROUPS: { label: string; roles: { name: string; className: string }[] }[] = [
  {
    label: 'Primary',
    roles: [
      { name: 'primary', className: 'bg-primary text-on-primary' },
      { name: 'primary-container', className: 'bg-primary-container text-on-primary-container' },
    ],
  },
  {
    label: 'Secondary',
    roles: [
      { name: 'secondary', className: 'bg-secondary text-on-secondary' },
      { name: 'secondary-container', className: 'bg-secondary-container text-on-secondary-container' },
    ],
  },
  {
    label: 'Neutral',
    roles: [
      { name: 'neutral', className: 'bg-neutral text-on-neutral' },
      { name: 'neutral-container', className: 'bg-neutral-container text-on-neutral-container' },
    ],
  },
  {
    label: 'Surfaces',
    roles: [
      { name: 'surface', className: 'bg-surface text-on-surface' },
      { name: 'surface-1', className: 'bg-surface-1 text-on-surface' },
      { name: 'surface-2', className: 'bg-surface-2 text-on-surface' },
      { name: 'surface-3', className: 'bg-surface-3 text-on-surface' },
    ],
  },
  {
    label: 'Semantic',
    roles: [
      { name: 'error', className: 'bg-error text-on-error' },
      { name: 'success', className: 'bg-success text-on-success' },
      { name: 'warning', className: 'bg-warning text-on-warning' },
      { name: 'info', className: 'bg-info text-on-info' },
    ],
  },
];

const TYPE_STYLES = [
  { name: 'display-lg', className: 'text-display-lg' },
  { name: 'display-md', className: 'text-display-md' },
  { name: 'display-sm', className: 'text-display-sm' },
  { name: 'title-lg', className: 'text-title-lg' },
  { name: 'title-md', className: 'text-title-md' },
  { name: 'title-sm', className: 'text-title-sm' },
  { name: 'body-lg', className: 'text-body-lg' },
  { name: 'body-md', className: 'text-body-md' },
  { name: 'body-sm', className: 'text-body-sm' },
  { name: 'action-md', className: 'text-action-md' },
  { name: 'label-md', className: 'text-label-md' },
];

// Width comes from the raw CSS var (inline style) — no Tailwind class needed.
const SPACING = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '24'];

const RADIUS = [
  { name: 'component', className: 'rounded-component' },
  { name: 'input', className: 'rounded-input' },
  { name: 'card', className: 'rounded-card' },
  { name: 'modal', className: 'rounded-modal' },
  { name: 'pill', className: 'rounded-pill' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title-md text-on-surface-variant">{title}</h2>
      {children}
    </section>
  );
}

export default function PreviewPage() {
  const { resolved, setTheme } = useTheme();

  return (
    <main className="min-h-screen bg-surface text-on-surface px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-display-sm">Loom foundation</h1>
            <p className="text-body-sm text-on-surface-variant">
              Token-landing check — delete <code>src/app/preview/</code> when your brand is confirmed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
            className="interactive rounded-pill border border-outline bg-surface-1 px-4 py-2 text-action-md text-on-surface"
          >
            Theme: {resolved}
          </button>
        </header>

        <Section title="Color roles">
          <div className="flex flex-col gap-6">
            {COLOR_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <span className="text-label-md text-on-surface-variant">{group.label}</span>
                <div className="flex flex-wrap gap-3">
                  {group.roles.map((role) => (
                    <div
                      key={role.name}
                      className={`${role.className} flex h-20 w-40 flex-col justify-end rounded-card border border-outline-subtle p-3`}
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
                <div className="h-4 rounded-1 bg-primary" style={{ width: `var(--space-${step})` }} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Radius">
          <div className="flex flex-wrap gap-4">
            {RADIUS.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div className={`${r.className} h-20 w-20 bg-surface-2 border border-outline`} />
                <span className="text-label-sm text-on-surface-variant">{r.name}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
