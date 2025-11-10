"use client";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import { createInUserTimezone, getUserTimezone } from '@/lib/timezone';
dayjs.extend(timezone);

import { useEffect, useState } from 'react';
import { accountService } from '@/services/accountService';
import { groupService } from '@/services/groupService';
import { Account, AccountBalance, AccountType } from '@/types';
import { GroupMember } from '@/types';
import { Plus, Pencil, Trash2, Wallet, CreditCard, DollarSign, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AccountManagerProps {
  groupId?: number;
  canManage?: boolean;
  canView?: boolean;
  title?: string;
  currentUserId?: number;
  canManageOwn?: boolean;
  canManageAll?: boolean;
}

export default function AccountManager({
  groupId,
  canManage = true,
  canView = true,
  title,
  currentUserId,
  canManageOwn = false,
  canManageAll = false,
}: AccountManagerProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [balances, setBalances] = useState<Record<number, AccountBalance | null>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH' as AccountType,
    initialBalance: '0,00',
    initialBalanceDateTime: createInUserTimezone(),
    userId: currentUserId || undefined,
  });

  const [balanceFormData, setBalanceFormData] = useState({
    amount: 0,
    dateTime: createInUserTimezone(), // Dayjs object
  });

  useEffect(() => {
    if (canView) {
      loadAccounts();
    }
    if (groupId && showModal) {
      groupService.getMembers(groupId).then((members: GroupMember[]) => setGroupMembers(members));
    }
  }, [canView, groupId, showModal]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAll(groupId ? { groupId } : undefined);
      setAccounts(data);

      // Load balances for all accounts
      const balancePromises = data.map(async (account) => {
        const balance = await accountService.getCurrentBalance(account.id);
        return { accountId: account.id, balance };
      });

      const balanceResults = await Promise.all(balancePromises);
      const balanceMap: Record<number, AccountBalance | null> = {};
      balanceResults.forEach(({ accountId, balance }) => {
        balanceMap[accountId] = balance;
      });
      setBalances(balanceMap);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast.error('Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const canEditAccount = (account: Account): boolean => {
    if (!groupId) return canManage; // Personal accounts
    
    // Group accounts
    if (canManageAll) return true;
    if (canManageOwn && currentUserId && account.userId === currentUserId) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await accountService.update(editingAccount.id, {
          name: formData.name,
          type: formData.type,
        });
        toast.success('Conta atualizada com sucesso!');
      } else {
        // userId só é enviado se for grupo
        const payload = groupId ? { ...formData, groupId, userId: formData.userId } : formData;
        // Remover userId se não for grupo
        if (!groupId) delete (payload as any).userId;
        // Enviar saldo inicial e data/hora
        const amountNumber = Number(formData.initialBalance.replace(/\./g, '').replace(',', '.'));
        await accountService.create({
          ...payload,
          initialBalance: amountNumber,
          // Se a API suportar, envie initialBalanceDate: formData.initialBalanceDateTime.toDate(),
          // Caso contrário, apenas envie initialBalance e trate a data/hora no backend
        });
        toast.success('Conta criada com sucesso!');
      }
      setShowModal(false);
      resetForm();
      loadAccounts();
    } catch (error) {
      console.error('Failed to save account:', error);
      toast.error('Erro ao salvar conta');
    }
  };

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;

    try {
      await accountService.addBalance({
        accountId: selectedAccountId,
        amount: balanceFormData.amount,
        date: balanceFormData.dateTime.toDate(),
      });
      toast.success('Saldo atualizado com sucesso!');
      setShowBalanceModal(false);
      resetBalanceForm();
      loadAccounts();
    } catch (error) {
      console.error('Failed to update balance:', error);
      toast.error('Erro ao atualizar saldo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

    try {
      await accountService.delete(id);
      toast.success('Conta excluída com sucesso!');
      loadAccounts();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Erro ao excluir conta');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'CASH',
      initialBalance: '0,00',
      initialBalanceDateTime: createInUserTimezone(),
      userId: currentUserId || undefined,
    });
    setEditingAccount(null);
  };

  const resetBalanceForm = () => {
    setBalanceFormData({
      amount: 0,
      dateTime: createInUserTimezone(),
    });
    setSelectedAccountId(null);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      initialBalance: '0,00',
      initialBalanceDateTime: createInUserTimezone(),
      userId: account.userId,
    });
    setShowModal(true);
  };

  const openBalanceModal = (accountId: number) => {
    const currentBalance = balances[accountId];
    setSelectedAccountId(accountId);
    setBalanceFormData({
      amount: currentBalance?.amount || 0,
      dateTime: createInUserTimezone(),
    });
    setShowBalanceModal(true);
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'CREDIT':
        return <CreditCard className="w-6 h-6" />;
      case 'CASH':
        return <DollarSign className="w-6 h-6" />;
      case 'PREPAID':
        return <Wallet className="w-6 h-6" />;
      default:
        return <Wallet className="w-6 h-6" />;
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'CREDIT':
        return 'Crédito';
      case 'CASH':
        return 'Dinheiro';
      case 'PREPAID':
        return 'Pré-pago';
      default:
        return type;
    }
  };

  const getAccountTypeEmoji = (type: AccountType) => {
    switch (type) {
      case 'CREDIT':
        return '💳';
      case 'CASH':
        return '💵';
      case 'PREPAID':
        return '💰';
      default:
        return '🏦';
    }
  };

  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            Você não tem permissão para visualizar as contas{groupId ? ' deste grupo' : ''}.
          </p>
        </div>
      </div>
    );
  }

  const showCreateButton = groupId ? (canManageOwn || canManageAll) : canManage;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title || 'Minhas Contas'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas contas e acompanhe seus saldos
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando contas...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma conta cadastrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Comece criando sua primeira conta para gerenciar seu dinheiro
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const balance = balances[account.id];
            const canEdit = canEditAccount(account);

            // Buscar nome do dono
            let ownerName = '';
            if (groupId) {
              const owner = groupMembers.find(m => m.userId === account.userId);
              ownerName = owner?.user?.firstName ? `${owner.user.firstName} ${owner.user.lastName}` : owner?.user?.email || '';
            }
            return (
              <div
                key={account.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{getAccountTypeEmoji(account.type)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {account.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getAccountTypeLabel(account.type)}
                      </p>
                      {groupId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Dono: {ownerName}
                        </p>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(account)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Editar conta"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Excluir conta"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Saldo Atual</span>
                    {canEdit && (
                      <button
                        onClick={() => openBalanceModal(account.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Atualizar
                      </button>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {balance?.amount?.toFixed(2) || '0.00'}
                  </div>
                  {balance && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Atualizado em {new Date(balance.date).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Button */}
      {showCreateButton && (
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="fixed bottom-6 right-6 z-40 p-4 bg-blue-600 dark:bg-blue-700 text-white rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all hover:scale-110 active:scale-95"
          title="Criar nova conta"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Create/Edit Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingAccount ? 'Editar Conta' : 'Nova Conta'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Conta
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: Carteira, Nubank, Conta Corrente"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Conta
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="CASH">💵 Dinheiro</option>
                    <option value="CREDIT">💳 Crédito</option>
                    <option value="PREPAID">💰 Pré-pago</option>
                  </select>
                </div>

                {groupId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dono da Conta
                    </label>
                    {canManageAll ? (
                      <select
                        value={formData.userId}
                        onChange={e => setFormData({ ...formData, userId: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {groupMembers.map(member => (
                          <option key={member.userId} value={member.userId}>
                            {member.user?.firstName ? `${member.user.firstName} ${member.user.lastName}` : member.user?.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={groupMembers.find(m => m.userId === currentUserId)?.user?.firstName ? `${groupMembers.find(m => m.userId === currentUserId)?.user?.firstName} ${groupMembers.find(m => m.userId === currentUserId)?.user?.lastName}` : groupMembers.find(m => m.userId === currentUserId)?.user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    )}
                  </div>
                )}

                {!editingAccount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Saldo Inicial
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.initialBalance}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const cents = Number(digits || '0');
                        const formatted = (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        setFormData({ ...formData, initialBalance: formatted });
                      }}
                      onKeyDown={(e) => {
                        const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
                        if (allowed.includes(e.key)) return;
                        if (!/^\d$/.test(e.key)) e.preventDefault();
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0,00"
                    />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">
                      Data e Hora do Saldo Inicial
                    </label>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                      <DateTimePicker
                        value={formData.initialBalanceDateTime}
                        onChange={(newValue: Dayjs | null) => {
                          if (newValue) {
                            setFormData({ ...formData, initialBalanceDateTime: newValue });
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
                                backgroundColor: 'white',
                                '& fieldset': {
                                  borderColor: 'rgb(209 213 219)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgb(156 163 175)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: 'rgb(59 130 246)',
                                  borderWidth: '2px',
                                },
                              },
                              '& .MuiInputBase-input': {
                                padding: '8px 12px',
                                color: 'rgb(17 24 39)',
                              },
                              '& .MuiIconButton-root': {
                                color: 'rgb(17 24 39)',
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingAccount ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Balance Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Atualizar Saldo
                </h3>
                <button
                  onClick={() => {
                    setShowBalanceModal(false);
                    resetBalanceForm();
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleBalanceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Novo Saldo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={balanceFormData.amount}
                    onChange={(e) => setBalanceFormData({ ...balanceFormData, amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data e Hora
                  </label>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                    <DateTimePicker
                      value={balanceFormData.dateTime}
                      onChange={(newValue: Dayjs | null) => {
                        if (newValue) {
                          setBalanceFormData({ ...balanceFormData, dateTime: newValue });
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
                              backgroundColor: 'white',
                              '& fieldset': {
                                borderColor: 'rgb(209 213 219)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgb(156 163 175)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'rgb(59 130 246)',
                                borderWidth: '2px',
                              },
                            },
                            '& .MuiInputBase-input': {
                              padding: '8px 12px',
                              color: 'rgb(17 24 39)',
                            },
                            '& .MuiIconButton-root': {
                              color: 'rgb(17 24 39)',
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBalanceModal(false);
                      resetBalanceForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Atualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
