/**
 * Generates the /design-system route page.
 * Foundation views (Typography, Colors) + Component playground by category.
 * Responsive: sidebar drawer on mobile, fixed sidebar on desktop.
 * Uses own components: TopBar, Button, Sidebar, SidebarItem, Separator.
 */

function generate(configs, registry) {
  const categories = {};
  for (const [name, def] of Object.entries(registry)) {
    if (!categories[def.category]) categories[def.category] = [];
    categories[def.category].push(name);
  }

  const categoryKeys = JSON.stringify(Object.keys(categories));

  return `'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { TopBar } from '@/components/atoms/TopBar';
import { Sidebar, SidebarItem } from '@/components/atoms/Sidebar';
import { Separator } from '@/components/atoms/Separator';
import { ComponentPlayground } from '@/components/playground/ComponentPlayground';
import { TypographyView } from '@/components/playground/TypographyView';
import { ColorsView } from '@/components/playground/ColorsView';
import { stories, storyCategories, type StoryKey } from '@/stories/registry';
import { ThemeToggle } from '@/components/providers/ThemeToggle';

type ActiveView = StoryKey | 'foundation:typography' | 'foundation:colors';

const foundationItems = [
  { key: 'foundation:typography' as const, label: 'Typography' },
  { key: 'foundation:colors' as const, label: 'Colors' },
];

const categoryOrder = ${categoryKeys};

function SidebarNav({ active, onNavigate }: { active: ActiveView; onNavigate: (view: ActiveView) => void }) {
  return (
    <div className="flex flex-col gap-group px-group py-group">
      {/* Foundation */}
      <div>
        <h2 className="text-label-md text-on-surface-variant font-semibold px-group py-1 uppercase tracking-wider">Foundation</h2>
        {foundationItems.map(({ key, label }) => (
          <SidebarItem key={key} active={active === key} onClick={() => onNavigate(key)} >
            {label}
          </SidebarItem>
        ))}
      </div>

      {/* Component categories */}
      {categoryOrder.map((cat) => {
        const keys = (storyCategories as any)[cat] as string[] | undefined;
        if (!keys) return null;
        return (
          <React.Fragment key={cat}>
            <Separator />
            <div>
              <h2 className="text-label-md text-on-surface-variant font-semibold px-group py-1 uppercase tracking-wider">{cat}</h2>
              {keys.map((key) => {
                const story = stories[key as StoryKey];
                if (!story) return null;
                return (
                  <SidebarItem key={key} active={active === key} onClick={() => onNavigate(key as StoryKey)} >
                    {story.name}
                  </SidebarItem>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function DesignSystemPage() {
  const [active, setActive] = useState<ActiveView>('foundation:typography');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isFoundation = active.startsWith('foundation:');

  const navigate = (view: ActiveView) => {
    setActive(view);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-surface text-on-surface">
      {/* Mobile top bar */}
      <TopBar variant="elevated" size="sm" className="fixed top-0 left-0 right-0 z-20 md:hidden">
        <Button variant="ghost" size="sm" iconOnly onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
        <span className="text-title-sm">Design System</span>
      </TopBar>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-scrim/60 md:hidden" onClick={() => setSidebarOpen(false)} />
          <Sidebar className="fixed inset-y-0 left-0 z-40 border-r border-outline-subtle overflow-y-auto md:hidden">
            <div className="flex flex-col gap-group px-section py-section border-b border-outline-subtle">
              <div className="flex items-center justify-between">
                <h1 className="text-title-md">Design System</h1>
                <Button variant="ghost" size="sm" iconOnly onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                  <X />
                </Button>
              </div>
              <ThemeToggle />
            </div>
            <SidebarNav active={active} onNavigate={navigate} />
          </Sidebar>
        </>
      )}

      {/* Desktop sidebar */}
      <Sidebar className="max-md:hidden border-r border-outline-subtle overflow-y-auto shrink-0">
        <div className="flex flex-col gap-group px-section py-section border-b border-outline-subtle">
          <h1 className="text-title-md">Design System</h1>
          <ThemeToggle />
        </div>
        <SidebarNav active={active} onNavigate={navigate} />
      </Sidebar>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-content py-content mt-12 md:mt-0">
        <div className="max-w-3xl mx-auto">
          {active === 'foundation:typography' && <TypographyView />}
          {active === 'foundation:colors' && <ColorsView />}
          {!isFoundation && stories[active as StoryKey] && (
            <div className="flex flex-col gap-section">
              <h2 className="text-display-sm">{stories[active as StoryKey]?.name}</h2>
              <ComponentPlayground key={active} story={stories[active as StoryKey]} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
`;
}

module.exports = { generate };
