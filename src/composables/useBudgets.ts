import type { Budget, BudgetComparison, TransactionType } from '@/types/api'

export function useBudgets() {
  const { apiRequest } = useApiClient()

  async function getBudgets(params?: { 
    year?: number
    month?: number
    type?: TransactionType
    subcategoryId?: string 
  }) {
    const query = new URLSearchParams()
    if (params?.year) query.append('year', params.year.toString())
    if (params?.month) query.append('month', params.month.toString())
    if (params?.type) query.append('type', params.type)
    if (params?.subcategoryId) query.append('subcategoryId', params.subcategoryId)
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return await apiRequest<Budget[]>(`/budgets${queryString}`)
  }

  async function getBudget(id: string) {
    return await apiRequest<Budget>(`/budgets/${id}`)
  }

  async function createBudget(budget: Partial<Budget>) {
    return await apiRequest<Budget>('/budgets', {
      method: 'POST',
      body: budget
    })
  }

  async function updateBudget(id: string, budget: Partial<Budget>) {
    return await apiRequest<Budget>(`/budgets/${id}`, {
      method: 'PUT',
      body: budget
    })
  }

  async function deleteBudget(id: string) {
    return await apiRequest<void>(`/budgets/${id}`, {
      method: 'DELETE'
    })
  }

  async function getBudgetComparison(params: { 
    year: number
    month: number
    type?: TransactionType 
  }) {
    const query = new URLSearchParams()
    query.append('year', params.year.toString())
    query.append('month', params.month.toString())
    if (params.type) query.append('type', params.type)
    return await apiRequest<BudgetComparison[]>(`/budgets/comparison?${query.toString()}`)
  }

  return {
    getBudgets,
    getBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    getBudgetComparison
  }
}
