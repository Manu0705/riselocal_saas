import { Suspense } from 'react';
import StudentLoginForm from './StudentLoginForm';

export default function StudentLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
          <div className="text-sm text-[#536579]">
            Loading student login...
          </div>
        </main>
      }
    >
      <StudentLoginForm />
    </Suspense>
  );
}