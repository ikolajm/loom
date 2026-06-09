/**
 * Generate story definitions + registry from component registry.
 * Writes: stories/*.story.ts + stories/registry.ts
 */
const fs = require('fs');
const path = require('path');
const { resolveBase, formatDisplayName } = require('./shared');

function generateStory(name, config, meta = {}) {
  // Detect variant key — same logic as generate-components
  const variantKey = meta.variantKey
    || (config.state ? 'state' : null)
    || (config.variants ? 'variants' : null)
    || (config.checked ? 'checked' : null)
    || (config.active ? 'active' : null)
    || (config['step-state'] ? 'step-state' : null)
    || (config.item ? 'item' : null)
    || 'variants';

  const variantDefs = config[variantKey];
  const flatVariants = variantDefs && variantDefs.state ? variantDefs.state : variantDefs;
  const hasVariants = flatVariants && typeof flatVariants === 'object' && !Array.isArray(flatVariants);
  const variantNames = hasVariants ? Object.keys(flatVariants) : ['default'];
  const hasSizes = config.sizes && typeof config.sizes === 'object';
  const sizeEntries = hasSizes ? Object.fromEntries(Object.entries(config.sizes).filter(([k]) => !k.startsWith('$'))) : { sm: {}, md: {}, lg: {} };
  const sizeNames = Object.keys(sizeEntries);
  const hasIconSlots = !meta.noIconSlots && !!config['icon-slots'];
  const selfClosing = meta.selfClosing || false;
  const hasLeading = !selfClosing && hasIconSlots && config['icon-slots'].leading && !config['icon-slots'].leading.persistent;
  const hasTrailing = !selfClosing && hasIconSlots && config['icon-slots'].trailing && !config['icon-slots'].trailing.persistent;
  const dflt = config.default || {};
  const variantPropName = (variantKey === 'state' || variantKey === 'active') ? variantKey : (variantKey === 'checked' ? 'checkedState' : (variantKey === 'step-state' ? 'step' : 'variant'));
  const defaultVariant = dflt[variantPropName] || dflt.variant || dflt.state || variantNames[0];
  const defaultSize = dflt.size || 'md';

  const iconOnly = meta.iconOnly || false;
  const isFAB = name === 'FAB';
  const isToggleGroup = name === 'ToggleGroup';
  const isSelect = name === 'Select';
  const isRadio = name === 'Radio';
  const needsIconImport = iconOnly || isFAB;
  let storyImports = `import { ${name} } from '../components/atoms/${name}';`;
  if (isRadio) {
    storyImports = `import { RadioGroup, RadioGroupItem } from '../components/atoms/Radio';
import { forwardRef } from 'react';

// Pre-composed Radio for playground — wraps RadioGroup + items
const labelSize: Record<string, string> = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' };

const RadioDemo = forwardRef<HTMLDivElement, { size?: 'sm' | 'md' | 'lg'; disabled?: boolean }>(
  ({ size = 'md', disabled, ...props }, ref) => (
    <RadioGroup ref={ref} defaultValue="option-1" disabled={disabled} {...props}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-1" size={size} id="r1" />
        <label htmlFor="r1" className={\`\${labelSize[size]} cursor-pointer\`}>Option 1</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-2" size={size} id="r2" />
        <label htmlFor="r2" className={\`\${labelSize[size]} cursor-pointer\`}>Option 2</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-3" size={size} id="r3" />
        <label htmlFor="r3" className={\`\${labelSize[size]} cursor-pointer\`}>Option 3</label>
      </div>
    </RadioGroup>
  )
);
RadioDemo.displayName = 'RadioDemo';`;
  } else if (isSelect) {
    storyImports = `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/atoms/Select';
import { forwardRef } from 'react';

// Pre-composed Select for playground — wraps Radix parts into a single component
const SelectDemo = forwardRef<HTMLButtonElement, { state?: 'default' | 'error'; size?: 'sm' | 'md' | 'lg'; placeholder?: string; disabled?: boolean }>(
  ({ state, size, placeholder = 'Select an option...', disabled, ...props }, ref) => (
    <Select disabled={disabled}>
      <SelectTrigger ref={ref} state={state} size={size} className="w-full" {...props}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option-1">Option 1</SelectItem>
        <SelectItem value="option-2">Option 2</SelectItem>
        <SelectItem value="option-3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  )
);
SelectDemo.displayName = 'SelectDemo';`;
  } else if (name === 'Dialog') {
    storyImports = `import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/atoms/Dialog';
import { Button } from '../components/atoms/Button';
import { X } from 'lucide-react';
import { useState } from 'react';

const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg', full: 'text-body-lg' } as const;

const DialogDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'full' }) => {
  const [open, setOpen] = useState(false);
  const btnSize = size === 'full' ? 'lg' : size;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size={btnSize} onClick={() => setOpen(true)}>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent size={size}>
        <div className="flex items-start justify-between">
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>This is a description of the dialog content and purpose.</DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button variant="ghost" size={btnSize} iconOnly>
              <X />
            </Button>
          </DialogClose>
        </div>
        <div className={\`\${bodySize[size]} text-on-surface-variant\`}>Dialog body content goes here.</div>
        <DialogFooter>
          <Button variant="ghost" size={btnSize} onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="default" size={btnSize} onClick={() => setOpen(false)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};`;
  } else if (name === 'Sheet') {
    storyImports = `import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '../components/atoms/Sheet';
import { Button } from '../components/atoms/Button';
import { X } from 'lucide-react';
import { useState } from 'react';

const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;

const SheetDemo = ({ size = 'md', side = 'right' }: { size?: 'sm' | 'md' | 'lg'; side?: 'left' | 'right' | 'top' | 'bottom' }) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default" size={size} onClick={() => setOpen(true)}>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent side={side} size={size}>
        <div className="flex items-start justify-between">
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>This is a side panel for secondary content or actions.</SheetDescription>
          </SheetHeader>
          <SheetClose asChild>
            <Button variant="ghost" size={size} iconOnly>
              <X />
            </Button>
          </SheetClose>
        </div>
        <div className={\`\${bodySize[size]} text-on-surface-variant flex-1\`}>Sheet body content goes here.</div>
      </SheetContent>
    </Sheet>
  );
};`;
  } else if (name === 'AlertDialog') {
    storyImports = `import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../components/atoms/AlertDialog';
import { Button } from '../components/atoms/Button';
import { useState } from 'react';

const AlertDialogDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={size} onClick={() => setOpen(true)}>Delete Item</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone. This will permanently delete the item.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost" size={size}>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" size={size}>Delete</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};`;
  } else if (name === 'Table') {
    storyImports = `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/atoms/Table';

const TableDemo = ({ size }: { size?: 'sm' | 'md' | 'lg' }) => (
  <Table size={size}>
    <TableHeader>
      <TableRow>
        <TableHead size={size}>First Name</TableHead>
        <TableHead size={size}>Last Name</TableHead>
        <TableHead size={size}>Email</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell size={size}>John</TableCell>
        <TableCell size={size}>Doe</TableCell>
        <TableCell size={size}>john@example.com</TableCell>
      </TableRow>
      <TableRow>
        <TableCell size={size}>Jane</TableCell>
        <TableCell size={size}>Smith</TableCell>
        <TableCell size={size}>jane@example.com</TableCell>
      </TableRow>
      <TableRow>
        <TableCell size={size}>Alex</TableCell>
        <TableCell size={size}>Johnson</TableCell>
        <TableCell size={size}>alex@example.com</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);`;
  } else if (name === 'Tooltip') {
    storyImports = `import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../components/atoms/Tooltip';
import { Button } from '../components/atoms/Button';

const TooltipDemo = ({ size, children }: { size?: 'sm' | 'md' | 'lg'; children?: string }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="default" size={size}>Hover me</Button>
        </TooltipTrigger>
        <TooltipContent size={size}>
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};`;
  } else if (name === 'Popover') {
    storyImports = `import { Popover, PopoverTrigger, PopoverContent } from '../components/atoms/Popover';
import { Button } from '../components/atoms/Button';

const titleSize = { sm: 'text-title-sm', md: 'text-title-md', lg: 'text-title-lg' } as const;
const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;

const PopoverDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="default" size={size}>Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent size={size}>
        <p className={\`\${titleSize[size]} font-semibold\`}>Dimensions</p>
        <p className={\`\${bodySize[size]} text-on-surface-variant\`}>Set the dimensions for the layer.</p>
      </PopoverContent>
    </Popover>
  );
};`;
  } else if (name === 'HoverCard') {
    storyImports = `import { HoverCard, HoverCardTrigger, HoverCardContent } from '../components/atoms/HoverCard';
import { Avatar, AvatarImage, AvatarFallback } from '../components/atoms/Avatar';

const titleSize = { sm: 'text-title-sm', md: 'text-title-md', lg: 'text-title-lg' } as const;
const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;

const HoverCardDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a href="#" className={\`text-primary underline underline-offset-4 \${bodySize[size]}\`}>@jacobikola</a>
      </HoverCardTrigger>
      <HoverCardContent size={size}>
        <div className="flex gap-3">
          <Avatar size={size} shape="circle">
            <AvatarFallback>JI</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <p className={\`\${titleSize[size]} font-semibold\`}>Jacob Ikola</p>
            <p className={\`\${bodySize[size]} text-on-surface-variant\`}>Designer, developer, creative entrepreneur. Building tools and systems.</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};`;
  } else if (name === 'Accordion') {
    storyImports = `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/atoms/Accordion';

const AccordionDemo = ({ variant, size = 'md' }: { variant?: 'default' | 'filled'; size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full max-w-md">
      <Accordion type="single" collapsible variant={variant}>
        <AccordionItem value="item-1">
          <AccordionTrigger size={size}>Is it accessible?</AccordionTrigger>
          <AccordionContent size={size}>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger size={size}>Is it styled?</AccordionTrigger>
          <AccordionContent size={size}>Yes. It comes with default styles from the design system tokens.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger size={size}>Is it animated?</AccordionTrigger>
          <AccordionContent size={size}>Yes. It uses CSS animations for smooth open and close transitions.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};`;
  } else if (name === 'Collapsible') {
    storyImports = `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../components/atoms/Collapsible';

const CollapsibleDemo = ({ variant, size = 'md' }: { variant?: 'default' | 'bordered'; size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full max-w-md">
      <Collapsible variant={variant}>
        <CollapsibleTrigger size={size}>Additional details</CollapsibleTrigger>
        <CollapsibleContent size={size}>
          This section contains extra information that can be shown or hidden as needed. Useful for progressive disclosure.
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};`;
  } else if (name === 'Tabs') {
    storyImports = `import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/atoms/Tabs';

const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;

const TabsDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <TabsList size={size}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className={\`\${bodySize[size]} text-on-surface-variant\`}>Overview content goes here.</p>
      </TabsContent>
      <TabsContent value="activity">
        <p className={\`\${bodySize[size]} text-on-surface-variant\`}>Recent activity and updates.</p>
      </TabsContent>
      <TabsContent value="settings">
        <p className={\`\${bodySize[size]} text-on-surface-variant\`}>Configure your preferences.</p>
      </TabsContent>
    </Tabs>
  );
};`;
  } else if (name === 'TopBar') {
    storyImports = `import { TopBar } from '../components/atoms/TopBar';
import { Menu, Bell, Search } from 'lucide-react';

const iconSize = { sm: 20, md: 20, lg: 24 } as const;
const titleSize = { sm: 'text-[16px] leading-[24px]', md: 'text-[18px] leading-[28px]', lg: 'text-[20px] leading-[28px]' } as const;

const TopBarDemo = ({ variant, size = 'md' }: { variant?: 'default' | 'elevated'; size?: 'sm' | 'md' | 'lg' }) => {
  const s = iconSize[size];
  return (
    <TopBar variant={variant} size={size} className="w-full">
      <Menu size={s} className="shrink-0 cursor-pointer" />
      <span className={\`flex-1 font-semibold tracking-[-0.01em] \${titleSize[size]}\`}>App Title</span>
      <Search size={s} className="shrink-0 cursor-pointer" />
      <Bell size={s} className="shrink-0 cursor-pointer" />
    </TopBar>
  );
};`;
  } else if (name === 'Sidebar') {
    storyImports = `import { Sidebar, SidebarItem } from '../components/atoms/Sidebar';
import { Home, Settings, Users, FileText, BarChart } from 'lucide-react';

const iconSize = { sm: 16, md: 20, lg: 24 } as const;

const SidebarDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const s = iconSize[size];
  return (
    <Sidebar size={size} className="h-[320px] py-2 gap-1">
      <SidebarItem size={size} active icon={<Home size={s} />}>Dashboard</SidebarItem>
      <SidebarItem size={size} icon={<BarChart size={s} />}>Analytics</SidebarItem>
      <SidebarItem size={size} icon={<Users size={s} />}>Team</SidebarItem>
      <SidebarItem size={size} icon={<FileText size={s} />}>Documents</SidebarItem>
      <SidebarItem size={size} icon={<Settings size={s} />}>Settings</SidebarItem>
    </Sidebar>
  );
};`;
  } else if (name === 'BottomNav') {
    storyImports = `import { BottomNav, BottomNavItem } from '../components/atoms/BottomNav';
import { Home, Search, Bell, User } from 'lucide-react';

const iconSize = { sm: 20, md: 20, lg: 24 } as const;
const labelSize = { sm: 'text-[10px] leading-[14px]', md: 'text-[12px] leading-[16px]', lg: 'text-[12px] leading-[16px]' } as const;

const BottomNavDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const s = iconSize[size];
  return (
    <BottomNav size={size}>
      <BottomNavItem active icon={<Home size={s} />}>
        <span className={labelSize[size]}>Home</span>
      </BottomNavItem>
      <BottomNavItem icon={<Search size={s} />}>
        <span className={labelSize[size]}>Search</span>
      </BottomNavItem>
      <BottomNavItem icon={<Bell size={s} />}>
        <span className={labelSize[size]}>Alerts</span>
      </BottomNavItem>
      <BottomNavItem icon={<User size={s} />}>
        <span className={labelSize[size]}>Profile</span>
      </BottomNavItem>
    </BottomNav>
  );
};`;
  } else if (name === 'Breadcrumbs') {
    storyImports = `import { Breadcrumbs, BreadcrumbItem } from '../components/atoms/Breadcrumbs';

const BreadcrumbsDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <Breadcrumbs size={size} aria-label="Breadcrumb">
      <BreadcrumbItem>Home</BreadcrumbItem>
      <span className="text-outline-subtle">/</span>
      <BreadcrumbItem>Projects</BreadcrumbItem>
      <span className="text-outline-subtle">/</span>
      <BreadcrumbItem current>Design System</BreadcrumbItem>
    </Breadcrumbs>
  );
};`;
  } else if (name === 'EmptyState') {
    storyImports = `import { EmptyState } from '../components/atoms/EmptyState';
import { Inbox } from 'lucide-react';

const EmptyStateDemo = ({ size, heading, description }: { size?: 'sm' | 'md' | 'lg'; heading?: string; description?: string }) => {
  return (
    <EmptyState
      size={size}
      icon={<Inbox />}
      heading={heading}
      description={description}
    />
  );
};`;
  } else if (name === 'Avatar') {
    storyImports = `import { Avatar, AvatarImage, AvatarFallback } from '../components/atoms/Avatar';

const AvatarDemo = ({ size, shape, initials }: { size?: 'sm' | 'md' | 'lg' | 'xl'; shape?: 'circle' | 'rounded'; initials?: string }) => {
  return (
    <Avatar size={size} shape={shape}>
      <AvatarImage src="" alt="User" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};`;
  } else if (name === 'ListItem') {
    storyImports = `import { ListItem } from '../components/atoms/ListItem';
import { User, ChevronRight } from 'lucide-react';

const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;
const iconSize = { sm: 16, md: 20, lg: 24 } as const;

const ListItemDemo = ({ variant, size = 'md', children }: { variant?: 'default' | 'bordered'; size?: 'sm' | 'md' | 'lg'; children?: string }) => {
  const s = iconSize[size];
  return (
    <div className="w-full max-w-sm">
      <ListItem variant={variant} size={size} leading={<User size={s} />} trailing={<ChevronRight size={s} />}>
        <span className={bodySize[size]}>{children}</span>
      </ListItem>
    </div>
  );
};`;
  } else if (name === 'Stepper') {
    storyImports = `import { Stepper, Step } from '../components/atoms/Stepper';

const StepperDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full max-w-lg">
      <Stepper size={size}>
        <Step state="completed" step={1} label="Account" size={size} />
        <Step state="active" step={2} label="Profile" size={size} />
        <Step state="incomplete" step={3} label="Review" size={size} showConnector={false} />
      </Stepper>
    </div>
  );
};`;
  } else if (name === 'Carousel') {
    storyImports = `import { Carousel } from '../components/atoms/Carousel';

const slides = [
  { bg: 'bg-primary-container', label: 'Slide 1' },
  { bg: 'bg-secondary-container', label: 'Slide 2' },
  { bg: 'bg-success-container', label: 'Slide 3' },
];

const CarouselDemo = () => {
  return (
    <div className="w-full max-w-md">
      <Carousel>
        {slides.map((slide) => (
          <div key={slide.label} className={\`\${slide.bg} rounded-card flex items-center justify-center h-48 text-title-md font-semibold\`}>
            {slide.label}
          </div>
        ))}
      </Carousel>
    </div>
  );
};`;
  } else if (name === 'TreeView') {
    storyImports = `import { TreeView } from '../components/atoms/TreeView';
import type { TreeNodeData } from '../components/atoms/TreeView';

const sampleData: TreeNodeData[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'input', label: 'Input.tsx' },
          { id: 'card', label: 'Card.tsx' },
        ],
      },
      {
        id: 'hooks',
        label: 'hooks',
        children: [
          { id: 'use-theme', label: 'useTheme.ts' },
          { id: 'use-media', label: 'useMediaQuery.ts' },
        ],
      },
      { id: 'app', label: 'App.tsx' },
      { id: 'index', label: 'index.ts' },
    ],
  },
  { id: 'package', label: 'package.json' },
  { id: 'readme', label: 'README.md' },
];

const TreeViewDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full max-w-sm">
      <TreeView data={sampleData} size={size} />
    </div>
  );
};`;
  } else if (name === 'Toast') {
    storyImports = `import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastAction, ToastClose } from '../components/atoms/Toast';
import { Button } from '../components/atoms/Button';
import { useState, useRef, useEffect } from 'react';

type ToastData = { id: number; variant: string; title: string; description: string };

const ToastDemo = ({ variant = 'default', size = 'md' }: { variant?: 'default' | 'error' | 'success' | 'warning' | 'info'; size?: 'sm' | 'md' | 'lg' }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counter = useRef(0);

  const addToast = () => {
    counter.current++;
    setToasts((prev) => [...prev, {
      id: counter.current,
      variant,
      title: variant === 'error' ? 'Something went wrong' : variant === 'success' ? 'Changes saved' : variant === 'warning' ? 'Check your input' : variant === 'info' ? 'New update available' : 'Notification',
      description: 'This is a toast message description.',
    }]);
  };

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastProvider>
      <Button variant="default" size={size} onClick={addToast}>Show Toast</Button>
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant as any} size={size} onOpenChange={(open) => { if (!open) removeToast(t.id); }}>
          <div className="flex flex-col gap-1 flex-1">
            <ToastTitle>{t.title}</ToastTitle>
            <ToastDescription>{t.description}</ToastDescription>
          </div>
          <ToastAction altText="Undo">Undo</ToastAction>
          <ToastClose size={size} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
};`;
  } else if (name === 'NavigationMenu') {
    storyImports = `import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
} from '../components/atoms/NavigationMenu';

const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;

const NavigationMenuDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full pt-2 pb-48">
    <NavigationMenu size={size}>
      <NavigationMenuList size={size}>
        <NavigationMenuItem>
          <NavigationMenuTrigger size={size}>Getting Started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 w-[400px]">
              <li><NavigationMenuLink asChild><a href="#" className={\`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 \${bodySize[size]}\`}><div className="font-semibold mb-1">Introduction</div><p className="text-on-surface-variant">Learn the basics of the design system.</p></a></NavigationMenuLink></li>
              <li><NavigationMenuLink asChild><a href="#" className={\`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 \${bodySize[size]}\`}><div className="font-semibold mb-1">Installation</div><p className="text-on-surface-variant">Set up your project with tokens and components.</p></a></NavigationMenuLink></li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger size={size}>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 w-[400px] md:grid-cols-2">
              <li><NavigationMenuLink asChild><a href="#" className={\`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 \${bodySize[size]}\`}><div className="font-semibold mb-1">Button</div><p className="text-on-surface-variant">Actions and form submissions.</p></a></NavigationMenuLink></li>
              <li><NavigationMenuLink asChild><a href="#" className={\`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 \${bodySize[size]}\`}><div className="font-semibold mb-1">Dialog</div><p className="text-on-surface-variant">Modal overlays for focused tasks.</p></a></NavigationMenuLink></li>
              <li><NavigationMenuLink asChild><a href="#" className={\`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 \${bodySize[size]}\`}><div className="font-semibold mb-1">Toast</div><p className="text-on-surface-variant">Temporary notifications.</p></a></NavigationMenuLink></li>
              <li><NavigationMenuLink asChild><a href="#" className={\`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 \${bodySize[size]}\`}><div className="font-semibold mb-1">Card</div><p className="text-on-surface-variant">Contained content surfaces.</p></a></NavigationMenuLink></li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <a href="#" className={\`inline-flex items-center justify-center rounded-component font-medium text-on-surface interactive cursor-pointer hover:bg-surface-1 \${bodySize[size]}\`} style={{ height: 'var(--size-ch-5)', padding: '0 1rem' }}>
              Documentation
            </a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
    </div>
  );
};`;
  } else if (name === 'Pagination') {
    storyImports = `import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '../components/atoms/Pagination';

const PaginationDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <Pagination size={size}>
      <PaginationContent size={size}>
        <PaginationItem><PaginationPrevious size={size} href="#" /></PaginationItem>
        <PaginationItem><PaginationLink size={size} href="#">1</PaginationLink></PaginationItem>
        <PaginationItem><PaginationLink size={size} href="#" isActive>2</PaginationLink></PaginationItem>
        <PaginationItem><PaginationLink size={size} href="#">3</PaginationLink></PaginationItem>
        <PaginationItem><PaginationEllipsis size={size} /></PaginationItem>
        <PaginationItem><PaginationLink size={size} href="#">12</PaginationLink></PaginationItem>
        <PaginationItem><PaginationNext size={size} href="#" /></PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};`;
  } else if (name === 'FileUpload') {
    storyImports = `import { FileUpload } from '../components/atoms/FileUpload';

const FileUploadDemo = ({ variant = 'default', size = 'md' }: { variant?: 'default' | 'dragover'; size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full max-w-md">
      <FileUpload variant={variant} size={size} onFilesSelected={(files) => console.log('Files:', files)} />
    </div>
  );
};`;
  } else if (name === 'InputOTP') {
    storyImports = `import { InputOTP } from '../components/atoms/InputOTP';
import { useState } from 'react';

const InputOTPDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [value, setValue] = useState('');
  return (
    <div className="flex flex-col gap-2 items-center">
      <InputOTP size={size} length={6} value={value} onValueChange={setValue} />
      <p className="text-body-sm text-on-surface-variant">Value: {value || '(empty)'}</p>
    </div>
  );
};`;
  } else if (name === 'FormField') {
    storyImports = `import { FormField } from '../components/atoms/FormField';
import { Label } from '../components/atoms/Label';
import { Input } from '../components/atoms/Input';
import { HelperText } from '../components/atoms/HelperText';
import { Checkbox } from '../components/atoms/Checkbox';
import { Switch } from '../components/atoms/Switch';

const FormFieldDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="flex flex-col gap-section w-full max-w-sm">
      <FormField>
        <Label size={size}>Email address</Label>
        <Input size={size} placeholder="you@example.com" />
        <HelperText size={size}>We\\'ll never share your email.</HelperText>
      </FormField>

      <FormField error>
        <Label size={size}>Username</Label>
        <Input size={size} state="error" placeholder="Enter username" />
        <HelperText size={size} state="error">Username is already taken.</HelperText>
      </FormField>

      <FormField>
        <div className="flex items-start gap-component-compact">
          <Checkbox size={size} />
          <div className="flex flex-col gap-0.5">
            <Label size={size}>Accept terms and conditions</Label>
            <HelperText size={size}>You must agree before submitting.</HelperText>
          </div>
        </div>
      </FormField>

      <FormField>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label size={size}>Push notifications</Label>
            <HelperText size={size}>Receive alerts on your device.</HelperText>
          </div>
          <Switch size={size} />
        </div>
      </FormField>
    </div>
  );
};`;
  } else if (name === 'Skeleton') {
    storyImports = `import { Skeleton } from '../components/atoms/Skeleton';

const gapSize = { sm: 'gap-2', md: 'gap-3', lg: 'gap-4' } as const;

const SkeletonDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const gap = gapSize[size];
  return (
    <div className={\`flex flex-col \${gap} w-full max-w-sm\`}>
      <div className={\`flex items-center \${gap}\`}>
        <Skeleton shape="avatar" />
        <div className={\`flex flex-col gap-2 flex-1\`}>
          <Skeleton shape="text" className="w-3/4" />
          <Skeleton shape="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton shape="card" />
      <div className="flex flex-col gap-2">
        <Skeleton shape="text" />
        <Skeleton shape="text" className="w-5/6" />
        <Skeleton shape="text" className="w-4/6" />
      </div>
    </div>
  );
};`;
  } else if (name === 'CommandPalette') {
    storyImports = `import {
  CommandPalette, CommandPaletteInput, CommandPaletteList,
  CommandPaletteEmpty, CommandPaletteGroup, CommandPaletteItem,
  CommandPaletteSeparator, CommandPaletteShortcut,
} from '../components/atoms/CommandPalette';
import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react';

const CommandPaletteDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <CommandPalette size={size} className="w-full">
      <CommandPaletteInput size={size} placeholder="Type a command or search..." />
      <CommandPaletteList>
        <CommandPaletteEmpty>No results found.</CommandPaletteEmpty>
        <CommandPaletteGroup size={size} heading="Suggestions">
          <CommandPaletteItem size={size}><Calendar className="mr-2 size-icon-2" />Calendar</CommandPaletteItem>
          <CommandPaletteItem size={size}><Smile className="mr-2 size-icon-2" />Search Emoji</CommandPaletteItem>
          <CommandPaletteItem size={size}><Calculator className="mr-2 size-icon-2" />Calculator</CommandPaletteItem>
        </CommandPaletteGroup>
        <CommandPaletteSeparator />
        <CommandPaletteGroup size={size} heading="Settings">
          <CommandPaletteItem size={size}><User className="mr-2 size-icon-2" />Profile<CommandPaletteShortcut>⌘P</CommandPaletteShortcut></CommandPaletteItem>
          <CommandPaletteItem size={size}><CreditCard className="mr-2 size-icon-2" />Billing<CommandPaletteShortcut>⌘B</CommandPaletteShortcut></CommandPaletteItem>
          <CommandPaletteItem size={size}><Settings className="mr-2 size-icon-2" />Settings<CommandPaletteShortcut>⌘S</CommandPaletteShortcut></CommandPaletteItem>
        </CommandPaletteGroup>
      </CommandPaletteList>
    </CommandPalette>
  );
};`;
  } else if (name === 'Combobox') {
    storyImports = `import { Combobox } from '../components/atoms/Combobox';
import { useState } from 'react';

const frameworks = [
  { value: 'next', label: 'Next.js' },
  { value: 'svelte', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
];

const ComboboxDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [value, setValue] = useState('');
  return (
    <div className="w-full max-w-xs">
      <Combobox
        size={size}
        options={frameworks}
        value={value}
        onValueChange={setValue}
        placeholder="Select framework..."
        searchPlaceholder="Search framework..."
      />
    </div>
  );
};`;
  } else if (name === 'Calendar') {
    storyImports = `import { Calendar } from '../components/atoms/Calendar';
import { useState } from 'react';

const CalendarDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <Calendar size={size} mode="single" selected={date} onSelect={setDate} />
  );
};`;
  } else if (name === 'DatePicker') {
    storyImports = `import { DatePicker } from '../components/atoms/DatePicker';
import { useState } from 'react';

const DatePickerDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <div className="w-full max-w-xs">
      <DatePicker size={size} value={date} onValueChange={setDate} />
    </div>
  );
};`;
  } else if (name === 'DropdownMenu') {
    storyImports = `import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuCheckboxItem, DropdownMenuShortcut,
} from '../components/atoms/DropdownMenu';
import { Button } from '../components/atoms/Button';
import { useState } from 'react';

const DropdownMenuDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [bookmarksChecked, setBookmarksChecked] = useState(true);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size={size}>Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent size={size}>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem size={size}>Profile<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem size={size}>Settings<DropdownMenuShortcut>⌘S</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem size={size}>Keyboard shortcuts<DropdownMenuShortcut>⌘K</DropdownMenuShortcut></DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem size={size} checked={bookmarksChecked} onCheckedChange={setBookmarksChecked}>
          Show Bookmarks
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger size={size}>Invite users</DropdownMenuSubTrigger>
          <DropdownMenuSubContent size={size}>
            <DropdownMenuItem size={size}>Email</DropdownMenuItem>
            <DropdownMenuItem size={size}>Message</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem size={size} disabled>API<DropdownMenuShortcut>⌘A</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuItem size={size}>Log out<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};`;
  } else if (name === 'ContextMenu') {
    storyImports = `import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuLabel,
  ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
  ContextMenuCheckboxItem, ContextMenuShortcut,
} from '../components/atoms/ContextMenu';
import { useState } from 'react';

const ContextMenuDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [showGrid, setShowGrid] = useState(false);
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-36 w-72 items-center justify-center rounded-card border border-dashed border-outline-subtle text-body-sm text-on-surface-variant">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent size={size}>
        <ContextMenuLabel>Edit</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem size={size}>Back<ContextMenuShortcut>⌘[</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem size={size}>Forward<ContextMenuShortcut>⌘]</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem size={size}>Reload<ContextMenuShortcut>⌘R</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem size={size} checked={showGrid} onCheckedChange={setShowGrid}>
          Show Grid
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger size={size}>More Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent size={size}>
            <ContextMenuItem size={size}>Save Page As…<ContextMenuShortcut>⌘S</ContextMenuShortcut></ContextMenuItem>
            <ContextMenuItem size={size}>Create Shortcut…</ContextMenuItem>
            <ContextMenuItem size={size}>Developer Tools</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};`;
  } else if (isToggleGroup) {
    storyImports = `import { ToggleGroup, ToggleGroupItem } from '../components/atoms/ToggleGroup';

const ToggleGroupDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <ToggleGroup type="single" size={size}>
      <ToggleGroupItem value="a" size={size}>Option A</ToggleGroupItem>
      <ToggleGroupItem value="b" size={size}>Option B</ToggleGroupItem>
      <ToggleGroupItem value="c" size={size}>Option C</ToggleGroupItem>
    </ToggleGroup>
  );
};`;
  } else if (needsIconImport) {
    storyImports = `import { ${name} } from '../components/atoms/${name}';\nimport { createElement } from 'react';\nimport { Plus } from 'lucide-react';`;
  }

  const isOverlay = ['Dialog', 'Sheet', 'AlertDialog'].includes(name);
  const isTable = name === 'Table';
  const isCompound = ['Tooltip', 'Popover', 'HoverCard', 'Accordion', 'Collapsible', 'Tabs', 'TopBar', 'Sidebar', 'BottomNav', 'Breadcrumbs', 'EmptyState', 'Avatar', 'ListItem', 'Stepper', 'TreeView', 'Carousel', 'DropdownMenu', 'ContextMenu', 'Toast', 'NavigationMenu', 'Pagination', 'FileUpload', 'InputOTP', 'CommandPalette', 'Combobox', 'Calendar', 'DatePicker', 'Skeleton', 'FormField', 'ToggleGroup'].includes(name);
  const componentRef = isSelect ? 'SelectDemo' : isRadio ? 'RadioDemo' : isOverlay ? `${name}Demo` : isTable ? 'TableDemo' : isCompound ? `${name}Demo` : name;

  let story = `${storyImports}

export const ${name.toLowerCase()}Story = {
  component: ${componentRef},
  name: '${formatDisplayName(name)}',
  defaultProps: {`;

  // Skip variant defaultProp for Radix components that manage their own state (Checkbox, Switch, Toggle)
  const radixManagesState = meta.template === 'radix' && ['checked', 'active'].includes(variantKey);
  const radixManagesToggleState = name === 'Toggle';
  const skipVariantProp = radixManagesState || radixManagesToggleState;

  if (isOverlay) {
    story += `
    size: '${defaultSize}',`;
    if (name === 'Sheet') story += `\n    side: 'right',`;
  } else if (isCompound) {
    // Compound demos have custom defaultProps per component
    if (name === 'Tooltip') {
      story += `\n    size: '${defaultSize}',\n    children: 'Save changes',`;
    } else if (name === 'Skeleton') {
      story += `\n    size: '${defaultSize}',`;
    } else if (name === 'Toast' || name === 'FileUpload') {
      story += `\n    variant: '${defaultVariant}',\n    size: '${defaultSize}',`;
    } else if (name === 'Popover' || name === 'HoverCard' || name === 'Tabs' || name === 'Sidebar' || name === 'BottomNav' || name === 'Breadcrumbs' || name === 'DropdownMenu' || name === 'ContextMenu' || name === 'NavigationMenu' || name === 'Pagination' || name === 'InputOTP' || name === 'CommandPalette' || name === 'Combobox' || name === 'Calendar' || name === 'DatePicker' || name === 'FormField' || name === 'ToggleGroup') {
      story += `\n    size: '${defaultSize}',`;
    } else if (name === 'Accordion') {
      story += `\n    variant: '${defaultVariant}',\n    size: '${defaultSize}',`;
    } else if (name === 'Collapsible') {
      story += `\n    variant: 'bordered',\n    size: '${defaultSize}',`;
    } else if (name === 'TopBar') {
      story += `\n    variant: '${defaultVariant}',\n    size: '${defaultSize}',`;
    } else if (name === 'EmptyState') {
      story += `\n    size: '${defaultSize}',\n    heading: 'No results found',\n    description: 'Try adjusting your search or filters to find what you\\'re looking for.',`;
    } else if (name === 'Avatar') {
      story += `\n    size: '${defaultSize}',\n    shape: 'circle',\n    initials: 'JI',`;
    } else if (name === 'ListItem') {
      story += `\n    variant: '${defaultVariant}',\n    size: '${defaultSize}',\n    children: 'Account Settings',`;
    } else if (name === 'Stepper') {
      story += `\n    size: '${defaultSize}',`;
    } else if (name === 'TreeView') {
      story += `\n    size: '${defaultSize}',`;
    } else if (name === 'Carousel') {
      // No props — carousel demo has no controls
    } else {
      story += `\n    size: '${defaultSize}',`;
    }
  } else if (isSelect) {
    story += `
    state: '${defaultVariant}',
    size: '${defaultSize}',
    placeholder: 'Select an option...',`;
  } else if (skipVariantProp) {
    story += `
    size: '${defaultSize}',`;
  } else if (name === 'Banner') {
    story += `
    ${variantPropName}: 'info',
    size: '${defaultSize}',`;
  } else {
    story += `
    ${variantPropName}: '${defaultVariant}',
    size: '${defaultSize}',`;
  }

  if (false) { // ToggleGroup is now a compound demo — old createElement pattern removed
  } else if (isFAB) {
    story += `\n    icon: createElement(Plus, { size: 20 }),`;
  } else if (iconOnly) {
    story += `\n    children: createElement(Plus, { size: 20 }),`;
  } else if (name === 'Banner') {
    story += `\n    children: 'Your session will expire in 5 minutes.',`;
    story += `\n    showLeadingIcon: true,`;
    story += `\n    showDismiss: true,`;
  } else if (name === 'ProgressBar') {
    story += `\n    value: 60,`;
  } else if (name === 'Kbd') {
    story += `\n    children: '⌘K',`;
  } else if (!selfClosing && !meta.noChildren && meta.element !== 'textarea' && !isCompound) {
    story += `\n    children: '${formatDisplayName(name)}',`;
  }
  const isTextInput = (selfClosing && meta.element === 'input' && !meta.inputType) || meta.element === 'textarea';
  if (isTextInput) story += `\n    placeholder: 'Enter text...',`;

  story += `
  },
  controls: [`;

  // Compound stories get custom controls
  if (isCompound) {
    const compoundControls = {
      'Tooltip': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`, `{ type: 'text' as const, prop: 'children', label: 'Label' }`],
      'Popover': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Accordion': [`{ type: 'select' as const, prop: 'variant', label: 'Variant', options: [${variantNames.map(v => `'${v}'`).join(', ')}] }`, `{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Collapsible': [`{ type: 'select' as const, prop: 'variant', label: 'Variant', options: [${variantNames.map(v => `'${v}'`).join(', ')}] }`, `{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Tabs': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'TopBar': [`{ type: 'select' as const, prop: 'variant', label: 'Variant', options: [${variantNames.map(v => `'${v}'`).join(', ')}] }`, `{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Sidebar': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'BottomNav': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Breadcrumbs': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'EmptyState': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`, `{ type: 'text' as const, prop: 'heading', label: 'Heading' }`, `{ type: 'text' as const, prop: 'description', label: 'Description' }`],
      'Avatar': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`, `{ type: 'select' as const, prop: 'shape', label: 'Shape', options: ['circle', 'rounded'] }`, `{ type: 'text' as const, prop: 'initials', label: 'Initials' }`],
      'ListItem': [`{ type: 'select' as const, prop: 'variant', label: 'Variant', options: [${variantNames.map(v => `'${v}'`).join(', ')}] }`, `{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`, `{ type: 'text' as const, prop: 'children', label: 'Label' }`],
      'Stepper': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'TreeView': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Carousel': [],
      'DropdownMenu': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'ContextMenu': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'HoverCard': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Toast': [`{ type: 'select' as const, prop: 'variant', label: 'Variant', options: [${variantNames.map(v => `'${v}'`).join(', ')}] }`, `{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'NavigationMenu': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Pagination': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'FileUpload': [`{ type: 'select' as const, prop: 'variant', label: 'Variant', options: [${variantNames.map(v => `'${v}'`).join(', ')}] }`, `{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'InputOTP': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'CommandPalette': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Combobox': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Calendar': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'DatePicker': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'Skeleton': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'FormField': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
      'ToggleGroup': [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`],
    };
    const controls = compoundControls[name] || [`{ type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] }`];
    for (const c of controls) story += `\n    ${c},`;
  } else {
  // Skip variant/state control for Radix components that manage their own state internally
  // (Toggle, Switch, Checkbox — but NOT Select, which uses state for visual error styling)
  // Also skip for overlay components (Dialog, Sheet, AlertDialog) — they have no user-facing variant
  if (!skipVariantProp && !isOverlay) {
    story += `\n    { type: 'select' as const, prop: '${variantPropName}', label: '${variantPropName.charAt(0).toUpperCase() + variantPropName.slice(1)}', options: [${variantNames.map(v => `'${v}'`).join(', ')}] },`;
  }
  story += `\n    { type: 'select' as const, prop: 'size', label: 'Size', options: [${sizeNames.map(s => `'${s}'`).join(', ')}] },`;
  if (name === 'Sheet') story += `\n    { type: 'select' as const, prop: 'side', label: 'Side', options: ['left', 'right', 'top', 'bottom'] },`;

  // Custom controls for specific non-compound components
  if (name === 'Banner') {
    story += `\n    { type: 'text' as const, prop: 'children', label: 'Label' },`;
    story += `\n    { type: 'boolean' as const, prop: 'showLeadingIcon', label: 'Leading Icon' },`;
    story += `\n    { type: 'boolean' as const, prop: 'showDismiss', label: 'Dismissible' },`;
  } else if (name === 'ProgressBar') {
    story += `\n    { type: 'text' as const, prop: 'value', label: 'Value (0-100)' },`;
  } else if (name === 'Kbd') {
    story += `\n    { type: 'text' as const, prop: 'children', label: 'Label' },`;
  } else {
  if (!selfClosing && !meta.noChildren && !iconOnly && !isFAB && !isToggleGroup && !isSelect && meta.element !== 'textarea') story += `\n    { type: 'text' as const, prop: 'children', label: 'Label' },`;
  // FAB has an optional label for extended mode
  if (isFAB) story += `\n    { type: 'text' as const, prop: 'label', label: 'Label (Extended)' },`;
  // Button has both text and icon-only modes
  if (name === 'Button') story += `\n    { type: 'boolean' as const, prop: 'iconOnly', label: 'Icon Only' },`;
  if (hasLeading) story += `\n    { type: 'boolean' as const, prop: 'showLeadingIcon', label: 'Leading Icon' },`;
  if (hasTrailing) story += `\n    { type: 'boolean' as const, prop: 'showTrailingIcon', label: 'Trailing Icon' },`;
  }

  // disabled only works on button/input/select/textarea elements
  const supportsDisabled = ['button', 'input', 'select', 'textarea'].includes(meta.element);
  if (supportsDisabled) story += `\n    { type: 'boolean' as const, prop: 'disabled', label: 'Disabled' },`;
  } // end non-compound controls

  story += `
  ],
};
`;
  return story;
}

function generateRegistry(registry) {
  // Group by category
  const categories = {};
  const imports = [];
  const storyEntries = [];

  for (const [name, def] of Object.entries(registry)) {
    const slug = def.key;
    const varName = `${name.toLowerCase()}Story`;
    imports.push(`import { ${varName} } from './${name.toLowerCase()}.story';`);
    storyEntries.push(`  '${slug}': ${varName},`);

    if (!categories[def.category]) categories[def.category] = [];
    categories[def.category].push(`'${slug}'`);
  }

  const categoryEntries = Object.entries(categories)
    .map(([cat, keys]) => `  '${cat}': [${keys.join(', ')}],`)
    .join('\n');

  return `/**
 * Component story registry — auto-generated.
 * Import this to get all available stories for the playground.
 */
${imports.join('\n')}

export const stories = {
${storyEntries.join('\n')}
};

export type StoryKey = keyof typeof stories;

export const storyCategories = {
${categoryEntries}
} as const;
`;
}

// Catalog output directory (loom/catalog/) — stories land alongside their atoms.
const CATALOG_DIR = path.resolve(__dirname, '../../catalog');

function generate(registry, outputDir) {
  // Catalog output: always loom/catalog/ regardless of outputDir.
  // outputDir is ignored here (kept in signature for orchestrator compatibility).
  fs.mkdirSync(CATALOG_DIR, { recursive: true });

  let count = 0;
  for (const [name, def] of Object.entries(registry)) {
    // Config-free utilities use a stub config
    const config = name === 'FormField'
      ? { variants: { default: {} }, default: { size: 'md' } }
      : def.baseKey
        ? resolveBase(def.source, def.key)
        : def.source[def.key];

    if (!config) continue;

    const story = generateStory(name, config, def);
    // Use .tsx for stories that contain JSX (compound component demos)
    const compoundNames = ['Tooltip', 'Popover', 'HoverCard', 'Accordion', 'Collapsible', 'Tabs', 'TopBar', 'Sidebar', 'BottomNav', 'Breadcrumbs', 'EmptyState', 'Avatar', 'ListItem', 'Dialog', 'Sheet', 'AlertDialog', 'Table', 'Stepper', 'TreeView', 'Carousel', 'DropdownMenu', 'ContextMenu', 'Toast', 'NavigationMenu', 'Pagination', 'FileUpload', 'InputOTP', 'CommandPalette', 'Combobox', 'Calendar', 'DatePicker', 'Skeleton', 'FormField', 'ToggleGroup'];
    const hasJSX = compoundNames.includes(name) || story.includes('<Select') || story.includes('<RadioGroup') || story.includes('createElement');
    const ext = hasJSX ? 'tsx' : 'ts';
    const otherExt = hasJSX ? 'ts' : 'tsx';
    const otherPath = path.join(CATALOG_DIR, `${def.key}.story.${otherExt}`);
    if (fs.existsSync(otherPath)) fs.unlinkSync(otherPath);
    fs.writeFileSync(path.join(CATALOG_DIR, `${def.key}.story.${ext}`), story);
    console.log(`  ${def.key}.story.${ext}`);
    count++;
  }

  // registry.ts deliberately not emitted — catalog uses auto-discovery from sibling .story.[ts|tsx] files
  // per CATALOG_SPEC.md § Auto-discovery in /design-system

  console.log(`\nStories: ${count} files → ${CATALOG_DIR}`);
  return count;
}

module.exports = { generate, generateStory, generateRegistry };
