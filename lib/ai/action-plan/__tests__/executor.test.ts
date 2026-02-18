import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  executeActionPlan,
  resolveParamRefs,
  getNestedValue,
} from '../executor'
import type { ActionPlan, PlanExecutionEvent, StepResult } from '../types'
import type { ToolContext } from '@/lib/ai/tools/types'

// Mock executeTool
vi.mock('@/lib/ai/tools/executor', () => ({
  executeTool: vi.fn(),
}))

import { executeTool } from '@/lib/ai/tools/executor'

const mockExecuteTool = vi.mocked(executeTool)

const context: ToolContext = {
  projectId: 'proj-1',
  workspaceId: 'ws-1',
  userId: 'user-1',
}

type StepInput = Omit<ActionPlan['steps'][number], 'paramRefs' | 'dependsOn'> &
  Partial<Pick<ActionPlan['steps'][number], 'paramRefs' | 'dependsOn'>>

function step(s: StepInput): ActionPlan['steps'][number] {
  return { paramRefs: [], dependsOn: [], ...s }
}

function makePlan(steps: StepInput[]): ActionPlan {
  return { title: 'Test Plan', summary: 'Test', steps: steps.map(step) }
}

function collectEvents(
  plan: ActionPlan,
  ctx: ToolContext
): Promise<{ results: StepResult[]; events: PlanExecutionEvent[] }> {
  const events: PlanExecutionEvent[] = []
  return executeActionPlan(plan, ctx, (e) => events.push(e)).then((results) => ({
    results,
    events,
  }))
}

describe('getNestedValue', () => {
  it('traverses dot path', () => {
    expect(getNestedValue({ data: { id: '123' } }, 'data.id')).toBe('123')
  })

  it('returns undefined for missing path', () => {
    expect(getNestedValue({ data: {} }, 'data.missing.deep')).toBeUndefined()
  })

  it('handles single-level path', () => {
    expect(getNestedValue({ id: 'abc' }, 'id')).toBe('abc')
  })
})

describe('resolveParamRefs', () => {
  it('merges resolved values into params', () => {
    const completedSteps: StepResult[] = [
      { stepId: 'step-0', status: 'completed', toolResult: { data: { id: 'sys-1' } } },
    ]
    const result = resolveParamRefs(
      { name: 'test' },
      { systemId: { stepIndex: 0, path: 'data.id' } },
      completedSteps
    )
    expect(result).toEqual({ name: 'test', systemId: 'sys-1' })
  })

  it('throws if referenced step not completed', () => {
    const completedSteps: StepResult[] = [
      { stepId: 'step-0', status: 'failed', error: 'boom' },
    ]
    expect(() =>
      resolveParamRefs(
        {},
        { id: { stepIndex: 0, path: 'data.id' } },
        completedSteps
      )
    ).toThrow('not completed')
  })

  it('throws if path not found', () => {
    const completedSteps: StepResult[] = [
      { stepId: 'step-0', status: 'completed', toolResult: { data: {} } },
    ]
    expect(() =>
      resolveParamRefs(
        {},
        { id: { stepIndex: 0, path: 'data.nonexistent' } },
        completedSteps
      )
    ).toThrow('not found')
  })

  it('returns params unchanged when no paramRefs', () => {
    const result = resolveParamRefs({ x: 1 }, {}, [])
    expect(result).toEqual({ x: 1 })
  })
})

describe('executeActionPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes all steps in a linear plan', async () => {
    mockExecuteTool.mockResolvedValueOnce({
      toolName: 'create_game_system',
      description: 'Created system',
      apiCall: { service: 'test', payload: null, mutationType: 'create' },
      result: { success: true, data: { id: 'sys-1' } },
      executedAt: new Date().toISOString(),
    })
    mockExecuteTool.mockResolvedValueOnce({
      toolName: 'update_game_system',
      description: 'Updated system',
      apiCall: { service: 'test', payload: null, mutationType: 'update' },
      result: { success: true, data: { id: 'sys-1' } },
      executedAt: new Date().toISOString(),
    })

    const plan = makePlan([
      { stepId: 'create', description: 'Create', toolName: 'create_game_system', params: [{ key: 'name', value: 'Test' }] },
      { stepId: 'update', description: 'Update', toolName: 'update_game_system', params: [{ key: 'id', value: 'sys-1' }] },
    ])

    const { results, events } = await collectEvents(plan, context)

    expect(results).toHaveLength(2)
    expect(results[0].status).toBe('completed')
    expect(results[1].status).toBe('completed')

    const eventTypes = events.map((e) => e.type)
    expect(eventTypes).toContain('plan_started')
    expect(eventTypes).toContain('step_started')
    expect(eventTypes).toContain('step_completed')
    expect(eventTypes).toContain('plan_completed')
  })

  it('resolves paramRefs between steps', async () => {
    mockExecuteTool.mockResolvedValueOnce({
      toolName: 'create_game_system',
      description: 'Created',
      apiCall: { service: 'test', payload: null, mutationType: 'create' },
      result: { success: true, data: { id: 'new-sys-id' } },
      executedAt: new Date().toISOString(),
    })
    mockExecuteTool.mockResolvedValueOnce({
      toolName: 'update_game_system',
      description: 'Updated',
      apiCall: { service: 'test', payload: null, mutationType: 'update' },
      result: { success: true, data: { id: 'new-sys-id' } },
      executedAt: new Date().toISOString(),
    })

    const plan = makePlan([
      { stepId: 'create', description: 'Create', toolName: 'create_game_system', params: [{ key: 'name', value: 'New' }] },
      {
        stepId: 'update',
        description: 'Update',
        toolName: 'update_game_system',
        params: [{ key: 'purpose', value: 'Testing' }],
        paramRefs: [{ paramName: 'systemId', stepIndex: 0, path: 'id' }],
      },
    ])

    const { results } = await collectEvents(plan, context)
    expect(results[1].status).toBe('completed')
    // Verify the second call got the resolved param
    expect(mockExecuteTool).toHaveBeenNthCalledWith(
      2,
      'update_game_system',
      expect.objectContaining({ systemId: 'new-sys-id', purpose: 'Testing' }),
      context,
      expect.any(Object)
    )
  })

  it('skips dependent steps when a step fails', async () => {
    mockExecuteTool.mockResolvedValueOnce({
      toolName: 'create_game_system',
      description: 'Failed',
      apiCall: { service: 'test', payload: null, mutationType: 'create' },
      result: { success: false, error: 'Conflict', code: 'CONFLICT' },
      executedAt: new Date().toISOString(),
    })

    const plan = makePlan([
      { stepId: 'create', description: 'Create', toolName: 'create_game_system', params: [] },
      { stepId: 'update', description: 'Update', toolName: 'update_game_system', params: [] },
    ])

    const { results, events } = await collectEvents(plan, context)

    expect(results[0].status).toBe('failed')
    expect(results[1].status).toBe('skipped')

    const skippedEvent = events.find((e) => e.type === 'step_skipped')
    expect(skippedEvent).toBeDefined()

    const failedEvent = events.find((e) => e.type === 'plan_failed')
    expect(failedEvent).toBeDefined()
  })

  it('emits events in correct order', async () => {
    mockExecuteTool.mockResolvedValue({
      toolName: 'test',
      description: 'Done',
      apiCall: { service: 'test', payload: null, mutationType: 'read' },
      result: { success: true, data: {} },
      executedAt: new Date().toISOString(),
    })

    const plan = makePlan([
      { stepId: 's1', description: 'Step 1', toolName: 'test', params: [] },
    ])

    const { events } = await collectEvents(plan, context)
    const types = events.map((e) => e.type)
    expect(types).toEqual([
      'plan_started',
      'step_started',
      'step_completed',
      'plan_completed',
    ])
  })

  it('handles invalid paramRef path gracefully', async () => {
    mockExecuteTool.mockResolvedValueOnce({
      toolName: 'create',
      description: 'Created',
      apiCall: { service: 'test', payload: null, mutationType: 'create' },
      result: { success: true, data: {} },
      executedAt: new Date().toISOString(),
    })

    const plan = makePlan([
      { stepId: 'create', description: 'Create', toolName: 'create', params: [] },
      {
        stepId: 'use',
        description: 'Use',
        toolName: 'update',
        params: [],
        paramRefs: [{ paramName: 'id', stepIndex: 0, path: 'nonexistent.deep.path' }],
      },
    ])

    const { results } = await collectEvents(plan, context)
    expect(results[1].status).toBe('failed')
    expect(results[1].error).toContain('not found')
  })
})
