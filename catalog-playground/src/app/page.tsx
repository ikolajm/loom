'use client';
import { useState } from 'react';
import { Button } from '@/components/button';
import { Badge } from '@/components/badge';
import { Dot } from '@/components/dot';
import { FAB } from '@/components/fab';
import { FabMenu, FabAction } from '@/components/fab-menu';
import { Toggle } from '@/components/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle-group';

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
);
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" /></svg>
);

const TREATMENTS = ['filled', 'outline', 'ghost'] as const;
const COLORS = ['primary', 'secondary', 'destructive', 'success', 'warning', 'neutral'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const BADGE_VARIANTS = ['filled', 'outline'] as const;
const BADGE_STATES = ['default', 'neutral', 'destructive', 'success', 'warning', 'info'] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-outline-subtle rounded-component p-6 space-y-4">
      <h2 className="text-on-surface text-xl font-semibold border-b border-outline-subtle pb-2">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2">
      <div className="text-on-surface-variant text-sm w-32 shrink-0 pt-2">{label}</div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function Page() {
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [toggleOn, setToggleOn] = useState(false);
  const [toggleValue, setToggleValue] = useState<string>('left');

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-8">
      <header className="space-y-2 pb-4 border-b border-outline-subtle">
        <h1 className="text-3xl font-bold">Loom Catalog — Buttons Group</h1>
        <p className="text-on-surface-variant">
          v2 orthogonal model: <code>variant</code> × <code>color</code> via CSS vars. Installed via <code>setup.sh</code> from <code>loom-picks.json</code>.
        </p>
      </header>

      {/* === BUTTON — the orthogonal variant × color matrix === */}
      <Section title="Button — variant × color">
        {TREATMENTS.map((v) => (
          <Row key={v} label={`variant: ${v}`}>
            {COLORS.map((c) => (
              <Button key={c} variant={v} color={c}>{c}</Button>
            ))}
          </Row>
        ))}
        <Row label="sizes (filled/primary)">
          {SIZES.map((s) => <Button key={s} size={s}>{s.toUpperCase()}</Button>)}
        </Row>
        <Row label="leadingIcon">
          {SIZES.map((s) => <Button key={s} size={s} leadingIcon={<PlusIcon />}>Add item</Button>)}
        </Row>
        <Row label="trailingIcon">
          {SIZES.map((s) => <Button key={s} size={s} trailingIcon={<ArrowIcon />}>Continue</Button>)}
        </Row>
        {TREATMENTS.map((v) => (
          <Row key={v} label={`iconOnly: ${v}`}>
            {SIZES.map((s) => <Button key={s} size={s} iconOnly variant={v}><PlusIcon /></Button>)}
          </Row>
        ))}
        <Row label="loading">
          <Button loading>Saving</Button>
          <Button loading variant="outline" color="primary">Saving</Button>
          <Button iconOnly loading><PlusIcon /></Button>
        </Row>
        <Row label="disabled">
          <Button disabled>Disabled</Button>
          <Button variant="outline" color="neutral" disabled>Disabled</Button>
          <Button variant="ghost" disabled>Disabled</Button>
        </Row>
        <Row label="asChild (anchor)">
          <Button asChild trailingIcon={<ArrowIcon />}>
            <a href="https://example.com" target="_blank" rel="noreferrer">Renders an &lt;a&gt;, styled as a button</a>
          </Button>
        </Row>
      </Section>

      {/* === BADGE === */}
      <Section title="Badge — variant × state">
        {BADGE_VARIANTS.map((v) => (
          <Row key={v} label={`variant: ${v}`}>
            {BADGE_STATES.map((state) => (
              <Badge key={state} variant={v} state={state}>{state}</Badge>
            ))}
          </Row>
        ))}
        <Row label="sizes">
          {SIZES.map((s) => <Badge key={s} size={s}>{s}</Badge>)}
        </Row>
        <Row label="with icons">
          <Badge leadingIcon={<StarIcon />}>Featured</Badge>
          <Badge trailingIcon={<ArrowIcon />} state="success">Active</Badge>
          <Badge variant="outline" leadingIcon={<CheckIcon />} state="success">Verified</Badge>
        </Row>
        <Row label="interactive">
          <Badge interactive onClick={() => alert('clicked')}>Click me</Badge>
          <Badge interactive variant="outline" state="info" onClick={() => alert('clicked')}>Filter</Badge>
        </Row>
        <Row label="onRemove">
          <Badge onRemove={() => alert('remove')}>React</Badge>
          <Badge onRemove={() => alert('remove')} variant="outline" state="destructive">TypeScript</Badge>
        </Row>
        <Row label="interactive + onRemove">
          <Badge interactive onClick={() => alert('main')} onRemove={() => alert('remove')}>filter + remove</Badge>
          <Badge interactive variant="outline" state="info" onClick={() => alert('main')} onRemove={() => alert('remove')}>split hover</Badge>
        </Row>
      </Section>

      {/* === DOT — standalone status indicator === */}
      <Section title="Dot — standalone status indicator">
        <Row label="states">
          {BADGE_STATES.map((state) => (
            <span key={state} className="inline-flex items-center gap-2">
              <Dot state={state} aria-label={state} />
              <span className="text-on-surface-variant text-sm">{state}</span>
            </span>
          ))}
        </Row>
        <Row label="sizes">
          {SIZES.map((s) => <Dot key={s} size={s} />)}
        </Row>
        <Row label="composed">
          <span className="inline-flex items-center gap-2 text-on-surface"><Dot state="success" /> Online</span>
          <Badge state="warning"><Dot state="warning" className="mr-1" />Pending</Badge>
          <span className="inline-flex items-center gap-2 text-on-surface-variant text-sm"><Dot state="destructive" size="sm" /> in a subheading</span>
        </Row>
      </Section>

      {/* === FAB === */}
      <Section title="FAB">
        <Row label="sizes">
          {SIZES.map((s) => <FAB key={s} size={s} icon={<PlusIcon />} />)}
        </Row>
        <Row label="extended">
          <FAB size="sm" icon={<PlusIcon />} label="New" />
          <FAB size="md" icon={<PlusIcon />} label="Create" />
          <FAB size="lg" icon={<PlusIcon />} label="Create new" />
        </Row>
      </Section>

      {/* === FAB MENU === */}
      <Section title="FabMenu">
        <Row label="closed/open (controlled)">
          <FabMenu triggerIcon={<PlusIcon />} open={fabMenuOpen} onOpenChange={setFabMenuOpen}>
            <FabAction icon={<CheckIcon />} label="Save" onClick={() => alert('save')} />
            <FabAction icon={<StarIcon />} label="Favorite" onClick={() => alert('favorite')} />
            <FabAction icon={<ArrowIcon />} label="Share" onClick={() => alert('share')} />
          </FabMenu>
          <span className="text-on-surface-variant text-sm">state: {fabMenuOpen ? 'open' : 'closed'}</span>
        </Row>
      </Section>

      {/* === TOGGLE === */}
      <Section title="Toggle">
        <Row label="single (controlled)">
          <Toggle pressed={toggleOn} onPressedChange={setToggleOn}>
            {toggleOn ? 'Pressed' : 'Press me'}
          </Toggle>
        </Row>
        <Row label="sizes">
          {SIZES.map((s) => <Toggle key={s} size={s}>{s}</Toggle>)}
        </Row>
        <Row label="with icon">
          <Toggle leadingIcon={<StarIcon />}>Favorite</Toggle>
        </Row>
      </Section>

      {/* === TOGGLE GROUP — segmented + spaced === */}
      <Section title="ToggleGroup — segmented + spaced">
        <Row label="segmented (single)">
          <ToggleGroup type="single" value={toggleValue} onValueChange={(v) => v && setToggleValue(v)}>
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="center">Center</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
          <span className="text-on-surface-variant text-sm">value: {toggleValue}</span>
        </Row>
        <Row label="spaced (single)">
          <ToggleGroup variant="spaced" type="single" defaultValue="center">
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="center">Center</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row label="multi-select">
          <ToggleGroup type="multiple">
            <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
            <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
            <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row label="sizes">
          {SIZES.map((s) => (
            <ToggleGroup key={s} type="single" size={s}>
              <ToggleGroupItem value="a">A</ToggleGroupItem>
              <ToggleGroupItem value="b">B</ToggleGroupItem>
              <ToggleGroupItem value="c">C</ToggleGroupItem>
            </ToggleGroup>
          ))}
        </Row>
      </Section>
    </main>
  );
}
