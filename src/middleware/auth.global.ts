import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app"
import { useUserStore } from "../stores/useUserStore"

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/']
  
  // If user is not logged in and trying to access protected route
  if (!userStore.isLoggedIn && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
  
  // If user is logged in and trying to access login page, redirect to dashboard
  if (userStore.isLoggedIn && to.path === '/login') {
    return navigateTo('/dashboard')
  }
})
