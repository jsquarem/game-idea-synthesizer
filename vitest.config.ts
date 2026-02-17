import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['lib/**/__tests__/**/*.test.ts', '__tests__/**/*.test.ts', '__tests__/**/*.integration.test.ts'],
    exclude: ['node_modules', '.next', 'e2e'],
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['lib/**/*.ts'],
      exclude: ['lib/**/__tests__/**', '**/*.test.ts', '**/*.d.ts'],
      // Per DOCS/qa-testing-specification.md; raise as more unit/integration tests are added
      thresholds: {
        branches: 65,
        functions: 60,
        lines: 20,
        statements: 20,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
