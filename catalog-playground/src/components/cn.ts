import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge<'text-style'>({
  extend: {
    classGroups: {
      'text-style': [{ text: ['display-sm', 'display-md', 'display-lg', 'title-sm', 'title-md', 'title-lg', 'body-sm', 'body-md', 'body-lg', 'action-sm', 'action-md', 'action-lg', 'label-sm', 'label-md', 'label-lg', 'input-sm', 'input-md', 'input-lg'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
