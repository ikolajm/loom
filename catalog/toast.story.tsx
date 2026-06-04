import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastAction, ToastClose } from '../components/atoms/Toast';
import { Button } from '../components/atoms/Button';
import { useState, useRef, useEffect } from 'react';

type ToastData = { id: number; variant: string; title: string; description: string };

const ToastDemo = ({ variant = 'default', size = 'md' }: { variant?: 'default' | 'error' | 'success' | 'warning' | 'info'; size?: 'sm' | 'md' | 'lg' }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counter = useRef(0);

  const addToast = () => {
    counter.current++;
    setToasts((prev) => [...prev, {
      id: counter.current,
      variant,
      title: variant === 'error' ? 'Something went wrong' : variant === 'success' ? 'Changes saved' : variant === 'warning' ? 'Check your input' : variant === 'info' ? 'New update available' : 'Notification',
      description: 'This is a toast message description.',
    }]);
  };

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastProvider>
      <Button variant="default" size={size} onClick={addToast}>Show Toast</Button>
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant as any} size={size} onOpenChange={(open) => { if (!open) removeToast(t.id); }}>
          <div className="flex flex-col gap-1 flex-1">
            <ToastTitle>{t.title}</ToastTitle>
            <ToastDescription>{t.description}</ToastDescription>
          </div>
          <ToastAction altText="Undo">Undo</ToastAction>
          <ToastClose size={size} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
};

export const toastStory = {
  component: ToastDemo,
  name: 'Toast',
  defaultProps: {
    variant: 'default',
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default', 'error', 'success', 'warning', 'info'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
