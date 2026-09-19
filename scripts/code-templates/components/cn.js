/**
 * cn.ts is clsx, and nothing else — conditional class joining.
 *
 * No class-aware merge runs over it, so a consumer hand-composing two `text-*` classes
 * on one element gets no dedupe and stylesheet order decides which wins.
 */
function buildCnUtility() {
  return `import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
`;
}

module.exports = { buildCnUtility };
