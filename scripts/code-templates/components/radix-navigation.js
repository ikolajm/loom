const { buildVariantStyles, buildTypographyClasses } = require('../shared');
const { filterSizes, buildSizeStylesWithText, extractIconSizes, textRoleClass } = require('./helpers');

/**
 * Build trigger/content size maps from config sizes that have header-* or trigger-* prefixed keys.
 * Returns { triggerSize, chevronSize, contentPadding, contentText } as Record<string, string> source code.
 */
function buildDisclosureSizeMaps(config) {
  const sizes = filterSizes(config.sizes);
  const trigger = {};
  const chevron = {};
  const contentPad = {};
  const contentText = {};

  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const tc = [];
    // Height — try header-height, trigger-height, then height
    const h = sz['header-height'] || sz['trigger-height'] || sz.height;
    if (h) {
      const hClass = h.startsWith('height/') ? h.replace('height/', '') : null;
      if (hClass) tc.push(`h-${hClass}`);
    }
    // Padding
    const px = sz['header-x-padding'] || sz['trigger-x-padding'] || sz['x-padding'];
    if (px) {
      const match = px.match(/\{scale\.(\d+)\}/);
      if (match) tc.push(`px-${match[1]}`);
    }
    // Gap
    const gap = sz['header-gap'] || sz['trigger-gap'] || sz.gap;
    if (gap) {
      const match = gap.match(/\{scale\.(\d+)\}/);
      if (match) tc.push(`gap-${match[1]}`);
    }
    // Font size
    const tRole = textRoleClass(sz['header-text'] || sz['trigger-text'] || sz.text);
    if (tRole) tc.push(tRole);

    trigger[tier] = tc.join(' ');

    // Chevron/indicator size
    const indicator = sz.indicator;
    if (indicator && indicator.startsWith('icon/')) {
      chevron[tier] = `size-${indicator.replace('icon/', '')}`;
    }

    // Content padding — balanced p-N
    const cp = sz['content-padding'];
    if (cp) {
      const match = cp.match(/\{scale\.(\d+)\}/);
      if (match) contentPad[tier] = `p-${match[1]}`;
    }

    // Content text — body-{tier}
    contentText[tier] = `text-body-${tier}`;
  }

  return { trigger, chevron, contentPad, contentText };
}

function mapToRecord(map, indent = '  ') {
  return Object.entries(map).map(([k, v]) => `${indent}${k}: '${v}',`).join('\n');
}

function generateRadixTabs(name, config, meta) {
  const sizes = filterSizes(config.sizes);
  const defaultSize = config.default?.size || 'md';
  // Build list size styles — height + explicit font sizes only (no padding/gap on list)
  const listSizes = {};
  // Build trigger padding per size
  const triggerPadding = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const classes = [];
    const h = sz.height;
    if (h && h.startsWith('height/')) classes.push(`h-${h.replace('height/', '')}`);
    const listRole = textRoleClass(sz.text);
    if (listRole) classes.push(listRole);
    listSizes[tier] = classes.join(' ');
    // Trigger x-padding
    const px = sz['x-padding']?.match(/\{scale\.(\d+)\}/);
    if (px) triggerPadding[tier] = `px-${px[1]}`;
  }

  const typo = buildTypographyClasses(config);

  return `'use client';

import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const tabsListVariants = cva(
  'flex items-center border-b border-outline-subtle',
  {
    variants: {
      size: {
${Object.entries(listSizes).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: { size: '${config.default?.size || 'md'}' },
  }
);

const Tabs = TabsPrimitive.Root;

const TabsList = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>
>(({ size, className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn(tabsListVariants({ size }), className)} {...props} />
));
TabsList.displayName = 'TabsList';

const triggerPaddingMap: Record<string, string> = {
${Object.entries(triggerPadding).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type TabsSizeProps = { size?: ${Object.keys(sizes).map(k => `'${k}'`).join(' | ')} };

const TabsTrigger = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & TabsSizeProps
>(({ size = '${defaultSize}', className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'h-full${typo ? ' ' + typo : ''} cursor-pointer transition-colors',
      'control',
      'text-on-surface-variant hover:text-on-surface',
      'data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary',
      triggerPaddingMap[size],
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-4 control', className)} {...props} />
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
`;
}

function generateRadixAccordion(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const { trigger, chevron, contentPad, contentText } = buildDisclosureSizeMaps(config);

  return `'use client';

import { forwardRef } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';

const accordionVariants = cva('flex flex-col', {
  variants: {
    variant: {
${Object.entries(variantStyles).map(([k, v]) => `      ${k}: '${v}',`).join('\n')}
    },
  },
  defaultVariants: { variant: '${config.default?.variant || 'default'}' },
});

const Accordion = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & VariantProps<typeof accordionVariants>
>(({ variant, className, ...props }, ref) => (
  <AccordionPrimitive.Root ref={ref} className={cn(accordionVariants({ variant }), className)} {...props} />
));
Accordion.displayName = 'Accordion';

const AccordionItem = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn(className)} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

const triggerSize: Record<string, string> = {
${mapToRecord(trigger)}
};

const chevronSize: Record<string, string> = {
${mapToRecord(chevron)}
};

const contentPadding: Record<string, string> = {
${mapToRecord(contentPad)}
};

const contentText: Record<string, string> = {
${mapToRecord(contentText)}
};

const AccordionTrigger = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & { size?: 'sm' | 'md' | 'lg' }
>(({ size = 'md', className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between font-medium cursor-pointer transition-all',
        'hover:bg-surface-2 control',
        '[&[data-state=open]>svg]:rotate-180',
        triggerSize[size],
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn('shrink-0 transition-transform duration-200', chevronSize[size])} />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & { size?: 'sm' | 'md' | 'lg' }
>(({ size = 'md', className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn('overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down', contentText[size])}
    {...props}
  >
    <div className={cn('text-on-surface-variant', contentPadding[size], className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, accordionVariants };
`;
}

module.exports = { generateRadixTabs, generateRadixAccordion };
