import type { SynthesizedOutput } from '@prisma/client'

let counter = 0

export function buildSynthesizedOutput(
  overrides: Partial<SynthesizedOutput> = {}
): SynthesizedOutput {
  counter++
  return {
    id: `syn-${counter}`,
    projectId: 'project-1',
    brainstormSessionId: 'brainstorm-1',
    title: `Synthesis ${counter}`,
    content: '## Extracted Systems\n\n### Combat\n- Slug: combat',
    extractedSystems: JSON.stringify([{ name: 'Combat', systemSlug: 'combat' }]),
    extractedSystemDetails: null,
    status: 'pending',
    aiProvider: null,
    aiModel: null,
    promptTokens: null,
    completionTokens: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function resetSynthesizedOutputCounter(): void {
  counter = 0
}
