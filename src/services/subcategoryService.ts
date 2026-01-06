import api from '@/lib/apiClient';
import { Subcategory } from '@/types';

export const subcategoryService = {
  getAll: async (groupId?: number, includeHidden?: boolean): Promise<Subcategory[]> => {
    const params = new URLSearchParams();
    if (groupId !== undefined) {
      params.append('groupId', String(groupId));
    }
    if (includeHidden !== undefined) {
      params.append('includeHidden', String(includeHidden));
    }
    const url = params.toString() ? `/subcategories?${params.toString()}` : '/subcategories';
    const response = await api.get<Subcategory[]>(url);
    return response.data;
  },

  getByCategoryId: async (categoryId: number): Promise<Subcategory[]> => {
    const response = await api.get<Subcategory[]>(`/subcategories?categoryId=${categoryId}`);
    return response.data;
  },

  getById: async (id: number): Promise<Subcategory> => {
    const response = await api.get<Subcategory>(`/subcategories/${id}`);
    return response.data;
  },

  create: async (data: Omit<Subcategory, 'id'>): Promise<Subcategory> => {
    const response = await api.post<Subcategory>('/subcategories', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Subcategory>): Promise<Subcategory> => {
    const response = await api.put<Subcategory>(`/subcategories/${id}`, data);
    return response.data;
  },

  checkTransactions: async (id: number): Promise<{ 
    hasTransactions: boolean; 
    count: number;
    hasBudgets: boolean;
    budgetCount: number;
    hasAccounts: boolean;
    accountCount: number;
  }> => {
    const response = await api.get<{ 
      hasTransactions: boolean; 
      count: number;
      hasBudgets: boolean;
      budgetCount: number;
      hasAccounts: boolean;
      accountCount: number;
    }>(`/subcategories/${id}/check-transactions`);
    return response.data;
  },

  delete: async (id: number, deleteTransactions?: boolean, moveToSubcategoryId?: number): Promise<void> => {
    const params = new URLSearchParams();
    if (deleteTransactions !== undefined) {
      params.append('deleteTransactions', String(deleteTransactions));
    }
    if (moveToSubcategoryId !== undefined) {
      params.append('moveToSubcategoryId', String(moveToSubcategoryId));
    }
    const url = params.toString() ? `/subcategories/${id}?${params.toString()}` : `/subcategories/${id}`;
    await api.delete(url);
  },

  hide: async (id: number): Promise<void> => {
    await api.put(`/subcategories/${id}/hide`);
  },

  unhide: async (id: number): Promise<void> => {
    await api.put(`/subcategories/${id}/unhide`);
  },
};
