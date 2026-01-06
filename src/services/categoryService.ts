import api from '@/lib/apiClient';
import { Category } from '@/types';

export const categoryService = {
  getAll: async (groupId?: number, includeHidden?: boolean): Promise<Category[]> => {
    const params = new URLSearchParams();
    if (groupId !== undefined) {
      params.append('groupId', String(groupId));
    }
    if (includeHidden !== undefined) {
      params.append('includeHidden', String(includeHidden));
    }
    const url = params.toString() ? `/categories?${params.toString()}` : '/categories';
    const response = await api.get<Category[]>(url);
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  create: async (data: Omit<Category, 'id'>): Promise<Category> => {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Category>): Promise<Category> => {
    const response = await api.put<Category>(`/categories/${id}`, data);
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
    }>(`/categories/${id}/check-transactions`);
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
    const url = params.toString() ? `/categories/${id}?${params.toString()}` : `/categories/${id}`;
    await api.delete(url);
  },

  hide: async (id: number): Promise<void> => {
    await api.put(`/categories/${id}/hide`);
  },

  unhide: async (id: number): Promise<void> => {
    await api.put(`/categories/${id}/unhide`);
  },
};
