export type EntityType = 'EXPENSE' | 'INCOME';

export interface Category {
  id: number;
  name: string;
  type: EntityType;
  groupId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
  type: EntityType;
  groupId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: number;
  userId?: number;
  groupId?: number;
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
  subcategory?: Subcategory & { category: Category };
  title: string;
  amount: number;
  description?: string;
  date: string;
  type: EntityType;
  userId?: number;
  user?: User;
  groupId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  firstAccess?: boolean;
  locale?: string;
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
  userId?: number;
  user?: User;
}

// Group types
export interface Group {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupRole {
  id: number;
  groupId: number;
  name: string;
  description?: string;
  canViewTransactions: boolean;
  canManageTransactions: boolean;
  canViewCategories: boolean;
  canManageCategories: boolean;
  canViewSubcategories: boolean;
  canManageSubcategories: boolean;
  canViewBudgets: boolean;
  canManageBudgets: boolean;
  canManageGroup: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  roleId: number;
  joinedAt: string;
  updatedAt: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  role?: GroupRole;
}

export interface GroupPermissions {
  canViewTransactions: boolean;
  canManageTransactions: boolean;
  canViewCategories: boolean;
  canManageCategories: boolean;
  canViewSubcategories: boolean;
  canManageSubcategories: boolean;
  canViewBudgets: boolean;
  canManageBudgets: boolean;
  canManageGroup: boolean;
}
