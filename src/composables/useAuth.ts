import type { LoginRequest, LoginResponse } from '@/types/api'

export function useAuth() {
  const { apiRequest } = useApiClient()
  const userStore = useUserStore()

  async function login(credentials: LoginRequest) {
    const { data, error } = await apiRequest<LoginResponse>('/users/login', {
      method: 'POST',
      body: credentials
    })

    if (data.value && data.value.token) {
      sessionStorage.setItem('token', data.value.token)
      userStore.setUser(data.value.user)
    }

    return { data, error }
  }

  function logout() {
    userStore.logout()
  }

  return {
    login,
    logout
  }
}
