/**
 * cn.ts is clsx, and nothing else.
 *
 * It used to be `extendTailwindMerge` fed Loom's radius, spacing and semantic-height
 * scales plus a `text-style` class group, so a className override displaced the atom's
 * own utility instead of sitting beside it and losing to stylesheet order. That was
 * load-bearing while atoms carried Tailwind utilities. It is not any more:
 *
 *   - Nothing utility-shaped is emitted for the radius or spacing scales. The class layer
 *     writes `border-radius` inside a component's rule; there is no `rounded-component`
 *     class for `rounded-none` to conflict with.
 *   - The `text-*` type ramp *is* still emitted, but no atom applies one. Moving
 *     appearance into the class layer took the last of them out of the TSX.
 *
 * So every group twMerge was configured for is empty on the only files it runs against.
 * What is left is conditional class joining, which is clsx.
 *
 * The one thing genuinely given up: a consumer hand-composing two `text-*` classes on one
 * element no longer gets the later one deduped, and stylesheet order decides instead.
 * That was a Tailwind-shaped expectation, and there is no Tailwind under this any more.
 */
function buildCnUtility() {
  return `import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
`;
}

module.exports = { buildCnUtility };
