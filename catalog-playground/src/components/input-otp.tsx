'use client';

import { forwardRef, useRef, useCallback, useState, useEffect } from 'react';
import { cn } from './cn';

const cellSizeMap: Record<string, string> = {
  sm: 'size-ch-5 rounded-input text-[16px] leading-[24px] border',
  md: 'size-ch-7 rounded-input text-[20px] leading-[28px] border',
  lg: 'size-ch-9 rounded-input text-[24px] leading-[32px] border-2',
};

const gapMap: Record<string, string> = {
  sm: 'gap-2',
  md: 'gap-2',
  lg: 'gap-3',
};

type InputOTPProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg';
  length?: number;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
};

const InputOTP = forwardRef<HTMLDivElement, InputOTPProps>(
  ({ size = 'md', length = 6, value = '', onValueChange, disabled, error, className, ...props }, ref) => {
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
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
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
              disabled && 'opacity-50 cursor-not-allowed',
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
