import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '../components/atoms/Sheet';
import { Button } from '../components/atoms/Button';
import { X } from 'lucide-react';
import { useState } from 'react';

const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;

const SheetDemo = ({ size = 'md', side = 'right' }: { size?: 'sm' | 'md' | 'lg'; side?: 'left' | 'right' | 'top' | 'bottom' }) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default" size={size} onClick={() => setOpen(true)}>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent side={side} size={size}>
        <div className="flex items-start justify-between">
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>This is a side panel for secondary content or actions.</SheetDescription>
          </SheetHeader>
          <SheetClose asChild>
            <Button variant="ghost" size={size} iconOnly>
              <X />
            </Button>
          </SheetClose>
        </div>
        <div className={`${bodySize[size]} text-on-surface-variant flex-1`}>Sheet body content goes here.</div>
      </SheetContent>
    </Sheet>
  );
};

export const sheetStory = {
  component: SheetDemo,
  name: 'Sheet',
  defaultProps: {
    size: 'md',
    side: 'right',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
    { type: 'select' as const, prop: 'side', label: 'Side', options: ['left', 'right', 'top', 'bottom'] },
  ],
};
