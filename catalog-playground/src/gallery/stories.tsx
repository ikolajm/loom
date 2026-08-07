'use client';
import { useEffect, useRef, useState } from 'react';
import type { GalleryStory } from './shell';
import { Button } from '@/components/button';
import { Badge } from '@/components/badge';
import { Dot } from '@/components/dot';
import { Banner } from '@/components/banner';
import { FAB } from '@/components/fab';
import { FabMenu, FabAction } from '@/components/fab-menu';
import { Toggle } from '@/components/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle-group';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/dialog';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/sheet';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/alert-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/table';
import { Separator } from '@/components/separator';
import { Toolbar } from '@/components/toolbar';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/select';
import { Checkbox } from '@/components/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/radio';
import { Switch } from '@/components/switch';
import { Slider } from '@/components/slider';
import { Combobox } from '@/components/combobox';
import { DatePicker } from '@/components/date-picker';
import { Calendar } from '@/components/calendar';
import { InputOTP } from '@/components/input-otp';
import { Label } from '@/components/label';
import { HelperText } from '@/components/helper-text';
import { FormField } from '@/components/form-field';
import { FileUpload, FileUploadItem } from '@/components/file-upload';
import { Rating } from '@/components/rating';
import { TimePicker, type TimeValue } from '@/components/time-picker';
import { SearchBar } from '@/components/search-bar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/avatar';
import { AvatarGroup } from '@/components/avatar-group';
import { ListItem } from '@/components/list-item';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/accordion';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/collapsible';
import { Kbd } from '@/components/kbd';
import { NumberDisplay } from '@/components/number';
import { RelativeTime } from '@/components/relative-time';
import { TopBar } from '@/components/top-bar';
import { Sidebar, SidebarItem } from '@/components/sidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/tabs';
import { BottomNav, BottomNavItem } from '@/components/bottom-nav';
import { Breadcrumbs, BreadcrumbItem, BreadcrumbSeparator } from '@/components/breadcrumbs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/pagination';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from '@/components/navigation-menu';
import { CommandPalette, CommandPaletteInput, CommandPaletteList, CommandPaletteEmpty, CommandPaletteGroup, CommandPaletteItem, CommandPaletteSeparator, CommandPaletteShortcut } from '@/components/command-palette';
import { Stepper, Step } from '@/components/stepper';
import { Carousel } from '@/components/carousel';
import { TreeView, type TreeNodeData } from '@/components/tree-view';
import { Reveal } from '@/components/reveal';
import { Stagger } from '@/components/stagger';
import { CountUp } from '@/components/count-up';
import { ScrollProgress } from '@/components/scroll-progress';
import { Home, BarChart3, Users, Settings, Bell, Menu, ChevronRight } from 'lucide-react';

const Plus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>;
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>;
const Arrow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
const Star = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" /></svg>;

// Inline so the gallery never reaches the network for a demo asset.
const SAMPLE_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' fill='%234b5563'/><circle cx='20' cy='15' r='7' fill='%239ca3af'/><path d='M6 40c0-8 6-13 14-13s14 5 14 13z' fill='%239ca3af'/></svg>";

const TREATMENTS = ['filled', 'outline', 'ghost'] as const;
const COLORS = ['primary', 'secondary', 'destructive', 'success', 'warning', 'neutral'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const BADGE_STATES = ['default', 'neutral', 'destructive', 'success', 'warning', 'info'] as const;

const treeSample: TreeNodeData[] = [
  { id: 'src', label: 'src', children: [
    { id: 'components', label: 'components', children: [
      { id: 'button', label: 'button.tsx' },
      { id: 'card', label: 'card.tsx' },
    ] },
    { id: 'index', label: 'index.ts' },
  ] },
  { id: 'readme', label: 'README.md' },
];

// Stateful examples are small components so story content stays declarative.

// Relative to now, computed after mount. These were absolute dates and went wrong
// within weeks — "future" rendered "2 months ago" — so the story made a working atom
// look broken. Module scope would not work either: the server and client would each
// call Date.now() and disagree on the <time dateTime> attribute, which is exactly the
// hydration mismatch RelativeTime is built to avoid.
function RelativeTimeExample({ offsetMs, numeric }: { offsetMs: number; numeric?: 'auto' | 'always' }) {
  const [date, setDate] = useState<Date | null>(null);
  useEffect(() => {
    setDate(new Date(Date.now() + offsetMs));
  }, [offsetMs]);
  if (!date) return <time className="text-on-surface-variant">&mdash;</time>;
  return <RelativeTime date={date} numeric={numeric} />;
}

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
function BannerDismissExample() {
  const [show, setShow] = useState(true);
  return show
    ? <div className="w-[460px]"><Banner variant="success" onDismiss={() => setShow(false)}>Saved. Click the × to dismiss.</Banner></div>
    : <Button size="sm" variant="outline" color="neutral" onClick={() => setShow(true)}>Restore banner</Button>;
}

// --- Forms stateful examples ---
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
function CheckboxExample() {
  const [on, setOn] = useState(true);
  return <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--doc-frame-fg)' }}><Checkbox checked={on} onCheckedChange={(c) => setOn(!!c)} /> Subscribe</label>;
}
function RadioExample() {
  return (
    <RadioGroup defaultValue="standard" className="flex-row gap-4">
      {['standard', 'express', 'overnight'].map((v) => (
        <label key={v} className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--doc-frame-fg)' }}><RadioGroupItem value={v} /> {v}</label>
      ))}
    </RadioGroup>
  );
}
function SwitchExample() {
  const [on, setOn] = useState(false);
  return <Switch checked={on} onCheckedChange={setOn} />;
}
function SliderExample() {
  const [v, setV] = useState([40]);
  return <div className="w-64"><Slider value={v} onValueChange={setV} max={100} step={1} /></div>;
}
function ComboboxExample() {
  const [v, setV] = useState('');
  return <div className="w-64"><Combobox value={v} onValueChange={setV} options={[{ value: 'next', label: 'Next.js' }, { value: 'remix', label: 'Remix' }, { value: 'astro', label: 'Astro' }]} placeholder="Pick a framework" /></div>;
}
function DatePickerExample() {
  const [d, setD] = useState<Date>();
  return <div className="w-56"><DatePicker value={d} onValueChange={setD} /></div>;
}
function OTPExample() {
  const [v, setV] = useState('');
  return <InputOTP value={v} onValueChange={setV} length={6} />;
}
function RatingExample({ allowHalf }: { allowHalf?: boolean }) {
  const [v, setV] = useState(allowHalf ? 2.5 : 3);
  return <Rating value={v} onValueChange={setV} allowHalf={allowHalf} />;
}
function TimePickerExample() {
  const [t, setT] = useState<TimeValue>({ hour: 9, minute: 30, period: 'AM' });
  return <TimePicker value={t} onValueChange={setT} />;
}
// The error-cascade headline: one <FormField error> reddens the control border + helper text.
function FieldCascadeExample({ error }: { error?: boolean }) {
  return (
    <FormField error={error} className="w-72">
      <Label htmlFor="email">Email</Label>
      <Input id="email" placeholder="you@example.com" defaultValue={error ? 'not-an-email' : ''} />
      <HelperText>{error ? 'Enter a valid email address.' : 'We never share your email.'}</HelperText>
    </FormField>
  );
}

// Motion atoms can't show in a static frame — they reveal on mount and sit still. The Replay button
// remounts every Reveal (key bump) so the enter transition re-runs on demand for visual-confirm.
function RevealDemo() {
  const [k, setK] = useState(0);
  const box = (label: string, tone = 'bg-surface-1 text-on-surface') => (
    <div className={`flex h-16 w-28 items-center justify-center rounded-card ${tone} text-body-md`}>{label}</div>
  );
  const variants = ['fade', 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'scale'] as const;
  const easings = ['decelerate', 'spring-smooth', 'spring-snappy', 'spring-bounce'] as const;
  return (
    <div className="flex flex-col gap-5">
      <Button variant="filled" size="sm" className="w-fit" onClick={() => setK((n) => n + 1)}>Replay</Button>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm text-on-surface">variants</span>
        <div className="flex flex-wrap gap-3">
          {variants.map((v) => (
            <Reveal key={`${v}-${k}`} variant={v}>{box(v)}</Reveal>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm text-on-surface">easing · bezier vs spring presets</span>
        <div className="flex flex-wrap gap-3">
          {easings.map((e) => (
            <Reveal key={`${e}-${k}`} variant="fade-up" easing={e}>{box(e, 'bg-primary-container text-on-primary-container')}</Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stagger cascades its children in. Replay remounts the whole group so the cascade re-runs.
function StaggerDemo() {
  const [k, setK] = useState(0);
  return (
    <div className="flex flex-col gap-5">
      <Button variant="filled" size="sm" className="w-fit" onClick={() => setK((n) => n + 1)}>Replay</Button>
      <Stagger key={k} className="flex flex-wrap gap-3" step={90}>
        {['One', 'Two', 'Three', 'Four', 'Five'].map((label) => (
          <div key={label} className="flex h-16 w-28 items-center justify-center rounded-card bg-surface-1 text-on-surface text-body-md">{label}</div>
        ))}
      </Stagger>
    </div>
  );
}

// CountUp animates on in-view. In the always-visible gallery it counts on mount; Replay remounts
// the group (key bump) to re-run. Shows formatting forwarded to NumberDisplay (separators, currency, percent).
function CountUpDemo() {
  const [k, setK] = useState(0);
  const stat = (node: React.ReactNode, label: string) => (
    <div className="flex flex-col gap-1">
      <span className="text-title-lg text-on-surface">{node}</span>
      <span className="text-body-sm text-on-surface">{label}</span>
    </div>
  );
  return (
    <div className="flex flex-col gap-5">
      <Button variant="filled" size="sm" className="w-fit" onClick={() => setK((n) => n + 1)}>Replay</Button>
      <div key={k} className="flex flex-wrap gap-10">
        {stat(<CountUp value={147} />, 'Clients')}
        {stat(<CountUp value={45200} format="currency" currency="USD" />, 'Revenue')}
        {stat(<CountUp value={0.92} format="percent" decimals={0} />, 'Growth')}
        {stat(<CountUp value={4.8} />, 'Rating')}
      </div>
    </div>
  );
}

// ScrollProgress binds to scroll position. Demoed against a self-contained scroll container (target)
// so it doesn't hijack the page scrollbar — the inline bar above the box fills as you scroll inside.
function ScrollProgressDemo() {
  const boxRef = useRef<HTMLDivElement>(null);
  return (
    <div className="w-[360px]">
      <ScrollProgress target={boxRef} position="inline" showTrack className="rounded-full" />
      <div ref={boxRef} className="mt-2 h-48 overflow-y-auto rounded-card border border-outline-subtle p-4">
        <div className="flex flex-col gap-3 text-body-md text-on-surface">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i}>Paragraph {i + 1} — scroll this container to drive the progress bar above. The bar reflects scroll position directly; no autonomous animation.</p>
          ))}
        </div>
      </div>
    </div>
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
    name: 'Banner',
    category: 'Feedback',
    description: 'Inline status/severity strip (consolidates the old alert). Severity variant × size, optional leading icon, action slot, stateless dismiss.',
    sections: [
      { label: 'variants', content: (['info', 'success', 'warning', 'error'] as const).map((v) => <div key={v} className="w-[460px]"><Banner variant={v}>This is a {v} banner.</Banner></div>) },
      { label: 'sizes', content: SIZES.map((s) => <div key={s} className="w-[460px]"><Banner size={s}>Banner at {s} size.</Banner></div>) },
      { label: 'leading icon', content: <div className="w-[460px]"><Banner variant="info" leadingIcon={<Star />}>Heads up — a new version is available.</Banner></div> },
      { label: 'action slot', content: <div className="w-[460px]"><Banner variant="warning" leadingIcon={<Star />} action={<Button size="sm" variant="outline" color="neutral">Review</Button>}>Your trial ends in 3 days.</Banner></div> },
      { label: 'dismissible', content: <BannerDismissExample /> },
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
  {
    name: 'Card',
    category: 'Layout',
    description: 'Surface container. variant (default/elevated/outline/flush) × size. flush sits level with the surface — no chrome — and takes borders/padding back when a use needs them.',
    sections: [
      { label: 'variants', content: (['default', 'elevated', 'outline', 'flush'] as const).map((v) => (
        <Card key={v} variant={v} className="w-52">
          <CardHeader><CardTitle>{v}</CardTitle><CardDescription>Card description text.</CardDescription></CardHeader>
          <CardContent className="text-sm">Body content goes here.</CardContent>
        </Card>
      )) },
      { label: 'sizes', content: (['sm', 'md', 'lg'] as const).map((s) => (
        <Card key={s} size={s} variant="outline" className="w-40"><CardContent className="text-sm">size={s}</CardContent></Card>
      )) },
      { label: 'flush + override (borders / edge-to-edge media)', content: (
        <Card variant="flush" className="w-52 border border-outline p-0 overflow-hidden">
          <div className="h-20 w-full bg-primary" />
          <CardContent className="px-4 py-3 text-sm">Flush card, given a border + edge-to-edge media via className.</CardContent>
        </Card>
      ) },
    ],
  },
  {
    name: 'Toolbar',
    category: 'Layout',
    description: 'Horizontal container for grouped actions — buttons, toggles, separators. Sizes to content.',
    sections: [
      { label: 'default', content: (
        <Toolbar className="w-fit">
          <Button variant="ghost" color="neutral" size="sm" iconOnly><Star /></Button>
          <Button variant="ghost" color="neutral" size="sm">Bold</Button>
          <Button variant="ghost" color="neutral" size="sm">Italic</Button>
          <Separator orientation="vertical" className="h-6" />
          <Toggle size="sm">Wrap</Toggle>
        </Toolbar>
      ) },
      { label: 'sizes', content: SIZES.map((s) => (
        <Toolbar key={s} size={s} className="w-fit"><Button variant="ghost" color="neutral" size="sm">A</Button><Button variant="ghost" color="neutral" size="sm">B</Button></Toolbar>
      )) },
    ],
  },
  {
    name: 'Separator',
    category: 'Layout',
    description: 'Hairline divider, Radix-backed. Horizontal or vertical.',
    sections: [
      { label: 'horizontal', content: <div className="w-52 flex flex-col gap-2 text-sm" style={{ color: 'var(--doc-frame-fg)' }}><span>Above</span><Separator /><span>Below</span></div> },
      { label: 'vertical', content: <div className="flex items-center gap-3 h-8 text-sm" style={{ color: 'var(--doc-frame-fg)' }}><span>Left</span><Separator orientation="vertical" /><span>Right</span></div> },
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
    name: 'Sheet',
    category: 'Layout',
    description: 'Edge panel — side prop (top/right/bottom/left). Built-in close X.',
    sections: [
      { label: 'sides', content: (['left', 'right', 'top', 'bottom'] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild><Button variant="outline" color="primary" size="sm">{side}</Button></SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader><SheetTitle>{side} sheet</SheetTitle><SheetDescription>Slides in from the {side}; built-in close X.</SheetDescription></SheetHeader>
          </SheetContent>
        </Sheet>
      )) },
    ],
  },
  {
    name: 'AlertDialog',
    category: 'Layout',
    description: 'Confirmation modal — no dismiss on outside/escape; explicit Action/Cancel. No close X by design.',
    sections: [
      { label: 'destructive confirm', content: (
        <AlertDialog>
          <AlertDialogTrigger asChild><Button color="destructive">Delete</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete this item?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild><Button variant="ghost" color="neutral">Cancel</Button></AlertDialogCancel>
              <AlertDialogAction asChild><Button color="destructive">Delete</Button></AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) },
    ],
  },
  {
    name: 'Table',
    category: 'Layout',
    description: 'Data table. Size set once on <Table>, cascades to cells via context; per-cell size overrides.',
    sections: [
      { label: 'size=sm (cells inherit)', content: (
        <Table size="sm" className="w-80">
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow><TableCell>Ada</TableCell><TableCell>Engineer</TableCell></TableRow>
            <TableRow><TableCell>Grace</TableCell><TableCell>Lead</TableCell></TableRow>
          </TableBody>
        </Table>
      ) },
      { label: 'size=lg', content: (
        <Table size="lg" className="w-80">
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
          <TableBody><TableRow><TableCell>Ada</TableCell><TableCell>Engineer</TableCell></TableRow></TableBody>
        </Table>
      ) },
    ],
  },

  // === Inputs (Forms group) ===
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
    name: 'Input',
    category: 'Inputs',
    description: 'Text input (text-field base). state (default/error) × size; error also cascades from FormField.',
    sections: [
      { label: 'sizes', content: SIZES.map((s) => <Input key={s} size={s} placeholder={`size ${s}`} className="w-48" />) },
      { label: 'error state (explicit)', content: <Input state="error" defaultValue="invalid" className="w-48" /> },
      { label: 'disabled', content: <Input disabled placeholder="Disabled" className="w-48" /> },
    ],
  },
  {
    name: 'Textarea',
    category: 'Inputs',
    description: 'Multi-line input. min-height per size; vertical resize. Error cascades from FormField.',
    sections: [
      { label: 'sizes', content: SIZES.map((s) => <Textarea key={s} size={s} placeholder={`size ${s}`} className="w-56" />) },
      { label: 'error', content: <Textarea state="error" defaultValue="Too short" className="w-56" /> },
    ],
  },
  {
    name: 'Select',
    category: 'Inputs',
    description: 'Radix Select with token-styled trigger + content. Error cascades from FormField.',
    sections: [{ label: 'default', content: <SelectExample /> }],
  },
  {
    name: 'Checkbox · Radio · Switch',
    category: 'Inputs',
    description: 'Binary + exclusive selection controls. Checkbox/radio share toggle-base; switch is its own track/thumb.',
    sections: [
      { label: 'checkbox', content: [<CheckboxExample key="c" />, ...SIZES.map((s) => <Checkbox key={s} size={s} defaultChecked />)] },
      { label: 'radio group', content: <RadioExample /> },
      { label: 'switch', content: [<SwitchExample key="s" />, ...SIZES.map((s) => <Switch key={s} size={s} defaultChecked />)] },
    ],
  },
  {
    name: 'Slider',
    category: 'Inputs',
    description: 'Single/range slider, Radix-backed. Pair with a visible value label.',
    sections: [{ label: 'default', content: <SliderExample /> }],
  },
  {
    name: 'Combobox',
    category: 'Inputs',
    description: 'Filterable single-select (cmdk + popover). Trigger error cascades from FormField.',
    sections: [{ label: 'default', content: <ComboboxExample /> }],
  },
  {
    name: 'DatePicker',
    category: 'Inputs',
    description: 'Text-field trigger + Calendar in a popover. Trigger error cascades from FormField.',
    sections: [{ label: 'default', content: <DatePickerExample /> }],
  },
  {
    name: 'Calendar',
    category: 'Inputs',
    description: 'Day grid (react-day-picker). New compact size absorbs the mini-calendar pattern.',
    sections: [
      { label: 'compact (new)', content: <Calendar size="compact" mode="single" /> },
      { label: 'md', content: <Calendar size="md" mode="single" /> },
    ],
  },
  {
    name: 'InputOTP',
    category: 'Inputs',
    description: 'One-time-code input — per-cell boxes, auto-advance, paste support.',
    sections: [{ label: '6-digit', content: <OTPExample /> }],
  },
  {
    name: 'FileUpload',
    category: 'Inputs',
    description: 'Stateless dropzone (dragover is internal state, not a variant). Single-file: status shows in the dropzone via selectedFile. Multi-file: map files over FileUploadItem rows. Both share one status vocabulary; consumer owns the files + drives status/progress.',
    sections: [
      { label: 'dropzone (idle)', content: <div className="w-80"><FileUpload /></div> },
      { label: 'single file · in-dropzone status', content: (
        <div className="flex flex-wrap gap-4">
          <div className="w-72"><FileUpload selectedFile={{ name: 'headshot.jpg', status: 'uploading', progress: 62 }} /></div>
          <div className="w-72"><FileUpload selectedFile={{ name: 'resume.pdf', size: '248 KB', status: 'success' }} /></div>
          <div className="w-72"><FileUpload selectedFile={{ name: 'archive.zip', status: 'error', error: 'Upload failed' }} /></div>
        </div>
      ) },
      { label: 'multi file · FileUploadItem rows', content: (
        <div className="w-80 flex flex-col gap-2">
          <FileUploadItem name="cover-letter.docx" size="89 KB" onRemove={() => {}} />
          <FileUploadItem name="headshot.jpg" status="uploading" progress={62} />
          <FileUploadItem name="resume.pdf" size="248 KB" status="success" onRemove={() => {}} />
          <FileUploadItem name="archive.zip" status="error" error="Upload failed" onRemove={() => {}} />
        </div>
      ) },
      { label: 'sizes', content: SIZES.map((s) => <FileUpload key={s} size={s} className="w-44" />) },
    ],
  },
  {
    name: 'Rating',
    category: 'Inputs',
    description: 'Star (or custom-icon) rating. Interactive, optional half-steps, read-only. Filled = primary (project-owned).',
    sections: [
      { label: 'half steps', content: <RatingExample allowHalf /> },
      { label: 'read-only', content: <Rating value={4} readOnly /> },
      { label: 'sizes', content: SIZES.map((s) => <Rating key={s} size={s} value={3} readOnly />) },
    ],
  },
  {
    name: 'TimePicker',
    category: 'Inputs',
    description: 'Option A — three composed Selects (hour / minute / period). No masking; a11y via Select.',
    sections: [
      { label: '12-hour', content: <TimePickerExample /> },
      { label: '24-hour', content: <TimePicker use24Hour value={{ hour: 14, minute: 0 }} /> },
    ],
  },
  {
    name: 'SearchBar',
    category: 'Inputs',
    description: 'In-body search shell — leading icon (optional) + clearable X. Distinct from command-palette (overlay).',
    sections: [
      { label: 'default (search glyph)', content: <div className="w-64"><SearchBar placeholder="Search…" /></div> },
      { label: 'no leading icon (text to edge)', content: <div className="w-64"><SearchBar icon={null} placeholder="No icon — text at the edge" /></div> },
      { label: 'leading icon · sizes (slot scales)', content: SIZES.map((s) => <div key={s} className="w-64"><SearchBar size={s} placeholder={`size ${s}`} /></div>) },
    ],
  },
  {
    name: 'Avatar',
    category: 'Data Display',
    description: 'Initials / image avatar. Single decorative variant (no color axis — bg is decoration, not severity). circle / rounded × sm–xl.',
    sections: [
      { label: 'sizes', content: (['sm', 'md', 'lg', 'xl'] as const).map((s) => <Avatar key={s} size={s}><AvatarFallback>JI</AvatarFallback></Avatar>) },
      { label: 'shapes', content: [<Avatar key="c" shape="circle"><AvatarFallback>JI</AvatarFallback></Avatar>, <Avatar key="r" shape="rounded"><AvatarFallback>JI</AvatarFallback></Avatar>] },
      { label: 'image loads · broken src falls back to initials', content: [<Avatar key="1" size="lg"><AvatarImage src={SAMPLE_AVATAR} alt="" /><AvatarFallback>AB</AvatarFallback></Avatar>, <Avatar key="2" size="lg"><AvatarImage src="data:," alt="" /><AvatarFallback>CD</AvatarFallback></Avatar>] },
    ],
  },
  {
    name: 'AvatarGroup',
    category: 'Data Display',
    description: 'Stacked avatars over the surface ring; size forwards to children. max caps the visible set, overflow becomes a +N counter avatar.',
    sections: [
      { label: 'stacked', content: <AvatarGroup><Avatar><AvatarFallback>JI</AvatarFallback></Avatar><Avatar><AvatarFallback>AB</AvatarFallback></Avatar><Avatar><AvatarFallback>CD</AvatarFallback></Avatar></AvatarGroup> },
      { label: 'max=3 + overflow', content: <AvatarGroup max={3}><Avatar><AvatarFallback>JI</AvatarFallback></Avatar><Avatar><AvatarFallback>AB</AvatarFallback></Avatar><Avatar><AvatarFallback>CD</AvatarFallback></Avatar><Avatar><AvatarFallback>EF</AvatarFallback></Avatar><Avatar><AvatarFallback>GH</AvatarFallback></Avatar></AvatarGroup> },
      { label: 'sizes (forwarded)', content: (['sm', 'md', 'lg'] as const).map((s) => <AvatarGroup key={s} size={s} max={2}><Avatar><AvatarFallback>JI</AvatarFallback></Avatar><Avatar><AvatarFallback>AB</AvatarFallback></Avatar><Avatar><AvatarFallback>CD</AvatarFallback></Avatar></AvatarGroup>) },
      { label: 'spacing', content: (['tight', 'normal', 'loose'] as const).map((sp) => <AvatarGroup key={sp} spacing={sp}><Avatar><AvatarFallback>JI</AvatarFallback></Avatar><Avatar><AvatarFallback>AB</AvatarFallback></Avatar><Avatar><AvatarFallback>CD</AvatarFallback></Avatar></AvatarGroup>) },
    ],
  },
  {
    name: 'ListItem',
    category: 'Data Display',
    description: 'Three-slot row shell (leading / content / trailing). default / bordered × sm–lg. No internal text styling — slots fill it.',
    sections: [
      { label: 'variants', content: (['default', 'bordered'] as const).map((v) => <div key={v} className="w-72"><ListItem variant={v} leading={<Star />} trailing={<Arrow />}>List item — {v}</ListItem></div>) },
      { label: 'sizes', content: SIZES.map((s) => <div key={s} className="w-72"><ListItem size={s} leading={<Star />}>Size {s}</ListItem></div>) },
      { label: 'leading avatar', content: <div className="w-72"><ListItem leading={<Avatar size="sm"><AvatarFallback>JI</AvatarFallback></Avatar>} trailing={<Kbd>⏎</Kbd>}>Jacob Ikola</ListItem></div> },
    ],
  },
  {
    name: 'Accordion',
    category: 'Data Display',
    description: 'Collapsible section group (mutual exclusion when type=single). default / filled. Chevron rotates on open.',
    sections: [
      { label: 'single (default)', content: <div className="w-80"><Accordion type="single" collapsible defaultValue="a"><AccordionItem value="a"><AccordionTrigger>What is Loom?</AccordionTrigger><AccordionContent>A token-driven design-system generator.</AccordionContent></AccordionItem><AccordionItem value="b"><AccordionTrigger>How are atoms picked?</AccordionTrigger><AccordionContent>Via loom-picks.json; setup.sh syncs the resolved set.</AccordionContent></AccordionItem></Accordion></div> },
      { label: 'filled', content: <div className="w-80"><Accordion type="single" collapsible variant="filled"><AccordionItem value="a"><AccordionTrigger>Section one</AccordionTrigger><AccordionContent>Filled surface, no border.</AccordionContent></AccordionItem><AccordionItem value="b"><AccordionTrigger>Section two</AccordionTrigger><AccordionContent>Second panel.</AccordionContent></AccordionItem></Accordion></div> },
    ],
  },
  {
    name: 'Collapsible',
    category: 'Data Display',
    description: 'Single progressive-disclosure panel — no group behavior. Simpler than Accordion.',
    sections: [
      { label: 'default (open)', content: <div className="w-80"><Collapsible defaultOpen><CollapsibleTrigger>Toggle details</CollapsibleTrigger><CollapsibleContent><div className="px-4 py-2 text-on-surface-variant text-body-md">Optional detail content lives here.</div></CollapsibleContent></Collapsible></div> },
      { label: 'bordered', content: <div className="w-80"><Collapsible variant="bordered"><CollapsibleTrigger>Show more</CollapsibleTrigger><CollapsibleContent><div className="px-4 py-2 text-on-surface-variant text-body-md">Hidden until toggled.</div></CollapsibleContent></Collapsible></div> },
    ],
  },
  {
    name: 'Kbd',
    category: 'Data Display',
    description: 'Keyboard shortcut key cap. Inline element; combos compose with a gap.',
    sections: [
      { label: 'sizes', content: SIZES.map((s) => <Kbd key={s} size={s}>⌘K</Kbd>) },
      { label: 'combination', content: <span className="inline-flex items-center gap-1"><Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>P</Kbd></span> },
    ],
  },
  {
    name: 'NumberDisplay',
    category: 'Data Display',
    description: 'Intl.NumberFormat primitive. RSC-safe, tabular-nums. The count-up atom wraps it. options spreads last as an escape hatch.',
    sections: [
      { label: 'decimal', content: <NumberDisplay value={1234567.89} /> },
      { label: 'currency', content: [<NumberDisplay key="1" value={1299.99} format="currency" currency="USD" />, <NumberDisplay key="2" value={1299.99} format="currency" currency="EUR" locale="de-DE" />] },
      { label: 'percent', content: <NumberDisplay value={0.4267} format="percent" /> },
      { label: 'compact notation', content: [<NumberDisplay key="1" value={12500} notation="compact" />, <NumberDisplay key="2" value={3400000} notation="compact" />] },
      { label: 'unit', content: <NumberDisplay value={72} format="unit" unit="mile-per-hour" /> },
    ],
  },
  {
    name: 'RelativeTime',
    category: 'Data Display',
    description: 'Intl.RelativeTimeFormat in a <time> element. SSR-stable date fallback, relative string after mount (avoids hydration mismatch). Optional live tick.',
    sections: [
      { label: 'past', content: <RelativeTimeExample offsetMs={-2 * 60 * 60 * 1000} /> },
      { label: 'future', content: <RelativeTimeExample offsetMs={3 * 24 * 60 * 60 * 1000} /> },
      { label: 'weeks ago', content: <RelativeTimeExample offsetMs={-3 * 7 * 24 * 60 * 60 * 1000} /> },
      { label: 'numeric=always', content: <RelativeTimeExample offsetMs={-30 * 60 * 1000} numeric="always" /> },
    ],
  },
  {
    name: 'TopBar',
    category: 'Navigation',
    description: 'App header bar — title + nav/action icons. default (border) vs elevated (shadow). Container only; content is composed.',
    sections: [
      { label: 'variants', content: (['default', 'elevated'] as const).map((v) => (
        <TopBar key={v} variant={v} className="w-[460px]">
          <Button iconOnly variant="ghost" color="inherit" size="sm" aria-label="Menu"><Menu /></Button>
          <span className="font-semibold">Dashboard</span>
          <div className="ml-auto flex items-center gap-1">
            <Button iconOnly variant="ghost" color="inherit" size="sm" aria-label="Notifications"><Bell /></Button>
            <Button iconOnly variant="ghost" color="inherit" size="sm" aria-label="Settings"><Settings /></Button>
          </div>
        </TopBar>
      )) },
      { label: 'sizes', content: SIZES.map((s) => (
        <TopBar key={s} size={s} className="w-[460px]">
          <Button iconOnly variant="ghost" color="inherit" size={s} aria-label="Menu"><Menu /></Button>
          <span className="font-semibold">{s.toUpperCase()}</span>
        </TopBar>
      )) },
    ],
  },
  {
    name: 'Sidebar',
    category: 'Navigation',
    description: 'Vertical app nav. default (labeled) and rail (icon-only, narrow) variants on one axis — rail labels collapse via a parent group marker (no context, RSC-safe). Active item uses primary-container.',
    sections: [
      { label: 'default', content: (
        <Sidebar className="h-[300px] gap-1 py-2">
          <SidebarItem active icon={<Home size={20} />}>Dashboard</SidebarItem>
          <SidebarItem icon={<BarChart3 size={20} />}>Analytics</SidebarItem>
          <SidebarItem icon={<Users size={20} />}>Team</SidebarItem>
          <SidebarItem icon={<Settings size={20} />}>Settings</SidebarItem>
        </Sidebar>
      ) },
      { label: 'rail (icon-only — same items)', content: (
        <Sidebar variant="rail" className="h-[300px] gap-1 py-2">
          <SidebarItem active icon={<Home size={20} />}>Dashboard</SidebarItem>
          <SidebarItem icon={<BarChart3 size={20} />}>Analytics</SidebarItem>
          <SidebarItem icon={<Users size={20} />}>Team</SidebarItem>
          <SidebarItem icon={<Settings size={20} />}>Settings</SidebarItem>
        </Sidebar>
      ) },
      { label: 'sizes', content: SIZES.map((s) => (
        <Sidebar key={s} size={s} className="h-[200px] gap-1 py-2">
          <SidebarItem size={s} active icon={<Home size={18} />}>Dashboard</SidebarItem>
          <SidebarItem size={s} icon={<Users size={18} />}>Team</SidebarItem>
        </Sidebar>
      )) },
    ],
  },
  {
    name: 'Tabs',
    category: 'Navigation',
    description: 'Horizontal tab strip (Radix). Active tab gets the primary underline; arrow-key nav; content linked via aria-controls.',
    sections: [
      { label: 'default', content: (
        <Tabs defaultValue="overview" className="w-[420px]">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview panel content.</TabsContent>
          <TabsContent value="activity">Activity panel content.</TabsContent>
          <TabsContent value="settings">Settings panel content.</TabsContent>
        </Tabs>
      ) },
      { label: 'sizes', content: SIZES.map((s) => (
        <Tabs key={s} defaultValue="a" className="w-[360px]">
          <TabsList size={s}>
            <TabsTrigger size={s} value="a">First</TabsTrigger>
            <TabsTrigger size={s} value="b">Second</TabsTrigger>
          </TabsList>
        </Tabs>
      )) },
    ],
  },
  {
    name: 'BottomNav',
    category: 'Navigation',
    description: 'Mobile bottom bar — 3–5 destinations, always labeled. Active item uses primary.',
    sections: [
      { label: 'default', content: (
        <BottomNav className="w-[400px]">
          <BottomNavItem active icon={<Home size={20} />}>Home</BottomNavItem>
          <BottomNavItem icon={<BarChart3 size={20} />}>Stats</BottomNavItem>
          <BottomNavItem icon={<Bell size={20} />}>Alerts</BottomNavItem>
          <BottomNavItem icon={<Settings size={20} />}>Settings</BottomNavItem>
        </BottomNav>
      ) },
      { label: 'sizes', content: SIZES.map((s) => (
        <BottomNav key={s} size={s} className="w-[400px]">
          <BottomNavItem active icon={<Home size={18} />}>Home</BottomNavItem>
          <BottomNavItem icon={<Users size={18} />}>Team</BottomNavItem>
        </BottomNav>
      )) },
    ],
  },
  {
    name: 'Breadcrumbs',
    category: 'Navigation',
    description: 'Page-hierarchy trail. BreadcrumbSeparator renders / by default; pass children (e.g. a chevron) to override. Current page is plain text, not a link.',
    sections: [
      { label: 'default (/ separator)', content: (
        <Breadcrumbs>
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Library</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem current>Data display</BreadcrumbItem>
        </Breadcrumbs>
      ) },
      { label: 'custom separator', content: (
        <Breadcrumbs>
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbSeparator><ChevronRight className="size-3.5" /></BreadcrumbSeparator>
          <BreadcrumbItem>Settings</BreadcrumbItem>
          <BreadcrumbSeparator><ChevronRight className="size-3.5" /></BreadcrumbSeparator>
          <BreadcrumbItem current>Profile</BreadcrumbItem>
        </Breadcrumbs>
      ) },
      { label: 'sizes', content: SIZES.map((s) => (
        <Breadcrumbs key={s} size={s}>
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem current>{s}</BreadcrumbItem>
        </Breadcrumbs>
      )) },
    ],
  },
  {
    name: 'Pagination',
    category: 'Navigation',
    description: 'Page nav using <a> links (navigation semantics, not buttons). Active page highlighted; prev/next arrows; ellipsis for gaps.',
    sections: [
      { label: 'default', content: (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
            <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationLink href="#">10</PaginationLink></PaginationItem>
            <PaginationItem><PaginationNext href="#" /></PaginationItem>
          </PaginationContent>
        </Pagination>
      ) },
      { label: 'sizes', content: SIZES.map((s) => (
        <Pagination key={s}>
          <PaginationContent>
            <PaginationItem><PaginationPrevious size={s} href="#" /></PaginationItem>
            <PaginationItem><PaginationLink size={s} href="#">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink size={s} href="#" isActive>2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationNext size={s} href="#" /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )) },
    ],
  },
  {
    name: 'NavigationMenu',
    category: 'Navigation',
    description: 'Site-level menu bar with dropdown panels (Radix). Hover or focus a trigger to open its content. For marketing/content sites — distinct from sidebar (app nav) and dropdown-menu (actions).',
    sections: [
      { label: 'menu bar (hover/focus to open)', content: (
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[320px] gap-1 p-3">
                  <li><NavigationMenuLink href="#">Analytics</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Automation</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Reports</NavigationMenuLink></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Company</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[320px] gap-1 p-3">
                  <li><NavigationMenuLink href="#">About</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Careers</NavigationMenuLink></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      ) },
    ],
  },
  {
    name: 'CommandPalette',
    category: 'Navigation',
    description: 'Cmd+K search + action surface (cmdk). Shown inline here; in product it lives in a dialog. Type to filter; grouped results with shortcuts.',
    sections: [
      { label: 'inline (type to filter)', content: (
        <div className="w-[420px]">
          <CommandPalette>
            <CommandPaletteInput placeholder="Type a command or search…" />
            <CommandPaletteList>
              <CommandPaletteEmpty>No results found.</CommandPaletteEmpty>
              <CommandPaletteGroup heading="Suggestions">
                <CommandPaletteItem>Dashboard</CommandPaletteItem>
                <CommandPaletteItem>Analytics</CommandPaletteItem>
                <CommandPaletteItem>Team</CommandPaletteItem>
              </CommandPaletteGroup>
              <CommandPaletteSeparator />
              <CommandPaletteGroup heading="Settings">
                <CommandPaletteItem>Profile <CommandPaletteShortcut>⌘P</CommandPaletteShortcut></CommandPaletteItem>
                <CommandPaletteItem>Billing <CommandPaletteShortcut>⌘B</CommandPaletteShortcut></CommandPaletteItem>
              </CommandPaletteGroup>
            </CommandPaletteList>
          </CommandPalette>
        </div>
      ) },
    ],
  },
  // === Composite group ===
  {
    name: 'Stepper',
    category: 'Composite',
    description: 'Multi-step progress indicator. step-state axis (incomplete/active/completed/error) drives indicator + connector color; completed shows a check. Prop-driven — map your own steps.',
    sections: [
      { label: 'default (mixed states)', content: (
        <div className="w-[460px]">
          <Stepper>
            <Step state="completed" step={1} label="Account" />
            <Step state="completed" step={2} label="Profile" />
            <Step state="active" step={3} label="Payment" />
            <Step state="incomplete" step={4} label="Review" showConnector={false} />
          </Stepper>
        </div>
      ) },
      { label: 'error state', content: (
        <div className="w-[360px]">
          <Stepper>
            <Step state="completed" step={1} label="Details" />
            <Step state="error" step={2} label="Payment" />
            <Step state="incomplete" step={3} label="Done" showConnector={false} />
          </Stepper>
        </div>
      ) },
      { label: 'sizes', content: SIZES.map((s) => (
        <div key={s} className="w-[300px]">
          <Stepper size={s}>
            <Step size={s} state="completed" step={1} label="One" />
            <Step size={s} state="active" step={2} label="Two" />
            <Step size={s} state="incomplete" step={3} label="Three" showConnector={false} />
          </Stepper>
        </div>
      )) },
    ],
  },
  {
    name: 'Carousel',
    category: 'Composite',
    description: 'Sliding content on an embla base — drag/swipe, arrow keys, dots + arrow nav. Arrows disable at the ends (loop=false) or wrap (loop). Base structure only; motion variants are gated on the motion-library adoption decision.',
    sections: [
      { label: 'default (drag / arrows / dots)', content: (
        <div className="w-[360px]">
          <Carousel>
            {['Slide 1', 'Slide 2', 'Slide 3'].map((s, i) => (
              <div key={i} className="flex h-40 items-center justify-center rounded-card bg-surface-1 text-on-surface text-title-lg">{s}</div>
            ))}
          </Carousel>
        </div>
      ) },
      { label: 'loop (wraps at ends, no dots)', content: (
        <div className="w-[360px]">
          <Carousel loop showDots={false}>
            {['A', 'B', 'C'].map((s, i) => (
              <div key={i} className="flex h-40 items-center justify-center rounded-card bg-primary-container text-on-primary-container text-title-lg">{s}</div>
            ))}
          </Carousel>
        </div>
      ) },
    ],
  },
  {
    name: 'TreeView',
    category: 'Composite',
    description: 'Hierarchical expand/collapse list (role=tree, aria-expanded). Data-driven; default Folder/File icons, override per node. Click a parent to expand; selection via selectedId/onSelect.',
    sections: [
      { label: 'default (click to expand)', content: (
        <div className="w-[280px]"><TreeView data={treeSample} /></div>
      ) },
      { label: 'sizes', content: SIZES.map((s) => (
        <div key={s} className="w-[240px]"><TreeView size={s} data={treeSample} /></div>
      )) },
    ],
  },
  {
    name: 'Reveal',
    category: 'Motion',
    description: 'Scroll-reveal envelope on a hand-rolled IntersectionObserver — zero runtime dep. Holds children hidden, then transitions them in when scrolled into view. Honors prefers-reduced-motion in pure CSS (motion-safe: gate — content is instant under reduce). stagger composes this. Hit Replay to re-run the enter transition.',
    sections: [
      { label: 'variants · easing (replay to re-run)', content: <RevealDemo /> },
    ],
  },
  {
    name: 'Stagger',
    category: 'Motion',
    description: 'Cascade envelope — composes Reveal, wrapping each child at delay = index*step so the group enters one-by-one. The Stagger element is the layout container (here flex gap). Forwards variant/easing/duration to every child. Replay to re-run the cascade.',
    sections: [
      { label: 'step 90ms cascade (replay to re-run)', content: <StaggerDemo /> },
    ],
  },
  {
    name: 'CountUp',
    category: 'Motion',
    description: 'Leaf motion atom — animates a number from 0 to its target on scroll-into-view (rAF + easeOutCubic, own IO). Composes NumberDisplay for Intl formatting (separators / currency / percent). No overshoot — a stat shouldn’t count past its value. Replay to re-run.',
    sections: [
      { label: 'stats — integer · currency · percent · decimal (replay)', content: <CountUpDemo /> },
    ],
  },
  {
    name: 'ScrollProgress',
    category: 'Motion',
    description: 'Scroll-linked progress bar (reading indicator). Binds continuously to scroll position via a rAF-throttled passive listener writing a CSS var (transform: scaleX) — no per-frame React state. Tracks the page by default, or a container via target. Scroll the box to drive it.',
    sections: [
      { label: 'tracking a scroll container (target)', content: <ScrollProgressDemo /> },
    ],
  },
];
