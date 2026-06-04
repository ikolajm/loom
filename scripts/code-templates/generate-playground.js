/**
 * Generate the ComponentPlayground.tsx file.
 * Writes: playground/ComponentPlayground.tsx
 *
 * Uses the design system's own components for controls:
 * Select, Input, Checkbox, Label, Separator, Card.
 */
const fs = require('fs');
const path = require('path');

const PLAYGROUND_TSX = `'use client';

import { useState, type ComponentType, createElement } from 'react';
import { Star } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/atoms/Select';
import { Input } from '@/components/atoms/Input';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Label } from '@/components/atoms/Label';
import { Card } from '@/components/atoms/Card';

// --- Control types ---
export type ControlDef =
  | { type: 'select'; prop: string; label: string; options: string[] }
  | { type: 'boolean'; prop: string; label: string }
  | { type: 'text'; prop: string; label: string };

export interface StoryDef {
  component: ComponentType<any>;
  name: string;
  defaultProps: Record<string, any>;
  controls: ControlDef[];
}

// --- Control components ---
function SelectControl({
  control,
  value,
  onChange,
}: {
  control: Extract<ControlDef, { type: 'select' }>;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-component">
      <Label size="sm" className="justify-start">{control.label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="sm" className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {control.options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function BooleanControl({
  control,
  value,
  onChange,
}: {
  control: Extract<ControlDef, { type: 'boolean' }>;
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-component">
      <Label size="sm" className="justify-start">{control.label}</Label>
      <Checkbox
        checked={value}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
    </div>
  );
}

function TextControl({
  control,
  value,
  onChange,
}: {
  control: Extract<ControlDef, { type: 'text' }>;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-component">
      <Label size="sm" className="justify-start">{control.label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="sm"
        className="w-48"
      />
    </div>
  );
}

// --- Icon mapping ---
// Convention: showLeadingIcon/showTrailingIcon boolean controls
// map to leadingIcon/trailingIcon ReactNode props with a placeholder icon.
function resolveIconProps(props: Record<string, any>): Record<string, any> {
  const resolved = { ...props };
  // iconOnly: replace children with an icon
  if (resolved.iconOnly) {
    resolved.children = createElement(Star, { size: 16 });
  }
  for (const key of Object.keys(resolved)) {
    if (key.startsWith('show') && key.endsWith('Icon') && resolved[key] === true) {
      const realProp = key.slice(4, 5).toLowerCase() + key.slice(5); // showLeadingIcon → leadingIcon
      resolved[realProp] = createElement(Star, { size: 16 });
      delete resolved[key];
    } else if (key.startsWith('show') && key.endsWith('Icon')) {
      delete resolved[key];
    }
  }
  return resolved;
}

// --- Playground ---
export function ComponentPlayground({ story }: { story: StoryDef }) {
  const [props, setProps] = useState<Record<string, any>>(story.defaultProps);

  const updateProp = (prop: string, value: any) => {
    setProps((prev) => ({ ...prev, [prop]: value }));
  };

  const Component = story.component;

  return (
    <div className="flex flex-col gap-section">
      {/* Preview */}
      <Card variant="outline" className="flex items-center justify-center min-h-[200px]">
        <Component {...resolveIconProps(props)} />
      </Card>

      {/* Controls */}
      <Card variant="default" size="sm">
        <h3 className="text-label-md text-on-surface-variant font-semibold uppercase tracking-wider">Controls</h3>
        <div className="flex flex-col divide-y divide-outline-subtle">
          {story.controls.map((control) => {
            // Hide text/icon controls when iconOnly is active
            const hideWhenIconOnly = ['children', 'showLeadingIcon', 'showTrailingIcon'];
            if (props.iconOnly && hideWhenIconOnly.includes(control.prop)) return null;

            const value = props[control.prop] ?? story.defaultProps[control.prop];

            switch (control.type) {
              case 'select':
                return (
                  <SelectControl
                    key={control.prop}
                    control={control}
                    value={value}
                    onChange={(val) => updateProp(control.prop, val)}
                  />
                );
              case 'boolean':
                return (
                  <BooleanControl
                    key={control.prop}
                    control={control}
                    value={!!value}
                    onChange={(val) => updateProp(control.prop, val)}
                  />
                );
              case 'text':
                return (
                  <TextControl
                    key={control.prop}
                    control={control}
                    value={value ?? ''}
                    onChange={(val) => updateProp(control.prop, val)}
                  />
                );
            }
          })}
        </div>
      </Card>
    </div>
  );
}
`;

function generate(configs, outputDir) {
  fs.mkdirSync(path.join(outputDir, 'playground'), { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'playground', 'ComponentPlayground.tsx'), PLAYGROUND_TSX);
  console.log('  playground/ComponentPlayground.tsx');
}

module.exports = { generate };
