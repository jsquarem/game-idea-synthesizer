import { describe, it, expect, vi } from 'vitest'
import { validateActionPlan } from '../validate'
import type { ActionPlan } from '../types'

// Mock the tool registry (must mock the index which validate.ts imports)
vi.mock('@/lib/ai/tools', () => {
  const registry = new Map<string, { name: string }>()
  registry.set('create_game_system', { name: 'create_game_system' })
  registry.set('update_game_system', { name: 'update_game_system' })
  registry.set('add_dependency', { name: 'add_dependency' })
  registry.set('list_idea_threads', { name: 'list_idea_threads' })
  return {
    toolRegistry: {
      get: (name: string) => registry.get(name),
    },
  }
})

type StepInput = Omit<ActionPlan['steps'][number], 'paramRefs' | 'dependsOn'> &
  Partial<Pick<ActionPlan['steps'][number], 'paramRefs' | 'dependsOn'>>

function step(s: StepInput): ActionPlan['steps'][number] {
  return { paramRefs: [], dependsOn: [], ...s }
}

function makePlan(steps: StepInput[]): ActionPlan {
  return { title: 'Test', summary: 'Test', steps: steps.map(step) }
}

describe('validateActionPlan', () => {
  it('accepts a valid plan', () => {
    const result = validateActionPlan(
      makePlan([
        { stepId: 's1', description: 'Create', toolName: 'create_game_system', params: [] },
        {
          stepId: 's2',
          description: 'Update',
          toolName: 'update_game_system',
          params: [],
          paramRefs: [{ paramName: 'systemId', stepIndex: 0, path: 'data.id' }],
        },
      ])
    )
    expect(result.valid).toBe(true)
  })

  it('rejects unknown tool name', () => {
    const result = validateActionPlan(
      makePlan([
        { stepId: 's1', description: 'Bad', toolName: 'nonexistent_tool', params: [] },
      ])
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors[0]).toContain('unknown tool')
      expect(result.errors[0]).toContain('nonexistent_tool')
    }
  })

  it('rejects paramRef to future step', () => {
    const result = validateActionPlan(
      makePlan([
        {
          stepId: 's1',
          description: 'Bad ref',
          toolName: 'create_game_system',
          params: [],
          paramRefs: [{ paramName: 'id', stepIndex: 1, path: 'data.id' }],
        },
        { stepId: 's2', description: 'Future', toolName: 'update_game_system', params: [] },
      ])
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors[0]).toContain('not a prior step')
    }
  })

  it('rejects paramRef to self', () => {
    const result = validateActionPlan(
      makePlan([
        {
          stepId: 's1',
          description: 'Self ref',
          toolName: 'create_game_system',
          params: [],
          paramRefs: [{ paramName: 'id', stepIndex: 0, path: 'data.id' }],
        },
      ])
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors[0]).toContain('not a prior step')
    }
  })

  it('rejects negative stepIndex in paramRef', () => {
    const result = validateActionPlan(
      makePlan([
        {
          stepId: 's1',
          description: 'Negative',
          toolName: 'create_game_system',
          params: [],
          paramRefs: [{ paramName: 'id', stepIndex: -1, path: 'data.id' }],
        },
      ])
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors[0]).toContain('negative')
    }
  })

  it('rejects dependsOn referencing future step', () => {
    const result = validateActionPlan(
      makePlan([
        {
          stepId: 's1',
          description: 'Bad dep',
          toolName: 'create_game_system',
          params: [],
          dependsOn: [1],
        },
        { stepId: 's2', description: 'Other', toolName: 'update_game_system', params: [] },
      ])
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors[0]).toContain('not a prior step')
    }
  })

  it('collects multiple errors', () => {
    const result = validateActionPlan(
      makePlan([
        { stepId: 's1', description: 'Bad tool', toolName: 'fake_tool', params: [] },
        {
          stepId: 's2',
          description: 'Bad ref',
          toolName: 'also_fake',
          params: [],
          paramRefs: [{ paramName: 'id', stepIndex: 5, path: 'x' }],
        },
      ])
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(1)
    }
  })
})
