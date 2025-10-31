'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { Category, Subcategory, EntityType } from '@/types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<EntityType>('EXPENSE');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', type: activeTab });
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    categoryId: '',
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
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
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
      if (selectedCategory) {
        setSelectedCategory(null);
      }
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
    mutationFn: ({ id, data }: { id: string; data: Partial<Subcategory> }) =>
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
    setSubcategoryFormData({ name: '', categoryId: selectedCategory?.id || '', type: activeTab });
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

  const handleDeleteCategory = (id: string) => {
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

  const handleDeleteSubcategory = (id: string) => {
    if (confirm('Are you sure you want to delete this subcategory?')) {
      deleteSubcategoryMutation.mutate(id);
    }
  };

  const filteredCategories = categories.filter((cat) => cat.type === activeTab);
  const filteredSubcategories = selectedCategory
    ? subcategories.filter((sub) => sub.categoryId === selectedCategory.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('EXPENSE');
            setSelectedCategory(null);
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'EXPENSE'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tCommon('expense')}
        </button>
        <button
          onClick={() => {
            setActiveTab('INCOME');
            setSelectedCategory(null);
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'INCOME'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tCommon('income')}
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories Panel */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('categories')}</h2>
            <button
              onClick={() => {
                setEditingCategory(null);
                resetCategoryForm();
                setCategoryFormData({ name: '', type: activeTab });
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} />
              {t('addCategory')}
            </button>
          </div>
          <div className="p-4 space-y-2">
            {filteredCategories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No categories found</p>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategory?.id === category.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subcategories Panel */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('subcategories')}</h2>
            <button
              onClick={() => {
                if (!selectedCategory) {
                  alert('Please select a category first');
                  return;
                }
                setEditingSubcategory(null);
                resetSubcategoryForm();
                setSubcategoryFormData({
                  name: '',
                  categoryId: selectedCategory.id,
                  type: activeTab,
                });
                setIsSubcategoryModalOpen(true);
              }}
              disabled={!selectedCategory}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {t('addSubcategory')}
            </button>
          </div>
          <div className="p-4 space-y-2">
            {!selectedCategory ? (
              <p className="text-gray-500 text-center py-8">{t('selectCategory')}</p>
            ) : filteredSubcategories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No subcategories found</p>
            ) : (
              filteredSubcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{subcategory.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSubcategory(subcategory)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubcategory(subcategory.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? tCommon('edit') : t('addCategory')}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('categoryName')}
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingSubcategory ? tCommon('edit') : t('addSubcategory')}
            </h2>
            <form onSubmit={handleSubcategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('subcategoryName')}
                </label>
                <input
                  type="text"
                  value={subcategoryFormData.name}
                  onChange={(e) =>
                    setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={
                    createSubcategoryMutation.isPending || updateSubcategoryMutation.isPending
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
