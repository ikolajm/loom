import { EmptyState } from '../components/atoms/EmptyState';
import { Inbox } from 'lucide-react';

const EmptyStateDemo = ({ size, heading, description }: { size?: 'sm' | 'md' | 'lg'; heading?: string; description?: string }) => {
  return (
    <EmptyState
      size={size}
      icon={<Inbox />}
      heading={heading}
      description={description}
    />
  );
};

export const emptystateStory = {
  component: EmptyStateDemo,
  name: 'Empty State',
  defaultProps: {
    size: 'md',
    heading: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'heading', label: 'Heading' },
    { type: 'text' as const, prop: 'description', label: 'Description' },
  ],
};
