'use client';

import { useState, useEffect } from 'react';
import { Subcategory, Category, EntityType } from '@/types';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: 'delete' | 'hide', deleteTransactions?: boolean, moveToSubcategoryId?: number) => void;
  categoryName: string;
  transactionCount: number;
  budgetCount?: number;
  accountCount?: number;
  availableSubcategories: Subcategory[];
  availableCategories: Category[];
  isCategory: boolean; // true for category, false for subcategory
}

export default function DeleteCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  transactionCount,
  budgetCount = 0,
  accountCount = 0,
  availableSubcategories,
  availableCategories,
  isCategory
}: DeleteCategoryModalProps) {
  const [action, setAction] = useState<'delete' | 'hide' | 'move'>('hide');
  const [selectedType, setSelectedType] = useState<EntityType>('EXPENSE');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | undefined>(undefined);

  // Filter categories by type
  const categoriesByType = availableCategories.filter(cat => cat.type === selectedType);

  // Get unique categories from available subcategories filtered by type
  const uniqueCategories = categoriesByType.filter(cat => 
    availableSubcategories.some(sub => sub.categoryId === cat.id && sub.type === selectedType)
  );

  // Filter subcategories by selected type and category
  const filteredSubcategories = availableSubcategories.filter(sub => {
    if (sub.type !== selectedType) return false;
    if (selectedCategoryId) return sub.categoryId === selectedCategoryId;
    return true;
  });

  // Check if there are any subcategories available for each type
  const hasExpenseSubcategories = availableSubcategories.some(sub => sub.type === 'EXPENSE');
  const hasIncomeSubcategories = availableSubcategories.some(sub => sub.type === 'INCOME');

  useEffect(() => {
    if (isOpen) {
      // Set initial type based on available subcategories
      if (hasExpenseSubcategories) {
        setSelectedType('EXPENSE');
      } else if (hasIncomeSubcategories) {
        setSelectedType('INCOME');
      }
    }
  }, [isOpen, hasExpenseSubcategories, hasIncomeSubcategories]);

  useEffect(() => {
    if (uniqueCategories.length > 0) {
      setSelectedCategoryId(uniqueCategories[0].id);
    } else {
      setSelectedCategoryId(undefined);
    }
  }, [selectedType, uniqueCategories.length]);

  useEffect(() => {
    if (filteredSubcategories.length > 0) {
      setSelectedSubcategoryId(filteredSubcategories[0].id);
    } else {
      setSelectedSubcategoryId(undefined);
    }
  }, [selectedType, selectedCategoryId, filteredSubcategories.length]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (transactionCount === 0) {
      // No transactions, check if hiding or deleting
      if (action === 'hide') {
        onConfirm('hide');
      } else {
        onConfirm('delete', false);
      }
    } else {
      // Has transactions
      if (action === 'hide') {
        onConfirm('hide');
      } else if (action === 'delete') {
        onConfirm('delete', true);
      } else {
        onConfirm('delete', false, selectedSubcategoryId);
      }
    }
  };

  const entityType = isCategory ? 'categoria' : 'subcategoria';
  const entityTypeTitle = isCategory ? 'Categoria' : 'Subcategoria';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Excluir {entityTypeTitle}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Você está prestes a excluir a {entityType}{' '}
            <span className="font-semibold">{categoryName}</span>.
          </p>

          {transactionCount === 0 && budgetCount === 0 && accountCount === 0 ? (
            <>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Esta {entityType} não possui transações, orçamentos ou contas associadas.
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  O que deseja fazer?
                </p>

                {/* Option: Hide */}
                <label className="flex items-start gap-3 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <input
                    type="radio"
                    name="action"
                    value="hide"
                    checked={action === 'hide'}
                    onChange={() => setAction('hide')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Esconder {entityType}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      A {entityType} não será excluída, apenas não aparecerá ao criar novas transações. Você pode reexibi-la depois se necessário.
                    </p>
                  </div>
                </label>

                {/* Option: Delete */}
                <label className="flex items-start gap-3 p-3 border-2 border-red-200 dark:border-red-800 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <input
                    type="radio"
                    name="action"
                    value="delete"
                    checked={action === 'delete'}
                    onChange={() => setAction('delete')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      Excluir {entityType} permanentemente
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Esta ação é irreversível. A {entityType} será removida do sistema.
                    </p>
                  </div>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-2">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Atenção:</strong> Esta {entityType} possui:
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 list-disc list-inside">
                  {transactionCount > 0 && (
                    <li>
                      <strong>{transactionCount}</strong> {transactionCount === 1 ? 'transação associada' : 'transações associadas'}
                    </li>
                  )}
                  {budgetCount > 0 && (
                    <li>
                      <strong>{budgetCount}</strong> {budgetCount === 1 ? 'orçamento cadastrado' : 'orçamentos cadastrados'}
                    </li>
                  )}
                  {accountCount > 0 && (
                    <li>
                      <strong>{accountCount}</strong> {accountCount === 1 ? 'conta vinculada' : 'contas vinculadas'}
                    </li>
                  )}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  O que deseja fazer?
                </p>

                {/* Option: Hide */}
                <label className="flex items-start gap-3 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <input
                    type="radio"
                    name="action"
                    value="hide"
                    checked={action === 'hide'}
                    onChange={() => setAction('hide')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Esconder {entityType}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      A {entityType} não será excluída e tudo permanecerá intacto (transações, orçamentos e contas). Ela apenas não aparecerá ao criar novas transações.
                    </p>
                  </div>
                </label>

                {/* Option: Move transactions */}
                {availableSubcategories.length > 0 && (
                  <label className="flex items-start gap-3 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <input
                      type="radio"
                      name="action"
                      value="move"
                      checked={action === 'move'}
                      onChange={() => setAction('move')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Mover para outra subcategoria e excluir
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Transações, orçamentos e contas serão transferidos para a subcategoria selecionada. Orçamentos serão somados aos existentes.
                      </p>
                      {action === 'move' && (
                        <div className="space-y-3">
                          {/* Type Filter */}
                          {(hasExpenseSubcategories && hasIncomeSubcategories) && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo
                              </label>
                              <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as EntityType)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="EXPENSE">Despesa</option>
                                <option value="INCOME">Renda</option>
                              </select>
                            </div>
                          )}
                          
                          {/* Category Filter */}
                          {uniqueCategories.length > 1 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Categoria
                              </label>
                              <select
                                value={selectedCategoryId || ''}
                                onChange={(e) => setSelectedCategoryId(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {uniqueCategories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* Subcategory Select */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Subcategoria de Destino
                            </label>
                            <select
                              value={selectedSubcategoryId || ''}
                              onChange={(e) => setSelectedSubcategoryId(parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                              disabled={filteredSubcategories.length === 0}
                            >
                              {filteredSubcategories.length > 0 ? (
                                filteredSubcategories.map((sub) => (
                                  <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                  </option>
                                ))
                              ) : (
                                <option value="">Nenhuma subcategoria disponível</option>
                              )}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                )}

                {/* Option: Delete transactions */}
                <label className="flex items-start gap-3 p-3 border-2 border-red-200 dark:border-red-800 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <input
                    type="radio"
                    name="action"
                    value="delete"
                    checked={action === 'delete'}
                    onChange={() => setAction('delete')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      Excluir {entityType} e tudo associado
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Atenção:</strong> Esta ação é irreversível! A {entityType}, {transactionCount > 0 && `todas as ${transactionCount} ${transactionCount === 1 ? 'transação' : 'transações'}`}{budgetCount > 0 && `, ${budgetCount} ${budgetCount === 1 ? 'orçamento' : 'orçamentos'}`}{accountCount > 0 && ` e ${accountCount} ${accountCount === 1 ? 'conta vinculada será desvinculada' : 'contas vinculadas serão desvinculadas'}`} serão permanentemente {transactionCount > 0 || budgetCount > 0 ? 'removidos' : 'removidas'}.
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={transactionCount > 0 && action === 'move' && !selectedSubcategoryId}
            className={`px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              action === 'hide' 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : action === 'delete' 
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {action === 'hide' 
              ? 'Esconder' 
              : action === 'delete' 
                ? (transactionCount === 0 ? 'Excluir' : 'Excluir Tudo')
                : 'Mover e Excluir'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
