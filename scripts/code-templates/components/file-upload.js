const { buildVariantStyles } = require('../shared');
const { filterSizes, buildSizeStylesWithText } = require('./helpers');

function generateFileUpload(name, config, meta) {
  const variantStyles = config.variants ? buildVariantStyles(config.variants) : {};
  const sizes = filterSizes(config.sizes);
  const sizeStyles = buildSizeStylesWithText(sizes, meta.textFamily);

  // Icon sizes per tier
  const iconSizeEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    if (sz['icon-size'] && sz['icon-size'].startsWith('icon/')) {
      iconSizeEntries[tier] = `size-${sz['icon-size'].replace('icon/', '')}`;
    }
  }

  const defaultSize = config.default?.size || 'md';

  return `'use client';

import { forwardRef, useCallback, useState, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Upload } from 'lucide-react';
import { cn } from './cn';

const fileUploadVariants = cva(
  'flex flex-col items-center justify-center border-2 border-dashed cursor-pointer transition-colors',
  {
    variants: {
      variant: {
${Object.entries(variantStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
      size: {
${Object.entries(sizeStyles).map(([k, v]) => `        ${k}: '${v}',`).join('\n')}
      },
    },
    defaultVariants: { variant: '${config.default?.variant || 'default'}', size: '${defaultSize}' },
  }
);

const iconSizeMap: Record<string, string> = {
${Object.entries(iconSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type FileUploadProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof fileUploadVariants>
  & {
    accept?: string;
    multiple?: boolean;
    onFilesSelected?: (files: File[]) => void;
    disabled?: boolean;
  };

const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(
  ({ variant, size = '${defaultSize}', accept, multiple, onFilesSelected, disabled, className, children, ...props }, ref) => {
    const [isDragover, setIsDragover] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragover(true);
    }, [disabled]);

    const handleDragLeave = useCallback(() => setIsDragover(false), []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragover(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      onFilesSelected?.(files);
    }, [disabled, onFilesSelected]);

    const handleClick = useCallback(() => {
      if (!disabled) inputRef.current?.click();
    }, [disabled]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      onFilesSelected?.(files);
    }, [onFilesSelected]);

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={cn(
          fileUploadVariants({ variant: isDragover ? 'dragover' : variant, size }),
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        {...props}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={handleChange}
          disabled={disabled}
        />
        {children || (
          <>
            <Upload className={cn('text-on-surface-variant', iconSizeMap[size || '${defaultSize}'])} />
            <p className="font-medium">Drop files here or click to browse</p>
            <p className="text-on-surface-variant text-body-sm">Supports any file type</p>
          </>
        )}
      </div>
    );
  }
);
FileUpload.displayName = 'FileUpload';

export { FileUpload, fileUploadVariants };
`;
}

module.exports = { generateFileUpload };
