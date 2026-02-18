import { z } from 'zod'
import * as dependencyService from '@/lib/services/dependency.service'
import type { ToolDefinition, ToolContext } from './types'
import type { ServiceResult } from '@/lib/services/types'

const getDependencyGraphSchema = z.object({})
type GetDependencyGraphParams = z.infer<typeof getDependencyGraphSchema>

const addDependencySchema = z.object({
  sourceSystemId: z.string(),
  targetSystemId: z.string(),
  dependencyType: z.enum(['requires', 'enhances', 'optional']).optional(),
})
type AddDependencyParams = z.infer<typeof addDependencySchema>

const removeDependencySchema = z.object({
  sourceSystemId: z.string(),
  targetSystemId: z.string(),
})
type RemoveDependencyParams = z.infer<typeof removeDependencySchema>

const getImpactAnalysisSchema = z.object({
  systemId: z.string(),
})
type GetImpactAnalysisParams = z.infer<typeof getImpactAnalysisSchema>

export const dependencyTools: ToolDefinition[] = [
  {
    name: 'get_dependency_graph',
    description: 'Get the full dependency graph for the current project, including nodes, edges, and topological implementation order.',
    category: 'dependency',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {},
    },
    parameterSchema: getDependencyGraphSchema,
    requiresConfirmation: false,
    execute: async (_params: GetDependencyGraphParams, context: ToolContext) => {
      return dependencyService.getProjectGraph(context.projectId)
    },
    describe: (_params: GetDependencyGraphParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to get dependency graph: ${result.error}`
      const data = result.data as { nodes: unknown[]; edges: unknown[] }
      return `Retrieved dependency graph with ${data.nodes.length} systems and ${data.edges.length} dependencies`
    },
  } as ToolDefinition,

  {
    name: 'add_dependency',
    description: 'Add a dependency between two game systems. The source system depends on the target system. Will fail if this would create a circular dependency.',
    category: 'dependency',
    mutationType: 'create',
    parameters: {
      type: 'object',
      properties: {
        sourceSystemId: { type: 'string', description: 'ID of the system that has the dependency' },
        targetSystemId: { type: 'string', description: 'ID of the system being depended on' },
        dependencyType: { type: 'string', enum: ['requires', 'enhances', 'optional'], description: 'Type of dependency (defaults to "requires")' },
      },
      required: ['sourceSystemId', 'targetSystemId'],
    },
    parameterSchema: addDependencySchema,
    requiresConfirmation: false,
    execute: async (params: AddDependencyParams) => {
      return dependencyService.addDependency(
        params.sourceSystemId,
        params.targetSystemId,
        params.dependencyType
      )
    },
    describe: (params: AddDependencyParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to add dependency: ${result.error}`
      const type = params.dependencyType ?? 'requires'
      return `Added ${type} dependency: ${params.sourceSystemId} → ${params.targetSystemId}`
    },
  } as ToolDefinition,

  {
    name: 'remove_dependency',
    description: 'Remove an existing dependency between two game systems.',
    category: 'dependency',
    mutationType: 'delete',
    parameters: {
      type: 'object',
      properties: {
        sourceSystemId: { type: 'string', description: 'ID of the system that has the dependency' },
        targetSystemId: { type: 'string', description: 'ID of the system being depended on' },
      },
      required: ['sourceSystemId', 'targetSystemId'],
    },
    parameterSchema: removeDependencySchema,
    requiresConfirmation: false,
    execute: async (params: RemoveDependencyParams) => {
      return dependencyService.removeDependency(params.sourceSystemId, params.targetSystemId)
    },
    describe: (params: RemoveDependencyParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to remove dependency: ${result.error}`
      return `Removed dependency: ${params.sourceSystemId} → ${params.targetSystemId}`
    },
  } as ToolDefinition,

  {
    name: 'get_impact_analysis',
    description: 'Analyze the downstream impact of changes to a game system. Returns all systems that transitively depend on the specified system.',
    category: 'dependency',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        systemId: { type: 'string', description: 'ID of the system to analyze impact for' },
      },
      required: ['systemId'],
    },
    parameterSchema: getImpactAnalysisSchema,
    requiresConfirmation: false,
    execute: async (params: GetImpactAnalysisParams, context: ToolContext) => {
      return dependencyService.getImpact(context.projectId, params.systemId)
    },
    describe: (params: GetImpactAnalysisParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to get impact analysis: ${result.error}`
      const data = result.data as { downstream: string[] }
      return data.downstream.length
        ? `System ${params.systemId} impacts ${data.downstream.length} downstream systems`
        : `System ${params.systemId} has no downstream dependencies`
    },
  } as ToolDefinition,
]
