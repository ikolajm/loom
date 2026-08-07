/**
 * Generates layout.tsx — Next.js root layout with ThemeProvider,
 * Google Fonts import, and default data-theme attribute.
 */

function generate(configs) {
  const defaultMode = configs.colors['default-mode'] || 'dark';
  const headingFont = configs.typography.families.heading;
  const bodyFont = configs.typography.families.body;

  const fonts = [...new Set([headingFont, bodyFont])];
  const googleFontsParam = fonts
    .map(f => f.replace(/ /g, '+'))
    .map(f => `family=${f}:wght@400;500;600;700`)
    .join('&');

  return `import type { Metadata } from 'next';
import { ThemeProvider } from '@/providers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'App',
  description: '',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="${defaultMode}" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?${googleFontsParam}&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
`;
}

module.exports = { generate };
