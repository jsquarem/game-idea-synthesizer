import type { VersionPlanItem } from '@prisma/client'

let counter = 0

export function buildVersionPlanItem(
  overrides: Partial<VersionPlanItem> = {}
): VersionPlanItem {
  counter++
  return {
    id: `vpi-${counter}`,
    versionPlanId: 'plan-1',
    gameSystemId: 'gs-1',
    phase: 1,
    sortOrder: 0,
    notes: null,
    ...overrides,
  }
}

export function resetVersionPlanItemCounter(): void {
  counter = 0
}
