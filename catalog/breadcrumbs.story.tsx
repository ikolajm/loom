import { Breadcrumbs, BreadcrumbItem } from '../components/atoms/Breadcrumbs';

const BreadcrumbsDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <Breadcrumbs size={size} aria-label="Breadcrumb">
      <BreadcrumbItem>Home</BreadcrumbItem>
      <span className="text-outline-subtle">/</span>
      <BreadcrumbItem>Projects</BreadcrumbItem>
      <span className="text-outline-subtle">/</span>
      <BreadcrumbItem current>Design System</BreadcrumbItem>
    </Breadcrumbs>
  );
};

export const breadcrumbsStory = {
  component: BreadcrumbsDemo,
  name: 'Breadcrumbs',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
