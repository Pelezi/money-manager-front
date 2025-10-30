import { ref } from 'vue'
import type { UseFetchOptions } from 'nuxt/app'

export function useApiClient() {
  const config = useRuntimeConfig()
  const baseURL = config.public.VITE_API_HOST || '/api/v1'

  function getAuthHeaders() {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : ''
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function apiRequest<T>(
    url: string,
    options: UseFetchOptions<T> = {}
  ) {
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }

    return await useFetch<T>(`${baseURL}${url}`, {
      ...options,
      headers
    })
  }

  return {
    apiRequest,
    baseURL
  }
}
