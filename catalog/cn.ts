import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge<'text-style'>({
  extend: {
    theme: {
      radius: ['component', 'card', 'input', 'modal', 'pill'],
      spacing: ['ch-0', 'ch-1', 'ch-2', 'ch-3', 'ch-4', 'ch-5', 'ch-6', 'ch-7', 'ch-8', 'ch-9', 'control-sm', 'control-md', 'control-lg', 'row-sm', 'row-md', 'row-lg', 'nav-item-sm', 'nav-item-md', 'nav-item-lg', 'menu-item-sm', 'menu-item-md', 'menu-item-lg', 'bar-sm', 'bar-md', 'bar-lg', 'bottom-bar-sm', 'bottom-bar-md', 'fab-sm', 'fab-md', 'fab-lg', 'icon-0', 'icon-1', 'icon-2', 'icon-3', 'icon-4', 'screen', 'content', 'section', 'group', 'component'],
    },
    classGroups: {
      'text-style': [{ text: ['display-sm', 'display-md', 'display-lg', 'title-sm', 'title-md', 'title-lg', 'body-sm', 'body-md', 'body-lg', 'action-sm', 'action-md', 'action-lg', 'label-sm', 'label-md', 'label-lg', 'input-sm', 'input-md', 'input-lg'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
