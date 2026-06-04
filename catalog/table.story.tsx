import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/atoms/Table';

const TableDemo = ({ size }: { size?: 'sm' | 'md' | 'lg' }) => (
  <Table size={size}>
    <TableHeader>
      <TableRow>
        <TableHead size={size}>First Name</TableHead>
        <TableHead size={size}>Last Name</TableHead>
        <TableHead size={size}>Email</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell size={size}>John</TableCell>
        <TableCell size={size}>Doe</TableCell>
        <TableCell size={size}>john@example.com</TableCell>
      </TableRow>
      <TableRow>
        <TableCell size={size}>Jane</TableCell>
        <TableCell size={size}>Smith</TableCell>
        <TableCell size={size}>jane@example.com</TableCell>
      </TableRow>
      <TableRow>
        <TableCell size={size}>Alex</TableCell>
        <TableCell size={size}>Johnson</TableCell>
        <TableCell size={size}>alex@example.com</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);

export const tableStory = {
  component: TableDemo,
  name: 'Table',
  defaultProps: {
    variant: 'default',
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
