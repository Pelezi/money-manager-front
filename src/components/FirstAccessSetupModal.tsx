'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { defaultCategoriesPT, DefaultCategory } from '@/lib/defaultCategories';
import { authService } from '@/services/authService';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';

interface FirstAccessSetupModalProps {
  onComplete: () => void;
  isResetup?: boolean;
}

type CategoryType = 'EXPENSE' | 'INCOME';

export default function FirstAccessSetupModal({ onComplete, isResetup = false }: FirstAccessSetupModalProps) {
  const [activeTab, setActiveTab] = useState<CategoryType>('EXPENSE');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Map<number, Set<number>>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allCategories = defaultCategoriesPT;
  const categories = allCategories.filter(cat => cat.type === activeTab);

  // Fetch existing categories and subcategories if this is a resetup
  const { data: existingCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    enabled: isResetup
  });

  const { data: existingSubcategories = [] } = useQuery({
    queryKey: ['subcategories'],
    queryFn: () => subcategoryService.getAll(),
    enabled: isResetup
  });

  // Pre-select existing categories when data is loaded
  useEffect(() => {
    if (isResetup && existingCategories.length > 0 && existingSubcategories.length > 0) {
      const newSelectedCategories = new Map<number, Set<number>>();
      
      allCategories.forEach((defaultCat, catIndex) => {
        // Find matching existing category by name and type
        const existingCat = existingCategories.find(
          cat => cat.name.toLowerCase() === defaultCat.name.toLowerCase() && cat.type === defaultCat.type
        );
        
        if (existingCat) {
          const selectedSubs = new Set<number>();
          
          // Check which subcategories already exist
          defaultCat.subcategories.forEach((defaultSubName, subIndex) => {
            const existingSub = existingSubcategories.find(
              sub => 
                sub.categoryId === existingCat.id && 
                sub.name.toLowerCase() === defaultSubName.toLowerCase()
            );
            
            if (existingSub) {
              selectedSubs.add(subIndex);
            }
          });
          
          if (selectedSubs.size > 0) {
            newSelectedCategories.set(catIndex, selectedSubs);
          }
        }
      });
      
      setSelectedCategories(newSelectedCategories);
    }
  }, [isResetup, existingCategories, existingSubcategories, allCategories]);

  const toggleCategory = (categoryIndex: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryIndex)) {
        newSet.delete(categoryIndex);
      } else {
        newSet.add(categoryIndex);
      }
      return newSet;
    });
  };

  const getCategoryGlobalIndex = (localIndex: number): number => {
    return allCategories.findIndex(cat => cat === categories[localIndex]);
  };

  const toggleCategorySelection = (localIndex: number) => {
    const globalIndex = getCategoryGlobalIndex(localIndex);
    setSelectedCategories((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(globalIndex)) {
        newMap.delete(globalIndex);
      } else {
        // Select all subcategories by default
        const subcategorySet = new Set<number>();
        allCategories[globalIndex].subcategories.forEach((_, subIndex) => {
          subcategorySet.add(subIndex);
        });
        newMap.set(globalIndex, subcategorySet);
      }
      return newMap;
    });
  };

  const toggleSubcategorySelection = (localIndex: number, subcategoryIndex: number) => {
    const globalIndex = getCategoryGlobalIndex(localIndex);
    setSelectedCategories((prev) => {
      const newMap = new Map(prev);
      const existingSet = newMap.get(globalIndex) || new Set<number>();
      const categorySet = new Set(existingSet); // Create a new Set instance
      
      if (categorySet.has(subcategoryIndex)) {
        categorySet.delete(subcategoryIndex);
        if (categorySet.size === 0) {
          newMap.delete(globalIndex);
        } else {
          newMap.set(globalIndex, categorySet);
        }
      } else {
        categorySet.add(subcategoryIndex);
        newMap.set(globalIndex, categorySet);
      }
      
      return newMap;
    });
  };

  const isCategorySelected = (localIndex: number) => {
    const globalIndex = getCategoryGlobalIndex(localIndex);
    return selectedCategories.has(globalIndex);
  };

  const isSubcategorySelected = (localIndex: number, subcategoryIndex: number) => {
    const globalIndex = getCategoryGlobalIndex(localIndex);
    return selectedCategories.get(globalIndex)?.has(subcategoryIndex) || false;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Build the categories array to send to the API
      const categoriesToCreate: Array<{ name: string; type: 'EXPENSE' | 'INCOME'; subcategories: string[] }> = [];
      
      selectedCategories.forEach((subcategoryIndexes, categoryIndex) => {
        const category = allCategories[categoryIndex];
        
        // If this is a resetup, check if category already exists
        let existingCat = null;
        if (isResetup) {
          existingCat = existingCategories.find(
            cat => cat.name.toLowerCase() === category.name.toLowerCase() && cat.type === category.type
          );
        }
        
        const selectedSubcategories: string[] = [];
        
        subcategoryIndexes.forEach((subIndex) => {
          const subName = category.subcategories[subIndex];
          
          // If this is a resetup, only add subcategories that don't exist yet
          if (isResetup && existingCat) {
            const existingSub = existingSubcategories.find(
              sub => 
                sub.categoryId === existingCat.id && 
                sub.name.toLowerCase() === subName.toLowerCase()
            );
            
            // Only add if subcategory doesn't exist
            if (!existingSub) {
              selectedSubcategories.push(subName);
            }
          } else {
            // Not a resetup, or category doesn't exist - add all selected subcategories
            selectedSubcategories.push(subName);
          }
        });
        
        // Only add category if it has subcategories to create
        if (selectedSubcategories.length > 0) {
          categoriesToCreate.push({
            name: category.name,
            type: category.type,
            subcategories: selectedSubcategories
          });
        }
      });

      if (categoriesToCreate.length > 0) {
        await authService.completeSetup(categoriesToCreate);
        // Show success toast
        if (isResetup) {
          toast.success('Novas categorias adicionadas com sucesso!');
        } else {
          toast.success('Categorias configuradas com sucesso!');
        }
      } else if (isResetup) {
        // No new categories to add
        toast.success('Categorias configuradas com sucesso!');
      }
      onComplete();
    } catch (error) {
      console.error('Failed to complete setup:', error);
      toast.error('Falha ao configurar as categorias. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 relative">
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Cancelar"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 pr-10">
            Bem-vindo! Vamos configurar suas categorias
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Selecione as categorias e subcategorias que você gostaria de usar. Você sempre pode adicionar ou remover depois.
          </p>
        </div>

        {/* Category Type Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
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
              Despesa
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
              Receita
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {categories.map((category, localIndex) => {
              const isExpanded = expandedCategories.has(localIndex);
              const isCatSelected = isCategorySelected(localIndex);

              return (
                <div
                  key={localIndex}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCategory(localIndex)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        style={{
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease-in-out'
                        }}
                      >
                        <ChevronRight size={20} />
                      </button>
                      
                      <button
                        onClick={() => toggleCategorySelection(localIndex)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isCatSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isCatSelected && <Check size={14} className="text-white" />}
                      </button>
                      
                      <span className="font-medium text-gray-900 dark:text-gray-100 flex-1">
                        {category.name}
                      </span>
                    </div>
                  </div>

                  {/* Subcategories */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isExpanded ? '2000px' : '0',
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {category.subcategories.map((subcategory, subIndex) => {
                        const isSubSelected = isSubcategorySelected(localIndex, subIndex);
                        
                        return (
                          <div
                            key={subIndex}
                            className="p-3 pl-12 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => toggleSubcategorySelection(localIndex, subIndex)}
                              className="flex items-center gap-3 cursor-pointer w-full text-left"
                            >
                              <div
                                className={`w-5 h-5 min-w-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  isSubSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                              >
                                {isSubSelected && <Check size={14} className="text-white" />}
                              </div>
                              <span className="text-gray-900 dark:text-gray-100">
                                {subcategory}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedCategories.size === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Carregando...' : 'Concluir Configuração'}
          </button>
        </div>
      </div>
    </div>
  );
}
