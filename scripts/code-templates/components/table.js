const { colorToClass, fontWeightToClass } = require('../shared');
const { filterSizes, resolveConfig, textRoleClass } = require('./helpers');

function generateTable(name, config, meta) {
  const resolved = resolveConfig(meta.source, meta.key, meta.baseKey);
  const variant = resolved.variants?.default || {};
  const sizes = filterSizes(resolved.sizes);
  const headerTypo = resolved.typography?.header || {};
  const cellTypo = resolved.typography?.cell || {};

  // Colors from config. Modern content-first treatment: no header fill, no zebra, no outer grid —
  // hierarchy comes from a muted header, full-strength cells, light row borders + subtle hover.
  const headerFg = colorToClass(variant['header-fg'], 'text') || 'text-on-surface-variant';
  const rowFg = colorToClass(variant['row-fg'], 'text') || 'text-on-surface';
  const border = colorToClass(variant['border'], 'border') || 'border-outline-subtle';

  // Typography
  const headerWeight = fontWeightToClass(headerTypo['font-weight']) || 'font-medium';
  const cellWeight = fontWeightToClass(cellTypo['font-weight']) || 'font-normal';

  // Size variants for cells (padding + text)
  const sizeEntries = Object.entries(sizes).map(([tier, s]) => {
    const px = s['x-padding']?.replace('{scale.', '').replace('}', '') || '4';
    const py = s['y-padding']?.replace('{scale.', '').replace('}', '') || '2';
    return { tier, px, py, role: textRoleClass(s.text) };
  });

  const cellSizeMap = sizeEntries.map(s =>
    `  ${s.tier}: 'px-${s.px} py-${s.py}${s.role ? ' ' + s.role : ''}',`
  ).join('\n');

  const headSizeMap = sizeEntries.map(s =>
    `  ${s.tier}: 'px-${s.px} py-${s.py}${s.role ? ' ' + s.role : ''}',`
  ).join('\n');

  const defaultSize = resolved.default?.size || 'md';

  return `'use client';

import { forwardRef, createContext, useContext } from 'react';
import { cn } from './cn';

const tableCellSize: Record<string, string> = {
${cellSizeMap}
};

const tableHeadSize: Record<string, string> = {
${headSizeMap}
};

type TableSize = 'sm' | 'md' | 'lg';

// Size is set once on <Table> and flows to every cell through context; a cell's own
// size prop still overrides. (Context => this atom is client-rendered.)
const TableSizeContext = createContext<TableSize>('${defaultSize}');

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  size?: TableSize;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ size = '${defaultSize}', className, ...props }, ref) => (
    <TableSizeContext.Provider value={size}>
      <table ref={ref} className={cn('w-full caption-bottom border-collapse text-sm', className)} data-size={size} {...props} />
    </TableSizeContext.Provider>
  )
);
Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<'thead'>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('${headerFg}', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<'tbody'>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('${rowFg} [&_tr]:transition-colors [&_tr:hover]:bg-surface-1 [&_tr:last-child]:border-0', className)} {...props} />
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
  ({ size, className, ...props }, ref) => {
    const ctxSize = useContext(TableSizeContext);
    return <th ref={ref} className={cn('text-left align-middle ${headerWeight}', tableHeadSize[size ?? ctxSize], className)} {...props} />;
  }
);
TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'td'> & { size?: TableSize }>(
  ({ size, className, ...props }, ref) => {
    const ctxSize = useContext(TableSizeContext);
    return <td ref={ref} className={cn('align-middle ${cellWeight}', tableCellSize[size ?? ctxSize], className)} {...props} />;
  }
);
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
`;
}

module.exports = { generateTable };
