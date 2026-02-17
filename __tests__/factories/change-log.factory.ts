import type { ChangeLog } from '@prisma/client'

let counter = 0

export function buildChangeLog(overrides: Partial<ChangeLog> = {}): ChangeLog {
  counter++
  return {
    id: `cl-${counter}`,
    gameSystemId: 'gs-1',
    version: 'v1.0',
    summary: `Change ${counter}`,
    details: null,
    changeType: 'update',
    author: null,
    createdAt: new Date(),
    ...overrides,
  }
}

export function resetChangeLogCounter(): void {
  counter = 0
}
