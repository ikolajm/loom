// Stacked avatars with overlap + a +N overflow counter. Composition over `avatar`:
// size is forwarded to every child, and the surface-colored ring is injected onto each
// avatar's root so the radius follows the avatar's own shape (circle / rounded). Overlap
// is negative horizontal margin; both ring + overlap are structural (frozen).
//
// Child contract: children are expected to be <Avatar> (or any element accepting `size` +
// `className`) — the clone forwards `size` and merges the ring class onto each. A child that
// ignores those props renders unstyled rather than erroring. The cast is the idiomatic way to
// clone-with-typed-props; there's no runtime guard for "accepts a size prop".
function generateAvatarGroup(name, config, meta) {
  const defaultSize = config.default?.size || 'md';
  const defaultSpacing = config.default?.spacing || 'normal';

  return `import { forwardRef, Children, cloneElement, isValidElement } from 'react';
import { cn } from './cn';
import { Avatar, AvatarFallback } from './avatar';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const spacingMap: Record<string, string> = {
  tight: '-space-x-3',
  normal: '-space-x-2',
  loose: '-space-x-1',
};

type AvatarGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: AvatarSize;
  max?: number;
  spacing?: 'tight' | 'normal' | 'loose';
};

const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ size = '${defaultSize}', max, spacing = '${defaultSpacing}', className, children, ...props }, ref) => {
    const items = Children.toArray(children);
    const visible = typeof max === 'number' ? items.slice(0, max) : items;
    const overflow = items.length - visible.length;
    return (
      <div ref={ref} className={cn('flex items-center', spacingMap[spacing], className)} {...props}>
        {visible.map((child, i) =>
          isValidElement(child)
            ? cloneElement(child as React.ReactElement<{ size?: AvatarSize; className?: string }>, {
                key: child.key ?? i,
                size,
                className: cn('ring-2 ring-surface', (child.props as { className?: string }).className),
              })
            : child
        )}
        {overflow > 0 && (
          <Avatar size={size} className="bg-surface-2 text-on-surface-variant ring-2 ring-surface">
            <AvatarFallback>+{overflow}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

export { AvatarGroup };
`;
}

module.exports = { generateAvatarGroup };
