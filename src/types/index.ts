export type EntityType = 'EXPENSE' | 'INCOME';

export interface Category {
  id: number;
  name: string;
  type: EntityType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
  type: EntityType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: number;
  userId?: number;
  name: string;
  amount: number;
  type: EntityType;
  month: number;
  year: number;
  subcategoryId: number;
  annual?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: number;
  subcategoryId: number;
  amount: number;
  month?: number;
  year: number;
  type: EntityType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: number;
  subcategoryId: number;
  title: string;
  amount: number;
  description?: string;
  date: string;
  type: EntityType;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ExpenseComparison {
  subcategoryId: number;
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
  subcategoryId: number;
  total: number;
  count: number;
  month: number;
  year: number;
  type: EntityType;
}
