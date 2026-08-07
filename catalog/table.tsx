'use client';

import { forwardRef, createContext, useContext } from 'react';
import { cn } from './cn';

const tableCellSize: Record<string, string> = {
  sm: 'px-3 py-1 text-[14px] leading-[20px]',
  md: 'px-4 py-2 text-[14px] leading-[20px]',
  lg: 'px-6 py-3 text-[16px] leading-[24px]',
};

const tableHeadSize: Record<string, string> = {
  sm: 'px-3 py-1 text-[14px] leading-[20px]',
  md: 'px-4 py-2 text-[14px] leading-[20px]',
  lg: 'px-6 py-3 text-[16px] leading-[24px]',
};

type TableSize = 'sm' | 'md' | 'lg';

// Size is set once on <Table> and flows to every cell through context; a cell's own
// size prop still overrides. (Context => this atom is client-rendered.)
const TableSizeContext = createContext<TableSize>('md');

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  size?: TableSize;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <TableSizeContext.Provider value={size}>
      <table ref={ref} className={cn('w-full caption-bottom border-collapse text-sm', className)} data-size={size} {...props} />
    </TableSizeContext.Provider>
  )
);
Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<'thead'>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('text-on-surface-variant', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<'tbody'>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('text-on-surface [&_tr]:transition-colors [&_tr:hover]:bg-surface-1 [&_tr:last-child]:border-0', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

const TableRow = forwardRef<HTMLTableRowElement, React.ComponentPropsWithoutRef<'tr'>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('border-b border-outline', className)} {...props} />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'th'> & { size?: TableSize }>(
  ({ size, className, ...props }, ref) => {
    const ctxSize = useContext(TableSizeContext);
    return <th ref={ref} className={cn('text-left align-middle font-medium', tableHeadSize[size ?? ctxSize], className)} {...props} />;
  }
);
TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'td'> & { size?: TableSize }>(
  ({ size, className, ...props }, ref) => {
    const ctxSize = useContext(TableSizeContext);
    return <td ref={ref} className={cn('align-middle font-normal', tableCellSize[size ?? ctxSize], className)} {...props} />;
  }
);
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
