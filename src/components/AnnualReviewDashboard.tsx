'use client';

import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { budgetService } from '@/services/budgetService';
import { transactionService } from '@/services/transactionService';
import { accountService } from '@/services/accountService';
import { useAppStore } from '@/lib/store';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface AnnualReviewDashboardProps {
  groupId?: number;
  canView?: boolean;
  title?: string;
}

export default function AnnualReviewDashboard({ 
  groupId, 
  canView = true,
  title = 'Resumo Anual'
}: AnnualReviewDashboardProps) {
  const { selectedYear, setSelectedYear } = useAppStore();

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', groupId],
    queryFn: () => categoryService.getAll(groupId),
    enabled: canView,
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', groupId],
    queryFn: () => subcategoryService.getAll(groupId),
    enabled: canView,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedYear, 'EXPENSE', groupId],
    queryFn: () => budgetService.getAll({ year: selectedYear.toString(), type: 'EXPENSE', groupId }),
    enabled: canView,
  });

  const { data: aggregatedTransactions = [] } = useQuery({
    queryKey: ['transactions-aggregated', selectedYear, groupId],
    queryFn: () => transactionService.getAggregated(selectedYear, undefined, groupId),
    enabled: canView,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', groupId],
    queryFn: () => accountService.getAll(groupId ? { groupId } : undefined),
    enabled: canView,
  });

  // Fetch balance history for all accounts
  const { data: accountBalances = [] } = useQuery({
    queryKey: ['account-balances-history', accounts.map(a => a.id), groupId],
    queryFn: async () => {
      if (accounts.length === 0) return [];
      
      const balancePromises = accounts.map(async (account) => {
        const history = await accountService.getBalanceHistory(account.id);
        return history.map(balance => ({
          ...balance,
          accountId: account.id,
        }));
      });
      
      const results = await Promise.all(balancePromises);
      return results.flat();
    },
    enabled: canView && accounts.length > 0,
  });

  // Permission check
  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">Você não tem permissão para visualizar o resumo anual{groupId ? ' deste grupo' : ''}.</p>
        </div>
      </div>
    );
  }

  // Calculate monthly trends
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const monthlyTrends = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const income = aggregatedTransactions
      .filter((t) => t.month === month && t.type === 'INCOME')
      .reduce((sum, t) => sum + t.total, 0);
    const expense = aggregatedTransactions
      .filter((t) => t.month === month && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.total, 0);
    
    return {
      month: monthNames[index],
      income,
      expense,
      net: income - expense,
    };
  });

  // Calculate real account balance per month based on balance records

  type TrendWithBalance = {
    month: string;
    income: number;
    expense: number;
    net: number;
    accumulatedBalance: number;
    calculatedBalance: number;
    divergence: number | null;
    hasRealData: boolean;
  };

  let lastBalanceMonthIndex = -1;
  let lastBalanceValue = 0;
  let lastBalanceDate: Date | null = null;
  const monthlyTrendsWithBalance: TrendWithBalance[] = [];
  monthlyTrends.forEach((trend, index) => {
    const month = index + 1;
    const endOfMonth = new Date(selectedYear, month, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    let mostRecentBalance: { amount: number; date: string } | null = null;
    accounts.forEach(account => {
      const accountHistory = accountBalances as { amount: number; date: string; accountId: number }[];
      const relevantBalances: { amount: number; date: string; accountId: number }[] = accountHistory.filter(b => b.accountId === account.id && new Date(b.date) <= endOfMonth);
      if (relevantBalances.length > 0) {
        const mostRecentAux = relevantBalances.reduce((latest, current) => {
          const latestDate = new Date(latest.date);
          const currentDate = new Date(current.date);
          return currentDate > latestDate ? current : latest;
        }, relevantBalances[0]);
        if (!mostRecentBalance || new Date(mostRecentAux.date) > new Date(mostRecentBalance.date)) {
          mostRecentBalance = { amount: mostRecentAux.amount, date: mostRecentAux.date };
        }
      }
    });

    let hasNewBalanceThisMonth = false;
    if (mostRecentBalance !== null) {
      const balanceDate = new Date((mostRecentBalance as { amount: number; date: string }).date);
      if (lastBalanceDate === null || balanceDate > lastBalanceDate) {
        lastBalanceMonthIndex = index;
        lastBalanceValue = (mostRecentBalance as { amount: number; date: string }).amount;
        lastBalanceDate = balanceDate;
        if (balanceDate.getFullYear() === selectedYear && balanceDate.getMonth() + 1 === month) {
          hasNewBalanceThisMonth = true;
        }
      }
    }

    const realBalance = mostRecentBalance !== null
      ? (mostRecentBalance as { amount: number; date: string }).amount
      : (index === 0 ? 0 : monthlyTrendsWithBalance[index-1].accumulatedBalance);

    let calculatedBalance = lastBalanceValue;
    if (lastBalanceMonthIndex >= 0) {
      for (let i = lastBalanceMonthIndex + 1; i <= index; i++) {
        calculatedBalance += monthlyTrends[i].net;
      }
    } else {
      calculatedBalance = monthlyTrends.slice(0, index + 1).reduce((sum, m) => sum + m.net, 0);
    }

    const divergence = hasNewBalanceThisMonth ? realBalance - calculatedBalance : null;

    monthlyTrendsWithBalance.push({
      ...trend,
      accumulatedBalance: realBalance,
      calculatedBalance,
      divergence,
      hasRealData: !!mostRecentBalance,
    });
  });

  const totalIncome = monthlyTrendsWithBalance.reduce((sum, m) => sum + (m.income || 0), 0);
  const totalExpenses = monthlyTrendsWithBalance.reduce((sum, m) => sum + (m.expense || 0), 0);
  const netSavings = totalIncome - totalExpenses;

  const expensesByCategory = categories
    .filter((cat) => cat.type === 'EXPENSE')
    .map((cat) => {
      const categorySubs = subcategories.filter((sub) => sub.categoryId === cat.id);
      const total = categorySubs.reduce((sum, sub) => {
        const subTotal = aggregatedTransactions
          .filter((t) => t.subcategoryId === sub.id && t.type === 'EXPENSE')
          .reduce((s, t) => s + t.total, 0);
        return sum + subTotal;
      }, 0);
      return {
        name: cat.name,
        value: total,
      };
    })
    .filter((cat) => cat.value > 0)
    .sort((a, b) => b.value - a.value);

  // Calcula desempenho anual por categoria
  const yearlyPerformance = categories
    .filter((cat) => cat.type === 'EXPENSE')
    .map((cat) => {
      // Subcategorias da categoria
      const subs = subcategories.filter((sub) => sub.categoryId === cat.id);

      // Soma orçamento anual da categoria
      const annualBudget = budgets
        .filter((b) => subs.some((sub) => sub.id === b.subcategoryId))
        .reduce((sum, b) => sum + (b.amount ?? 0), 0);

      // Soma gastos anuais da categoria
      const annualSpent = aggregatedTransactions
        .filter((t) => t.type === 'EXPENSE' && subs.some((sub) => sub.id === t.subcategoryId))
        .reduce((sum, t) => sum + (t.total ?? 0), 0);

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        annualBudget,
        annualSpent,
        difference: annualBudget - annualSpent,
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        
        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100">
            <Calendar size={20} />
            <span className="font-medium">{selectedYear}</span>
          </div>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Total</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                ${totalIncome.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas Totais</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                ${totalExpenses.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <TrendingDown className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Economia Líquida</p>
              <p className={`text-2xl font-bold mt-1 ${netSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                ${netSavings.toFixed(2)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${netSavings >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <DollarSign className={netSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'} size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tendências Mensais</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendsWithBalance}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: 'currentColor' }} 
                className="text-gray-600 dark:text-gray-400"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-600 dark:text-gray-400" />
              <Tooltip 
                formatter={(value: any) => {
                  if (value === null || value === undefined) return 'N/A';
                  return `R$ ${Number(value).toFixed(2)}`;
                }}
                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Receita" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Despesa" />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Líquido Mensal" />
              <Line type="monotone" dataKey="accumulatedBalance" stroke="#8b5cf6" strokeWidth={2} name="Saldo Real (Contas)" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="calculatedBalance" stroke="#06b6d4" strokeWidth={2} name="Saldo Calculado (Transações)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="divergence" stroke="#f97316" strokeWidth={2} name="Divergência Desconhecida" dot={{ r: 4 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Distribuição por Categoria</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => {
                  const { name, percent } = entry as unknown as { name: string; percent: number };
                  return `${name}: ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Income vs Expense */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Receita vs Despesa</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeVsExpense}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Receita" />
              <Bar dataKey="expense" fill="#ef4444" name="Despesa" />
            </BarChart>
          </ResponsiveContainer>
        </div> */}

        {/* Yearly Performance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Desempenho Anual</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Categoria
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Orçado
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Real
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Diferença
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {yearlyPerformance.map((row) => (
                  <tr key={row.categoryId}>
                    <td className="px-3 py-2 text-left">{row.categoryName}</td>
                    <td className="px-3 py-2 text-right">{row.annualBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-3 py-2 text-right">{row.annualSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className={`px-3 py-2 text-right ${row.difference < 0 ? 'text-red-600' : 'text-green-600'}`}>{row.difference.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
