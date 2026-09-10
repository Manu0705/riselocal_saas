import HostelSidebar from './components/hostel-sidebar';

export default function HostelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <HostelSidebar />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: 24,
        }}
      >
        {children}
      </main>
    </div>
  );
}