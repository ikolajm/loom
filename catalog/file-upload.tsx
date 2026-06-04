'use client';

import { forwardRef, useCallback, useState, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Upload } from 'lucide-react';
import { cn } from './cn';

const fileUploadVariants = cva(
  'flex flex-col items-center justify-center border-2 border-dashed cursor-pointer transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface text-on-surface border-outline-subtle border',
        dragover: 'bg-primary-container text-on-primary-container border-primary border',
      },
      size: {
        sm: 'px-4 py-4 gap-2 rounded-card border-2 text-body-sm',
        md: 'px-6 py-6 gap-3 rounded-card border-2 text-body-md',
        lg: 'px-8 py-8 gap-4 rounded-card border-2 text-body-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

const iconSizeMap: Record<string, string> = {
  sm: 'size-icon-2',
  md: 'size-icon-3',
  lg: 'size-icon-4',
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
  ({ variant, size = 'md', accept, multiple, onFilesSelected, disabled, className, children, ...props }, ref) => {
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
            <Upload className={cn('text-on-surface-variant', iconSizeMap[size || 'md'])} />
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
