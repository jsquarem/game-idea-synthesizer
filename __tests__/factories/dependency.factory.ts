import type { Dependency } from '@prisma/client'

let counter = 0

export function buildDependency(overrides: Partial<Dependency> = {}): Dependency {
  counter++
  return {
    id: `dep-${counter}`,
    sourceSystemId: 'gs-1',
    targetSystemId: 'gs-2',
    dependencyType: 'requires',
    description: null,
    createdAt: new Date(),
    ...overrides,
  }
}

export function resetDependencyCounter(): void {
  counter = 0
}
