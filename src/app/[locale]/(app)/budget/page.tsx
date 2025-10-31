'use client';

import { useState, useEffect, Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { expenseService } from '@/services/expenseService';
import { transactionService } from '@/services/transactionService';
import { useAppStore } from '@/lib/store';
import { EntityType } from '@/types';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export default function BudgetPage() {
  const t = useTranslations('budget');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const { selectedYear, setSelectedYear } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<EntityType>('EXPENSE');
  const [editingCell, setEditingCell] = useState<{ subcategoryId: string; month: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAnnualModalOpen, setIsAnnualModalOpen] = useState(false);
  const [annualDistribution, setAnnualDistribution] = useState({
    subcategoryId: '',
    amount: '',
    distribution: 'even' as 'even' | 'custom',
    customAmounts: Array(12).fill(''),
  });

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

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => expenseService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: expenseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const filteredCategories = categories.filter((cat) => cat.type === activeTab);
  const filteredSubcategories = subcategories.filter((sub) => sub.type === activeTab);

  const getExpense = (subcategoryId: string, month: number) => {
    return expenses.find(
      (exp) => exp.subcategoryId === subcategoryId && exp.month === month && exp.year === selectedYear
    );
  };

  const getActualAmount = (subcategoryId: string, month: number) => {
    const transaction = aggregatedTransactions.find(
      (trans) => trans.subcategoryId === subcategoryId && trans.month === month && trans.year === selectedYear
    );
    return transaction?.total || 0;
  };

  const getBudgetStatus = (budgeted: number, actual: number) => {
    if (budgeted === 0) return '';
    const percentage = (actual / budgeted) * 100;
    if (percentage < 85) return 'bg-green-50 text-green-700';
    if (percentage < 100) return 'bg-yellow-50 text-yellow-700';
    return 'bg-red-50 text-red-700';
  };

  const handleCellClick = (subcategoryId: string, month: number) => {
    const expense = getExpense(subcategoryId, month);
    setEditingCell({ subcategoryId, month });
    setEditValue(expense?.amount.toString() || '');
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;

    const value = parseFloat(editValue) || 0;
    const expense = getExpense(editingCell.subcategoryId, editingCell.month);
    const subcategory = subcategories.find((sub) => sub.id === editingCell.subcategoryId);

    if (!subcategory) return;

    if (expense) {
      await updateExpenseMutation.mutateAsync({
        id: expense.id,
        data: { amount: value },
      });
    } else {
      await createExpenseMutation.mutateAsync({
        subcategoryId: editingCell.subcategoryId,
        amount: value,
        month: editingCell.month,
        year: selectedYear,
        type: subcategory.type,
      });
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleAnnualDistribute = async () => {
    if (!annualDistribution.subcategoryId) return;

    const totalAmount = parseFloat(annualDistribution.amount) || 0;
    const subcategory = subcategories.find((sub) => sub.id === annualDistribution.subcategoryId);
    if (!subcategory) return;

    if (annualDistribution.distribution === 'even') {
      const monthlyAmount = totalAmount / 12;
      for (let month = 1; month <= 12; month++) {
        const expense = getExpense(annualDistribution.subcategoryId, month);
        if (expense) {
          await updateExpenseMutation.mutateAsync({
            id: expense.id,
            data: { amount: monthlyAmount },
          });
        } else {
          await createExpenseMutation.mutateAsync({
            subcategoryId: annualDistribution.subcategoryId,
            amount: monthlyAmount,
            month,
            year: selectedYear,
            type: subcategory.type,
          });
        }
      }
    } else {
      for (let month = 1; month <= 12; month++) {
        const amount = parseFloat(annualDistribution.customAmounts[month - 1]) || 0;
        const expense = getExpense(annualDistribution.subcategoryId, month);
        if (expense) {
          await updateExpenseMutation.mutateAsync({
            id: expense.id,
            data: { amount },
          });
        } else {
          await createExpenseMutation.mutateAsync({
            subcategoryId: annualDistribution.subcategoryId,
            amount,
            month,
            year: selectedYear,
            type: subcategory.type,
          });
        }
      }
    }

    setIsAnnualModalOpen(false);
    setAnnualDistribution({
      subcategoryId: '',
      amount: '',
      distribution: 'even',
      customAmounts: Array(12).fill(''),
    });
  };

  const getCategoryTotal = (categoryId: string, month: number) => {
    const categorySubs = filteredSubcategories.filter((sub) => sub.categoryId === categoryId);
    return categorySubs.reduce((sum, sub) => {
      const expense = getExpense(sub.id, month);
      return sum + (expense?.amount || 0);
    }, 0);
  };

  const getMonthTotal = (month: number) => {
    return filteredSubcategories.reduce((sum, sub) => {
      const expense = getExpense(sub.id, month);
      return sum + (expense?.amount || 0);
    }, 0);
  };

  const getSubcategoryYearTotal = (subcategoryId: string) => {
    let total = 0;
    for (let month = 1; month <= 12; month++) {
      const expense = getExpense(subcategoryId, month);
      total += expense?.amount || 0;
    }
    return total;
  };

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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('EXPENSE')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'EXPENSE'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tCommon('expense')}
        </button>
        <button
          onClick={() => setActiveTab('INCOME')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'INCOME'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tCommon('income')}
        </button>
      </div>

      {/* Budget Spreadsheet */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200 w-48">
                {t('category')} / {t('subcategory')}
              </th>
              {MONTHS.map((month, index) => (
                <th
                  key={month}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r border-gray-200 min-w-[120px]"
                >
                  {t(month)}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                {t('total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((category) => {
              const categorySubs = filteredSubcategories.filter(
                (sub) => sub.categoryId === category.id
              );
              if (categorySubs.length === 0) return null;

              return (
                <Fragment key={category.id}>
                  {/* Category Row */}
                  <tr className="bg-blue-50 border-t border-gray-200">
                    <td className="sticky left-0 bg-blue-50 px-4 py-2 font-semibold text-gray-900 border-r border-gray-200">
                      {category.name}
                    </td>
                    {MONTHS.map((_, index) => {
                      const total = getCategoryTotal(category.id, index + 1);
                      return (
                        <td
                          key={index}
                          className="px-4 py-2 text-center font-medium text-gray-700 border-r border-gray-200"
                        >
                          ${total.toFixed(2)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-center font-semibold text-gray-900">
                      $
                      {categorySubs
                        .reduce((sum, sub) => sum + getSubcategoryYearTotal(sub.id), 0)
                        .toFixed(2)}
                    </td>
                  </tr>
                  
                  {/* Subcategory Rows */}
                  {categorySubs.map((subcategory) => (
                    <tr key={subcategory.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-2 pl-8 text-gray-700 border-r border-gray-200">
                        {subcategory.name}
                      </td>
                      {MONTHS.map((_, index) => {
                        const month = index + 1;
                        const expense = getExpense(subcategory.id, month);
                        const budgeted = expense?.amount || 0;
                        const actual = getActualAmount(subcategory.id, month);
                        const isEditing =
                          editingCell?.subcategoryId === subcategory.id &&
                          editingCell?.month === month;
                        const status = getBudgetStatus(budgeted, actual);

                        return (
                          <td
                            key={index}
                            className={`px-2 py-2 text-center border-r border-gray-200 ${status}`}
                            onClick={() => !isEditing && handleCellClick(subcategory.id, month)}
                            title={`Budgeted: $${budgeted.toFixed(2)}, Actual: $${actual.toFixed(2)}`}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellBlur}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellBlur();
                                  if (e.key === 'Escape') {
                                    setEditingCell(null);
                                    setEditValue('');
                                  }
                                }}
                                autoFocus
                                className="w-full px-2 py-1 text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <div className="cursor-pointer hover:bg-opacity-80">
                                <div className="font-medium">${budgeted.toFixed(2)}</div>
                                {actual > 0 && (
                                  <div className="text-xs text-gray-600">
                                    ${actual.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-center font-medium text-gray-900">
                        ${getSubcategoryYearTotal(subcategory.id).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
            
            {/* Total Row */}
            <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
              <td className="sticky left-0 bg-gray-100 px-4 py-3 text-gray-900 border-r border-gray-200">
                {t('total')}
              </td>
              {MONTHS.map((_, index) => {
                const total = getMonthTotal(index + 1);
                return (
                  <td key={index} className="px-4 py-3 text-center text-gray-900 border-r border-gray-200">
                    ${total.toFixed(2)}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center text-gray-900">
                $
                {MONTHS.reduce((sum, _, index) => sum + getMonthTotal(index + 1), 0).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 items-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <span>{t('withinBudget')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 rounded"></div>
          <span>{t('nearLimit')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded"></div>
          <span>{t('overBudget')}</span>
        </div>
      </div>
    </div>
  );
}
