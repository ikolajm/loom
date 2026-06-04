import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuCheckboxItem, DropdownMenuShortcut,
} from '../components/atoms/DropdownMenu';
import { Button } from '../components/atoms/Button';
import { useState } from 'react';

const DropdownMenuDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [bookmarksChecked, setBookmarksChecked] = useState(true);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size={size}>Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent size={size}>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem size={size}>Profile<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem size={size}>Settings<DropdownMenuShortcut>⌘S</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem size={size}>Keyboard shortcuts<DropdownMenuShortcut>⌘K</DropdownMenuShortcut></DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem size={size} checked={bookmarksChecked} onCheckedChange={setBookmarksChecked}>
          Show Bookmarks
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger size={size}>Invite users</DropdownMenuSubTrigger>
          <DropdownMenuSubContent size={size}>
            <DropdownMenuItem size={size}>Email</DropdownMenuItem>
            <DropdownMenuItem size={size}>Message</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem size={size} disabled>API<DropdownMenuShortcut>⌘A</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuItem size={size}>Log out<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const dropdownmenuStory = {
  component: DropdownMenuDemo,
  name: 'Dropdown Menu',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
