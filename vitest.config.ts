// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [
        vue(),          // para compilar .vue
        tsconfigPaths() // para resolver @/* conforme tsconfig.json
    ],
    resolve: {
        alias: {
            '@': '/src'   // garante que @ = src na raiz do projeto
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/test/unit/**/*.spec.ts']
    }
})
