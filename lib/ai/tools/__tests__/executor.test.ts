import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/repositories/prompt-history.repository', () => ({
  createPromptHistory: vi.fn().mockResolvedValue({ id: 'ph-1' }),
}))

import { revalidatePath } from 'next/cache'
import { createPromptHistory } from '@/lib/repositories/prompt-history.repository'
import { executeTool } from '../executor'
import { ToolRegistry } from '../registry'
import type { ToolDefinition, ToolContext } from '../types'

// We need to mock the registry used by executor
vi.mock('../registry', async () => {
  const { ToolRegistry } = await vi.importActual<typeof import('../registry')>('../registry')
  const instance = new ToolRegistry()
  return { ToolRegistry, toolRegistry: instance }
})

import { toolRegistry } from '../registry'

const mockContext: ToolContext = {
  projectId: 'proj-1',
  workspaceId: 'ws-1',
  userId: 'user-1',
}

function makeTool(overrides: Partial<ToolDefinition> = {}): ToolDefinition {
  return {
    name: overrides.name ?? 'test_tool',
    description: 'A test tool',
    category: overrides.category ?? 'project',
    mutationType: overrides.mutationType ?? 'read',
    parameters: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'test' },
      },
    },
    parameterSchema: overrides.parameterSchema ?? z.object({ value: z.string().optional() }),
    requiresConfirmation: overrides.requiresConfirmation ?? false,
    execute: overrides.execute ?? (async () => ({ success: true as const, data: { id: '1' } })),
    describe: overrides.describe ?? (() => 'Tool executed successfully'),
    ...overrides,
  }
}

describe('executeTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear the registry between tests
    const all = toolRegistry.getAll()
    for (const tool of all) {
      // Access private map to clear - recreate registry
      ;(toolRegistry as unknown as { tools: Map<string, unknown> }).tools.delete(tool.name)
    }
  })

  it('returns NOT_FOUND error for unknown tool', async () => {
    const result = await executeTool('nonexistent', {}, mockContext)

    expect(result.result.success).toBe(false)
    if (!result.result.success) {
      expect(result.result.code).toBe('NOT_FOUND')
      expect(result.result.error).toContain('nonexistent')
    }
  })

  it('returns VALIDATION error for invalid params', async () => {
    const tool = makeTool({
      name: 'strict_tool',
      parameterSchema: z.object({ value: z.string() }),
    })
    toolRegistry.register(tool)

    const result = await executeTool('strict_tool', { value: 123 }, mockContext)

    expect(result.result.success).toBe(false)
    if (!result.result.success) {
      expect(result.result.code).toBe('VALIDATION')
    }
  })

  it('executes a read tool successfully without revalidation', async () => {
    const tool = makeTool({ name: 'read_tool', mutationType: 'read' })
    toolRegistry.register(tool)

    const result = await executeTool('read_tool', {}, mockContext)

    expect(result.result.success).toBe(true)
    expect(result.toolName).toBe('read_tool')
    expect(result.description).toBe('Tool executed successfully')
    expect(result.executedAt).toBeTruthy()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('executes a mutation tool and revalidates', async () => {
    const tool = makeTool({ name: 'create_tool', mutationType: 'create' })
    toolRegistry.register(tool)

    const result = await executeTool('create_tool', {}, mockContext)

    expect(result.result.success).toBe(true)
    expect(revalidatePath).toHaveBeenCalledWith('/projects/proj-1', 'layout')
  })

  it('calls onConfirmationNeeded for confirmable tools and proceeds on approval', async () => {
    const tool = makeTool({
      name: 'dangerous_tool',
      requiresConfirmation: true,
      mutationType: 'delete',
    })
    toolRegistry.register(tool)

    const onConfirm = vi.fn().mockResolvedValue(true)
    const result = await executeTool('dangerous_tool', {}, mockContext, {
      onConfirmationNeeded: onConfirm,
    })

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        toolName: 'dangerous_tool',
      })
    )
    expect(result.result.success).toBe(true)
  })

  it('returns FORBIDDEN when confirmation is declined', async () => {
    const tool = makeTool({
      name: 'dangerous_tool2',
      requiresConfirmation: true,
    })
    toolRegistry.register(tool)

    const onConfirm = vi.fn().mockResolvedValue(false)
    const result = await executeTool('dangerous_tool2', {}, mockContext, {
      onConfirmationNeeded: onConfirm,
    })

    expect(result.result.success).toBe(false)
    if (!result.result.success) {
      expect(result.result.code).toBe('FORBIDDEN')
    }
  })

  it('skips confirmation callback for non-confirmable tools', async () => {
    const tool = makeTool({
      name: 'safe_tool',
      requiresConfirmation: false,
    })
    toolRegistry.register(tool)

    const onConfirm = vi.fn()
    const result = await executeTool('safe_tool', {}, mockContext, {
      onConfirmationNeeded: onConfirm,
    })

    expect(onConfirm).not.toHaveBeenCalled()
    expect(result.result.success).toBe(true)
  })

  it('still generates description on service failure', async () => {
    const tool = makeTool({
      name: 'failing_tool',
      execute: async () => ({
        success: false as const,
        error: 'Something broke',
        code: 'INTERNAL' as const,
      }),
      describe: (_params: unknown, result: { success: boolean }) =>
        result.success ? 'ok' : 'Tool failed: Something broke',
    })
    toolRegistry.register(tool)

    const result = await executeTool('failing_tool', {}, mockContext)

    expect(result.result.success).toBe(false)
    expect(result.description).toBe('Tool failed: Something broke')
  })

  it('logs to PromptHistory with correct data', async () => {
    const tool = makeTool({ name: 'logged_tool', mutationType: 'create', category: 'project' })
    toolRegistry.register(tool)

    await executeTool('logged_tool', { value: 'test' }, mockContext)

    // Allow microtasks to settle
    await new Promise((r) => setTimeout(r, 10))

    expect(createPromptHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-1',
        promptType: 'tool_call',
        promptTemplate: 'logged_tool',
        aiProvider: 'tool_executor',
        status: 'completed',
      })
    )
  })

  it('does not break execution if PromptHistory logging fails', async () => {
    vi.mocked(createPromptHistory).mockRejectedValueOnce(new Error('DB down'))

    const tool = makeTool({ name: 'resilient_tool' })
    toolRegistry.register(tool)

    const result = await executeTool('resilient_tool', {}, mockContext)

    expect(result.result.success).toBe(true)
    expect(result.description).toBe('Tool executed successfully')
  })

  it('uses revalidatePaths override when provided', async () => {
    const tool = makeTool({
      name: 'custom_revalidate',
      mutationType: 'create',
      revalidatePaths: () => ['/', '/dashboard'],
    })
    toolRegistry.register(tool)

    await executeTool('custom_revalidate', {}, mockContext)

    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard', 'layout')
    expect(revalidatePath).not.toHaveBeenCalledWith('/projects/proj-1', 'layout')
  })

  it('builds correct apiCall in result', async () => {
    const tool = makeTool({
      name: 'api_call_tool',
      category: 'brainstorm',
      mutationType: 'create',
    })
    toolRegistry.register(tool)

    const result = await executeTool('api_call_tool', { value: 'test' }, mockContext)

    expect(result.apiCall).toEqual({
      service: 'brainstormService.api_call_tool',
      payload: { value: 'test' },
      mutationType: 'create',
    })
  })
})
