import { HoverCard, HoverCardTrigger, HoverCardContent } from '../components/atoms/HoverCard';
import { Avatar, AvatarImage, AvatarFallback } from '../components/atoms/Avatar';

const titleSize = { sm: 'text-title-sm', md: 'text-title-md', lg: 'text-title-lg' } as const;
const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;

const HoverCardDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a href="#" className={`text-primary underline underline-offset-4 ${bodySize[size]}`}>@jacobikola</a>
      </HoverCardTrigger>
      <HoverCardContent size={size}>
        <div className="flex gap-3">
          <Avatar size={size} shape="circle">
            <AvatarFallback>JI</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <p className={`${titleSize[size]} font-semibold`}>Jacob Ikola</p>
            <p className={`${bodySize[size]} text-on-surface-variant`}>Designer, developer, creative entrepreneur. Building tools and systems.</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export const hovercardStory = {
  component: HoverCardDemo,
  name: 'Hover Card',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
