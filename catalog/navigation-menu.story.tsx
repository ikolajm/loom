import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
} from '../components/atoms/NavigationMenu';

const bodySize = { sm: 'text-body-sm', md: 'text-body-md', lg: 'text-body-lg' } as const;

const NavigationMenuDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full pt-2 pb-48">
    <NavigationMenu size={size}>
      <NavigationMenuList size={size}>
        <NavigationMenuItem>
          <NavigationMenuTrigger size={size}>Getting Started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 w-[400px]">
              <li><NavigationMenuLink asChild><a href="#" className={`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 ${bodySize[size]}`}><div className="font-semibold mb-1">Introduction</div><p className="text-on-surface-variant">Learn the basics of the design system.</p></a></NavigationMenuLink></li>
              <li><NavigationMenuLink asChild><a href="#" className={`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 ${bodySize[size]}`}><div className="font-semibold mb-1">Installation</div><p className="text-on-surface-variant">Set up your project with tokens and components.</p></a></NavigationMenuLink></li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger size={size}>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 w-[400px] md:grid-cols-2">
              <li><NavigationMenuLink asChild><a href="#" className={`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 ${bodySize[size]}`}><div className="font-semibold mb-1">Button</div><p className="text-on-surface-variant">Actions and form submissions.</p></a></NavigationMenuLink></li>
              <li><NavigationMenuLink asChild><a href="#" className={`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 ${bodySize[size]}`}><div className="font-semibold mb-1">Dialog</div><p className="text-on-surface-variant">Modal overlays for focused tasks.</p></a></NavigationMenuLink></li>
              <li><NavigationMenuLink asChild><a href="#" className={`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 ${bodySize[size]}`}><div className="font-semibold mb-1">Toast</div><p className="text-on-surface-variant">Temporary notifications.</p></a></NavigationMenuLink></li>
              <li><NavigationMenuLink asChild><a href="#" className={`block select-none rounded-component p-3 leading-none no-underline hover:bg-surface-2 ${bodySize[size]}`}><div className="font-semibold mb-1">Card</div><p className="text-on-surface-variant">Contained content surfaces.</p></a></NavigationMenuLink></li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <a href="#" className={`inline-flex items-center justify-center rounded-component font-medium text-on-surface interactive cursor-pointer hover:bg-surface-1 ${bodySize[size]}`} style={{ height: 'var(--size-ch-5)', padding: '0 1rem' }}>
              Documentation
            </a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
    </div>
  );
};

export const navigationmenuStory = {
  component: NavigationMenuDemo,
  name: 'Navigation Menu',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};
