import { forwardRef } from 'react';
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

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  size?: TableSize;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <table ref={ref} className={cn('w-full caption-bottom border-collapse border-outline-subtle border', className)} data-size={size} {...props} />
  )
);
Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<'thead'>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-surface-2 text-on-surface', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<'tbody'>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('text-on-surface [&_tr]:bg-surface-1 [&_tr:nth-child(even)]:bg-surface [&_tr]:transition-colors [&_tr:hover]:!bg-surface-2', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

const TableRow = forwardRef<HTMLTableRowElement, React.ComponentPropsWithoutRef<'tr'>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('border-b border-outline-subtle', className)} {...props} />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'th'> & { size?: TableSize }>(
  ({ size, className, ...props }, ref) => (
    <th ref={ref} className={cn('text-left align-middle font-medium', tableHeadSize[size || 'md'], className)} {...props} />
  )
);
TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'td'> & { size?: TableSize }>(
  ({ size, className, ...props }, ref) => (
    <td ref={ref} className={cn('align-middle font-normal', tableCellSize[size || 'md'], className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
