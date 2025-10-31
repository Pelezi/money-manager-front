// Nuxt 3 auto-imports
// This file provides type declarations for Nuxt's auto-imported composables

import type { RouteLocationRaw, RouteRecordNormalized } from 'vue-router'
import type { Ref } from 'vue'

export {}

interface PageMeta {
  layout?: string
  middleware?: string | string[]
  name?: string
  path?: string
  alias?: string | string[]
  redirect?: RouteLocationRaw
  [key: string]: unknown
}

interface NavigateToOptions {
  replace?: boolean
  redirectCode?: number
  external?: boolean
}

interface NuxtRoute {
  path: string
  params: Record<string, string | string[]>
  query: Record<string, string | string[]>
  hash: string
  name: string | undefined
  fullPath: string
  matched: RouteRecordNormalized[]
  meta: Record<string, unknown>
}

interface NuxtRouter {
  push: (to: RouteLocationRaw) => Promise<void>
  replace: (to: RouteLocationRaw) => Promise<void>
  back: () => void
  forward: () => void
  go: (delta: number) => void
  currentRoute: Ref<NuxtRoute>
}

interface RuntimeConfig {
  public: {
    VITE_ENV: string
    VITE_API_HOST: string
    VITE_API_HOST_NODE: string
    [key: string]: string | number | boolean | undefined
  }
  [key: string]: unknown
}

interface UseFetchOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  params?: Record<string, string | number | boolean>
  query?: Record<string, string | number | boolean>
  body?: unknown
  headers?: Record<string, string>
  baseURL?: string
  server?: boolean
  lazy?: boolean
  immediate?: boolean
  watch?: Ref<unknown>[]
  transform?: (data: unknown) => T
  pick?: string[]
  onRequest?: (ctx: { request: string; options: UseFetchOptions<T> }) => void
  onResponse?: (ctx: { response: Response }) => void
  onRequestError?: (ctx: { error: Error }) => void
  onResponseError?: (ctx: { response: Response }) => void
}

interface UseFetchReturn<T> {
  data: Ref<T | null>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refresh: () => Promise<void>
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  params?: Record<string, string | number | boolean>
  query?: Record<string, string | number | boolean>
  body?: unknown
  headers?: Record<string, string>
  baseURL?: string
}

declare global {
  const definePageMeta: (meta: PageMeta) => void
  
  const navigateTo: (
    to: RouteLocationRaw,
    options?: NavigateToOptions
  ) => Promise<void>
  
  const useRoute: () => NuxtRoute
  
  const useRouter: () => NuxtRouter
  
  const useRuntimeConfig: () => RuntimeConfig
  
  const useFetch: <T = unknown>(
    url: string | (() => string),
    options?: UseFetchOptions<T>
  ) => Promise<UseFetchReturn<T>>
  
  const $fetch: <T = unknown>(
    url: string,
    options?: FetchOptions
  ) => Promise<T>
}
