function buildCnUtility(configs) {
  const families = Object.keys(configs.typography.textStyles);
  const tiers = ['sm', 'md', 'lg'];
  const textStyleValues = families.flatMap(f => tiers.map(t => `'${f}-${t}'`));

  return `import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge<'text-style'>({
  extend: {
    classGroups: {
      'text-style': [{ text: [${textStyleValues.join(', ')}] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
}

module.exports = { buildCnUtility };
