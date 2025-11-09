'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services/transactionService';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { groupService } from '@/services/groupService';
import { Transaction, EntityType } from '@/types';
import { Plus, Filter } from 'lucide-react';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { TransactionFilterModal } from '@/components/TransactionFilterModal';
import { TransactionsTable } from '@/components/TransactionsTable';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/pt-br';
import { createInUserTimezone, toUserTimezone, getUserTimezone } from '@/lib/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface TransactionManagerProps {
  groupId?: number;
  canManage?: boolean;
  canView?: boolean;
  title?: string;
  showUser?: boolean;
}

export default function TransactionManager({ 
  groupId, 
  canManage = true, 
  canView = true,
  title = 'Transações',
  showUser = false
}: TransactionManagerProps) {
  const queryClient = useQueryClient();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [filters, setFilters] = useState({
    year: currentYear,
    month: currentMonth,
    type: '',
    categoryId: undefined as number | undefined,
    subcategoryId: undefined as number | undefined,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: 0,
    subcategoryId: 0,
    title: '',
    amount: '',
    description: '',
    dateTime: createInUserTimezone(), // Dayjs object for date and time in user's timezone
    type: 'EXPENSE' as EntityType,
    ...(groupId && { groupId }),
    ...(groupId && { userId: undefined as number | undefined }),
  });

  // Detect dark mode on mount and when it changes
  useEffect(() => {
    const updateDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    updateDarkMode();
    
    // Watch for changes to dark mode
    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  const getDateRange = () => {
    const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
    const lastDay = new Date(filters.year, filters.month, 0).getDate();
    const endDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
  };

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: groupId ? ['transactions', filters, groupId] : ['transactions', filters],
    queryFn: () => {
      const { startDate, endDate } = getDateRange();
      return transactionService.getAll({
        startDate,
        endDate,
        type: filters.type || undefined,
        subcategoryId: filters.subcategoryId,
        ...(groupId && { groupId }),
      });
    },
    enabled: canView,
  });

  const { data: categories = [] } = useQuery({
    queryKey: groupId ? ['categories', groupId] : ['categories'],
    queryFn: () => categoryService.getAll(groupId),
    enabled: canView,
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: groupId ? ['subcategories', groupId] : ['subcategories'],
    queryFn: () => subcategoryService.getAll(groupId),
    enabled: canView,
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => groupService.getMembers(groupId!),
    enabled: !!groupId && canView,
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
      dateTime: createInUserTimezone(), // Current date and time in user's timezone
      type: 'EXPENSE',
      ...(groupId && { groupId }),
      ...(groupId && { userId: undefined as number | undefined }),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert to UTC for sending to backend
    const dateInUtc = formData.dateTime.utc();
    const dateStr = dateInUtc.format('YYYY-MM-DD');
    const timeStr = dateInUtc.format('HH:mm:ss');
    
    const data = {
      subcategoryId: formData.subcategoryId,
      title: formData.title,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: dateStr,
      time: timeStr,
      type: formData.type,
      ...(groupId && { groupId }),
      ...(groupId && formData.userId && { userId: formData.userId }),
    };

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    if (!canManage) return;
    setEditingTransaction(transaction);
    const subcategory = subcategories.find((s) => s.id === transaction.subcategoryId);
    // Convert UTC date from backend to user's timezone
    const transactionDate = toUserTimezone(transaction.date);
    setFormData({
      categoryId: subcategory?.categoryId || 0,
      subcategoryId: transaction.subcategoryId,
      title: transaction.title,
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      dateTime: transactionDate,
      type: transaction.type,
      ...(groupId && { groupId }),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!canManage) return;
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteMutation.mutate(id);
    }
  };

  // Create MUI theme that matches our dark mode
  const muiTheme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  });

  return (
    <div className="space-y-4">
      {/* Desktop Title - Only visible on desktop */}
      <div className="hidden lg:block">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
      </div>

      {/* Sticky Header - Mobile and Desktop */}
      <div className="bg-gray-50 dark:bg-gray-900 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 shadow-sm lg:shadow-none">
        <div className="pt-3 lg:pt-0 space-y-3">
          {/* Mobile: Compact header with all controls */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex-1">
              <MonthYearPicker
                year={filters.year}
                month={filters.month}
                onMonthYearChange={(year, month) => setFilters({ ...filters, year, month })}
              />
            </div>
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center justify-center p-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <Filter size={18} />
            </button>
          </div>

          {/* Desktop: Month picker with filter button */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex-1">
              <MonthYearPicker
                year={filters.year}
                month={filters.month}
                onMonthYearChange={(year, month) => setFilters({ ...filters, year, month })}
              />
            </div>
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter size={20} />
              <span>Filtrar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <TransactionFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={{
          type: filters.type,
          categoryId: filters.categoryId,
          subcategoryId: filters.subcategoryId,
        }}
        onFiltersChange={(newFilters) =>
          setFilters({
            ...filters,
            type: newFilters.type,
            categoryId: newFilters.categoryId,
            subcategoryId: newFilters.subcategoryId,
          })
        }
        categories={categories}
        subcategories={subcategories}
        showCategoryFilter={!groupId}
      />

      {/* Table */}
      <div className="mb-24">
        <TransactionsTable
          transactions={transactions}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canManage={canManage}
          showUser={showUser}
        />
      </div>

      {/* Floating Add Button */}
      {canManage && (
        <button
          onClick={() => {
            setEditingTransaction(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 p-4 bg-blue-600 dark:bg-blue-700 text-white rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all hover:scale-110 active:scale-95"
          aria-label="Adicionar transação"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingTransaction ? 'Editar' : 'Adicionar Transação'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Data e Horário
                </label>
                <ThemeProvider theme={muiTheme}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                    <DateTimePicker
                      value={formData.dateTime}
                      onChange={(newValue: Dayjs | null) => {
                        if (newValue) {
                          setFormData({ ...formData, dateTime: newValue });
                        }
                      }}
                      format="DD/MM/YYYY HH:mm"
                      ampm={false}
                      slotProps={{
                        textField: {
                          required: true,
                          fullWidth: true,
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '0.5rem',
                              backgroundColor: isDarkMode ? 'rgb(55 65 81)' : 'white',
                              '& fieldset': {
                                borderColor: isDarkMode ? 'rgb(75 85 99)' : 'rgb(209 213 219)',
                              },
                              '&:hover fieldset': {
                                borderColor: isDarkMode ? 'rgb(107 114 128)' : 'rgb(156 163 175)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'rgb(59 130 246)',
                                borderWidth: '2px',
                              },
                            },
                            '& .MuiInputBase-input': {
                              padding: '8px 12px',
                              color: isDarkMode ? 'rgb(243 244 246)' : 'rgb(17 24 39)',
                            },
                            '& .MuiIconButton-root': {
                              color: isDarkMode ? 'rgb(243 244 246)' : 'rgb(17 24 39)',
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </ThemeProvider>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="Digite o título da transação..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as EntityType;
                    setFormData({ 
                      ...formData, 
                      type: newType,
                      categoryId: 0,
                      subcategoryId: 0
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                >
                  <option value="EXPENSE">Despesa</option>
                  <option value="INCOME">Receita</option>
                </select>
              </div>
              {groupId && !editingTransaction && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Membro do Grupo
                  </label>
                  <select
                    value={formData.userId || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      userId: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                  >
                    <option value="">Eu (usuário atual)</option>
                    {groupMembers.filter(m => m.user).map((member) => (
                      <option key={member.id} value={member.user!.id} className="text-gray-900 dark:text-gray-100">
                        {member.user!.firstName} {member.user!.lastName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Selecione qual membro do grupo fez esta transação
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    categoryId: Number(e.target.value),
                    subcategoryId: 0
                  })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                >
                  <option value={0} className="text-gray-500 dark:text-gray-400">Selecione uma categoria</option>
                  {categories
                    .filter((cat) => cat.type === formData.type)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id} className="text-gray-900 dark:text-gray-100">
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Subcategoria
                </label>
                <select
                  value={formData.subcategoryId}
                  onChange={(e) => setFormData({ ...formData, subcategoryId: Number(e.target.value) })}
                  required
                  disabled={!formData.categoryId}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  <option value={0} className="text-gray-500 dark:text-gray-400">Selecione uma subcategoria</option>
                  {subcategories
                    .filter((sub) => sub.type === formData.type && sub.categoryId === formData.categoryId)
                    .map((sub) => (
                      <option key={sub.id} value={sub.id} className="text-gray-900 dark:text-gray-100">
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="Descrição opcional..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Carregando...'
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
