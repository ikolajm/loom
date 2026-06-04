function generateSkeleton(name, config, meta) {
  const shapes = config.shapes || {};

  // Build shape entries from config
  const shapeEntries = {};
  for (const [shapeName, shapeDef] of Object.entries(shapes)) {
    const classes = [];
    // Height
    const hMatch = shapeDef.height?.match(/\{scale\.(\d+)\}/);
    if (hMatch) classes.push(`h-${hMatch[1]}`);
    // Width
    if (shapeDef.width === '100%') classes.push('w-full');
    else {
      const wMatch = shapeDef.width?.match(/\{scale\.(\d+)\}/);
      if (wMatch) classes.push(`w-${wMatch[1]}`);
    }
    // Radius
    if (shapeDef.radius === 'radius/pill') classes.push('rounded-full');
    else if (shapeDef.radius === 'radius/component') classes.push('rounded-component');
    else if (shapeDef.radius === 'radius/card') classes.push('rounded-card');
    shapeEntries[shapeName] = classes.join(' ');
  }

  return `import { forwardRef } from 'react';
import { cn } from './cn';

const shapeMap: Record<string, string> = {
${Object.entries(shapeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  shape?: ${Object.keys(shapeEntries).map(k => `'${k}'`).join(' | ')};
};

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ shape, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-pulse bg-surface-1',
        shape ? shapeMap[shape] : 'h-4 w-full rounded-component',
        className,
      )}
      {...props}
    />
  )
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
`;
}

module.exports = { generateSkeleton };
