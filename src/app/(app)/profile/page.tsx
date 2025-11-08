'use client';

import { authService } from '@/services/authService';

export default function ProfilePage() {
  const user = authService.getCurrentUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Perfil
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Informações do Perfil
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.email || 'Não disponível'}
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <svg className="w-12 h-12" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
              <rect width="60" height="30" fill="#009b3a"/>
              <path d="M30,3 L54,15 L30,27 L6,15 Z" fill="#fedf00"/>
              <circle cx="30" cy="15" r="5" fill="#002776"/>
            </svg>
            <div>
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Português (Brasil)
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Idioma do sistema
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
