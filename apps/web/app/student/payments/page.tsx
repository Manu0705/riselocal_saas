import { Suspense } from 'react';
import PaymentsContent from './PaymentsContent';

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
          <div className="text-sm text-[#536579]">
            Loading your payments...
          </div>
        </main>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}