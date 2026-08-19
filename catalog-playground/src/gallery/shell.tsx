'use client';
import { useState } from 'react';
import { Button } from '@/components/button';

/**
 * Dev gallery shell — renders the presentation/ blocks (frame / header / variant-section) in code,
 * against the --doc-* vars derived from presentation/layout.json. The chrome is hand-marked-up on
 * `.sidebar` / `.sidebar-item` from loom.components.css rather than on a Sidebar atom, which is the
 * point: the catalog is a worked-example set now, and its own shell is built the way a consumer
 * builds. One data-theme on the root swaps the doc frame chrome (doc-layout.css) AND every component
 * token (tokens.css) in lockstep.
 * Gallery-first: static variant grids; interactive-preview controls are a later increment.
 */

export type GalleryStory = {
  name: string;
  category: string;
  description?: string;
  sections: { label: string; content: React.ReactNode }[];
};

/** A neutral documentation frame — one component's full display. Mode comes from the root data-theme. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="flex flex-col w-fit border"
      style={{
        background: 'var(--doc-frame-bg)',
        color: 'var(--doc-frame-fg)',
        borderColor: 'var(--doc-outline)',
        padding: 'var(--doc-frame-padding)',
        borderRadius: 'var(--doc-frame-radius)',
        gap: 'var(--doc-section-gap)',
        minWidth: 'var(--doc-frame-min-width)',
      }}
    >
      {children}
    </section>
  );
}

/** Frame title + description (header block, lg). Type from the product type scale (text-* classes). */
function Header({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--doc-description-gap)' }}>
      <h1 className="text-title-lg">{title}</h1>
      {description && (
        <p className="text-body-sm" style={{ color: 'var(--doc-frame-fg-muted)', maxWidth: '60ch' }}>
          {description}
        </p>
      )}
    </div>
  );
}

/** A labeled group of variant instances (variant-section block). */
function VariantSection({ label, content }: { label: string; content: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--doc-label-gap)' }}>
      <div className="text-label-sm font-semibold uppercase" style={{ color: 'var(--doc-frame-fg-muted)' }}>
        {label}
      </div>
      <div className="flex flex-wrap items-center" style={{ gap: 'var(--doc-component-gap)' }}>
        {content}
      </div>
    </div>
  );
}

/** The browse shell: the sidebar classes, hand-marked-up, + the active frame. */
export function Gallery({ stories }: { stories: GalleryStory[] }) {
  const [active, setActive] = useState(0);
  // Default to the product's own mode so the catalog opens on "their system at a glance".
  // TODO: derive default from the product default-mode (emit it from the doc-layout generator).
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const story = stories[active];

  const byCategory = stories.reduce<Record<string, { story: GalleryStory; index: number }[]>>((acc, s, index) => {
    (acc[s.category] ||= []).push({ story: s, index });
    return acc;
  }, {});

  return (
    <div data-theme={mode} className="flex min-h-screen" style={{ background: 'var(--doc-page-bg)' }}>
      {/* The sidebar classes, marked up by hand — no atom involved. */}
      <nav
        className="sidebar shrink-0 sticky top-0 h-screen overflow-y-auto py-6 gap-6"
        data-size="sm"
        data-variant="default"
      >
        <div className="px-2 flex flex-col gap-3">
          <div className="text-sm font-semibold text-on-surface">Loom Catalog</div>
          <p className="text-label-sm text-on-surface-variant leading-snug">
            Rendering the example token set — your brand&apos;s tokens will differ.
          </p>
          <div className="flex self-start gap-1">
            {(['light', 'dark'] as const).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? 'filled' : 'ghost'}
                color={mode === m ? 'primary' : 'neutral'}
                onClick={() => setMode(m)}
              >
                {m === 'light' ? 'Light' : 'Dark'}
              </Button>
            ))}
          </div>
        </div>
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category} className="flex flex-col gap-0.5">
            <div className="px-2 pb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              {category}
            </div>
            {items.map(({ story: s, index }) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setActive(index)}
                aria-current={index === active || undefined}
                className="sidebar-item interactive control w-full rounded-component text-left aria-[current]:bg-primary-container aria-[current]:text-on-primary-container"
              >
                {s.name}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Canvas */}
      <main className="flex-1 overflow-y-auto p-10">
        <Frame>
          <Header title={story.name} description={story.description} />
          {story.sections.map((sec) => (
            <VariantSection key={sec.label} label={sec.label} content={sec.content} />
          ))}
        </Frame>
      </main>
    </div>
  );
}
