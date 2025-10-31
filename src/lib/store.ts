import { create } from 'zustand';
import { Category, Subcategory, Expense, Transaction } from '@/types';

interface AppState {
  // Categories
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  
  // Subcategories
  subcategories: Subcategory[];
  setSubcategories: (subcategories: Subcategory[]) => void;
  
  // Expenses
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  
  // Transactions
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  
  // Selected year for budget management
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  
  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  
  subcategories: [],
  setSubcategories: (subcategories) => set({ subcategories }),
  
  expenses: [],
  setExpenses: (expenses) => set({ expenses }),
  
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  
  selectedYear: new Date().getFullYear(),
  setSelectedYear: (year) => set({ selectedYear: year }),
  
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
