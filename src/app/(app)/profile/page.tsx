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
        </div>
      </div>
    </div>
  );
}
