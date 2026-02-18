import type { ZodSchema } from 'zod'
import type { ServiceResult } from '@/lib/services/types'

export type ToolCategory =
  | 'project'
  | 'game-system'
  | 'brainstorm'
  | 'dependency'
  | 'version-plan'
  | 'idea-stream'
  | 'export'

export type ToolMutationType = 'create' | 'read' | 'update' | 'delete' | 'action'

export type JsonSchemaProperty = {
  type: string
  description?: string
  enum?: string[]
  items?: JsonSchemaProperty
  default?: unknown
}

export type JsonSchema = {
  type: 'object'
  properties: Record<string, JsonSchemaProperty>
  required?: string[]
  additionalProperties?: boolean
}

export type ToolContext = {
  projectId: string
  workspaceId: string
  userId: string
}

export type ToolDefinition<TParams = unknown, TResult = unknown> = {
  name: string
  description: string
  category: ToolCategory
  mutationType: ToolMutationType
  parameters: JsonSchema
  parameterSchema: ZodSchema<TParams>
  requiresConfirmation: boolean
  execute: (params: TParams, context: ToolContext) => Promise<ServiceResult<TResult>>
  describe: (params: TParams, result: ServiceResult<TResult>) => string
  revalidatePaths?: (context: ToolContext, params: TParams) => string[]
}

export type ToolCallResult = {
  toolName: string
  description: string
  apiCall: {
    service: string
    payload: unknown
    mutationType: ToolMutationType
  }
  result: ServiceResult<unknown>
  executedAt: string
}
