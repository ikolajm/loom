import {
  CommandPalette, CommandPaletteInput, CommandPaletteList,
  CommandPaletteEmpty, CommandPaletteGroup, CommandPaletteItem,
  CommandPaletteSeparator, CommandPaletteShortcut,
} from '../components/atoms/CommandPalette';
import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react';

const CommandPaletteDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <CommandPalette size={size} className="w-full">
      <CommandPaletteInput size={size} placeholder="Type a command or search..." />
      <CommandPaletteList>
        <CommandPaletteEmpty>No results found.</CommandPaletteEmpty>
        <CommandPaletteGroup size={size} heading="Suggestions">
          <CommandPaletteItem size={size}><Calendar className="mr-2 size-icon-2" />Calendar</CommandPaletteItem>
          <CommandPaletteItem size={size}><Smile className="mr-2 size-icon-2" />Search Emoji</CommandPaletteItem>
          <CommandPaletteItem size={size}><Calculator className="mr-2 size-icon-2" />Calculator</CommandPaletteItem>
        </CommandPaletteGroup>
        <CommandPaletteSeparator />
        <CommandPaletteGroup size={size} heading="Settings">
          <CommandPaletteItem size={size}><User className="mr-2 size-icon-2" />Profile<CommandPaletteShortcut>⌘P</CommandPaletteShortcut></CommandPaletteItem>
          <CommandPaletteItem size={size}><CreditCard className="mr-2 size-icon-2" />Billing<CommandPaletteShortcut>⌘B</CommandPaletteShortcut></CommandPaletteItem>
          <CommandPaletteItem size={size}><Settings className="mr-2 size-icon-2" />Settings<CommandPaletteShortcut>⌘S</CommandPaletteShortcut></CommandPaletteItem>
        </CommandPaletteGroup>
      </CommandPaletteList>
    </CommandPalette>
  );
};

export const commandpaletteStory = {
  component: CommandPaletteDemo,
  name: 'Command Palette',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
