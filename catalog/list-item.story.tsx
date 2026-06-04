import { ListItem } from '../components/atoms/ListItem';
import { User, ChevronRight } from 'lucide-react';

const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;
const iconSize = { sm: 16, md: 20, lg: 24 } as const;

const ListItemDemo = ({ variant, size = 'md', children }: { variant?: 'default' | 'bordered'; size?: 'sm' | 'md' | 'lg'; children?: string }) => {
  const s = iconSize[size];
  return (
    <div className="w-full max-w-sm">
      <ListItem variant={variant} size={size} leading={<User size={s} />} trailing={<ChevronRight size={s} />}>
        <span className={bodySize[size]}>{children}</span>
      </ListItem>
    </div>
  );
};

export const listitemStory = {
  component: ListItemDemo,
  name: 'List Item',
  defaultProps: {
    variant: 'default',
    size: 'md',
    children: 'Account Settings',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default', 'bordered'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'text' as const, prop: 'children', label: 'Label' },
  ],
};
