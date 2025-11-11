'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services/transactionService';
import { accountService } from '@/services/accountService';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { groupService } from '@/services/groupService';
import { Transaction, EntityType } from '@/types';
import { Plus, Filter } from 'lucide-react';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
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

  // Buscar contas disponíveis
  const { data: accounts = [] } = useQuery({
    queryKey: groupId ? ['accounts', groupId] : ['accounts'],
    queryFn: () => accountService.getAll(groupId ? { groupId } : undefined),
    enabled: canView,
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [filters, setFilters] = useState({
    year: currentYear,
    month: currentMonth,
    type: '',
    categoryId: undefined as number | undefined,
    subcategoryId: undefined as number | undefined,
    accountId: undefined as number | undefined,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [formData, setFormData] = useState({
    categoryId: 0,
    subcategoryId: 0,
    accountId: 0,
    toAccountId: 0,
    title: '',
    amount: '0,00',
    description: '',
    dateTime: createInUserTimezone(), // Dayjs object for date and time in user's timezone
    type: 'EXPENSE' as EntityType,
    ...(groupId && { groupId }),
    ...(groupId && { userId: undefined as number | undefined }),
  });

  // Listen for changes to Tailwind's dark mode class
  useEffect(() => {
    const updateDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    updateDarkMode();
    window.addEventListener('storage', updateDarkMode);
    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('storage', updateDarkMode);
      observer.disconnect();
    };
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
        categoryId: filters.categoryId,
        subcategoryId: filters.subcategoryId,
        accountId: filters.accountId,
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
      accountId: 0,
      toAccountId: 0,
      title: '',
      amount: '0,00',
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

    const amountNumber = Number(formData.amount.replace(/\./g, '').replace(',', '.'));

    const data = {
      subcategoryId: formData.subcategoryId,
      accountId: formData.accountId,
      toAccountId: formData.toAccountId,
      title: formData.title,
      amount: amountNumber,
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
      accountId: transaction.accountId || 0,
      toAccountId: transaction.toAccountId || 0,
      title: transaction.title,
      amount: Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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

  // ---- Accent styles (cores por tipo) ----
  const ACCENTS = {
    EXPENSE: {
      twRing: 'focus:ring-red-500',
      twBorder: 'focus:border-red-500',
      twBorderBase: 'border-red-300',
      twText: 'text-red-600',
      twBgSoft: 'bg-red-50',
      twChipOn: 'bg-red-600 text-white border-red-600',
      twChipOff: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
      muiColor: '#ef4444', // red-500
    },
    INCOME: {
      twRing: 'focus:ring-green-500',
      twBorder: 'focus:border-green-500',
      twBorderBase: 'border-green-300',
      twText: 'text-green-600',
      twBgSoft: 'bg-green-50',
      twChipOn: 'bg-green-600 text-white border-green-600',
      twChipOff: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
      muiColor: '#22c55e', // green-500
    },
    TRANSFER: {
      twRing: 'focus:ring-gray-400',
      twBorder: 'focus:border-gray-400',
      twBorderBase: 'border-gray-300',
      twText: 'text-gray-600',
      twBgSoft: 'bg-gray-50',
      twChipOn: 'bg-gray-600 text-white border-gray-600',
      twChipOff: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
      muiColor: '#6b7280',
    },
  } as const;

  const accent = ACCENTS[formData.type];


  const muiTheme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: accent.muiColor,
      },
    },
  });

  const formatBRLfromCents = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const normalizeToBRL = (value: string) => {
    const digits = value.replace(/\D/g, ''); // só números
    const cents = Number(digits || '0');
    return formatBRLfromCents(cents);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = normalizeToBRL(e.target.value);
    setFormData((f) => ({ ...f, amount: formatted }));
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault(); // apenas dígitos
  };

  const formRef = useRef<HTMLFormElement>(null);

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
          accountId: filters.accountId,
        }}
        onFiltersChange={(newFilters) =>
          setFilters({
            ...filters,
            type: newFilters.type,
            categoryId: newFilters.categoryId,
            subcategoryId: newFilters.subcategoryId,
            accountId: newFilters.accountId,
          })
        }
        categories={categories}
        subcategories={subcategories}
        accounts={accounts}
        showCategoryFilter={!groupId}
      />

      {/* Table */}
      <div className="mb-24">
        <TransactionsTable
          transactions={transactions}
          accounts={accounts}
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
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-6 sm:pt-10 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            {/* Cabeçalho + selector de tipo */}
            <div className="sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingTransaction ? 'Editar Transação' : 'Adicionar Transação'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Fechar
                </button>
              </div>

              {/* Segmented control Despesa / Renda */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(f => ({ ...f, type: 'EXPENSE', categoryId: 0, subcategoryId: 0 }));
                  }}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors
                       ${formData.type === 'EXPENSE' ? accent.twChipOn : accent.twChipOff}`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(f => ({ ...f, type: 'INCOME', categoryId: 0, subcategoryId: 0 }));
                  }}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors
                       ${formData.type === 'INCOME' ? accent.twChipOn : accent.twChipOff}`}
                >
                  Renda
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(f => ({ ...f, type: 'TRANSFER', categoryId: 0, subcategoryId: 0 }));
                  }}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors
                       ${formData.type === 'TRANSFER' ? accent.twChipOn : accent.twChipOff}`}
                >
                  Transferência
                </button>
              </div>
            </div>

            {/* Conteúdo rolável */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="flex-1 p-4 space-y-4 overflow-y-auto pb-28 sm:pb-32"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Data/Hora - PRIMEIRO CAMPO */}
              <ThemeProvider theme={muiTheme}>
                <div>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                    <DateTimePicker
                      label="Data e horário"
                      value={formData.dateTime}
                      onChange={(newValue: Dayjs | null) => {
                        if (newValue) setFormData({ ...formData, dateTime: newValue });
                      }}
                      format="DD/MM/YYYY HH:mm"
                      ampm={false}
                      slotProps={{
                        textField: {
                          required: true,
                          focused: true,
                          fullWidth: true,
                          color: 'primary',
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>

                {/* Conta(s) - linha única quando for despesa ou renda, dois selects quando for transferência */}
                {formData.type === 'TRANSFER' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <FormControl focused fullWidth required margin="normal">
                      <InputLabel id="account-from-label">Conta origem</InputLabel>
                      <Select
                        labelId="account-from-label"
                        value={formData.accountId}
                        label="Conta origem"
                        onChange={(e) => setFormData({ ...formData, accountId: Number(e.target.value) })}
                      >
                        <MenuItem value={0}>Selecione</MenuItem>
                        {(accounts).map((acc) => (
                          <MenuItem key={acc.id} value={acc.id}>{acc.name} - {acc.type === 'CASH' ? 'Dinheiro' : acc.type === 'CREDIT' ? 'Crédito' : 'Pré-pago'} ({acc.user?.firstName})</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl focused fullWidth required margin="normal">
                      <InputLabel id="account-to-label">Conta destino</InputLabel>
                      <Select
                        labelId="account-to-label"
                        value={formData.toAccountId}
                        label="Conta destino"
                        onChange={(e) => setFormData({ ...formData, toAccountId: Number(e.target.value) })}
                      >
                        <MenuItem value={0}>Selecione</MenuItem>
                        {(accounts).map((acc) => (
                          <MenuItem key={acc.id} value={acc.id}>{acc.name} - {acc.type === 'CASH' ? 'Dinheiro' : acc.type === 'CREDIT' ? 'Crédito' : 'Pré-pago'} ({acc.user?.firstName})</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                ) : (
                  <FormControl focused fullWidth required margin="normal">
                    <InputLabel id="account-label">Conta</InputLabel>
                    <Select
                      labelId="account-label"
                      value={formData.accountId}
                      label="Conta"
                      onChange={(e) => setFormData({ ...formData, accountId: Number(e.target.value) })}
                    >
                      <MenuItem value={0}>Selecione</MenuItem>
                      {(accounts).map((acc) => (
                        <MenuItem key={acc.id} value={acc.id}>{acc.name} - {acc.type === 'CASH' ? 'Dinheiro' : acc.type === 'CREDIT' ? 'Crédito' : 'Pré-pago'} ({acc.user?.firstName})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* Categoria e Subcategoria - mesma linha (omitidas para transferências) */}
                {formData.type !== 'TRANSFER' && (
                  <div className="grid grid-cols-2 gap-2">
                    <FormControl focused fullWidth required margin="normal">
                      <InputLabel id="category-label">Categoria</InputLabel>
                      <Select
                        labelId="category-label"
                        value={formData.categoryId}
                        label="Categoria"
                        onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value), subcategoryId: 0 })}
                      >
                        <MenuItem value={0}>Selecione</MenuItem>
                        {categories.filter((cat) => cat.type === formData.type).map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl focused fullWidth required margin="normal" disabled={!formData.categoryId}>
                      <InputLabel id="subcategory-label">Subcategoria</InputLabel>
                      <Select
                        labelId="subcategory-label"
                        value={formData.subcategoryId}
                        label="Subcategoria"
                        onChange={(e) => setFormData({ ...formData, subcategoryId: Number(e.target.value) })}
                      >
                        <MenuItem value={0}>Selecione</MenuItem>
                        {subcategories
                          .filter((sub) => sub.type === formData.type && sub.categoryId === formData.categoryId)
                          .map((sub) => (<MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </div>
                )}


                {/* Valor */}
                <TextField focused 
                  label="Valor"
                  type="text"
                  inputMode="numeric"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  onKeyDown={handleAmountKeyDown}
                  required
                  fullWidth
                  margin="normal"
                  placeholder="0,00"
                />

                {/* Título */}
                <TextField focused 
                  label="Título"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  fullWidth
                  margin="normal"
                  placeholder="Opcional…"
                />

                {/* Descrição */}
                <TextField focused 
                  label="Descrição"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="Opcional…"
                />

                {/* (Opcional) Membro do grupo – mantive sua regra original */}
                {groupId && !editingTransaction && (
                  (() => {
                    // Busca o usuário atual
                    let currentUserId: number | undefined = undefined;
                    if (typeof window !== 'undefined') {
                      const userStr = localStorage.getItem('user');
                      if (userStr) {
                        try {
                          const user = JSON.parse(userStr);
                          currentUserId = Number(user.id);
                        } catch {}
                      }
                    }
                    // Se não estiver definido, pega o primeiro membro
                    const defaultUserId: number | undefined = currentUserId ?? (groupMembers[0]?.user?.id ?? undefined);
                    // Se não estiver selecionado, seleciona o padrão
                    if (!formData.userId && defaultUserId !== undefined) {
                      setFormData(f => ({ ...f, userId: defaultUserId }));
                    }
                    return (
                      <FormControl focused fullWidth margin="normal">
                        <InputLabel id="group-member-label">Membro do Grupo</InputLabel>
                        <Select
                          labelId="group-member-label"
                          value={formData.userId ?? defaultUserId ?? ''}
                          label="Membro do Grupo"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              userId: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        >
                          {defaultUserId !== undefined && (
                            <MenuItem value={defaultUserId}>Eu (usuário atual)</MenuItem>
                          )}
                          {groupMembers.filter(m => m.user).map((member) => (
                            <MenuItem key={member.id} value={member.user!.id}>
                              {member.user!.firstName} {member.user!.lastName}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>Selecione qual membro do grupo fez esta transação</FormHelperText>
                      </FormControl>
                    );
                  })()
                )}
              </ThemeProvider>

            </form>

            {/* Rodapé de ações fixo (mobile-friendly) */}
            <div
              className="sticky bottom-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)'
              }}
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    if (!formRef.current?.reportValidity()) return;
                    formRef.current?.requestSubmit();
                  }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50"
                  style={{ background: accent.muiColor }}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
}
