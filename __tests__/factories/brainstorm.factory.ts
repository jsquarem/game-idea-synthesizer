import type { BrainstormSession } from '@prisma/client'

let counter = 0

export function buildBrainstormSession(
  overrides: Partial<BrainstormSession> = {}
): BrainstormSession {
  counter++
  return {
    id: `brainstorm-${counter}`,
    projectId: 'project-1',
    title: `Session ${counter}`,
    source: 'manual',
    content: 'We should add a combat system with health bars and damage types.',
    author: 'TestUser',
    tags: null,
    sourceThreadIds: null,
    createdAt: new Date(),
    ...overrides,
  }
}

export function resetBrainstormCounter(): void {
  counter = 0
}
