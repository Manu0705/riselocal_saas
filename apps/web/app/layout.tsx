import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';

import './globals.css';

import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

const fontFallbacks: CSSProperties & {
  '--font-inter': string;
  '--font-manrope': string;
} = {
  '--font-inter': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  '--font-manrope': '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

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
    icon: [{ url: '/logo/riselocal-logo.png', type: 'image/png' }],
    shortcut: '/logo/riselocal-logo.png',
    apple: '/logo/riselocal-logo.png',
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={fontFallbacks}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
