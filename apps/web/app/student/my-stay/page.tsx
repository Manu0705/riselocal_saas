import { Suspense } from 'react';
import MyStayContent from './MyStayContent';

export default function MyStayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
          <div className="text-sm text-[#536579]">
            Loading your stay...
          </div>
        </main>
      }
    >
      <MyStayContent />
    </Suspense>
  );
}