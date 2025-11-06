'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ 
  children
}: { 
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      // Get current locale from pathname
      const currentLocale = pathname.split('/')[1];
      
      if (!isAuthenticated && !pathname.includes('/auth/login')) {
        // Redirect to login if not authenticated
        router.push(`/${currentLocale}/auth/login`);
      } else if (isAuthenticated && user?.locale && user.locale !== currentLocale && !pathname.includes('/auth/')) {
        // If user is authenticated and their preferred locale is different, redirect to their locale
        const newPath = pathname.replace(`/${currentLocale}`, `/${user.locale}`);
        window.location.href = newPath;
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname]);

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
