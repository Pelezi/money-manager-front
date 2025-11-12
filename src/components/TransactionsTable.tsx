'use client';

import { User } from 'lucide-react';
import { Transaction, Account } from '@/types';
import { useRouter } from 'next/navigation';
import { toUserTimezone, formatInUserTimezone } from '@/lib/timezone';

interface TransactionsTableProps {
  transactions: Transaction[];
  accounts: Account[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
  canManage?: boolean;
  showUser?: boolean;
  groupId?: number;
  initialAccountId?: number;
  currentAccountBalanceAmount?: number;
}

interface DayGroup {
  date: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  total: number;
}

export function TransactionsTable({
  transactions,
  accounts,
  isLoading,
  onEdit,
  onDelete,
  canManage = true,
  showUser = false,
  groupId,
  initialAccountId,
  currentAccountBalanceAmount,
}: TransactionsTableProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    // Convert to user's timezone
    const date = toUserTimezone(dateString);
    const today = toUserTimezone(new Date().toISOString());
    const yesterday = today.subtract(1, 'day');

    // Compare dates
    if (date.isSame(today, 'day')) {
      return { display: 'Hoje', isSpecial: true };
    } else if (date.isSame(yesterday, 'day')) {
      return { display: 'Ontem', isSpecial: true };
    }

    return { 
      display: formatInUserTimezone(dateString, 'DD/MM'),
      isSpecial: false 
    };
  };

  const getDayOfWeek = (dateString: string) => {
    const date = toUserTimezone(dateString);
    const dayNumber = date.day(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayNumber === 0 || dayNumber === 6;
    
    const dayNames: { [key: number]: string } = {
      0: 'Dom',
      1: 'Seg',
      2: 'Ter',
      3: 'Qua',
      4: 'Qui',
      5: 'Sex',
      6: 'Sáb'
    };

    return {
      name: dayNames[dayNumber],
      isWeekend
    };
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const dateKey = transaction.date.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        transactions: [],
        totalIncome: 0,
        totalExpense: 0,
        total: 0,
      };
    }
    acc[dateKey].transactions.push(transaction);
    
    // Balance updates are synthetic entries that should not affect totals
    if (transaction.type === 'UPDATE') {
      // do nothing
    } else if (transaction.type === 'INCOME') {
      acc[dateKey].totalIncome += transaction.amount;
      acc[dateKey].total += transaction.amount;
    } else if (transaction.type === 'EXPENSE') {
      acc[dateKey].totalExpense += transaction.amount;
      acc[dateKey].total -= transaction.amount;
    } else {
    }
    
    return acc;
  }, {} as Record<string, DayGroup>);

  // Sort by date descending
  const sortedDays = Object.values(groupedTransactions).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Compute running balances per transaction when viewing a single account (initialAccountId)
  const txBalanceAfter: Record<number, number> = {};
  if (initialAccountId && typeof currentAccountBalanceAmount === 'number' && transactions.length > 0) {
    // Flatten transactions and sort descending (newest first)
    const flatDesc = transactions.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let running = currentAccountBalanceAmount;
    for (const tx of flatDesc) {
      // For UPDATE transactions, if amount represents absolute balance, set running to that value
      if (tx.type === 'UPDATE') {
        // Assume tx.amount is the new balance after the update
        txBalanceAfter[tx.id] = tx.amount;
        running = tx.amount;
        continue;
      }

      // Balance after this transaction (at this point in descending order)
      txBalanceAfter[tx.id] = running;

      // Determine effect of this transaction on the account
      let effect = 0;
      if (tx.type === 'INCOME') {
        if (tx.accountId === initialAccountId) effect = tx.amount; // money into this account
      } else if (tx.type === 'EXPENSE') {
        if (tx.accountId === initialAccountId) effect = -tx.amount; // money out of this account
      } else if (tx.type === 'TRANSFER') {
        if (tx.accountId === initialAccountId) effect = -tx.amount; // outgoing transfer
        else if (tx.toAccountId === initialAccountId) effect = tx.amount; // incoming transfer
      }

      // Move running balance backwards to the previous state (older transactions)
      running = running - effect;
    }
  }

  const handleTransactionClick = (transactionId: number, e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`${groupId ? `/groups/${groupId}` : ''}/transactions/${transactionId}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Nenhuma transação encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDays.map((dayGroup) => (
        <div key={dayGroup.date} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Date Header */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 dark:text-gray-400">Data</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatDate(dayGroup.date).display}
                  </span>
                  <span
                    className={`px-1 py-0.5 rounded text-[10px] font-medium ${
                      getDayOfWeek(dayGroup.date).isWeekend
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {getDayOfWeek(dayGroup.date).name}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 dark:text-gray-400">Entradas</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(dayGroup.totalIncome)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 dark:text-gray-400">Saídas</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(dayGroup.totalExpense)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <span
                  className={`font-semibold ${
                    dayGroup.total >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(dayGroup.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Cards */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {dayGroup.transactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={(e) => handleTransactionClick(transaction.id, e)}
                className="grid grid-cols-[100px_1fr_100px] gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
              >
                {/* Left: Time, Category & Subcategory */}
                <div className="flex flex-col justify-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {formatInUserTimezone(transaction.date, 'HH:mm')}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 break-words line-clamp-2">
                    {transaction.type == 'UPDATE' ? 'Atualização de Saldo' : transaction.type == 'TRANSFER' ? 'Transferência' : transaction.subcategory?.category?.name || '-'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 break-words line-clamp-2">
                    {transaction.type == 'UPDATE' ? '' : transaction.type == 'TRANSFER' ? '' : transaction.subcategory?.name || '-'}
                  </div>
                </div>

                {/* Center: Title */}
                <div className="flex flex-col justify-center text-center">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 break-words line-clamp-2">
                    {transaction.title && (
                      transaction.title
                    )}
                  </div>
                  {transaction.accountId && (
                    (() => {
                      if (transaction.type === 'TRANSFER' && transaction.toAccountId) {
                        const from = accounts.find(acc => acc.id === transaction.accountId);
                        const to = accounts.find(acc => acc.id === transaction.toAccountId);
                        let fromLabel = from ? from.name : 'Conta';
                        let toLabel = to ? to.name : 'Conta';
                        if (groupId) {
                          const fromOwner = from?.user?.firstName;
                          const toOwner = to?.user?.firstName;
                          if (fromOwner) fromLabel = `${fromLabel} (${fromOwner})`;
                          if (toOwner) toLabel = `${toLabel} (${toOwner})`;
                        }
                        const label = `${fromLabel} → ${toLabel}`;
                        return (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words line-clamp-2">
                            {label}
                          </div>
                        );
                      }
                      const account = accounts.find(acc => acc.id === transaction.accountId);
                      return account ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words line-clamp-2">
                          {account.name} {groupId && account.user ? `(${account.user.firstName})` : ''}
                        </div>
                      ) : null;
                    })()
                  )}
                </div>

                {/* Right: Amount */}
                <div className="flex flex-col justify-center items-end gap-1">
                  <div
                    className={`text-sm sm:text-lg font-bold whitespace-nowrap ${
                      transaction.type === 'UPDATE' ? 'text-blue-600 dark:text-blue-400' :
                      transaction.type === 'INCOME'
                        ? 'text-green-600 dark:text-green-400'
                        : transaction.type === 'EXPENSE'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {transaction.type === 'UPDATE' ? '' : transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                    {formatCurrency(transaction.amount)}
                  </div>
                  {showUser && transaction.user && (
                    <div className="flex items-center gap-1">
                      <User size={10} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {transaction.user.firstName}
                      </span>
                    </div>
                  )}
                  {/* Show running balance after this transaction if available */}
                  {initialAccountId && typeof txBalanceAfter[transaction.id] === 'number' && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Saldo: {formatCurrency(txBalanceAfter[transaction.id])}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
