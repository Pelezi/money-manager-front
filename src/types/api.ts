export type TransactionType = 'EXPENSE' | 'INCOME'

export interface Category {
  id: string
  name: string
  type: TransactionType
  createdAt?: string
  updatedAt?: string
}

export interface Subcategory {
  id: string
  name: string
  type: TransactionType
  categoryId: string
  category?: Category
  createdAt?: string
  updatedAt?: string
}

export interface Budget {
  id: string
  subcategoryId: string
  subcategory?: Subcategory
  amount: number
  month: number
  year: number
  type: TransactionType
  createdAt?: string
  updatedAt?: string
}

export interface Transaction {
  id: string
  subcategoryId: string
  subcategory?: Subcategory
  amount: number
  description: string
  date: string
  type: TransactionType
  createdAt?: string
  updatedAt?: string
}

export interface BudgetComparison {
  subcategoryId: string
  subcategoryName: string
  categoryName: string
  budgeted: number
  actual: number
  difference: number
  type: TransactionType
}

export interface TransactionAggregation {
  subcategoryId: string
  subcategoryName: string
  categoryName: string
  total: number
  count: number
  type: TransactionType
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}
