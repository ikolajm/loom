import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../components/atoms/AlertDialog';
import { Button } from '../components/atoms/Button';
import { useState } from 'react';

const AlertDialogDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={size} onClick={() => setOpen(true)}>Delete Item</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone. This will permanently delete the item.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost" size={size}>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" size={size}>Delete</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const alertdialogStory = {
  component: AlertDialogDemo,
  name: 'Alert Dialog',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
