import HostelSidebar from './components/hostel-sidebar';

export default function HostelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="hostel-layout"
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 120px)',
        width: '100%',
        minWidth: 0,
      }}
    >
      <HostelSidebar />

      <main
        className="hostel-layout-main"
        style={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>
    </div>
  );
}