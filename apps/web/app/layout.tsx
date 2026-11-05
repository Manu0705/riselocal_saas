import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter, Manrope } from 'next/font/google';

import './globals.css';

import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://riselocal.in'),

  title: {
    default: 'Riselocal | One Business Growth Platform',
    template: '%s | Riselocal',
  },

  description:
    'Build your online presence, manage customer relationships and organise your business operations with Riselocal, one connected business growth platform.',

  keywords: [
    'Riselocal',
    'business growth platform',
    'local business management',
    'business website',
    'customer management',
    'business operations',
    'hostel management',
    'agency management',
  ],

  icons: {
    icon: [{ url: '/logo/riselocal-logo.svg', type: 'image/svg+xml' }],
    shortcut: '/logo/riselocal-logo.svg',
    apple: '/logo/riselocal-logo.svg',
  },

  openGraph: {
    title: 'Riselocal | One Business Growth Platform',
    description:
      'Your business. Your customers. One connected platform. Explore Riselocal solutions for businesses and industry-specific workflows.',
    url: 'https://riselocal.in',
    siteName: 'Riselocal',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Riselocal | One Business Growth Platform',
    description:
      'Build your online presence, manage customer relationships and organise your business operations with Riselocal.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable}`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}