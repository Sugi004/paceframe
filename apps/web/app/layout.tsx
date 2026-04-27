import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Paceframe',
  description: 'Energy-aware planning and burnout recovery platform.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
