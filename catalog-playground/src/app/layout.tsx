import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Loom Catalog Playground',
  description: 'Visual confirmation surface for the Loom catalog atoms.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-on-surface">
        {children}
      </body>
    </html>
  );
}
