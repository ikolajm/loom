import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '../components/atoms/Pagination';

const PaginationDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <Pagination size={size}>
      <PaginationContent size={size}>
        <PaginationItem><PaginationPrevious size={size} href="#" /></PaginationItem>
        <PaginationItem><PaginationLink size={size} href="#">1</PaginationLink></PaginationItem>
        <PaginationItem><PaginationLink size={size} href="#" isActive>2</PaginationLink></PaginationItem>
        <PaginationItem><PaginationLink size={size} href="#">3</PaginationLink></PaginationItem>
        <PaginationItem><PaginationEllipsis size={size} /></PaginationItem>
        <PaginationItem><PaginationLink size={size} href="#">12</PaginationLink></PaginationItem>
        <PaginationItem><PaginationNext size={size} href="#" /></PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export const paginationStory = {
  component: PaginationDemo,
  name: 'Pagination',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
