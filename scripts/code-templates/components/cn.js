function buildCnUtility(configs) {
  const families = Object.keys(configs.typography.textStyles);
  const tiers = ['sm', 'md', 'lg'];
  const textStyleValues = families.flatMap(f => tiers.map(t => `'${f}-${t}'`));

  // Custom token utilities aren't in tailwind-merge's default scales, so an override
  // (e.g. `rounded-none` on a `rounded-component` atom, or `h-10` on `h-ch-5`) wouldn't
  // displace them — both classes survive and CSS order decides. Feeding the radius +
  // spacing theme scales makes every dependent group (rounded, h/w/size, gap/p/m) treat
  // these as real conflicts, so className overrides win cleanly.
  // KEEP IN SYNC with generate-tokens-css.js, which *emits* these same scales as
  // utilities. A scale added there but not here silently regresses overrides for it.
  const q = (arr) => arr.map(v => `'${v}'`).join(', ');
  const radiusValues = Object.keys(configs.sizing['border-radius']);     // component, card, input, modal, pill
  const spacingValues = [
    ...Object.keys(configs.standards.sizing['component-height']),         // ch-0 .. ch-9
    ...Object.keys(configs.standards.sizing['icon-size']),                // icon-0 .. icon-4
    ...Object.keys(configs.spacing.categories),                          // screen, content, section, group, component
  ];

  return `import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge<'text-style'>({
  extend: {
    theme: {
      radius: [${q(radiusValues)}],
      spacing: [${q(spacingValues)}],
    },
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
