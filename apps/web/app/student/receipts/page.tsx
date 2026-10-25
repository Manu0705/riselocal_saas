import { Suspense } from 'react';
import ReceiptsContent from './ReceiptsContent';

export default function ReceiptsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
          <div className="text-sm text-[#536579]">
            Loading your receipts...
          </div>
        </main>
      }
    >
      <ReceiptsContent />
    </Suspense>
  );
}