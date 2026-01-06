'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { Category, Subcategory, EntityType } from '@/types';
import { Plus, Edit2, Trash2, ChevronRight, X, ChevronDown, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DeleteCategoryModal from './DeleteCategoryModal';

interface CategoryListProps {
  groupId?: number;
  canManage?: boolean;
  canView?: boolean;
}

export default function CategoryList({ 
  groupId, 
  canManage = true, 
  canView = true 
}: CategoryListProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<EntityType>('EXPENSE');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [showHiddenSection, setShowHiddenSection] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | 'new' | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<number | 'new' | null>(null);
  const [editingSubcategoryCategory, setEditingSubcategoryCategory] = useState<number | null>(null);
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [subcategoryInputValue, setSubcategoryInputValue] = useState('');
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const subcategoryInputRef = useRef<HTMLInputElement>(null);
  
  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [deletingSubcategoryId, setDeletingSubcategoryId] = useState<number | null>(null);
  const [deleteTransactionCount, setDeleteTransactionCount] = useState(0);
  const [deleteBudgetCount, setDeleteBudgetCount] = useState(0);
  const [deleteAccountCount, setDeleteAccountCount] = useState(0);
  const [deletingItemName, setDeletingItemName] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: groupId ? ['categories', groupId, 'all'] : ['categories', 'all'],
    queryFn: () => categoryService.getAll(groupId, true),
    enabled: canView,
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: groupId ? ['subcategories', groupId, 'all'] : ['subcategories', 'all'],
    queryFn: () => subcategoryService.getAll(groupId, true),
    enabled: canView,
  });

  const createCategoryMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria salva com sucesso!');
      setEditingCategoryId(null);
      setCategoryInputValue('');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria salva com sucesso!');
      setEditingCategoryId(null);
      setCategoryInputValue('');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: ({ id, deleteTransactions, moveToSubcategoryId }: { id: number; deleteTransactions?: boolean; moveToSubcategoryId?: number }) =>
      categoryService.delete(id, deleteTransactions, moveToSubcategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Categoria excluída');
      setDeleteModalOpen(false);
      setDeletingCategoryId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir categoria');
    },
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: subcategoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Subcategoria salva com sucesso!');
      setSubcategoryInputValue('');
      setTimeout(() => {
        subcategoryInputRef.current?.focus();
      }, 50);
    },
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Subcategory> }) =>
      subcategoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Subcategoria salva com sucesso!');
      setEditingSubcategoryId(null);
      setEditingSubcategoryCategory(null);
      setSubcategoryInputValue('');
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: ({ id, deleteTransactions, moveToSubcategoryId }: { id: number; deleteTransactions?: boolean; moveToSubcategoryId?: number }) =>
      subcategoryService.delete(id, deleteTransactions, moveToSubcategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Subcategoria excluída');
      setDeleteModalOpen(false);
      setDeletingSubcategoryId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir subcategoria');
    },
  });

  const unhideCategoryMutation = useMutation({
    mutationFn: categoryService.unhide,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria restaurada');
    },
  });

  const unhideSubcategoryMutation = useMutation({
    mutationFn: subcategoryService.unhide,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Subcategoria restaurada');
    },
  });

  useEffect(() => {
    if (editingCategoryId) {
      categoryInputRef.current?.focus();
      categoryInputRef.current?.select();
    }
  }, [editingCategoryId]);

  useEffect(() => {
    if (editingSubcategoryId) {
      subcategoryInputRef.current?.focus();
      subcategoryInputRef.current?.select();
    }
  }, [editingSubcategoryId]);

  const handleAddCategory = () => {
    if (!canManage) return;
    setEditingCategoryId('new');
    setCategoryInputValue('');
  };

  const toggleCategoryExpansion = (categoryId: number) => {
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

  const handleEditCategory = (category: Category) => {
    if (!canManage) return;
    setEditingCategoryId(category.id);
    setCategoryInputValue(category.name);
  };

  const handleSaveCategory = () => {
    const trimmedName = categoryInputValue.trim();
    if (!trimmedName) {
      setEditingCategoryId(null);
      setCategoryInputValue('');
      return;
    }

    if (editingCategoryId === 'new') {
      createCategoryMutation.mutate({ 
        name: trimmedName, 
        type: activeTab,
        ...(groupId && { groupId })
      });
    } else if (typeof editingCategoryId === 'number') {
      updateCategoryMutation.mutate({ id: editingCategoryId, data: { name: trimmedName } });
    }
  };

  const handleCancelCategory = () => {
    setEditingCategoryId(null);
    setCategoryInputValue('');
  };

  const handleDeleteCategory = async (id: number) => {
    if (!canManage) return;
    
    try {
      const category = categories.find(c => c.id === id);
      if (!category) return;
      
      const result = await categoryService.checkTransactions(id);
      setDeletingCategoryId(id);
      setDeletingSubcategoryId(null);
      setDeleteTransactionCount(result.count);
      setDeleteBudgetCount(result.budgetCount || 0);
      setDeleteAccountCount(result.accountCount || 0);
      setDeletingItemName(category.name);
      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error checking transactions:', error);
      toast.error('Erro ao verificar transações');
    }
  };

  const handleAddSubcategory = (categoryId: number) => {
    if (!canManage) return;
    setEditingSubcategoryId('new');
    setEditingSubcategoryCategory(categoryId);
    setSubcategoryInputValue('');
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      newSet.add(categoryId);
      return newSet;
    });
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    if (!canManage) return;
    setEditingSubcategoryId(subcategory.id);
    setEditingSubcategoryCategory(subcategory.categoryId);
    setSubcategoryInputValue(subcategory.name);
  };

  const handleSaveSubcategory = () => {
    const trimmedName = subcategoryInputValue.trim();
    if (!trimmedName || !editingSubcategoryCategory) {
      setEditingSubcategoryId(null);
      setEditingSubcategoryCategory(null);
      setSubcategoryInputValue('');
      return;
    }

    if (editingSubcategoryId === 'new') {
      createSubcategoryMutation.mutate({
        name: trimmedName,
        categoryId: editingSubcategoryCategory,
        type: activeTab,
        ...(groupId && { groupId })
      });
    } else if (typeof editingSubcategoryId === 'number') {
      updateSubcategoryMutation.mutate({ id: editingSubcategoryId, data: { name: trimmedName } });
    }
  };

  const handleCancelSubcategory = () => {
    setEditingSubcategoryId(null);
    setEditingSubcategoryCategory(null);
    setSubcategoryInputValue('');
  };

  const handleDeleteSubcategory = async (id: number) => {
    if (!canManage) return;
    
    try {
      const subcategory = subcategories.find(s => s.id === id);
      if (!subcategory) return;
      
      const result = await subcategoryService.checkTransactions(id);
      setDeletingSubcategoryId(id);
      setDeletingCategoryId(null);
      setDeleteTransactionCount(result.count);
      setDeleteBudgetCount(result.budgetCount || 0);
      setDeleteAccountCount(result.accountCount || 0);
      setDeletingItemName(subcategory.name);
      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error checking transactions:', error);
      toast.error('Erro ao verificar transações');
    }
  };

  const handleConfirmDelete = (action: 'delete' | 'hide', deleteTransactions?: boolean, moveToSubcategoryId?: number) => {
    if (deletingCategoryId !== null) {
      if (action === 'hide') {
        categoryService.hide(deletingCategoryId).then(() => {
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          toast.success('Categoria escondida');
          setDeleteModalOpen(false);
          setDeletingCategoryId(null);
        }).catch((error: any) => {
          toast.error(error.response?.data?.message || 'Erro ao esconder categoria');
        });
      } else {
        deleteCategoryMutation.mutate({
          id: deletingCategoryId,
          deleteTransactions,
          moveToSubcategoryId
        });
      }
    } else if (deletingSubcategoryId !== null) {
      if (action === 'hide') {
        subcategoryService.hide(deletingSubcategoryId).then(() => {
          queryClient.invalidateQueries({ queryKey: ['subcategories'] });
          toast.success('Subcategoria escondida');
          setDeleteModalOpen(false);
          setDeletingSubcategoryId(null);
        }).catch((error: any) => {
          toast.error(error.response?.data?.message || 'Erro ao esconder subcategoria');
        });
      } else {
        deleteSubcategoryMutation.mutate({
          id: deletingSubcategoryId,
          deleteTransactions,
          moveToSubcategoryId
        });
      }
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

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveCategory();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelCategory();
    }
  };

  const handleSubcategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveSubcategory();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelSubcategory();
    }
  };

  const filteredCategories = categories
    .filter((cat) => cat.type === activeTab && !cat.hidden)
    .sort((a, b) => a.name.localeCompare(b.name));
    
  const getCategorySubcategories = (categoryId: number) =>
    subcategories
      .filter((sub) => sub.categoryId === categoryId && !sub.hidden)
      .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setActiveTab('EXPENSE');
            setExpandedCategories(new Set());
            handleCancelCategory();
            handleCancelSubcategory();
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'EXPENSE'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Despesa
        </button>
        <button
          onClick={() => {
            setActiveTab('INCOME');
            setExpandedCategories(new Set());
            handleCancelCategory();
            handleCancelSubcategory();
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'INCOME'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Renda
        </button>
      </div>

      {/* Categories Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Categorias</h2>
          {canManage && (
            <button
              onClick={handleAddCategory}
              disabled={editingCategoryId === 'new'}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Adicionar Categoria
            </button>
          )}
        </div>
        <div className="p-4 space-y-2">
          {/* New Category Input */}
          {editingCategoryId === 'new' && (
            <div className="border-2 border-blue-500 dark:border-blue-400 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 animate-fade-in">
              <div className="flex items-center gap-2">
                <input
                  ref={categoryInputRef}
                  type="text"
                  value={categoryInputValue}
                  onChange={(e) => setCategoryInputValue(e.target.value)}
                  onKeyDown={handleCategoryKeyDown}
                  placeholder="Nome da Categoria"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={handleCancelCategory}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Cancel (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Pressione Enter para salvar, Escape para cancelar</p>
            </div>
          )}

          {filteredCategories.length === 0 && editingCategoryId !== 'new' ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Nenhuma categoria encontrada. {canManage && 'Clique em "Adicionar Categoria" para criar uma.'}
            </p>
          ) : (
            filteredCategories.map((category) => {
              const categorySubcategories = getCategorySubcategories(category.id);
              const isExpanded = expandedCategories.has(category.id);
              const isEditingThisCategory = editingCategoryId === category.id;

              return (
                <div
                  key={category.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <div 
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => !isEditingThisCategory && toggleCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="text-gray-600 dark:text-gray-400 transition-transform duration-200"
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          }}
                        >
                          <ChevronRight size={20} />
                        </div>
                        {isEditingThisCategory ? (
                          <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              ref={categoryInputRef}
                              type="text"
                              value={categoryInputValue}
                              onChange={(e) => setCategoryInputValue(e.target.value)}
                              onKeyDown={handleCategoryKeyDown}
                              className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <button
                              onClick={handleCancelCategory}
                              className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              title="Cancel (Esc)"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {category.name}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({categorySubcategories.length})
                            </span>
                          </>
                        )}
                      </div>
                      {!isEditingThisCategory && canManage && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleAddSubcategory(category.id)}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                            title="Add subcategory"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1 rounded transition-colors"
                            title="Edit category"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded transition-colors"
                            title="Delete category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
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
                      {/* New Subcategory Input */}
                      {editingSubcategoryId === 'new' && editingSubcategoryCategory === category.id && (
                        <div className="p-3 pl-12 border-b-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20">
                          <div className="flex items-center gap-2">
                            <input
                              ref={subcategoryInputRef}
                              type="text"
                              value={subcategoryInputValue}
                              onChange={(e) => setSubcategoryInputValue(e.target.value)}
                              onKeyDown={handleSubcategoryKeyDown}
                              placeholder="Nome da Subcategoria"
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <button
                              onClick={handleCancelSubcategory}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              title="Cancel (Esc)"
                            >
                              <X size={20} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Pressione Enter para salvar, Escape para cancelar</p>
                        </div>
                      )}

                      {categorySubcategories.length === 0 && editingSubcategoryCategory !== category.id ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          Nenhuma subcategoria
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {categorySubcategories.map((subcategory, index) => {
                            const isEditingThisSubcategory = editingSubcategoryId === subcategory.id;
                            return (
                              <div
                                key={subcategory.id}
                                className="p-3 pl-12 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                style={{
                                  animation: isExpanded
                                    ? `slideIn 0.3s ease-out ${index * 50}ms backwards`
                                    : 'none',
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  {isEditingThisSubcategory ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <input
                                        ref={subcategoryInputRef}
                                        type="text"
                                        value={subcategoryInputValue}
                                        onChange={(e) => setSubcategoryInputValue(e.target.value)}
                                        onKeyDown={handleSubcategoryKeyDown}
                                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      />
                                      <button
                                        onClick={handleCancelSubcategory}
                                        className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                        title="Cancel (Esc)"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="text-gray-900 dark:text-gray-100">
                                        {subcategory.name}
                                      </span>
                                      {canManage && (
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
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Hidden Categories Section */}
        {canManage && (() => {
          // Get categories that are hidden OR have hidden subcategories
          const categoriesWithHiddenItems = categories.filter(cat => {
            if (cat.type !== activeTab) return false;
            // Include if category itself is hidden
            if (cat.hidden) return true;
            // Include if category has any hidden subcategories
            return subcategories.some(sub => sub.categoryId === cat.id && sub.hidden);
          });
          
          const totalHiddenCount = subcategories.filter(sub => {
            const category = categories.find(c => c.id === sub.categoryId);
            return category?.type === activeTab && sub.hidden;
          }).length;

          if (totalHiddenCount === 0) return null;

          return (
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 px-4">
              <button
                onClick={() => setShowHiddenSection(!showHiddenSection)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors w-full"
              >
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-200 ${showHiddenSection ? 'rotate-180' : ''}`}
                />
                <span>Itens Escondidos ({totalHiddenCount} subcategorias)</span>
              </button>

              {showHiddenSection && (
                <div className="mt-3 space-y-2">
                  {categoriesWithHiddenItems.map((category) => {
                    const hiddenSubcategories = subcategories.filter(sub => sub.categoryId === category.id && sub.hidden);
                    const isExpanded = expandedCategories.has(category.id);

                    return (
                      <div
                        key={`hidden-${category.id}`}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/50 opacity-75"
                      >
                        <div
                          className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => toggleCategoryExpansion(category.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="text-gray-500 dark:text-gray-400 transition-transform duration-200"
                                style={{
                                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                }}
                              >
                                <ChevronRight size={20} />
                              </div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {category.name}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({hiddenSubcategories.length})
                              </span>
                            </div>
                            {category.hidden && (
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => unhideCategoryMutation.mutate(category.id)}
                                  className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                                  title="Restaurar categoria e todas subcategorias"
                                >
                                  <Eye size={16} />
                                  Restaurar Tudo
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                  title="Apagar permanentemente"
                                >
                                  <Trash2 size={16} />
                                  Apagar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hidden Subcategories List */}
                        <div
                          className="overflow-hidden transition-all duration-300 ease-in-out"
                          style={{
                            maxHeight: isExpanded ? '2000px' : '0',
                            opacity: isExpanded ? 1 : 0,
                          }}
                        >
                          <div className="bg-gray-100 dark:bg-gray-800/70">
                            {hiddenSubcategories.map((subcategory) => (
                              <div
                                key={subcategory.id}
                                className="p-3 pl-12 border-t border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {subcategory.name}
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => unhideSubcategoryMutation.mutate(subcategory.id)}
                                      className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                                      title="Restaurar subcategoria"
                                    >
                                      <Eye size={14} />
                                      Restaurar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubcategory(subcategory.id)}
                                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                      title="Apagar permanentemente"
                                    >
                                      <Trash2 size={14} />
                                      Apagar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteCategoryModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingCategoryId(null);
          setDeletingSubcategoryId(null);
        }}
        onConfirm={handleConfirmDelete}
        categoryName={deletingItemName}
        transactionCount={deleteTransactionCount}
        budgetCount={deleteBudgetCount}
        accountCount={deleteAccountCount}
        availableSubcategories={deletingCategoryId !== null 
          ? subcategories.filter(sub => sub.categoryId !== deletingCategoryId)
          : subcategories.filter(sub => sub.id !== deletingSubcategoryId)
        }
        availableCategories={categories}
        isCategory={deletingCategoryId !== null}
      />

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
