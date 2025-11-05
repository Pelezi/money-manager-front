'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { Category, Subcategory, EntityType } from '@/types';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<EntityType>('EXPENSE');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', type: activeTab });
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    categoryId: 0,
    type: activeTab,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories'],
    queryFn: () => subcategoryService.getAll(),
  });

  const createCategoryMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryModalOpen(false);
      resetCategoryForm();
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      resetCategoryForm();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    },
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: subcategoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      setIsSubcategoryModalOpen(false);
      resetSubcategoryForm();
    },
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Subcategory> }) =>
      subcategoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      setIsSubcategoryModalOpen(false);
      setEditingSubcategory(null);
      resetSubcategoryForm();
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: subcategoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    },
  });

  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', type: activeTab });
  };

  const resetSubcategoryForm = () => {
    setSubcategoryFormData({ name: '', categoryId: 0, type: activeTab });
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryFormData });
    } else {
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  const handleSubcategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubcategory) {
      updateSubcategoryMutation.mutate({ id: editingSubcategory.id, data: subcategoryFormData });
    } else {
      createSubcategoryMutation.mutate(subcategoryFormData);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name, type: category.type });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryFormData({
      name: subcategory.name,
      categoryId: subcategory.categoryId,
      type: subcategory.type,
    });
    setIsSubcategoryModalOpen(true);
  };

  const handleDeleteSubcategory = (id: number) => {
    if (confirm('Are you sure you want to delete this subcategory?')) {
      deleteSubcategoryMutation.mutate(id);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddSubcategory = (category: Category) => {
    setSelectedCategoryForSubcategory(category);
    setEditingSubcategory(null);
    setSubcategoryFormData({
      name: '',
      categoryId: category.id,
      type: category.type,
    });
    setIsSubcategoryModalOpen(true);
  };

  const filteredCategories = categories.filter((cat) => cat.type === activeTab);
  const getCategorySubcategories = (categoryId: number) =>
    subcategories.filter((sub) => sub.categoryId === categoryId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setActiveTab('EXPENSE');
            setExpandedCategories(new Set());
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'EXPENSE'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {tCommon('expense')}
        </button>
        <button
          onClick={() => {
            setActiveTab('INCOME');
            setExpandedCategories(new Set());
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'INCOME'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {tCommon('income')}
        </button>
      </div>

      {/* Single Panel with Expandable Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('categories')}</h2>
          <button
            onClick={() => {
              setEditingCategory(null);
              resetCategoryForm();
              setCategoryFormData({ name: '', type: activeTab });
              setIsCategoryModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus size={16} />
            {t('addCategory')}
          </button>
        </div>
        <div className="p-4 space-y-2">
          {filteredCategories.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No categories found</p>
          ) : (
            filteredCategories.map((category) => {
              const categorySubcategories = getCategorySubcategories(category.id);
              const isExpanded = expandedCategories.has(category.id);

              return (
                <div
                  key={category.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease-in-out'
                          }}
                        >
                          <ChevronRight size={20} />
                        </button>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {category.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({categorySubcategories.length} {categorySubcategories.length === 1 ? t('subcategory') : t('subcategories')})
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddSubcategory(category)}
                          className="flex items-center gap-1 px-2 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Add subcategory"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded transition-colors"
                          title="Delete category"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subcategories List (Expanded) */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isExpanded ? '2000px' : '0',
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div className="bg-white dark:bg-gray-800">
                      {categorySubcategories.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No subcategories yet
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {categorySubcategories.map((subcategory, index) => (
                            <div
                              key={subcategory.id}
                              className="p-3 pl-12 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              style={{
                                animation: isExpanded ? `slideIn 0.3s ease-out ${index * 50}ms backwards` : 'none'
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-gray-900 dark:text-gray-100">
                                  {subcategory.name}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditSubcategory(subcategory)}
                                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1 rounded"
                                    title="Edit subcategory"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubcategory(subcategory.id)}
                                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded"
                                    title="Delete subcategory"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingCategory ? tCommon('edit') : t('addCategory')}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('categoryName')}
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="Enter category name"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending
                    ? tCommon('loading')
                    : tCommon('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingSubcategory ? tCommon('edit') : t('addSubcategory')}
            </h2>
            <form onSubmit={handleSubcategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('subcategoryName')}
                </label>
                <input
                  type="text"
                  value={subcategoryFormData.name}
                  onChange={(e) =>
                    setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="Enter subcategory name"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubcategoryModalOpen(false);
                    setEditingSubcategory(null);
                    resetSubcategoryForm();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={
                    createSubcategoryMutation.isPending || updateSubcategoryMutation.isPending
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                >
                  {createSubcategoryMutation.isPending || updateSubcategoryMutation.isPending
                    ? tCommon('loading')
                    : tCommon('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
