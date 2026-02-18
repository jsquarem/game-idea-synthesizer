import { z } from 'zod'
import * as versionPlanService from '@/lib/services/version-plan.service'
import type { ToolDefinition, ToolContext } from './types'
import type { ServiceResult } from '@/lib/services/types'

const listVersionPlansSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
})
type ListVersionPlansParams = z.infer<typeof listVersionPlansSchema>

const getVersionPlanSchema = z.object({
  planId: z.string(),
})
type GetVersionPlanParams = z.infer<typeof getVersionPlanSchema>

const createVersionPlanSchema = z.object({
  versionLabel: z.string().min(1),
  title: z.string().min(1),
  systemIds: z.array(z.string()).min(1),
  description: z.string().optional(),
})
type CreateVersionPlanParams = z.infer<typeof createVersionPlanSchema>

const validateVersionScopeSchema = z.object({
  systemIds: z.array(z.string()).min(1),
})
type ValidateVersionScopeParams = z.infer<typeof validateVersionScopeSchema>

const finalizeVersionPlanSchema = z.object({
  planId: z.string(),
})
type FinalizeVersionPlanParams = z.infer<typeof finalizeVersionPlanSchema>

const deleteVersionPlanSchema = z.object({
  planId: z.string(),
})
type DeleteVersionPlanParams = z.infer<typeof deleteVersionPlanSchema>

export const versionPlanTools: ToolDefinition[] = [
  {
    name: 'list_version_plans',
    description: 'List all version plans for the current project. Returns paginated results.',
    category: 'version-plan',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number (1-based)' },
        pageSize: { type: 'number', description: 'Results per page (max 100)' },
      },
    },
    parameterSchema: listVersionPlansSchema,
    requiresConfirmation: false,
    execute: async (params: ListVersionPlansParams, context: ToolContext) => {
      const pagination = params.page || params.pageSize
        ? { page: params.page, pageSize: params.pageSize }
        : undefined
      return versionPlanService.listVersionPlans(context.projectId, pagination)
    },
    describe: (_params: ListVersionPlansParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to list version plans: ${result.error}`
      const data = result.data as { total: number }
      return `Found ${data.total} version plans`
    },
  } as ToolDefinition,

  {
    name: 'get_version_plan',
    description: 'Get a version plan by ID, including its included systems and implementation order.',
    category: 'version-plan',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: 'The version plan ID' },
      },
      required: ['planId'],
    },
    parameterSchema: getVersionPlanSchema,
    requiresConfirmation: false,
    execute: async (params: GetVersionPlanParams) => {
      return versionPlanService.getVersionPlan(params.planId) as Promise<ServiceResult<unknown>>
    },
    describe: (params: GetVersionPlanParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to get version plan: ${result.error}`
      const data = result.data as { title: string }
      return `Retrieved version plan "${data.title}"`
    },
  } as ToolDefinition,

  {
    name: 'create_version_plan',
    description: 'Create a new version plan from a set of game systems. Validates that all dependencies are included in scope.',
    category: 'version-plan',
    mutationType: 'create',
    parameters: {
      type: 'object',
      properties: {
        versionLabel: { type: 'string', description: 'Version label (e.g. "v0.1", "alpha")' },
        title: { type: 'string', description: 'Version plan title' },
        systemIds: { type: 'string', description: 'Array of game system IDs to include', items: { type: 'string' } },
        description: { type: 'string', description: 'Optional description of this version plan' },
      },
      required: ['versionLabel', 'title', 'systemIds'],
    },
    parameterSchema: createVersionPlanSchema,
    requiresConfirmation: false,
    execute: async (params: CreateVersionPlanParams, context: ToolContext) => {
      return versionPlanService.createVersionPlanFromSystems(
        context.projectId,
        params.versionLabel,
        params.title,
        params.systemIds,
        params.description
      )
    },
    describe: (params: CreateVersionPlanParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to create version plan: ${result.error}`
      return `Created version plan "${params.title}" (${params.versionLabel}) with ${params.systemIds.length} systems`
    },
  } as ToolDefinition,

  {
    name: 'validate_version_scope',
    description: 'Check whether a set of game systems forms a valid version scope. Returns any missing dependencies that would need to be included.',
    category: 'version-plan',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        systemIds: { type: 'string', description: 'Array of game system IDs to validate', items: { type: 'string' } },
      },
      required: ['systemIds'],
    },
    parameterSchema: validateVersionScopeSchema,
    requiresConfirmation: false,
    execute: async (params: ValidateVersionScopeParams, context: ToolContext) => {
      return versionPlanService.validateVersionPlanScope(
        context.projectId,
        params.systemIds
      ) as Promise<ServiceResult<unknown>>
    },
    describe: (_params: ValidateVersionScopeParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to validate version scope: ${result.error}`
      const data = result.data as { valid: boolean; missingDependencies: unknown[] }
      return data.valid
        ? 'Version scope is valid — all dependencies are included'
        : `Version scope has ${data.missingDependencies.length} missing dependencies`
    },
  } as ToolDefinition,

  {
    name: 'finalize_version_plan',
    description: 'Finalize a version plan, locking it from further changes. This action is irreversible.',
    category: 'version-plan',
    mutationType: 'action',
    parameters: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: 'ID of the version plan to finalize' },
      },
      required: ['planId'],
    },
    parameterSchema: finalizeVersionPlanSchema,
    requiresConfirmation: true,
    execute: async (params: FinalizeVersionPlanParams) => {
      return versionPlanService.finalizeVersionPlanAction(params.planId)
    },
    describe: (params: FinalizeVersionPlanParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to finalize version plan: ${result.error}`
      return `Finalized version plan ${params.planId}`
    },
  } as ToolDefinition,

  {
    name: 'delete_version_plan',
    description: 'Delete a version plan. Cannot delete finalized plans.',
    category: 'version-plan',
    mutationType: 'delete',
    parameters: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: 'ID of the version plan to delete' },
      },
      required: ['planId'],
    },
    parameterSchema: deleteVersionPlanSchema,
    requiresConfirmation: true,
    execute: async (params: DeleteVersionPlanParams) => {
      return versionPlanService.deleteVersionPlanAction(params.planId)
    },
    describe: (params: DeleteVersionPlanParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to delete version plan: ${result.error}`
      return `Deleted version plan ${params.planId}`
    },
  } as ToolDefinition,
]
