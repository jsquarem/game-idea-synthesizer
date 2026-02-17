import type { GameSystem } from '@prisma/client'

let counter = 0

export function buildGameSystem(overrides: Partial<GameSystem> = {}): GameSystem {
  counter++
  const systemSlug = overrides.systemSlug ?? `system-${counter}`
  return {
    id: `gs-${counter}`,
    projectId: 'project-1',
    synthesizedOutputId: null,
    systemSlug,
    name: `System ${counter}`,
    version: 'v1.0',
    status: 'draft',
    purpose: 'Test purpose',
    currentState: 'Initial state',
    targetState: 'Target state',
    coreMechanics: 'Core mechanics description',
    inputs: 'Player input',
    outputs: 'Game state changes',
    failureStates: 'None defined',
    scalingBehavior: 'Linear',
    mvpCriticality: 'core',
    implementationNotes: '',
    openQuestions: '',
    markdownContent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function resetGameSystemCounter(): void {
  counter = 0
}
