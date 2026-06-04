import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/atoms/Tabs';

const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;

const TabsDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <TabsList size={size}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className={`${bodySize[size]} text-on-surface-variant`}>Overview content goes here.</p>
      </TabsContent>
      <TabsContent value="activity">
        <p className={`${bodySize[size]} text-on-surface-variant`}>Recent activity and updates.</p>
      </TabsContent>
      <TabsContent value="settings">
        <p className={`${bodySize[size]} text-on-surface-variant`}>Configure your preferences.</p>
      </TabsContent>
    </Tabs>
  );
};

export const tabsStory = {
  component: TabsDemo,
  name: 'Tabs',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
