import { ref } from 'vue'
import type { FetchOptions } from 'ofetch'

export function useApiClient() {
  // Use relative path to leverage Nuxt's proxy
  const baseURL = '/api'

  function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : ''
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function apiRequest<T>(
    url: string,
    options: FetchOptions<'json'> = {}
  ) {
    const headers: Record<string, string> = {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> || {})
    }

    // Only add Content-Type header if there's a body
    if (options.body) {
      headers['Content-Type'] = 'application/json'
    }

    try {
      const response = await $fetch<T>(`${baseURL}${url}`, {
        method: options.method as any || 'GET',
        body: options.body,
        headers
      })

      return { 
        data: ref(response), 
        error: ref(null) 
      }
    } catch (error: any) {
      return { 
        data: ref(null), 
        error: ref(error) 
      }
    }
  }

  return {
    apiRequest,
    baseURL
  }
}
