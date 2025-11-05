'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { userService } from '@/services/userService';
import { authService } from '@/services/authService';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  
  const [selectedLocale, setSelectedLocale] = useState<'en' | 'pt'>('en');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Get current locale from pathname
    const pathParts = pathname.split('/');
    const currentLocale = pathParts[1] as 'en' | 'pt';
    setSelectedLocale(currentLocale || 'en');
  }, [pathname]);

  const handleLocaleChange = async (locale: 'en' | 'pt') => {
    if (locale === selectedLocale) return;
    
    setIsUpdating(true);
    try {
      // Update locale in backend
      const updatedUser = await userService.updateLocale(locale);
      
      // Update user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      // Show success toast
      toast.success(t('updateSuccess'));
      
      // Change route to new locale
      const newPath = pathname.replace(`/${selectedLocale}`, `/${locale}`);
      router.push(newPath);
      
      // Reload to apply new locale
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to update locale:', error);
      toast.error(t('updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('title')}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('language')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('languageDescription')}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleLocaleChange('en')}
              disabled={isUpdating}
              className={`flex items-center gap-3 px-6 py-4 rounded-lg border-2 transition-all ${
                selectedLocale === 'en'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <svg className="w-8 h-8" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                <clipPath id="s">
                  <path d="M0,0 v30 h60 v-30 z"/>
                </clipPath>
                <clipPath id="t">
                  <path d="M30,15 h30 v15 z v-30 h-30 z h-30 v15 z v-30 h30 z"/>
                </clipPath>
                <g clipPath="url(#s)">
                  <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
                  <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                  <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
                  <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
                  <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
                </g>
              </svg>
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                English
              </span>
            </button>

            <button
              onClick={() => handleLocaleChange('pt')}
              disabled={isUpdating}
              className={`flex items-center gap-3 px-6 py-4 rounded-lg border-2 transition-all ${
                selectedLocale === 'pt'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <svg className="w-8 h-8" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="30" fill="#009b3a"/>
                <path d="M30,3 L54,15 L30,27 L6,15 Z" fill="#fedf00"/>
                <circle cx="30" cy="15" r="5" fill="#002776"/>
              </svg>
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Português
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
