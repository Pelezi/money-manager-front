'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

export default function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();

  useEffect(() => {
    const initRedirect = async () => {
      const { locale } = await params;
      
      // Check if user is authenticated
      const isAuthenticated = authService.isAuthenticated();
      
      if (isAuthenticated) {
        router.push(`/${locale}/transactions`);
      } else {
        router.push(`/${locale}/auth/login`);
      }
    };

    initRedirect();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
