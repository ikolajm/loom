import { Skeleton } from '../components/atoms/Skeleton';

const gapSize = { sm: 'gap-2', md: 'gap-3', lg: 'gap-4' } as const;

const SkeletonDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const gap = gapSize[size];
  return (
    <div className={`flex flex-col ${gap} w-full max-w-sm`}>
      <div className={`flex items-center ${gap}`}>
        <Skeleton shape="avatar" />
        <div className={`flex flex-col gap-2 flex-1`}>
          <Skeleton shape="text" className="w-3/4" />
          <Skeleton shape="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton shape="card" />
      <div className="flex flex-col gap-2">
        <Skeleton shape="text" />
        <Skeleton shape="text" className="w-5/6" />
        <Skeleton shape="text" className="w-4/6" />
      </div>
    </div>
  );
};

export const skeletonStory = {
  component: SkeletonDemo,
  name: 'Skeleton',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
