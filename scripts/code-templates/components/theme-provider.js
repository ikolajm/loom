/**
 * theme-provider.tsx — the theme mechanism, as a catalog file.
 *
 * It was in `scaffold/`, reachable only through a Next-only `init.sh`, which made the one
 * piece of the scaffold that carries real behavior the hardest piece to get. It belongs
 * here by the catalog's own bar: it persists a choice, resolves `prefers-color-scheme`,
 * and writes the `data-theme` attribute the alternate-mode block keys off. None of that
 * is expressible in CSS.
 *
 * Config-driven, which is why it is generated rather than a static asset: the default
 * mode and the server-side fallback both come from `colors['default-mode']`.
 *
 * No Next coupling. `'use client'` is a directive a non-Next bundler ignores, and nothing
 * here imports from `next`.
 */
function buildThemeProvider(configs) {
  const defaultMode = configs.colors['default-mode'] || 'dark';

  return `'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = '${defaultMode === 'dark' ? 'dark' : 'light'}';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return '${defaultMode}';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [resolved, setResolved] = useState<'light' | 'dark'>('${defaultMode}');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setThemeState(saved);
      setResolved(resolveTheme(saved));
    }
  }, []);

  useEffect(() => {
    const r = resolveTheme(theme);
    setResolved(r);
    document.documentElement.setAttribute('data-theme', r);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        const sys = getSystemTheme();
        setResolved(sys);
        document.documentElement.setAttribute('data-theme', sys);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
`;
}

module.exports = { buildThemeProvider };
