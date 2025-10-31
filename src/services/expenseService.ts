import api from '@/lib/apiClient';
import { Expense, ExpenseComparison } from '@/types';

export const expenseService = {
  getAll: async (year?: number): Promise<Expense[]> => {
    const params = year ? `?year=${year}` : '';
    const response = await api.get<Expense[]>(`/expenses${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Expense> => {
    const response = await api.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: Omit<Expense, 'id'>): Promise<Expense> => {
    const response = await api.post<Expense>('/expenses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Expense>): Promise<Expense> => {
    const response = await api.put<Expense>(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  getComparison: async (year: number, month?: number): Promise<ExpenseComparison[]> => {
    const params = month ? `?year=${year}&month=${month}` : `?year=${year}`;
    const response = await api.get<ExpenseComparison[]>(`/expenses/comparison${params}`);
    return response.data;
  },
};
