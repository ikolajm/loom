import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuLabel,
  ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
  ContextMenuCheckboxItem, ContextMenuShortcut,
} from '../components/atoms/ContextMenu';
import { useState } from 'react';

const ContextMenuDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [showGrid, setShowGrid] = useState(false);
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-36 w-72 items-center justify-center rounded-card border border-dashed border-outline-subtle text-body-sm text-on-surface-variant">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent size={size}>
        <ContextMenuLabel>Edit</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem size={size}>Back<ContextMenuShortcut>⌘[</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem size={size}>Forward<ContextMenuShortcut>⌘]</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem size={size}>Reload<ContextMenuShortcut>⌘R</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem size={size} checked={showGrid} onCheckedChange={setShowGrid}>
          Show Grid
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger size={size}>More Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent size={size}>
            <ContextMenuItem size={size}>Save Page As…<ContextMenuShortcut>⌘S</ContextMenuShortcut></ContextMenuItem>
            <ContextMenuItem size={size}>Create Shortcut…</ContextMenuItem>
            <ContextMenuItem size={size}>Developer Tools</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export const contextmenuStory = {
  component: ContextMenuDemo,
  name: 'Context Menu',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
