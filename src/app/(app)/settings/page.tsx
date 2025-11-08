'use client';

import { useState } from 'react';
import FirstAccessSetupModal from '@/components/FirstAccessSetupModal';

export default function SettingsPage() {
    const [showSetupModal, setShowSetupModal] = useState(false);

  const handleSetupComplete = () => {
    setShowSetupModal(false);
    // Optionally reload categories data
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Gerenciar Categorias Padrão
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Gerenciar Categorias Padrão
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Adicione mais categorias e subcategorias padrão à sua conta
            </p>
          </div>

          <button
            onClick={() => setShowSetupModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Gerenciar Categorias Padrão
          </button>
        </div>
      </div>

      {showSetupModal && (
        <FirstAccessSetupModal 
          onComplete={handleSetupComplete}
          isResetup={true}
        />
      )}
    </div>
  );
}
