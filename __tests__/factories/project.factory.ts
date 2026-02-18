import type { Project } from '@prisma/client'

let counter = 0

export function buildProject(overrides: Partial<Project> = {}): Project {
  counter++
  return {
    id: `project-${counter}`,
    name: `Test Project ${counter}`,
    description: 'A test project',
    genre: 'RPG',
    platform: 'PC',
    status: 'ideation',
    workspaceId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function resetProjectCounter(): void {
  counter = 0
}
