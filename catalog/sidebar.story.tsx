import { Sidebar, SidebarItem } from '../components/atoms/Sidebar';
import { Home, Settings, Users, FileText, BarChart } from 'lucide-react';

const iconSize = { sm: 16, md: 20, lg: 24 } as const;

const SidebarDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const s = iconSize[size];
  return (
    <Sidebar size={size} className="h-[320px] py-2 gap-1">
      <SidebarItem size={size} active icon={<Home size={s} />}>Dashboard</SidebarItem>
      <SidebarItem size={size} icon={<BarChart size={s} />}>Analytics</SidebarItem>
      <SidebarItem size={size} icon={<Users size={s} />}>Team</SidebarItem>
      <SidebarItem size={size} icon={<FileText size={s} />}>Documents</SidebarItem>
      <SidebarItem size={size} icon={<Settings size={s} />}>Settings</SidebarItem>
    </Sidebar>
  );
};

export const sidebarStory = {
  component: SidebarDemo,
  name: 'Sidebar',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
