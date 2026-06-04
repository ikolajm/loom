import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/atoms/Dialog';
import { Button } from '../components/atoms/Button';
import { X } from 'lucide-react';
import { useState } from 'react';

const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg', full: 'text-body-lg' } as const;

const DialogDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'full' }) => {
  const [open, setOpen] = useState(false);
  const btnSize = size === 'full' ? 'lg' : size;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size={btnSize} onClick={() => setOpen(true)}>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent size={size}>
        <div className="flex items-start justify-between">
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>This is a description of the dialog content and purpose.</DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button variant="ghost" size={btnSize} iconOnly>
              <X />
            </Button>
          </DialogClose>
        </div>
        <div className={`${bodySize[size]} text-on-surface-variant`}>Dialog body content goes here.</div>
        <DialogFooter>
          <Button variant="ghost" size={btnSize} onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="default" size={btnSize} onClick={() => setOpen(false)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const dialogStory = {
  component: DialogDemo,
  name: 'Dialog',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg', 'full'] },
  ],
};
