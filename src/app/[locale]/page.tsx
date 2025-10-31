'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/services/authService';

export const dynamic = 'force-dynamic';

export default function LocaleHomePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      router.push(`/${locale}/transactions`);
    } else {
      router.push(`/${locale}/auth/login`);
    }
  }, [locale, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
