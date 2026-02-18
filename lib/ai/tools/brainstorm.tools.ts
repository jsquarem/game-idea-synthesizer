import { z } from 'zod'
import * as brainstormService from '@/lib/services/brainstorm.service'
import type { ToolDefinition, ToolContext } from './types'
import type { ServiceResult } from '@/lib/services/types'

const listBrainstormsSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
})
type ListBrainstormsParams = z.infer<typeof listBrainstormsSchema>

const getBrainstormSchema = z.object({
  brainstormId: z.string(),
})
type GetBrainstormParams = z.infer<typeof getBrainstormSchema>

const createBrainstormSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  author: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
})
type CreateBrainstormParams = z.infer<typeof createBrainstormSchema>

const deleteBrainstormSchema = z.object({
  brainstormId: z.string(),
})
type DeleteBrainstormParams = z.infer<typeof deleteBrainstormSchema>

export const brainstormTools: ToolDefinition[] = [
  {
    name: 'list_brainstorms',
    description: 'List all brainstorm sessions for the current project. Returns paginated results.',
    category: 'brainstorm',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number (1-based)' },
        pageSize: { type: 'number', description: 'Results per page (max 100)' },
      },
    },
    parameterSchema: listBrainstormsSchema,
    requiresConfirmation: false,
    execute: async (params: ListBrainstormsParams, context: ToolContext) => {
      const pagination = params.page || params.pageSize
        ? { page: params.page, pageSize: params.pageSize }
        : undefined
      return brainstormService.listBrainstorms(context.projectId, pagination)
    },
    describe: (_params: ListBrainstormsParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to list brainstorms: ${result.error}`
      const data = result.data as { total: number }
      return `Found ${data.total} brainstorm sessions`
    },
  } as ToolDefinition,

  {
    name: 'get_brainstorm',
    description: 'Get a brainstorm session by ID, including any synthesized outputs derived from it.',
    category: 'brainstorm',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        brainstormId: { type: 'string', description: 'The brainstorm session ID' },
      },
      required: ['brainstormId'],
    },
    parameterSchema: getBrainstormSchema,
    requiresConfirmation: false,
    execute: async (params: GetBrainstormParams) => {
      return brainstormService.getBrainstormWithSynthesis(params.brainstormId)
    },
    describe: (params: GetBrainstormParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to get brainstorm: ${result.error}`
      const data = result.data as { brainstorm: { title: string } }
      return `Retrieved brainstorm "${data.brainstorm.title}"`
    },
  } as ToolDefinition,

  {
    name: 'create_brainstorm',
    description: 'Create a new brainstorm session with a title and content. The content captures ideas, notes, or design discussions.',
    category: 'brainstorm',
    mutationType: 'create',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title for the brainstorm session' },
        content: { type: 'string', description: 'Brainstorm content (ideas, notes, discussion)' },
        author: { type: 'string', description: 'Author name (defaults to "AI Assistant")' },
        source: { type: 'string', description: 'Source of the brainstorm (defaults to "manual")' },
        tags: { type: 'string', description: 'Comma-separated tags for categorization', items: { type: 'string' } },
      },
      required: ['title', 'content'],
    },
    parameterSchema: createBrainstormSchema,
    requiresConfirmation: false,
    execute: async (params: CreateBrainstormParams, context: ToolContext) => {
      return brainstormService.ingestBrainstorm({
        projectId: context.projectId,
        title: params.title,
        content: params.content,
        author: params.author ?? 'AI Assistant',
        source: params.source ?? 'manual',
        tags: params.tags,
      })
    },
    describe: (params: CreateBrainstormParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to create brainstorm: ${result.error}`
      return `Created brainstorm session "${params.title}"`
    },
  } as ToolDefinition,

  {
    name: 'delete_brainstorm',
    description: 'Permanently delete a brainstorm session. This cannot be undone.',
    category: 'brainstorm',
    mutationType: 'delete',
    parameters: {
      type: 'object',
      properties: {
        brainstormId: { type: 'string', description: 'ID of the brainstorm session to delete' },
      },
      required: ['brainstormId'],
    },
    parameterSchema: deleteBrainstormSchema,
    requiresConfirmation: true,
    execute: async (params: DeleteBrainstormParams) => {
      return brainstormService.deleteBrainstorm(params.brainstormId)
    },
    describe: (params: DeleteBrainstormParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to delete brainstorm: ${result.error}`
      return `Deleted brainstorm session ${params.brainstormId}`
    },
  } as ToolDefinition,
]
