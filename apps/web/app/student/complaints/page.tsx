import { Suspense } from 'react';
import ComplaintsContent from './ComplaintsContent';

export default function ComplaintsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
          <div className="text-sm text-[#536579]">
            Loading your complaints...
          </div>
        </main>
      }
    >
      <ComplaintsContent />
    </Suspense>
  );
}