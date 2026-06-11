import { forwardRef } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from './cn';

const itemSizeMap: Record<string, string> = {
  sm: 'size-ch-3 rounded-component text-body-sm',
  md: 'size-ch-5 rounded-component text-body-md',
  lg: 'size-ch-7 rounded-component text-body-lg',
};

const iconSizeMap: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-2',
};

const gapMap: Record<string, string> = {
  sm: 'gap-1',
  md: 'gap-1',
  lg: 'gap-2',
};

type SizeProps = { size?: 'sm' | 'md' | 'lg' };

const Pagination = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & SizeProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <nav ref={ref} role="navigation" aria-label="pagination" className={cn('flex items-center justify-center', gapMap[size], className)} {...props} />
  )
);
Pagination.displayName = 'Pagination';

const PaginationContent = forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement> & SizeProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex items-center', gapMap[size], className)} {...props} />
  )
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn('', className)} {...props} />
);
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & SizeProps & { isActive?: boolean };

const PaginationLink = forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ size = 'md', isActive, className, ...props }, ref) => (
    <a
      ref={ref}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium interactive cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        isActive ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-1',
        itemSizeMap[size],
        className,
      )}
      {...props}
    />
  )
);
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ size = 'md', className, children, ...props }, ref) => (
    <PaginationLink ref={ref} size={size} aria-label="Go to previous page" className={className} {...props}>
      <ChevronLeft className={iconSizeMap[size] || 'size-icon-2'} />
    </PaginationLink>
  )
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ size = 'md', className, children, ...props }, ref) => (
    <PaginationLink ref={ref} size={size} aria-label="Go to next page" className={className} {...props}>
      <ChevronRight className={iconSizeMap[size] || 'size-icon-2'} />
    </PaginationLink>
  )
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & SizeProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <span ref={ref} aria-hidden className={cn('inline-flex items-center justify-center text-on-surface-variant', itemSizeMap[size], className)} {...props}>
      <MoreHorizontal className={iconSizeMap[size] || 'size-icon-2'} />
    </span>
  )
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
};
