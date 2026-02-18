import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ToolRegistry } from '../registry'
import type { ToolDefinition } from '../types'

function makeTool(overrides: Partial<ToolDefinition> = {}): ToolDefinition {
  return {
    name: overrides.name ?? 'test_tool',
    description: 'A test tool',
    category: overrides.category ?? 'project',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        foo: { type: 'string', description: 'test param' },
      },
    },
    parameterSchema: z.object({ foo: z.string().optional() }),
    requiresConfirmation: false,
    execute: async () => ({ success: true as const, data: null }),
    describe: () => 'test',
    ...overrides,
  }
}

describe('ToolRegistry', () => {
  it('registers and retrieves a tool by name', () => {
    const registry = new ToolRegistry()
    const tool = makeTool({ name: 'my_tool' })
    registry.register(tool)

    expect(registry.get('my_tool')).toBe(tool)
  })

  it('throws on duplicate name', () => {
    const registry = new ToolRegistry()
    registry.register(makeTool({ name: 'dup' }))

    expect(() => registry.register(makeTool({ name: 'dup' }))).toThrow(
      'Tool "dup" is already registered'
    )
  })

  it('returns undefined for unknown name', () => {
    const registry = new ToolRegistry()
    expect(registry.get('nonexistent')).toBeUndefined()
  })

  it('getAll() returns all registered tools', () => {
    const registry = new ToolRegistry()
    registry.register(makeTool({ name: 'a' }))
    registry.register(makeTool({ name: 'b' }))
    registry.register(makeTool({ name: 'c' }))

    const all = registry.getAll()
    expect(all).toHaveLength(3)
    expect(all.map((t) => t.name).sort()).toEqual(['a', 'b', 'c'])
  })

  it('getByCategory() filters correctly', () => {
    const registry = new ToolRegistry()
    registry.register(makeTool({ name: 'proj1', category: 'project' }))
    registry.register(makeTool({ name: 'proj2', category: 'project' }))
    registry.register(makeTool({ name: 'brain1', category: 'brainstorm' }))
    registry.register(makeTool({ name: 'dep1', category: 'dependency' }))

    expect(registry.getByCategory('project')).toHaveLength(2)
    expect(registry.getByCategory('brainstorm')).toHaveLength(1)
    expect(registry.getByCategory('dependency')).toHaveLength(1)
    expect(registry.getByCategory('export')).toHaveLength(0)
  })

  it('size getter returns count', () => {
    const registry = new ToolRegistry()
    expect(registry.size).toBe(0)

    registry.register(makeTool({ name: 'a' }))
    expect(registry.size).toBe(1)

    registry.register(makeTool({ name: 'b' }))
    expect(registry.size).toBe(2)
  })

  it('toOpenAITools() returns correct format', () => {
    const registry = new ToolRegistry()
    registry.register(
      makeTool({
        name: 'my_tool',
        description: 'Does things',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'The input' },
          },
          required: ['input'],
        },
      })
    )

    const tools = registry.toOpenAITools()
    expect(tools).toHaveLength(1)
    expect(tools[0]).toEqual({
      type: 'function',
      function: {
        name: 'my_tool',
        description: 'Does things',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'The input' },
          },
          required: ['input'],
        },
      },
    })
  })

  it('toAnthropicTools() returns correct format', () => {
    const registry = new ToolRegistry()
    registry.register(
      makeTool({
        name: 'my_tool',
        description: 'Does things',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'The input' },
          },
        },
      })
    )

    const tools = registry.toAnthropicTools()
    expect(tools).toHaveLength(1)
    expect(tools[0]).toEqual({
      name: 'my_tool',
      description: 'Does things',
      input_schema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'The input' },
        },
      },
    })
  })
})
