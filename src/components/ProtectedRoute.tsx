'use client';

import { useEffect } from 'react';
import { useRouter as useNextRouter, usePathname } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';

export default function ProtectedRoute({ 
  children
}: { 
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string || 'pt'; // Get locale from params, fallback to default

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !pathname.includes('/auth/login')) {
        router.push('/auth/login');
      } else if (isAuthenticated && user?.locale && user.locale !== currentLocale && !pathname.includes('/auth/')) {
        // Use the next-intl router for locale switching
        const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
        window.location.href = `/${user.locale}${pathWithoutLocale}`;
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname, currentLocale]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated && !pathname.includes('/auth/login')) {
    return null;
  }

  return <>{children}</>;
}
