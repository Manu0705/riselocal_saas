import './globals.css';

export const metadata = {
  title: 'Admin Panel - Multi-Tenant SaaS',
  description: 'Manage all tenants and leads',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
