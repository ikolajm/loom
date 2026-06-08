'use client';

import { forwardRef, useCallback, useState, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Upload, File as FileIcon, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from './cn';
import { useFieldError } from './form-field';

const fileUploadVariants = cva(
  'relative flex flex-col items-center justify-center overflow-hidden border-2 border-dashed cursor-pointer transition-colors bg-surface text-on-surface border-outline-subtle border',
  {
    variants: {
      size: {
        sm: 'px-4 py-4 gap-2 rounded-card border-2 text-body-sm',
        md: 'px-6 py-6 gap-3 rounded-card border-2 text-body-md',
        lg: 'px-8 py-8 gap-4 rounded-card border-2 text-body-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const iconSizeMap: Record<string, string> = {
  sm: 'size-icon-2',
  md: 'size-icon-3',
  lg: 'size-icon-4',
};

// --- Status vocabulary, shared by the single-file dropzone state and the multi-file rows ---
type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const STATUS_GLYPH: Record<FileUploadStatus, React.ComponentType<{ className?: string }> | null> = {
  idle: null,
  uploading: Loader2,
  success: CheckCircle2,
  error: AlertCircle,
};

const STATUS_TONE: Record<FileUploadStatus, string> = {
  idle: 'text-on-surface-variant',
  uploading: 'text-on-surface-variant',
  success: 'text-success',
  error: 'text-error',
};

// The trailing detail for a file: error message → progress% → size.
function fileDetail(status: FileUploadStatus, file: { size?: string; progress?: number; error?: string }): string | undefined {
  if (status === 'error' && file.error) return file.error;
  if (status === 'uploading' && typeof file.progress === 'number') return `${Math.round(file.progress)}%`;
  return file.size;
}

const ProgressBar = ({ value }: { value: number }) => (
  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-surface-2">
    <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

type SelectedFile = { name: string; size?: string; status?: FileUploadStatus; progress?: number; error?: string };

type FileUploadProps = React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof fileUploadVariants>
  & {
    accept?: string;
    multiple?: boolean;
    onFilesSelected?: (files: File[]) => void;
    disabled?: boolean;
    error?: boolean;
    // Single-file case: render the file + its status in the dropzone itself (consumer-driven).
    // Multi-file case: leave this unset and map files over <FileUploadItem> below the dropzone.
    selectedFile?: SelectedFile;
  };

const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(
  ({ size = 'md', accept, multiple, onFilesSelected, disabled, error, selectedFile, className, children, ...props }, ref) => {
    const [isDragover, setIsDragover] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    // Error border cascades off FormFieldContext unless an explicit error prop is given.
    const isError = useFieldError(error) || selectedFile?.status === 'error';

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

    let content: React.ReactNode;
    if (children) {
      content = children;
    } else if (selectedFile) {
      const st = selectedFile.status ?? 'idle';
      const Glyph = STATUS_GLYPH[st] ?? FileIcon;
      const detail = fileDetail(st, selectedFile);
      content = (
        <>
          <Glyph className={cn(STATUS_TONE[st], st === 'uploading' && 'animate-spin', iconSizeMap[size || 'md'])} />
          <p className="max-w-full truncate font-medium">{selectedFile.name}</p>
          <p className={cn('text-body-sm', st === 'error' ? 'text-error' : 'text-on-surface-variant')}>{detail ?? 'Drop or click to replace'}</p>
        </>
      );
    } else {
      content = (
        <>
          <Upload className={cn('text-on-surface-variant', iconSizeMap[size || 'md'])} />
          <p className="font-medium">Drop files here or click to browse</p>
          <p className="text-on-surface-variant text-body-sm">Supports any file type</p>
        </>
      );
    }

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={cn(
          fileUploadVariants({ size }),
          isDragover && 'bg-primary-container text-on-primary-container border-primary border',
          isError && 'border-error',
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
        {content}
        {selectedFile?.status === 'uploading' && typeof selectedFile.progress === 'number' && (
          <ProgressBar value={selectedFile.progress} />
        )}
      </div>
    );
  }
);
FileUpload.displayName = 'FileUpload';

// Selected-file row for the MULTI-file case. The dropzone owns no file state — the consumer maps
// its own files array over FileUploadItem and drives per-file status/progress from their upload
// lifecycle. Frozen-but-editable: this row's structure is project-owned.
type FileUploadItemProps = {
  name: string;
  size?: string;
  status?: FileUploadStatus;
  progress?: number;
  error?: string;
  onRemove?: () => void;
  className?: string;
};

const FileUploadItem = forwardRef<HTMLDivElement, FileUploadItemProps>(
  ({ name, size, status = 'idle', progress, error, onRemove, className }, ref) => {
    const Glyph = STATUS_GLYPH[status];
    const detail = fileDetail(status, { size, progress, error });
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center justify-between gap-3 overflow-hidden rounded-component border bg-surface px-3 py-2 text-body-sm',
          status === 'error' ? 'border-error' : 'border-outline-subtle',
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <FileIcon className="size-icon-1 shrink-0 text-on-surface-variant" />
          <span className="truncate text-on-surface">{name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {detail && <span className={cn(status === 'error' ? 'text-error' : 'text-on-surface-variant')}>{detail}</span>}
          {Glyph && <Glyph className={cn('size-icon-1 shrink-0', STATUS_TONE[status], status === 'uploading' && 'animate-spin')} />}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${name}`}
              className="inline-flex items-center justify-center rounded-component text-on-surface-variant transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-icon-1" />
            </button>
          )}
        </div>
        {status === 'uploading' && typeof progress === 'number' && <ProgressBar value={progress} />}
      </div>
    );
  }
);
FileUploadItem.displayName = 'FileUploadItem';

export { FileUpload, FileUploadItem, fileUploadVariants };
