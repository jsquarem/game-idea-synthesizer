import type { PromptHistory } from '@prisma/client'

let counter = 0

export function buildPromptHistory(overrides: Partial<PromptHistory> = {}): PromptHistory {
  counter++
  return {
    id: `ph-${counter}`,
    projectId: 'project-1',
    gameSystemId: null,
    versionPlanId: null,
    promptType: 'synthesis',
    promptTemplate: 'synthesis',
    promptInput: 'Test prompt',
    promptContext: null,
    response: 'Test response',
    aiProvider: 'mock',
    aiModel: 'mock-model',
    promptTokens: 10,
    completionTokens: 20,
    durationMs: 100,
    status: 'completed',
    error: null,
    createdAt: new Date(),
    ...overrides,
  }
}

export function resetPromptHistoryCounter(): void {
  counter = 0
}
