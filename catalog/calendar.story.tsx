import { Calendar } from '../components/atoms/Calendar';
import { useState } from 'react';

const CalendarDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <Calendar size={size} mode="single" selected={date} onSelect={setDate} />
  );
};

export const calendarStory = {
  component: CalendarDemo,
  name: 'Calendar',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
