'use client';
import { useState } from 'react';
import type { GalleryStory } from './shell';
import { Button } from '@/components/button';
import { Badge } from '@/components/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/select';
import { FormField } from '@/components/form-field';

const Plus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>;
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>;
const Arrow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
const Star = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" /></svg>;

const TREATMENTS = ['filled', 'outline', 'ghost'] as const;
const COLORS = ['primary', 'secondary', 'destructive', 'success', 'warning', 'neutral'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const BADGE_STATES = ['default', 'neutral', 'destructive', 'success', 'warning', 'info'] as const;

// Stateful examples are small components so story content stays declarative.

function SelectExample() {
  const [v, setV] = useState<string>();
  return (
    <Select value={v} onValueChange={setV}>
      <SelectTrigger className="w-48"><SelectValue placeholder="Pick a fruit" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  );
}

// The whole point of the worked-example set: every element here except FormField is a
// class off loom.components.css, not an atom. `.label`, `.input .control` and
// `.helper-text` are what a consumer hand-marks-up, and the error cascade reaches them
// without any per-control wiring.
function FieldCascadeExample({ error }: { error?: boolean }) {
  return (
    <FormField error={error} className="w-72">
      <label className="label" data-size="md" htmlFor="email">Email</label>
      <input
        id="email"
        className="input control"
        data-size="md"
        aria-invalid={error || undefined}
        placeholder="you@example.com"
        defaultValue={error ? 'not-an-email' : ''}
      />
      <span className="helper-text" data-size="md">
        {error ? 'Enter a valid email address.' : 'We never share your email.'}
      </span>
    </FormField>
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
    name: 'Dialog',
    category: 'Layout',
    description: 'Modal dialog with built-in close X (showClose, default true). sm/md/lg/full sizes.',
    sections: [
      { label: 'default (built-in close X)', content: (
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" color="primary">Open dialog</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Dialog title</DialogTitle><DialogDescription>The top-right close X renders by default.</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="ghost" color="neutral">Cancel</Button><Button>Confirm</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      ) },
      { label: 'no close (showClose=false)', content: (
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" color="neutral">Open (no X)</Button></DialogTrigger>
          <DialogContent showClose={false}>
            <DialogHeader><DialogTitle>No close affordance</DialogTitle><DialogDescription>Dismiss via overlay / escape or your own control.</DialogDescription></DialogHeader>
          </DialogContent>
        </Dialog>
      ) },
    ],
  },
  {
    name: 'FormField + cascade',
    category: 'Inputs',
    description: 'Field-row primitive. <FormField error> cascades a red control border + red helper text to the whole field — no per-control wiring. Explicit state on a control still overrides.',
    sections: [
      { label: 'default', content: <FieldCascadeExample /> },
      { label: 'error (border + helper cascade)', content: <FieldCascadeExample error /> },
    ],
  },
  {
    name: 'Select',
    category: 'Inputs',
    description: 'Radix Select with token-styled trigger + content. Error cascades from FormField.',
    sections: [{ label: 'default', content: <SelectExample /> }],
  },
];
