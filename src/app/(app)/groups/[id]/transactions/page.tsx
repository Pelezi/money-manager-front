'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services/transactionService';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { Transaction, EntityType } from '@/types';
import { Plus, Filter } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { TransactionFilterModal } from '@/components/TransactionFilterModal';
import { TransactionsTable } from '@/components/TransactionsTable';

export default function GroupTransactionsPage() {
  const params = useParams();
  const groupId = parseInt(params?.id as string);
          const queryClient = useQueryClient();
  const { currentGroupPermissions } = useAppStore();

  const now = new Date();
  const [filters, setFilters] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    type: '',
    subcategoryId: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    categoryId: 0,
    subcategoryId: 0,
    title: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as EntityType,
    groupId,
  });

  const getDateRange = () => {
    const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
    const lastDay = new Date(filters.year, filters.month, 0).getDate();
    const endDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-${lastDay}`;
    return { startDate, endDate };
  };

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', filters, groupId],
    queryFn: () => {
      const { startDate, endDate } = getDateRange();
      return transactionService.getAll({ 
        startDate, 
        endDate, 
        type: filters.type || undefined, 
        subcategoryId: filters.subcategoryId || undefined,
        groupId 
      });
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', groupId],
    queryFn: () => categoryService.getAll(groupId),
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', groupId],
    queryFn: () => subcategoryService.getAll(groupId),
  });

  const createMutation = useMutation({
    mutationFn: transactionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Transaction> }) =>
      transactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsModalOpen(false);
      setEditingTransaction(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: transactionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const resetForm = () => {
    setFormData({
      categoryId: 0,
      subcategoryId: 0,
      title: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'EXPENSE' as EntityType,
      groupId,
    });
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      categoryId: transaction.subcategory?.categoryId || 0,
      subcategoryId: transaction.subcategoryId,
      title: transaction.title,
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      date: transaction.date.split('T')[0],
      type: transaction.type,
      groupId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const canManage = currentGroupPermissions?.canManageTransactions || false;
  const canView = currentGroupPermissions?.canViewTransactions || false;

  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">Você não tem permissão para visualizar as transações deste grupo.</p>
        </div>
      </div>
    );
  }

  const filteredCategories = categories.filter(c => c.type === formData.type);
  const filteredSubcategories = subcategories.filter(s => 
    s.categoryId === formData.categoryId
  );

  return (
    <div className="space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Transações do Grupo
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter size={20} />
            <span className="hidden sm:inline">Filtrar</span>
          </button>
          {canManage && (
            <button
              onClick={() => {
                setEditingTransaction(null);
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Adicionar Transação</span>
            </button>
          )}
        </div>
      </div>

      {/* Month/Year Picker - Fixed at top */}
      <div className="sticky top-0 z-10">
        <MonthYearPicker
          year={filters.year}
          month={filters.month}
          onMonthYearChange={(year, month) => setFilters({ ...filters, year, month })}
        />
      </div>

      {/* Filter Modal */}
      <TransactionFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={{
          type: filters.type,
          subcategoryId: filters.subcategoryId,
        }}
        onFiltersChange={(newFilters) =>
          setFilters({
            ...filters,
            type: newFilters.type,
            subcategoryId: newFilters.subcategoryId || 0,
          })
        }
        categories={categories}
        subcategories={subcategories}
        showCategoryFilter={false}
      />

      {/* Transactions Table */}
      <TransactionsTable
        transactions={transactions}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(id) => {
          if (confirm('Tem certeza que deseja excluir esta transação?')) {
            deleteMutation.mutate(id);
          }
        }}
        canManage={canManage}
        showUser={true}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingTransaction ? 'Editar Transação' : 'Adicionar Transação'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as EntityType,
                      categoryId: 0,
                      subcategoryId: 0,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="EXPENSE">Despesa</option>
                  <option value="INCOME">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryId: Number(e.target.value),
                      subcategoryId: 0,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value={0}>Selecione a Categoria</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subcategoria</label>
                <select
                  value={formData.subcategoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, subcategoryId: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                  disabled={!formData.categoryId}
                >
                  <option value={0}>Selecione a Subcategoria</option>
                  {filteredSubcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição (opcional)"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Salvando...'
                    : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
