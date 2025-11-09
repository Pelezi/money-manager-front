'use client';

import { User } from 'lucide-react';
import { Transaction } from '@/types';
import { useRouter } from 'next/navigation';
import { toUserTimezone, formatInUserTimezone } from '@/lib/timezone';

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
  canManage?: boolean;
  showUser?: boolean;
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
  isLoading,
  onEdit,
  onDelete,
  canManage = true,
  showUser = false,
}: TransactionsTableProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    // Convert to user's timezone
    const date = toUserTimezone(dateString);
    const today = toUserTimezone(new Date().toISOString());
    const yesterday = today.subtract(1, 'day');

    // Compare dates
    if (date.isSame(today, 'day')) {
      return 'Hoje';
    } else if (date.isSame(yesterday, 'day')) {
      return 'Ontem';
    }

    return formatInUserTimezone(dateString, 'dddd, D [de] MMMM');
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
    
    if (transaction.type === 'INCOME') {
      acc[dateKey].totalIncome += transaction.amount;
      acc[dateKey].total += transaction.amount;
    } else {
      acc[dateKey].totalExpense += transaction.amount;
      acc[dateKey].total -= transaction.amount;
    }
    
    return acc;
  }, {} as Record<string, DayGroup>);

  // Sort by date descending
  const sortedDays = Object.values(groupedTransactions).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleTransactionClick = (transactionId: number, e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/transactions/${transactionId}`);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {formatDate(dayGroup.date)}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400">Entradas:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(dayGroup.totalIncome)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400">Saídas:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(dayGroup.totalExpense)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400">Total:</span>
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
          </div>

          {/* Transaction Cards */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {dayGroup.transactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={(e) => handleTransactionClick(transaction.id, e)}
                className="flex items-center gap-2 sm:gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
              >
                {/* Left: Category & Subcategory */}
                <div className="flex-shrink-0 min-w-0 sm:w-32">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {transaction.subcategory?.category?.name || '-'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {transaction.subcategory?.name || '-'}
                  </div>
                </div>

                {/* Center: Title & Description */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {transaction.title}
                  </div>
                  {showUser && transaction.user && (
                    <div className="flex items-center gap-1">
                      <User size={10} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {transaction.user.firstName} {transaction.user.lastName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Amount */}
                <div className="flex-shrink-0">
                  <div
                    className={`text-sm sm:text-lg font-bold whitespace-nowrap ${
                      transaction.type === 'INCOME'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
