'use client';
import { useState } from 'react';
import type { GalleryStory } from './shell';
import { Button } from '@/components/button';
import { Badge } from '@/components/badge';
import { Dot } from '@/components/dot';
import { FAB } from '@/components/fab';
import { FabMenu, FabAction } from '@/components/fab-menu';
import { Toggle } from '@/components/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle-group';

const Plus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>;
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>;
const Arrow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
const Star = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" /></svg>;

const TREATMENTS = ['filled', 'outline', 'ghost'] as const;
const COLORS = ['primary', 'secondary', 'destructive', 'success', 'warning', 'neutral'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const BADGE_STATES = ['default', 'neutral', 'destructive', 'success', 'warning', 'info'] as const;

// Stateful examples are small components so story content stays declarative.
function ToggleExample() {
  const [on, setOn] = useState(false);
  return <Toggle pressed={on} onPressedChange={setOn}>{on ? 'Pressed' : 'Press me'}</Toggle>;
}
function FabMenuExample() {
  const [open, setOpen] = useState(false);
  return (
    <FabMenu triggerIcon={<Plus />} open={open} onOpenChange={setOpen}>
      <FabAction icon={<Check />} label="Save" onClick={() => {}} />
      <FabAction icon={<Star />} label="Favorite" onClick={() => {}} />
      <FabAction icon={<Arrow />} label="Share" onClick={() => {}} />
    </FabMenu>
  );
}
function SegmentedExample() {
  const [v, setV] = useState('left');
  return (
    <ToggleGroup type="single" value={v} onValueChange={(x) => x && setV(x)}>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  );
}

export const STORIES: GalleryStory[] = [
  {
    name: 'Button',
    category: 'Actions',
    description: 'Orthogonal variant (filled/outline/ghost) × color, independent axes via CSS vars.',
    sections: [
      ...TREATMENTS.map((v) => ({
        label: v,
        content: COLORS.map((c) => <Button key={c} variant={v} color={c}>{c}</Button>),
      })),
      { label: 'sizes', content: SIZES.map((s) => <Button key={s} size={s}>{s.toUpperCase()}</Button>) },
      { label: 'leading icon', content: SIZES.map((s) => <Button key={s} size={s} leadingIcon={<Plus />}>Add item</Button>) },
      { label: 'trailing icon', content: SIZES.map((s) => <Button key={s} size={s} trailingIcon={<Arrow />}>Continue</Button>) },
      ...TREATMENTS.map((v) => ({
        label: `iconOnly · ${v}`,
        content: SIZES.map((s) => <Button key={s} size={s} iconOnly variant={v}><Plus /></Button>),
      })),
      { label: 'loading', content: [<Button key="1" loading>Saving</Button>, <Button key="2" loading variant="outline" color="primary">Saving</Button>, <Button key="3" iconOnly loading><Plus /></Button>] },
      { label: 'disabled', content: [<Button key="1" disabled>Disabled</Button>, <Button key="2" variant="outline" color="neutral" disabled>Disabled</Button>, <Button key="3" variant="ghost" disabled>Disabled</Button>] },
      { label: 'asChild (anchor)', content: <Button asChild trailingIcon={<Arrow />}><a href="#">Renders an &lt;a&gt;, styled as a button</a></Button> },
    ],
  },
  {
    name: 'Badge',
    category: 'Actions',
    description: 'Label with severity + interactive/removable modes. filled/outline × state.',
    sections: [
      { label: 'filled', content: BADGE_STATES.map((s) => <Badge key={s} state={s}>{s}</Badge>) },
      { label: 'outline', content: BADGE_STATES.map((s) => <Badge key={s} variant="outline" state={s}>{s}</Badge>) },
      { label: 'sizes', content: SIZES.map((s) => <Badge key={s} size={s}>{s}</Badge>) },
      { label: 'with icons', content: [<Badge key="1" leadingIcon={<Star />}>Featured</Badge>, <Badge key="2" trailingIcon={<Arrow />} state="success">Active</Badge>, <Badge key="3" variant="outline" leadingIcon={<Check />} state="success">Verified</Badge>] },
      { label: 'interactive', content: [<Badge key="1" interactive onClick={() => {}}>Click me</Badge>, <Badge key="2" interactive variant="outline" state="info" onClick={() => {}}>Filter</Badge>] },
      { label: 'onRemove', content: [<Badge key="1" onRemove={() => {}}>React</Badge>, <Badge key="2" onRemove={() => {}} variant="outline" state="destructive">TypeScript</Badge>] },
      { label: 'interactive + onRemove (split hover)', content: [<Badge key="1" interactive onClick={() => {}} onRemove={() => {}}>filter + remove</Badge>, <Badge key="2" interactive variant="outline" state="info" onClick={() => {}} onRemove={() => {}}>split</Badge>] },
    ],
  },
  {
    name: 'Dot',
    category: 'Feedback',
    description: 'Standalone status/severity indicator. Composes into badges, alerts, list items, headings.',
    sections: [
      { label: 'states', content: BADGE_STATES.map((s) => <span key={s} className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--doc-frame-fg)' }}><Dot state={s} />{s}</span>) },
      { label: 'sizes', content: SIZES.map((s) => <Dot key={s} size={s} />) },
      { label: 'composed', content: [<span key="1" className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--doc-frame-fg)' }}><Dot state="success" /> Online</span>, <Badge key="2" state="warning"><Dot state="warning" className="mr-1" />Pending</Badge>] },
    ],
  },
  {
    name: 'FAB',
    category: 'Actions',
    description: 'Floating action button. Condensed scale; extended adds a label at any size.',
    sections: [
      { label: 'sizes', content: SIZES.map((s) => <FAB key={s} size={s} icon={<Plus />} />) },
      { label: 'extended', content: [<FAB key="1" size="sm" icon={<Plus />} label="New" />, <FAB key="2" size="md" icon={<Plus />} label="Create" />, <FAB key="3" size="lg" icon={<Plus />} label="Create new" />] },
    ],
  },
  {
    name: 'FabMenu',
    category: 'Actions',
    description: 'FAB that expands into a vertical action stack (M3 speed-dial). Labels track component radius.',
    sections: [
      { label: 'controlled', content: <FabMenuExample /> },
    ],
  },
  {
    name: 'Toggle',
    category: 'Actions',
    description: 'Two-state pressable. Radius malleable with the site theme.',
    sections: [
      { label: 'single', content: <ToggleExample /> },
      { label: 'sizes', content: SIZES.map((s) => <Toggle key={s} size={s}>{s}</Toggle>) },
      { label: 'with icon', content: <Toggle leadingIcon={<Star />}>Favorite</Toggle> },
    ],
  },
  {
    name: 'ToggleGroup',
    category: 'Actions',
    description: 'Group of toggles — segmented (shared borders) or spaced (gaps + own borders).',
    sections: [
      { label: 'segmented', content: <SegmentedExample /> },
      { label: 'spaced', content: <ToggleGroup variant="spaced" type="single" defaultValue="center"><ToggleGroupItem value="left">Left</ToggleGroupItem><ToggleGroupItem value="center">Center</ToggleGroupItem><ToggleGroupItem value="right">Right</ToggleGroupItem></ToggleGroup> },
      { label: 'multi-select', content: <ToggleGroup type="multiple"><ToggleGroupItem value="bold">Bold</ToggleGroupItem><ToggleGroupItem value="italic">Italic</ToggleGroupItem><ToggleGroupItem value="underline">Underline</ToggleGroupItem></ToggleGroup> },
      { label: 'sizes', content: SIZES.map((s) => <ToggleGroup key={s} type="single" size={s}><ToggleGroupItem value="a">A</ToggleGroupItem><ToggleGroupItem value="b">B</ToggleGroupItem><ToggleGroupItem value="c">C</ToggleGroupItem></ToggleGroup>) },
    ],
  },
];
