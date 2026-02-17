import type { Export } from '@prisma/client'

let counter = 0

export function buildExport(overrides: Partial<Export> = {}): Export {
  counter++
  return {
    id: `exp-${counter}`,
    projectId: 'project-1',
    exportType: 'gdd',
    format: 'markdown',
    content: '# Game Design Document\n\nContent here.',
    metadata: null,
    createdAt: new Date(),
    ...overrides,
  }
}

export function resetExportCounter(): void {
  counter = 0
}
