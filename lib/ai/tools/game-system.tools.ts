import { z } from 'zod'
import * as gameSystemService from '@/lib/services/game-system.service'
import type { ToolDefinition, ToolContext } from './types'
import type { ServiceResult } from '@/lib/services/types'

const listGameSystemsSchema = z.object({
  status: z.string().optional(),
  mvpCriticality: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
})
type ListGameSystemsParams = z.infer<typeof listGameSystemsSchema>

const getGameSystemSchema = z.object({
  systemId: z.string(),
})
type GetGameSystemParams = z.infer<typeof getGameSystemSchema>

const createGameSystemSchema = z.object({
  name: z.string().min(1),
  systemSlug: z.string().min(1),
  purpose: z.string().optional(),
  coreMechanics: z.string().optional(),
  mvpCriticality: z.string().optional(),
  status: z.string().optional(),
  currentState: z.string().optional(),
  targetState: z.string().optional(),
  inputs: z.string().optional(),
  outputs: z.string().optional(),
  failureStates: z.string().optional(),
  scalingBehavior: z.string().optional(),
  implementationNotes: z.string().optional(),
  openQuestions: z.string().optional(),
})
type CreateGameSystemParams = z.infer<typeof createGameSystemSchema>

const updateGameSystemSchema = z.object({
  systemId: z.string(),
  changeSummary: z.string().optional(),
  name: z.string().min(1).optional(),
  purpose: z.string().optional(),
  coreMechanics: z.string().optional(),
  mvpCriticality: z.string().optional(),
  status: z.string().optional(),
  currentState: z.string().optional(),
  targetState: z.string().optional(),
  inputs: z.string().optional(),
  outputs: z.string().optional(),
  failureStates: z.string().optional(),
  scalingBehavior: z.string().optional(),
  implementationNotes: z.string().optional(),
  openQuestions: z.string().optional(),
})
type UpdateGameSystemParams = z.infer<typeof updateGameSystemSchema>

const deleteGameSystemSchema = z.object({
  systemId: z.string(),
})
type DeleteGameSystemParams = z.infer<typeof deleteGameSystemSchema>

const importSystemFromMarkdownSchema = z.object({
  markdown: z.string().min(1),
})
type ImportSystemFromMarkdownParams = z.infer<typeof importSystemFromMarkdownSchema>

export const gameSystemTools: ToolDefinition[] = [
  {
    name: 'list_game_systems',
    description: 'List game systems for the current project. Optionally filter by status, MVP criticality, or search text.',
    category: 'game-system',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by system status (e.g. draft, active)' },
        mvpCriticality: { type: 'string', description: 'Filter by MVP criticality level' },
        search: { type: 'string', description: 'Search text to filter systems by name or content' },
        page: { type: 'number', description: 'Page number (1-based)' },
        pageSize: { type: 'number', description: 'Results per page (max 100)' },
      },
    },
    parameterSchema: listGameSystemsSchema,
    requiresConfirmation: false,
    execute: async (params: ListGameSystemsParams, context: ToolContext) => {
      const filter = {
        projectId: context.projectId,
        status: params.status,
        mvpCriticality: params.mvpCriticality,
        search: params.search,
      }
      const pagination = params.page || params.pageSize
        ? { page: params.page, pageSize: params.pageSize }
        : undefined
      return gameSystemService.listSystems(filter, pagination)
    },
    describe: (params: ListGameSystemsParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to list game systems: ${result.error}`
      const data = result.data as { total: number }
      const filters = [params.status, params.mvpCriticality, params.search].filter(Boolean)
      return filters.length
        ? `Found ${data.total} game systems matching filters`
        : `Found ${data.total} game systems`
    },
  } as ToolDefinition,

  {
    name: 'get_game_system',
    description: 'Get a game system by ID, including its dependencies and changelog.',
    category: 'game-system',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        systemId: { type: 'string', description: 'The game system ID to retrieve' },
      },
      required: ['systemId'],
    },
    parameterSchema: getGameSystemSchema,
    requiresConfirmation: false,
    execute: async (params: GetGameSystemParams) => {
      return gameSystemService.getSystem(params.systemId)
    },
    describe: (params: GetGameSystemParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to get game system: ${result.error}`
      const data = result.data as { name: string }
      return `Retrieved game system "${data.name}"`
    },
  } as ToolDefinition,

  {
    name: 'create_game_system',
    description: 'Create a new game system in the current project. Requires name and systemSlug (kebab-case identifier).',
    category: 'game-system',
    mutationType: 'create',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Display name for the game system' },
        systemSlug: { type: 'string', description: 'Unique kebab-case slug (e.g. "combat-system")' },
        purpose: { type: 'string', description: 'What this system does and why it exists' },
        coreMechanics: { type: 'string', description: 'Core mechanics description' },
        mvpCriticality: { type: 'string', description: 'MVP criticality level' },
        status: { type: 'string', description: 'System status (e.g. draft, active)' },
        currentState: { type: 'string', description: 'Current implementation state' },
        targetState: { type: 'string', description: 'Target/desired state' },
        inputs: { type: 'string', description: 'System inputs' },
        outputs: { type: 'string', description: 'System outputs' },
        failureStates: { type: 'string', description: 'Known failure states' },
        scalingBehavior: { type: 'string', description: 'Scaling behavior notes' },
        implementationNotes: { type: 'string', description: 'Implementation notes' },
        openQuestions: { type: 'string', description: 'Open questions to resolve' },
      },
      required: ['name', 'systemSlug'],
    },
    parameterSchema: createGameSystemSchema,
    requiresConfirmation: false,
    execute: async (params: CreateGameSystemParams, context: ToolContext) => {
      return gameSystemService.createSystem({
        ...params,
        projectId: context.projectId,
      })
    },
    describe: (params: CreateGameSystemParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to create game system: ${result.error}`
      return `Created game system "${params.name}" (${params.systemSlug})`
    },
  } as ToolDefinition,

  {
    name: 'update_game_system',
    description: 'Update an existing game system. Provide the systemId and any fields to change.',
    category: 'game-system',
    mutationType: 'update',
    parameters: {
      type: 'object',
      properties: {
        systemId: { type: 'string', description: 'ID of the game system to update' },
        changeSummary: { type: 'string', description: 'Summary of what changed (for changelog)' },
        name: { type: 'string', description: 'New display name' },
        purpose: { type: 'string', description: 'Updated purpose' },
        coreMechanics: { type: 'string', description: 'Updated core mechanics' },
        mvpCriticality: { type: 'string', description: 'Updated MVP criticality' },
        status: { type: 'string', description: 'Updated status' },
        currentState: { type: 'string', description: 'Updated current state' },
        targetState: { type: 'string', description: 'Updated target state' },
        inputs: { type: 'string', description: 'Updated inputs' },
        outputs: { type: 'string', description: 'Updated outputs' },
        failureStates: { type: 'string', description: 'Updated failure states' },
        scalingBehavior: { type: 'string', description: 'Updated scaling behavior' },
        implementationNotes: { type: 'string', description: 'Updated implementation notes' },
        openQuestions: { type: 'string', description: 'Updated open questions' },
      },
      required: ['systemId'],
    },
    parameterSchema: updateGameSystemSchema,
    requiresConfirmation: false,
    execute: async (params: UpdateGameSystemParams) => {
      const { systemId, changeSummary, ...input } = params
      return gameSystemService.updateSystem(
        systemId,
        input,
        changeSummary ?? 'Updated via AI assistant'
      )
    },
    describe: (params: UpdateGameSystemParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to update game system: ${result.error}`
      const { systemId: _, changeSummary: __, ...fields } = params
      const updated = Object.keys(fields).join(', ')
      return `Updated game system ${params.systemId}: ${updated}`
    },
  } as ToolDefinition,

  {
    name: 'delete_game_system',
    description: 'Permanently delete a game system. This removes the system and its changelog. Cannot be undone.',
    category: 'game-system',
    mutationType: 'delete',
    parameters: {
      type: 'object',
      properties: {
        systemId: { type: 'string', description: 'ID of the game system to delete' },
      },
      required: ['systemId'],
    },
    parameterSchema: deleteGameSystemSchema,
    requiresConfirmation: true,
    execute: async (params: DeleteGameSystemParams) => {
      return gameSystemService.deleteSystem(params.systemId)
    },
    describe: (params: DeleteGameSystemParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to delete game system: ${result.error}`
      return `Deleted game system ${params.systemId}`
    },
  } as ToolDefinition,

  {
    name: 'import_system_from_markdown',
    description: 'Import a game system from a markdown document. The markdown is parsed to extract system fields automatically.',
    category: 'game-system',
    mutationType: 'create',
    parameters: {
      type: 'object',
      properties: {
        markdown: { type: 'string', description: 'Markdown content describing the game system' },
      },
      required: ['markdown'],
    },
    parameterSchema: importSystemFromMarkdownSchema,
    requiresConfirmation: false,
    execute: async (params: ImportSystemFromMarkdownParams, context: ToolContext) => {
      return gameSystemService.importSystemFromMarkdown(context.projectId, params.markdown)
    },
    describe: (_params: ImportSystemFromMarkdownParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to import system from markdown: ${result.error}`
      const data = result.data as { name: string }
      return `Imported game system "${data.name}" from markdown`
    },
  } as ToolDefinition,
]
