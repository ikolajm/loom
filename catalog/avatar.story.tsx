import { Avatar, AvatarImage, AvatarFallback } from '../components/atoms/Avatar';

const AvatarDemo = ({ size, shape, initials }: { size?: 'sm' | 'md' | 'lg' | 'xl'; shape?: 'circle' | 'rounded'; initials?: string }) => {
  return (
    <Avatar size={size} shape={shape}>
      <AvatarImage src="" alt="User" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

export const avatarStory = {
  component: AvatarDemo,
  name: 'Avatar',
  defaultProps: {
    size: 'md',
    shape: 'circle',
    initials: 'JI',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg', 'xl'] },
    { type: 'select' as const, prop: 'shape', label: 'Shape', options: ['circle', 'rounded'] },
    { type: 'text' as const, prop: 'initials', label: 'Initials' },
  ],
};
