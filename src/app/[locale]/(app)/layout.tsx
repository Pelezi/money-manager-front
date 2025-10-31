'use client';

import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <ProtectedRoute locale={locale}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar locale={locale} />
        <main className="flex-1 overflow-y-auto lg:ml-64">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
