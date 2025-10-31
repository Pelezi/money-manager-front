'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { expenseService } from '@/services/expenseService';
import { transactionService } from '@/services/transactionService';
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

export default function AnnualReviewPage() {
  const t = useTranslations('annualReview');
  const tBudget = useTranslations('budget');
  const tCommon = useTranslations('common');
  const { selectedYear, setSelectedYear } = useAppStore();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories'],
    queryFn: () => subcategoryService.getAll(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', selectedYear],
    queryFn: () => expenseService.getAll(selectedYear),
  });

  const { data: aggregatedTransactions = [] } = useQuery({
    queryKey: ['transactions-aggregated', selectedYear],
    queryFn: () => transactionService.getAggregated(selectedYear),
  });

  // Calculate monthly trends
  const monthlyTrends = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const income = aggregatedTransactions
      .filter((t) => t.month === month && t.type === 'INCOME')
      .reduce((sum, t) => sum + t.total, 0);
    const expense = aggregatedTransactions
      .filter((t) => t.month === month && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.total, 0);
    
    return {
      month: tBudget(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][index]),
      income,
      expense,
      net: income - expense,
    };
  });

  // Calculate totals
  const totalIncome = monthlyTrends.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyTrends.reduce((sum, m) => sum + m.expense, 0);
  const netSavings = totalIncome - totalExpenses;

  // Category breakdown for expenses
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

  // Income vs Expense by month
  const incomeVsExpense = monthlyTrends.map((m) => ({
    month: m.month,
    income: m.income,
    expense: m.expense,
  }));

  // Yearly performance by category
  const yearlyPerformance = categories
    .filter((cat) => cat.type === 'EXPENSE')
    .map((cat) => {
      const categorySubs = subcategories.filter((sub) => sub.categoryId === cat.id);
      
      const budgeted = categorySubs.reduce((sum, sub) => {
        const subBudgeted = expenses
          .filter((exp) => exp.subcategoryId === sub.id)
          .reduce((s, exp) => s + exp.amount, 0);
        return sum + subBudgeted;
      }, 0);
      
      const actual = categorySubs.reduce((sum, sub) => {
        const subActual = aggregatedTransactions
          .filter((t) => t.subcategoryId === sub.id && t.type === 'EXPENSE')
          .reduce((s, t) => s + t.total, 0);
        return sum + subActual;
      }, 0);
      
      return {
        category: cat.name,
        budgeted,
        actual,
        difference: budgeted - actual,
      };
    })
    .filter((cat) => cat.budgeted > 0 || cat.actual > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        
        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg">
            <Calendar size={20} />
            <span className="font-medium">{selectedYear}</span>
          </div>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalIncome')}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ${totalIncome.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalExpenses')}</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                ${totalExpenses.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('netSavings')}</p>
              <p className={`text-2xl font-bold mt-1 ${netSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${netSavings.toFixed(2)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${netSavings >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
              <DollarSign className={netSavings >= 0 ? 'text-blue-600' : 'text-red-600'} size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('monthlyTrends')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name={tCommon('income')} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name={tCommon('expense')} />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('categoryBreakdown')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: { name: string; percent: number }) => {
                  const { name, percent } = props;
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('incomeVsExpense')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeVsExpense}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name={tCommon('income')} />
              <Bar dataKey="expense" fill="#ef4444" name={tCommon('expense')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Yearly Performance Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('yearlyPerformance')}</h2>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Budgeted
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Actual
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {yearlyPerformance.map((item) => (
                  <tr key={item.category}>
                    <td className="px-3 py-2 text-gray-900">{item.category}</td>
                    <td className="px-3 py-2 text-right text-gray-900">
                      ${item.budgeted.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-900">
                      ${item.actual.toFixed(2)}
                    </td>
                    <td className={`px-3 py-2 text-right font-medium ${
                      item.difference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${item.difference.toFixed(2)}
                    </td>
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
