import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { decodeJwt } from '../utils/jwt.js'

export const useUserStore = defineStore('user', () => {
  const user = ref<Record<string, any> | null>(null)

  const readFromStorage = () => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('token') || ''
    user.value = raw ? decodeJwt(raw) : null
  }

  if (typeof window !== 'undefined') {
    readFromStorage()
    window.addEventListener('storage', (e) => {
      if (e.key === 'token') readFromStorage()
    })
  }

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(
    () => String(user.value?.userFunction || '').toLowerCase() === 'admin'
  )

  function setUser(newUser: Record<string, any>) {
    user.value = newUser
  }

  function logout() {
    user.value = null
    sessionStorage.removeItem('token')
    delete axios.defaults.headers.common.Authorization
  }

  return { user, isLoggedIn, isAdmin, setUser, logout, readFromStorage }
})
