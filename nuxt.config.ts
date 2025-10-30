// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'node:url'

export default defineNuxtConfig({
  srcDir: 'src/',
  modules: ['@pinia/nuxt', '@vueuse/nuxt'],
  build: { transpile: ['vuetify'] },
  css: ['vuetify/styles', 'toastify-js/src/toastify.css'],
  runtimeConfig: {
    public: {
      VITE_ENV: process.env.VITE_ENV || 'DEV',
      VITE_API_HOST: process.env.VITE_API_HOST,
      VITE_API_HOST_NODE: process.env.VITE_API_HOST_NODE
    }
  },
  vite: {
    plugins: [
      tsconfigPaths({ loose: true, ignoreConfigErrors: true })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': fileURLToPath(new URL('./src', import.meta.url)),
        'form-data': 'form-data/lib/form_data.js'
      }
    },
    define: { 'process.env.DEBUG': false, global: 'globalThis' },
    optimizeDeps: { exclude: ['form-data'] }
  },
  ssr: false,
  nitro: {
    esbuild: {
      options: { target: 'esnext' }
    },
    experimental: { wasm: true }
  },
  experimental: { payloadExtraction: false },
  compatibilityDate: '2024-04-03'
})
