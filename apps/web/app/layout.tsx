import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'RiseLocal',
  description: 'Multi-tenant SaaS platform',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
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
