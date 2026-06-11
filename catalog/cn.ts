import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge<'text-style'>({
  extend: {
    theme: {
      radius: ['component', 'card', 'input', 'modal', 'pill'],
      spacing: ['ch-0', 'ch-1', 'ch-2', 'ch-3', 'ch-4', 'ch-5', 'ch-6', 'ch-7', 'ch-8', 'ch-9', 'icon-0', 'icon-1', 'icon-2', 'icon-3', 'icon-4', 'screen', 'content', 'section', 'group', 'component'],
    },
    classGroups: {
      'text-style': [{ text: ['display-sm', 'display-md', 'display-lg', 'title-sm', 'title-md', 'title-lg', 'body-sm', 'body-md', 'body-lg', 'action-sm', 'action-md', 'action-lg', 'label-sm', 'label-md', 'label-lg', 'input-sm', 'input-md', 'input-lg'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
