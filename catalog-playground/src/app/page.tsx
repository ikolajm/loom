'use client';
import { useState } from 'react';
import { Button } from '@/components/button';
import { Badge } from '@/components/badge';
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

const BUTTON_VARIANTS = ['default', 'secondary', 'destructive', 'success', 'warning', 'ghost', 'outline'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const BADGE_VARIANTS = ['filled', 'outline', 'outline-mono', 'dot'] as const;
const BADGE_STATES = ['default', 'neutral', 'destructive', 'success', 'warning', 'info'] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-outline-subtle rounded-card p-6 space-y-4">
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
        <p className="text-on-surface-variant">Sprint 1 vertical-slice visual confirmation. 6 atoms (toolbar pending registry wire-up).</p>
      </header>

      {/* === BUTTON === */}
      <Section title="Button">
        {BUTTON_VARIANTS.map((v) => (
          <Row key={v} label={`variant: ${v}`}>
            {SIZES.map((s) => (
              <Button key={s} variant={v} size={s}>{s.toUpperCase()}</Button>
            ))}
          </Row>
        ))}
        <Row label="leadingIcon">
          {SIZES.map((s) => <Button key={s} size={s} leadingIcon={<PlusIcon />}>Add item</Button>)}
        </Row>
        <Row label="trailingIcon">
          {SIZES.map((s) => <Button key={s} size={s} trailingIcon={<ArrowIcon />}>Continue</Button>)}
        </Row>
        <Row label="iconOnly">
          {SIZES.map((s) => <Button key={s} size={s} iconOnly><PlusIcon /></Button>)}
        </Row>
        <Row label="loading">
          {SIZES.map((s) => <Button key={s} size={s} loading>Saving</Button>)}
          <Button iconOnly loading><PlusIcon /></Button>
        </Row>
        <Row label="disabled">
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>Disabled</Button>
          <Button variant="ghost" disabled>Disabled</Button>
        </Row>
        <Row label="asChild + Link">
          <Button asChild leadingIcon={<ArrowIcon />}>
            <a href="https://example.com" target="_blank" rel="noreferrer">External link via asChild</a>
          </Button>
        </Row>
      </Section>

      {/* === BADGE === */}
      <Section title="Badge">
        {BADGE_VARIANTS.filter((v) => v !== 'dot').map((v) => (
          <Row key={v} label={`variant: ${v}`}>
            {BADGE_STATES.map((state) => (
              <Badge key={state} variant={v} state={state}>{state}</Badge>
            ))}
          </Row>
        ))}
        <Row label="variant: dot">
          {BADGE_STATES.map((state) => (
            <span key={state} className="inline-flex items-center gap-2">
              <Badge variant="dot" state={state} aria-label={state} />
              <span className="text-on-surface-variant text-sm">{state}</span>
            </span>
          ))}
        </Row>
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
          <Badge onRemove={() => alert('remove')} variant="outline-mono">Tailwind</Badge>
        </Row>
        <Row label="interactive + onRemove">
          <Badge interactive onClick={() => alert('main')} onRemove={() => alert('remove')}>filter+remove</Badge>
        </Row>
      </Section>

      {/* === FAB === */}
      <Section title="FAB">
        <Row label="sizes">
          {SIZES.map((s) => <FAB key={s} size={s} icon={<PlusIcon />} />)}
        </Row>
        <Row label="extended (md/lg only)">
          <FAB size="md" icon={<PlusIcon />} label="Create" />
          <FAB size="lg" icon={<PlusIcon />} label="Create new" />
        </Row>
      </Section>

      {/* === FAB MENU === */}
      <Section title="FabMenu">
        <Row label="closed/open (controlled)">
          <FabMenu
            triggerIcon={<PlusIcon />}
            open={fabMenuOpen}
            onOpenChange={setFabMenuOpen}
          >
            <FabAction icon={<CheckIcon />} label="Save" onClick={() => alert('save')} />
            <FabAction icon={<StarIcon />} label="Favorite" onClick={() => alert('favorite')} />
            <FabAction icon={<ArrowIcon />} label="Share" onClick={() => alert('share')} />
          </FabMenu>
          <span className="text-on-surface-variant text-sm">state: {fabMenuOpen ? 'open' : 'closed'}</span>
        </Row>
        <Row label="sizes">
          {SIZES.map((s) => (
            <FabMenu key={s} size={s} triggerIcon={<PlusIcon />} defaultOpen>
              <FabAction icon={<CheckIcon />} label="A" onClick={() => {}} />
              <FabAction icon={<StarIcon />} onClick={() => {}} />
            </FabMenu>
          ))}
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

      {/* === TOGGLE GROUP === */}
      <Section title="ToggleGroup">
        <p className="text-on-surface-variant text-xs italic">
          Note: segmented/spaced variant template work is pending — current template renders segmented only.
        </p>
        <Row label="segmented (single)">
          <ToggleGroup type="single" value={toggleValue} onValueChange={(v) => v && setToggleValue(v)}>
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="center">Center</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
          <span className="text-on-surface-variant text-sm">value: {toggleValue}</span>
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
              <ToggleGroupItem value="a" size={s}>A</ToggleGroupItem>
              <ToggleGroupItem value="b" size={s}>B</ToggleGroupItem>
              <ToggleGroupItem value="c" size={s}>C</ToggleGroupItem>
            </ToggleGroup>
          ))}
        </Row>
      </Section>
    </main>
  );
}
