import { z } from 'zod'
import * as exportService from '@/lib/services/export.service'
import type { ToolDefinition, ToolContext } from './types'
import type { ServiceResult } from '@/lib/services/types'

const listExportsSchema = z.object({
  pageSize: z.number().int().positive().max(100).optional(),
})
type ListExportsParams = z.infer<typeof listExportsSchema>

const generateExportSchema = z.object({
  exportType: z.enum(['gdd', 'version_prd', 'system_doc', 'roadmap', 'prompt_bundle']),
  format: z.enum(['markdown', 'json']).optional(),
})
type GenerateExportParams = z.infer<typeof generateExportSchema>

export const exportTools: ToolDefinition[] = [
  {
    name: 'list_exports',
    description: 'List previously generated exports for the current project.',
    category: 'export',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        pageSize: { type: 'number', description: 'Number of exports to return (max 100)' },
      },
    },
    parameterSchema: listExportsSchema,
    requiresConfirmation: false,
    execute: async (params: ListExportsParams, context: ToolContext) => {
      return exportService.listExports(context.projectId, params.pageSize) as Promise<ServiceResult<unknown>>
    },
    describe: (_params: ListExportsParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to list exports: ${result.error}`
      const data = result.data as { data: unknown[] }
      return `Found ${data.data.length} exports`
    },
  } as ToolDefinition,

  {
    name: 'generate_export',
    description: 'Generate a new export document for the current project. Supported types: GDD (game design document), version PRD, system doc, roadmap, or prompt bundle.',
    category: 'export',
    mutationType: 'action',
    parameters: {
      type: 'object',
      properties: {
        exportType: {
          type: 'string',
          enum: ['gdd', 'version_prd', 'system_doc', 'roadmap', 'prompt_bundle'],
          description: 'Type of export to generate',
        },
        format: {
          type: 'string',
          enum: ['markdown', 'json'],
          description: 'Output format (defaults to markdown)',
        },
      },
      required: ['exportType'],
    },
    parameterSchema: generateExportSchema,
    requiresConfirmation: false,
    execute: async (params: GenerateExportParams, context: ToolContext) => {
      return exportService.generateExport(
        context.projectId,
        params.exportType,
        params.format
      )
    },
    describe: (params: GenerateExportParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to generate export: ${result.error}`
      const format = params.format ?? 'markdown'
      return `Generated ${params.exportType} export in ${format} format`
    },
  } as ToolDefinition,
]
