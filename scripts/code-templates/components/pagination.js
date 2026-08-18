const { filterSizes } = require('./helpers');

function generatePagination(name, config, meta) {
  const sizes = filterSizes(config.sizes);
  const defaultSize = config.default?.size || 'md';

  // Build item size map: item-size → size-ch-N (square), radius, text
  const itemSizeEntries = {};
  const iconSizeEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const classes = [];
    if (sz['item-size']) classes.push(`size-${sz['item-size'].replace('height/', '')}`);
    if (sz.radius === 'radius/component') classes.push('rounded-component');
    if (meta.textFamily) classes.push(`text-${meta.textFamily}-${tier}`);
    itemSizeEntries[tier] = classes.join(' ');
    if (sz['icon-size'] && sz['icon-size'].startsWith('icon/')) {
      iconSizeEntries[tier] = `size-${sz['icon-size'].replace('icon/', '')}`;
    }
  }

  // Gap per size
  const gapEntries = {};
  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;
    const m = sz.gap?.match(/\{scale\.(\d+)\}/);
    if (m) gapEntries[tier] = `gap-${m[1]}`;
  }

  return `import { forwardRef } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from './cn';

const itemSizeMap: Record<string, string> = {
${Object.entries(itemSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const iconSizeMap: Record<string, string> = {
${Object.entries(iconSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const gapMap: Record<string, string> = {
${Object.entries(gapEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type SizeProps = { size?: ${Object.keys(sizes).map(k => `'${k}'`).join(' | ')} };

const Pagination = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & SizeProps>(
  ({ size = '${defaultSize}', className, ...props }, ref) => (
    <nav ref={ref} role="navigation" aria-label="pagination" className={cn('flex items-center justify-center', gapMap[size], className)} {...props} />
  )
);
Pagination.displayName = 'Pagination';

const PaginationContent = forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement> & SizeProps>(
  ({ size = '${defaultSize}', className, ...props }, ref) => (
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
  ({ size = '${defaultSize}', isActive, className, ...props }, ref) => (
    <a
      ref={ref}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium interactive cursor-pointer',
        'control',
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
  ({ size = '${defaultSize}', className, children, ...props }, ref) => (
    <PaginationLink ref={ref} size={size} aria-label="Go to previous page" className={className} {...props}>
      <ChevronLeft className={iconSizeMap[size] || 'size-icon-2'} />
    </PaginationLink>
  )
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ size = '${defaultSize}', className, children, ...props }, ref) => (
    <PaginationLink ref={ref} size={size} aria-label="Go to next page" className={className} {...props}>
      <ChevronRight className={iconSizeMap[size] || 'size-icon-2'} />
    </PaginationLink>
  )
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & SizeProps>(
  ({ size = '${defaultSize}', className, ...props }, ref) => (
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
`;
}

module.exports = { generatePagination };
