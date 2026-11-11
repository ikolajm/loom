const { cls } = require('../shared');
const { filterSizes } = require('./helpers');

/**
 * Appearance is the class layer's; this carries behavior: Radix's roving focus, one Tab
 * stop per list with arrow keys between the tabs, and the tab-to-panel wiring.
 *
 * `keepMounted` on a panel is the one thing added. Radix's own `forceMount` keeps a panel
 * mounted and visible at once, because its `hidden` follows mounting rather than
 * selection, so a consumer keeping a view's state across a switch saw every panel. The
 * root tracks the selected value so a kept panel can hide itself by selection instead.
 * Radix stays controlled throughout: the root hands it the tracked value, falling back to
 * an empty string so it never flips from uncontrolled to controlled when the first tab is
 * picked.
 *
 * The size rides context from the list to its tabs, so a list is sized once.
 */
function generateRadixTabs(name, config) {
  const sizes = filterSizes(config.sizes);
  const sizeUnion = Object.keys(sizes).map((s) => `'${s}'`).join(' | ');
  const defaultSize = config.default && config.default.size ? config.default.size : 'md';

  return `'use client';

import { createContext, forwardRef, useContext, useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from './cn';

type TabsSize = ${sizeUnion};

const SelectedContext = createContext<string | undefined>(undefined);
const SizeContext = createContext<TabsSize>('${defaultSize}');

const Tabs = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ value, defaultValue, onValueChange, ...props }, ref) => {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const selected = value ?? uncontrolled;
  return (
    <SelectedContext.Provider value={selected}>
      <TabsPrimitive.Root
        ref={ref}
        value={selected ?? ''}
        onValueChange={(next) => {
          if (value === undefined) setUncontrolled(next);
          onValueChange?.(next);
        }}
        {...props}
      />
    </SelectedContext.Provider>
  );
});
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { size?: TabsSize }
>(({ size = '${defaultSize}', className, ...props }, ref) => (
  <SizeContext.Provider value={size}>
    <TabsPrimitive.List ref={ref} className={cn('${cls('tab-list', 'tabs')}', className)} {...props} />
  </SizeContext.Provider>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const size = useContext(SizeContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn('${cls('tab interactive control', 'tabs')}', className)}
      data-size={size}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// keepMounted keeps an inactive panel in the tree, hidden, so its state survives a switch.
const TabsContent = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>, 'forceMount'> & { keepMounted?: boolean }
>(({ keepMounted = false, value, ...props }, ref) => {
  const selected = useContext(SelectedContext);
  return (
    <TabsPrimitive.Content
      ref={ref}
      value={value}
      {...(keepMounted ? { forceMount: true as const, hidden: value !== selected } : {})}
      {...props}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
`;
}


module.exports = { generateRadixTabs };
