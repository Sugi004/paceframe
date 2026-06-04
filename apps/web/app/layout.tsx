import "./globals.css";
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3001';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Paceframe',
    template: '%s | Paceframe'
  },
  description: 'Energy-aware planning and burnout recovery for people who want calmer execution.',
  applicationName: 'Paceframe',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Paceframe',
    description: 'Plan your day around energy, not just pressure.',
    url: '/',
    siteName: 'Paceframe',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paceframe',
    description: 'Energy-aware planning and recovery support for ambitious people.'
  },
  robots: {
    index: true,
    follow: true
  },
  category: 'productivity',
  keywords: ['Paceframe', 'burnout recovery', 'energy aware planning', 'task planning']
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
