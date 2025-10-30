import type { Subcategory, TransactionType } from '@/types/api'

export function useSubcategories() {
  const { apiRequest } = useApiClient()

  async function getSubcategories(params?: { type?: TransactionType; categoryId?: string }) {
    const query = new URLSearchParams()
    if (params?.type) query.append('type', params.type)
    if (params?.categoryId) query.append('categoryId', params.categoryId)
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return await apiRequest<Subcategory[]>(`/subcategories${queryString}`)
  }

  async function getSubcategory(id: string) {
    return await apiRequest<Subcategory>(`/subcategories/${id}`)
  }

  async function createSubcategory(subcategory: Partial<Subcategory>) {
    return await apiRequest<Subcategory>('/subcategories', {
      method: 'POST',
      body: subcategory
    })
  }

  async function updateSubcategory(id: string, subcategory: Partial<Subcategory>) {
    return await apiRequest<Subcategory>(`/subcategories/${id}`, {
      method: 'PUT',
      body: subcategory
    })
  }

  async function deleteSubcategory(id: string) {
    return await apiRequest<void>(`/subcategories/${id}`, {
      method: 'DELETE'
    })
  }

  return {
    getSubcategories,
    getSubcategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory
  }
}
