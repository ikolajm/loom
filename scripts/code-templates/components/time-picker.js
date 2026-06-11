// Time picker — Option A (Jacob's call): three composed Select atoms (hour / minute / period).
// Composes the existing Select substrate, so there's no masking logic and a11y comes for free.
function generateTimePicker(name, config, meta) {
  const defaultSize = config.default?.size || 'md';
  const sizeUnion = Object.keys(config.sizes || { sm: {}, md: {}, lg: {} })
    .filter(k => !k.startsWith('$')).map(k => `'${k}'`).join(' | ') || "'sm' | 'md' | 'lg'";

  return `'use client';

import { forwardRef } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import { cn } from './cn';

export type TimeValue = { hour: number; minute: number; period?: 'AM' | 'PM' };

type TimePickerProps = {
  value?: TimeValue;
  onValueChange?: (value: TimeValue) => void;
  size?: ${sizeUnion};
  minuteStep?: number;
  use24Hour?: boolean;
  disabled?: boolean;
  className?: string;
};

const pad = (n: number) => n.toString().padStart(2, '0');

const TimePicker = forwardRef<HTMLDivElement, TimePickerProps>(
  ({ value, onValueChange, size = '${defaultSize}', minuteStep = 5, use24Hour = false, disabled, className }, ref) => {
    const hours = use24Hour
      ? Array.from({ length: 24 }, (_, i) => i)
      : Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);
    const v: TimeValue = value ?? { hour: use24Hour ? 0 : 12, minute: 0, period: 'AM' };
    const update = (patch: Partial<TimeValue>) => onValueChange?.({ ...v, ...patch });

    return (
      <div ref={ref} className={cn('inline-flex items-center gap-2', className)}>
        <Select value={String(v.hour)} onValueChange={(h) => update({ hour: Number(h) })} disabled={disabled}>
          <SelectTrigger size={size} className="w-auto min-w-16"><SelectValue placeholder="--" /></SelectTrigger>
          <SelectContent>
            {hours.map((h) => <SelectItem key={h} value={String(h)}>{use24Hour ? pad(h) : h}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-on-surface-variant">:</span>
        <Select value={String(v.minute)} onValueChange={(m) => update({ minute: Number(m) })} disabled={disabled}>
          <SelectTrigger size={size} className="w-auto min-w-16"><SelectValue placeholder="--" /></SelectTrigger>
          <SelectContent>
            {minutes.map((m) => <SelectItem key={m} value={String(m)}>{pad(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        {!use24Hour && (
          <Select value={v.period} onValueChange={(p) => update({ period: p as 'AM' | 'PM' })} disabled={disabled}>
            <SelectTrigger size={size} className="w-auto min-w-16"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }
);
TimePicker.displayName = 'TimePicker';

export { TimePicker };
`;
}

module.exports = { generateTimePicker };
