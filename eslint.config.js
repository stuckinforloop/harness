import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: [
      '**/vendor/**',
      '**/sources/**',
      '**/skills/**',
      '**/evals/**',
      '**/node_modules/**',
    ],
  },
])
