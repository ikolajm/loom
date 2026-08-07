const { buildVariantStyles } = require('../shared');
const { filterSizes, textRoleClass } = require('./helpers');

function generateInputOTP(name, config, meta) {
  const states = config.state || {};
  const stateStyles = buildVariantStyles(states);
  const sizes = filterSizes(config.sizes);
  const defaultSize = config.default?.size || 'md';

  // Build cell size map: cell-size → size-ch-N (square), radius, font, border
  const cellSizeEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const classes = [];
    if (sz['cell-size']) classes.push(`size-${sz['cell-size'].replace('height/', '')}`);
    if (sz.radius === 'radius/input') classes.push('rounded-input');
    else if (sz.radius === 'radius/component') classes.push('rounded-component');
    const otpRole = textRoleClass(sz.text);
    if (otpRole) classes.push(otpRole);
    if (sz['border-width'] === 'border-width/bw-2') classes.push('border-2');
    else classes.push('border');
    cellSizeEntries[tier] = classes.join(' ');
  }

  // Gap per size
  const gapEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const m = sz.gap?.match(/\{scale\.(\d+)\}/);
    if (m) gapEntries[tier] = `gap-${m[1]}`;
  }

  return `'use client';

import { forwardRef, useRef, useCallback, useState, useEffect } from 'react';
import { cn } from './cn';

const cellSizeMap: Record<string, string> = {
${Object.entries(cellSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const gapMap: Record<string, string> = {
${Object.entries(gapEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type InputOTPProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: ${Object.keys(sizes).map(k => `'${k}'`).join(' | ')};
  length?: number;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
};

const InputOTP = forwardRef<HTMLDivElement, InputOTPProps>(
  ({ size = '${defaultSize}', length = 6, value = '', onValueChange, disabled, error, className, ...props }, ref) => {
    const [digits, setDigits] = useState<string[]>(value.split('').concat(Array(length).fill('')).slice(0, length));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
      setDigits(value.split('').concat(Array(length).fill('')).slice(0, length));
    }, [value, length]);

    const handleChange = useCallback((index: number, char: string) => {
      if (disabled) return;
      const next = [...digits];
      next[index] = char.slice(-1);
      setDigits(next);
      onValueChange?.(next.join(''));
      if (char && index < length - 1) inputRefs.current[index + 1]?.focus();
    }, [digits, disabled, length, onValueChange]);

    const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }, [digits]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      e.preventDefault();
      if (disabled) return;
      const pasted = e.clipboardData.getData('text').replace(/\\D/g, '').slice(0, length);
      const next = pasted.split('').concat(Array(length).fill('')).slice(0, length);
      setDigits(next);
      onValueChange?.(next.join(''));
      const focusIdx = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIdx]?.focus();
    }, [disabled, length, onValueChange]);

    const borderColor = error ? 'border-error' : 'border-outline-subtle';
    const focusBorder = error ? 'focus:border-error' : 'focus:border-primary';

    return (
      <div ref={ref} className={cn('flex items-center', gapMap[size], className)} onPaste={handlePaste} {...props}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={disabled}
            className={cn(
              'text-center font-semibold tracking-[0.1em] bg-surface text-on-surface outline-none transition-colors',
              borderColor, focusBorder,
              disabled && 'opacity-(--opacity-disabled) cursor-not-allowed',
              cellSizeMap[size],
            )}
          />
        ))}
      </div>
    );
  }
);
InputOTP.displayName = 'InputOTP';

export { InputOTP };
`;
}

module.exports = { generateInputOTP };
