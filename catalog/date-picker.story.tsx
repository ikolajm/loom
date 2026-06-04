import { DatePicker } from '../components/atoms/DatePicker';
import { useState } from 'react';

const DatePickerDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <div className="w-full max-w-xs">
      <DatePicker size={size} value={date} onValueChange={setDate} />
    </div>
  );
};

export const datepickerStory = {
  component: DatePickerDemo,
  name: 'Date Picker',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
