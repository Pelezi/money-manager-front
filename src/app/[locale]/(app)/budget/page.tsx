'use client';

import { useState, Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { budgetService } from '@/services/budgetService';
import { transactionService } from '@/services/transactionService';
import { useAppStore } from '@/lib/store';
import { EntityType, Budget } from '@/types';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export default function BudgetPage() {
  const t = useTranslations('budget');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const { selectedYear, setSelectedYear } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<EntityType>('EXPENSE');
  const [editingCell, setEditingCell] = useState<{ subcategoryId: number; month: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories'],
    queryFn: () => subcategoryService.getAll(),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedYear],
    queryFn: () => budgetService.getAll({ year: selectedYear.toString() }),
  });

  const { data: aggregatedTransactions = [] } = useQuery({
    queryKey: ['transactions-aggregated', selectedYear],
    queryFn: () => transactionService.getAggregated(selectedYear),
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Budget> }) => budgetService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const createBudgetMutation = useMutation({
    mutationFn: budgetService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const filteredCategories = categories.filter((cat) => cat.type === activeTab);
  const filteredSubcategories = subcategories.filter((sub) => sub.type === activeTab);

  const getBudget = (subcategoryId: number, month: number) => {
    return budgets.find(
      (budget) => budget.subcategoryId === subcategoryId && budget.month === month && budget.year === selectedYear
    );
  };

  const getActualAmount = (subcategoryId: number, month: number) => {
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

  const handleCellClick = (subcategoryId: number, month: number) => {
    const budget = getBudget(subcategoryId, month);
    setEditingCell({ subcategoryId, month });
    setEditValue(budget?.amount.toString() || '');
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;

    const value = parseFloat(editValue) || 0;
    const budget = getBudget(editingCell.subcategoryId, editingCell.month);
    const subcategory = subcategories.find((sub) => sub.id === editingCell.subcategoryId);

    if (!subcategory) return;

    if (budget) {
      await updateBudgetMutation.mutateAsync({
        id: budget.id,
        data: { amount: value },
      });
    } else {
      await createBudgetMutation.mutateAsync({
        name: `${subcategory.name} - ${editingCell.month}/${selectedYear}`,
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

  const getCategoryTotal = (categoryId: number, month: number) => {
    const categorySubs = filteredSubcategories.filter((sub) => sub.categoryId === categoryId);
    return categorySubs.reduce((sum, sub) => {
      const budget = getBudget(sub.id, month);
      return sum + (budget?.amount || 0);
    }, 0);
  };

  const getMonthTotal = (month: number) => {
    return filteredSubcategories.reduce((sum, sub) => {
      const budget = getBudget(sub.id, month);
      return sum + (budget?.amount || 0);
    }, 0);
  };

  const getSubcategoryYearTotal = (subcategoryId: number) => {
    let total = 0;
    for (let month = 1; month <= 12; month++) {
      const budget = getBudget(subcategoryId, month);
      total += budget?.amount || 0;
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
              : 'text-gray-800 hover:text-gray-900'
          }`}
        >
          {tCommon('expense')}
        </button>
        <button
          onClick={() => setActiveTab('INCOME')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'INCOME'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-800 hover:text-gray-900'
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
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200 w-48">
                {t('category')} / {t('subcategory')}
              </th>
              {MONTHS.map((month) => (
                <th
                  key={month}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r border-gray-200 min-w-[120px]"
                >
                  {t(month)}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase min-w-[120px]">
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
                          className="px-4 py-2 text-center font-medium text-gray-900 border-r border-gray-200"
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
                      <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-2 pl-8 text-gray-900 border-r border-gray-200">
                        {subcategory.name}
                      </td>
                      {MONTHS.map((_, index) => {
                        const month = index + 1;
                        const budget = getBudget(subcategory.id, month);
                        const budgeted = budget?.amount || 0;
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
