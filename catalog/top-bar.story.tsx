import { TopBar } from '../components/atoms/TopBar';
import { Menu, Bell, Search } from 'lucide-react';

const iconSize = { sm: 20, md: 20, lg: 24 } as const;
const titleSize = { sm: 'text-[16px] leading-[24px]', md: 'text-[18px] leading-[28px]', lg: 'text-[20px] leading-[28px]' } as const;

const TopBarDemo = ({ variant, size = 'md' }: { variant?: 'default' | 'elevated'; size?: 'sm' | 'md' | 'lg' }) => {
  const s = iconSize[size];
  return (
    <TopBar variant={variant} size={size} className="w-full">
      <Menu size={s} className="shrink-0 cursor-pointer" />
      <span className={`flex-1 font-semibold tracking-[-0.01em] ${titleSize[size]}`}>App Title</span>
      <Search size={s} className="shrink-0 cursor-pointer" />
      <Bell size={s} className="shrink-0 cursor-pointer" />
    </TopBar>
  );
};

export const topbarStory = {
  component: TopBarDemo,
  name: 'Top Bar',
  defaultProps: {
    variant: 'default',
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default', 'elevated'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
