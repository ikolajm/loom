const { buildVariantStyles, buildSizeStyles } = require('../shared');
const { filterSizes, resolveConfig, buildSizeStylesWithText } = require('./helpers');

function pxToClass(px) {
  const num = parseInt(px);
  // Tailwind size scale: 4=16px, 5=20px, 6=24px
  const map = { 16: '4', 20: '5', 24: '6', 28: '7', 32: '8' };
  return map[num] || `[${px}]`;
}

function generateRadixCheckbox(name, config, meta) {
  const resolved = resolveConfig(meta.source, meta.key, meta.baseKey);
  const checked = resolved.checked || {};
  const sizes = filterSizes(resolved.sizes);
  const radius = resolved.radius === 'radius/pill' ? 'rounded-full' : 'rounded-component';

  // Build size classes from config
  const sizeEntries = Object.entries(sizes).map(([tier, s]) => {
    const sz = pxToClass(s.size);
    // Icon is ~80% of control size
    const iconNum = Math.round(parseInt(s.size) * 0.8);
    const iconSz = pxToClass(iconNum + 'px');
    return [tier, { control: `size-${sz}`, icon: `size-${iconSz}` }];
  });

  const sizeVariants = sizeEntries.map(([tier, cls]) => `      ${tier}: '${cls.control}',`).join('\n');
  const iconSizeMap = sizeEntries.map(([tier, cls]) => `  ${tier}: '${cls.icon}',`).join('\n');

  return `'use client';

import { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';
import { cn } from './cn';

const checkboxVariants = cva(
  'peer shrink-0 cursor-pointer ${radius} border border-outline transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-on-primary',
  {
    variants: {
      size: {
${sizeVariants}
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const checkboxIconSize: Record<string, string> = {
${iconSizeMap}
};

type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
  & VariantProps<typeof checkboxVariants>;

const Checkbox = forwardRef<React.ComponentRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ size, className, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(checkboxVariants({ size }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center')}>
        <Check className={checkboxIconSize[size || 'md']} strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
);
Checkbox.displayName = 'Checkbox';

export { Checkbox, checkboxVariants };
`;
}

function generateRadixSwitch(name, config, meta) {
  const resolved = resolveConfig(meta.source, meta.key, meta.baseKey);
  const sizes = filterSizes(resolved.sizes);

  // Build size variants from config: width, height, thumb size, translate distance
  const sizeEntries = Object.entries(sizes).map(([tier, s]) => {
    const w = parseInt(s.width);
    const h = parseInt(s.height);
    const thumb = h - 4; // 2px inset on each side
    const translateX = w - h; // thumb slides from start to end
    return { tier, w, h, thumb, translateX };
  });

  const trackSizes = sizeEntries.map(s =>
    `      ${s.tier}: 'h-[${s.h}px] w-[${s.w}px]',`
  ).join('\n');

  const thumbSizes = sizeEntries.map(s =>
    `  ${s.tier}: { size: 'size-[${s.thumb}px]', translate: 'data-[state=checked]:translate-x-[${s.translateX}px]' },`
  ).join('\n');

  return `'use client';

import { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-pill transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-surface-1',
  {
    variants: {
      size: {
${trackSizes}
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const switchThumbConfig: Record<string, { size: string; translate: string }> = {
${thumbSizes}
};

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
  & VariantProps<typeof switchVariants>;

const Switch = forwardRef<React.ComponentRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ size, className, ...props }, ref) => {
    const thumb = switchThumbConfig[size || 'md'];
    return (
      <SwitchPrimitive.Root
        ref={ref}
        className={cn(switchVariants({ size }), className)}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'pointer-events-none block rounded-full transition-transform data-[state=unchecked]:translate-x-0.5',
            'data-[state=checked]:bg-on-primary data-[state=unchecked]:bg-on-surface-variant',
            thumb.size,
            thumb.translate,
          )}
        />
      </SwitchPrimitive.Root>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch, switchVariants };
`;
}

function generateRadixRadio(name, config, meta) {
  const resolved = resolveConfig(meta.source, meta.key, meta.baseKey);
  const sizes = filterSizes(resolved.sizes);

  const sizeEntries = Object.entries(sizes).map(([tier, s]) => {
    const sz = pxToClass(s.size);
    // Inner dot is ~40% of control size
    const dotNum = Math.round(parseInt(s.size) * 0.4);
    const dotSz = pxToClass(dotNum + 'px');
    return [tier, { control: `size-${sz}`, dot: `size-${dotSz}` }];
  });

  const sizeVariants = sizeEntries.map(([tier, cls]) => `      ${tier}: '${cls.control}',`).join('\n');
  const dotSizeMap = sizeEntries.map(([tier, cls]) => `  ${tier}: '${cls.dot}',`).join('\n');

  return `'use client';

import { forwardRef } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const radioItemVariants = cva(
  'aspect-square rounded-full border-2 border-outline transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary',
  {
    variants: {
      size: {
${sizeVariants}
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const radioDotSize: Record<string, string> = {
${dotSizeMap}
};

const RadioGroup = forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-2', className)} {...props} />
));
RadioGroup.displayName = 'RadioGroup';

type RadioGroupItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
  & VariantProps<typeof radioItemVariants>;

const RadioGroupItem = forwardRef<React.ComponentRef<typeof RadioGroupPrimitive.Item>, RadioGroupItemProps>(
  ({ size, className, ...props }, ref) => (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(radioItemVariants({ size }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className={cn('rounded-full bg-primary', radioDotSize[size || 'md'])} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
);
RadioGroupItem.displayName = 'RadioGroupItem';

// Alias for story/registry compatibility
const Radio = RadioGroup;

export { RadioGroup, RadioGroupItem, Radio, radioItemVariants };
`;
}

function generateRadixSlider(name, config, meta) {
  const resolved = resolveConfig(meta.source, meta.key, meta.baseKey);
  const sizes = filterSizes(resolved.sizes);

  // scale.1 = 4px, scale.2 = 8px
  const trackHeightMap = { '{scale.1}': '1', '{scale.2}': '2' };

  const sizeEntries = Object.entries(sizes).map(([tier, s]) => {
    const trackH = trackHeightMap[s['track-height']] || '1';
    const thumbSz = pxToClass(s['thumb-size']);
    return { tier, trackH, thumbSz };
  });

  const sliderSizeConfig = sizeEntries.map(s =>
    `  ${s.tier}: { track: 'h-${s.trackH}', thumb: 'size-${s.thumbSz}' },`
  ).join('\n');

  return `'use client';

import { forwardRef } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from './cn';

const sliderSizeConfig: Record<string, { track: string; thumb: string }> = {
${sliderSizeConfig}
};

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  size?: 'sm' | 'md' | 'lg';
};

const Slider = forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ size = 'md', className, ...props }, ref) => {
    const s = sliderSizeConfig[size];
    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn('relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[disabled]:pointer-events-none', className)}
        {...props}
      >
        <SliderPrimitive.Track className={cn('relative w-full grow overflow-hidden rounded-pill bg-surface-1', s.track)}>
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className={cn('block rounded-full bg-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none', s.thumb)} />
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
`;
}

function generateRadixSelect(name, config, meta) {
  const resolved = resolveConfig(meta.source, meta.key, meta.baseKey);
  const sizes = filterSizes(resolved.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);
  const stateStyles = resolved.state ? buildVariantStyles(resolved.state) : {};

  return `'use client';

import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from './cn';

const selectTriggerVariants = cva(
  'flex items-center justify-between w-full interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed data-[placeholder]:text-on-surface-variant',
  {
    variants: {
      state: {
${Object.entries(stateStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
      size: {
${Object.entries(sizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: {
      state: '${resolved.default?.state || 'default'}',
      size: '${resolved.default?.size || 'md'}',
    },
  }
);

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & VariantProps<typeof selectTriggerVariants>
>(({ state, size, className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(selectTriggerVariants({ state, size }), className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 shrink-0 text-on-surface-variant" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-[var(--z-popover)] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-input bg-surface-1 text-on-surface border border-outline-subtle shadow-[var(--shadow-2)] animate-fade-in',
        position === 'popper' && 'translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'w-full')}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

const SelectItem = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full items-center rounded-component px-3 py-2 pr-8 text-action-sm cursor-pointer select-none',
      'focus:bg-surface-2 focus:text-on-surface focus:outline-none',
      'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

const SelectSeparator = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn('my-1 h-px bg-outline-subtle', className)} {...props} />
));
SelectSeparator.displayName = 'SelectSeparator';

const SelectGroup = SelectPrimitive.Group;

const SelectLabel = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn('px-3 py-1.5 text-label-sm text-on-surface-variant font-semibold', className)} {...props} />
));
SelectLabel.displayName = 'SelectLabel';

export {
  Select, SelectValue, SelectTrigger, SelectContent,
  SelectItem, SelectSeparator, SelectGroup, SelectLabel,
  selectTriggerVariants,
};
`;
}

module.exports = {
  generateRadixCheckbox,
  generateRadixSwitch,
  generateRadixRadio,
  generateRadixSlider,
  generateRadixSelect,
};
