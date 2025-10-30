import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    env: { API_HOST: 'http://localhost:4001/v1' },
    specPattern: 'src/test/cypress/e2e/**/*.cy.{js,ts}',
    supportFile: false
  }
})

