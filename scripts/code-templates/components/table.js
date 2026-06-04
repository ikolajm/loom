const { colorToClass, fontWeightToClass } = require('../shared');
const { filterSizes, resolveConfig } = require('./helpers');

function generateTable(name, config, meta) {
  const resolved = resolveConfig(meta.source, meta.key, meta.baseKey);
  const variant = resolved.variants?.default || {};
  const sizes = filterSizes(resolved.sizes);
  const headerTypo = resolved.typography?.header || {};
  const cellTypo = resolved.typography?.cell || {};

  // Colors from config
  const headerBg = colorToClass(variant['header-bg'], 'bg') || 'bg-surface-2';
  const headerFg = colorToClass(variant['header-fg'], 'text') || 'text-on-surface';
  const rowBg = colorToClass(variant['row-bg'], 'bg') || 'bg-surface-1';
  const rowFg = colorToClass(variant['row-fg'], 'text') || 'text-on-surface';
  const border = colorToClass(variant['border'], 'border') || 'border-outline-subtle';
  const altRowBg = colorToClass(variant['alt-row-bg'], 'bg') || 'bg-surface';

  // Typography
  const headerWeight = fontWeightToClass(headerTypo['font-weight']) || 'font-medium';
  const cellWeight = fontWeightToClass(cellTypo['font-weight']) || 'font-normal';

  // Size variants for cells (padding + text)
  const sizeEntries = Object.entries(sizes).map(([tier, s]) => {
    const px = s['x-padding']?.replace('{scale.', '').replace('}', '') || '4';
    const py = s['y-padding']?.replace('{scale.', '').replace('}', '') || '2';
    const fs = s['font-size'] || '14px';
    const lh = s['line-height'] || '20px';
    return { tier, px, py, fs, lh };
  });

  const cellSizeMap = sizeEntries.map(s =>
    `  ${s.tier}: 'px-${s.px} py-${s.py} text-[${s.fs}] leading-[${s.lh}]',`
  ).join('\n');

  const headSizeMap = sizeEntries.map(s =>
    `  ${s.tier}: 'px-${s.px} py-${s.py} text-[${s.fs}] leading-[${s.lh}]',`
  ).join('\n');

  return `import { forwardRef } from 'react';
import { cn } from './cn';

const tableCellSize: Record<string, string> = {
${cellSizeMap}
};

const tableHeadSize: Record<string, string> = {
${headSizeMap}
};

type TableSize = 'sm' | 'md' | 'lg';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  size?: TableSize;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <table ref={ref} className={cn('w-full caption-bottom border-collapse ${border} border', className)} data-size={size} {...props} />
  )
);
Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<'thead'>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('${headerBg} ${headerFg}', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<'tbody'>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('${rowFg} [&_tr]:${rowBg} [&_tr:nth-child(even)]:${altRowBg} [&_tr]:transition-colors [&_tr:hover]:!bg-surface-2', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

const TableRow = forwardRef<HTMLTableRowElement, React.ComponentPropsWithoutRef<'tr'>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('border-b ${border}', className)} {...props} />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'th'> & { size?: TableSize }>(
  ({ size, className, ...props }, ref) => (
    <th ref={ref} className={cn('text-left align-middle ${headerWeight}', tableHeadSize[size || 'md'], className)} {...props} />
  )
);
TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'td'> & { size?: TableSize }>(
  ({ size, className, ...props }, ref) => (
    <td ref={ref} className={cn('align-middle ${cellWeight}', tableCellSize[size || 'md'], className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
`;
}

module.exports = { generateTable };
