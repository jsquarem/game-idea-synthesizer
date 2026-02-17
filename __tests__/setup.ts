import { beforeAll, afterEach, vi } from 'vitest'

beforeAll(() => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'file:./test.db'
})

afterEach(() => {
  vi.restoreAllMocks()
})
