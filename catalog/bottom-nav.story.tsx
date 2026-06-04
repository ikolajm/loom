import { BottomNav, BottomNavItem } from '../components/atoms/BottomNav';
import { Home, Search, Bell, User } from 'lucide-react';

const iconSize = { sm: 20, md: 20, lg: 24 } as const;
const labelSize = { sm: 'text-[10px] leading-[14px]', md: 'text-[12px] leading-[16px]', lg: 'text-[12px] leading-[16px]' } as const;

const BottomNavDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const s = iconSize[size];
  return (
    <BottomNav size={size}>
      <BottomNavItem active icon={<Home size={s} />}>
        <span className={labelSize[size]}>Home</span>
      </BottomNavItem>
      <BottomNavItem icon={<Search size={s} />}>
        <span className={labelSize[size]}>Search</span>
      </BottomNavItem>
      <BottomNavItem icon={<Bell size={s} />}>
        <span className={labelSize[size]}>Alerts</span>
      </BottomNavItem>
      <BottomNavItem icon={<User size={s} />}>
        <span className={labelSize[size]}>Profile</span>
      </BottomNavItem>
    </BottomNav>
  );
};

export const bottomnavStory = {
  component: BottomNavDemo,
  name: 'Bottom Nav',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
