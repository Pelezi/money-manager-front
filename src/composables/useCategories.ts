import type { Category, TransactionType } from '@/types/api'

export function useCategories() {
  const { apiRequest } = useApiClient()

  async function getCategories(type?: TransactionType) {
    const query = type ? `?type=${type}` : ''
    return await apiRequest<Category[]>(`/categories${query}`)
  }

  async function getCategory(id: string) {
    return await apiRequest<Category>(`/categories/${id}`)
  }

  async function createCategory(category: Partial<Category>) {
    return await apiRequest<Category>('/categories', {
      method: 'POST',
      body: category
    })
  }

  async function updateCategory(id: string, category: Partial<Category>) {
    return await apiRequest<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: category
    })
  }

  async function deleteCategory(id: string) {
    return await apiRequest<void>(`/categories/${id}`, {
      method: 'DELETE'
    })
  }

  return {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
  }
}
