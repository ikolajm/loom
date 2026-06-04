import { InputOTP } from '../components/atoms/InputOTP';
import { useState } from 'react';

const InputOTPDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [value, setValue] = useState('');
  return (
    <div className="flex flex-col gap-2 items-center">
      <InputOTP size={size} length={6} value={value} onValueChange={setValue} />
      <p className="text-body-sm text-on-surface-variant">Value: {value || '(empty)'}</p>
    </div>
  );
};

export const inputotpStory = {
  component: InputOTPDemo,
  name: 'Input OTP',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
