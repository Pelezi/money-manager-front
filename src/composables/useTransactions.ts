import type { Transaction, TransactionAggregation, TransactionType } from '@/types/api'

export function useTransactions() {
  const { apiRequest } = useApiClient()

  async function getTransactions(params?: { 
    startDate?: string
    endDate?: string
    type?: TransactionType
    subcategoryId?: string 
  }) {
    const query = new URLSearchParams()
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    if (params?.type) query.append('type', params.type)
    if (params?.subcategoryId) query.append('subcategoryId', params.subcategoryId)
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return await apiRequest<Transaction[]>(`/transactions${queryString}`)
  }

  async function getTransaction(id: string) {
    return await apiRequest<Transaction>(`/transactions/${id}`)
  }

  async function createTransaction(transaction: Partial<Transaction>) {
    return await apiRequest<Transaction>('/transactions', {
      method: 'POST',
      body: transaction
    })
  }

  async function updateTransaction(id: string, transaction: Partial<Transaction>) {
    return await apiRequest<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: transaction
    })
  }

  async function deleteTransaction(id: string) {
    return await apiRequest<void>(`/transactions/${id}`, {
      method: 'DELETE'
    })
  }

  async function getAggregatedTransactions(params: { 
    startDate: string
    endDate: string
    type?: TransactionType 
  }) {
    const query = new URLSearchParams()
    query.append('startDate', params.startDate)
    query.append('endDate', params.endDate)
    if (params.type) query.append('type', params.type)
    return await apiRequest<TransactionAggregation[]>(`/transactions/aggregated?${query.toString()}`)
  }

  return {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getAggregatedTransactions
  }
}
