import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://riselocal.in'),
  title: {
    default: 'RiseLocal | Capture Every Local Enquiry',
    template: '%s | RiseLocal',
  },
  description:
    'RiseLocal helps local businesses turn every call, WhatsApp click, and booking enquiry into a tracked, assigned, and measurable sales opportunity.',
  keywords: [
    'RiseLocal',
    'local business CRM',
    'WhatsApp lead capture',
    'multi-tenant SaaS',
    'lead tracking for local businesses',
  ],
  icons: {
    icon: [{ url: '/logo/riselocal-logo.svg', type: 'image/svg+xml' }],
    shortcut: '/logo/riselocal-logo.svg',
    apple: '/logo/riselocal-logo.svg',
  },
  openGraph: {
    title: 'RiseLocal | Capture Every Local Enquiry',
    description:
      'Branded business pages, WhatsApp-first lead capture, follow-up workflows, and analytics for local businesses, agencies, and franchises.',
    url: 'https://riselocal.in',
    siteName: 'RiseLocal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RiseLocal | Capture Every Local Enquiry',
    description:
      'Turn every WhatsApp click, call, and booking request into a tracked, assigned, and measurable sales opportunity.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
