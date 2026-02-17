import type { VersionPlan } from '@prisma/client'

let counter = 0

export function buildVersionPlan(overrides: Partial<VersionPlan> = {}): VersionPlan {
  counter++
  return {
    id: `plan-${counter}`,
    projectId: 'project-1',
    versionLabel: `v${counter}.0`,
    title: `Plan ${counter}`,
    description: null,
    status: 'draft',
    includedSystems: JSON.stringify(['movement', 'health', 'combat']),
    excludedSystems: null,
    phases: null,
    milestones: null,
    riskAreas: null,
    implementationOrder: JSON.stringify(['movement', 'health', 'combat']),
    scopeValidation: null,
    markdownContent: null,
    finalizedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function resetVersionPlanCounter(): void {
  counter = 0
}
