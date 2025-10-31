import { ref } from 'vue'
import type { Ref } from 'vue'

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | unknown[]
}

interface ApiResponse<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
}

export function useApiClient() {
  // Use relative path to leverage Nuxt's proxy
  const baseURL = '/api'

  function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : ''
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function apiRequest<T>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> || {})
    }

    // Only add Content-Type header if there's a body
    if (options.body) {
      headers['Content-Type'] = 'application/json'
    }

    try {
      const response = await fetch(`${baseURL}${url}`, {
        method: options.method || 'GET',
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json() as T

      return { 
        data: ref(data) as Ref<T | null>,
        error: ref(null) as Ref<Error | null>
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      return { 
        data: ref(null) as Ref<T | null>,
        error: ref(errorObj) as Ref<Error | null>
      }
    }
  }

  return {
    apiRequest,
    baseURL
  }
}
