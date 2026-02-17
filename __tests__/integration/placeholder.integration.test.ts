import { describe, it, expect } from 'vitest'
import { getTestDb } from '../helpers/db.helper'

describe('Integration test setup', () => {
  it('should have access to test database', () => {
    const db = getTestDb()
    expect(db).toBeDefined()
    expect(typeof db.project.findMany).toBe('function')
  })
})
