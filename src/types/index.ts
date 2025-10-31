export type EntityType = 'EXPENSE' | 'INCOME';

export interface Category {
  id: string;
  name: string;
  type: EntityType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  type: EntityType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  userId?: string;
  name: string;
  amount: number;
  type: EntityType;
  month: number;
  year: number;
  subcategoryId: string;
  annual?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  subcategoryId: string;
  amount: number;
  month?: number;
  year: number;
  type: EntityType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  subcategoryId: string;
  title: string;
  amount: number;
  description?: string;
  date: string;
  type: EntityType;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ExpenseComparison {
  subcategoryId: string;
  budgeted: number;
  actual: number;
  difference: number;
  month: number;
  year: number;
}

export interface BudgetComparison {
  budgeted: number;
  actual: number;
  difference: number;
}

export interface TransactionAggregated {
  subcategoryId: string;
  total: number;
  count: number;
  month: number;
  year: number;
  type: EntityType;
}
