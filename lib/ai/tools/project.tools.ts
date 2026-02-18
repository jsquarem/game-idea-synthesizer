import { z } from 'zod'
import * as projectService from '@/lib/services/project.service'
import type { ToolDefinition, ToolContext } from './types'
import type { ServiceResult } from '@/lib/services/types'

const listProjectsSchema = z.object({
  status: z.enum(['ideation', 'active', 'archived']).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
})
type ListProjectsParams = z.infer<typeof listProjectsSchema>

const getProjectSchema = z.object({
  projectId: z.string().optional(),
})
type GetProjectParams = z.infer<typeof getProjectSchema>

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  genre: z.string().optional(),
  platform: z.string().optional(),
  status: z.enum(['ideation', 'active', 'archived']).optional(),
})
type CreateProjectParams = z.infer<typeof createProjectSchema>

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
  platform: z.string().optional(),
  status: z.enum(['ideation', 'active', 'archived']).optional(),
})
type UpdateProjectParams = z.infer<typeof updateProjectSchema>

const deleteProjectSchema = z.object({
  projectId: z.string(),
})
type DeleteProjectParams = z.infer<typeof deleteProjectSchema>

const getProjectActivitySchema = z.object({
  limit: z.number().int().positive().max(50).optional(),
  cursor: z.string().optional(),
})
type GetProjectActivityParams = z.infer<typeof getProjectActivitySchema>

export const projectTools: ToolDefinition[] = [
  {
    name: 'list_projects',
    description: 'List all projects, optionally filtered by status. Returns paginated results.',
    category: 'project',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ideation', 'active', 'archived'], description: 'Filter by project status' },
        page: { type: 'number', description: 'Page number (1-based)' },
        pageSize: { type: 'number', description: 'Results per page (max 100)' },
      },
    },
    parameterSchema: listProjectsSchema,
    requiresConfirmation: false,
    execute: async (params: ListProjectsParams) => {
      const filter = params.status ? { status: params.status } : undefined
      const pagination = params.page || params.pageSize
        ? { page: params.page, pageSize: params.pageSize }
        : undefined
      return projectService.listProjects(filter, pagination)
    },
    describe: (params: ListProjectsParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to list projects: ${result.error}`
      const data = result.data as { total: number }
      return params.status
        ? `Found ${data.total} ${params.status} projects`
        : `Found ${data.total} projects`
    },
  } as ToolDefinition,

  {
    name: 'get_project',
    description: 'Get detailed project dashboard including system, brainstorm, and version plan counts. Defaults to the current project if no projectId is provided.',
    category: 'project',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID to look up. Defaults to current project.' },
      },
    },
    parameterSchema: getProjectSchema,
    requiresConfirmation: false,
    execute: async (params: GetProjectParams, context: ToolContext) => {
      const id = params.projectId || context.projectId
      return projectService.getProjectDashboard(id)
    },
    describe: (params: GetProjectParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to get project: ${result.error}`
      const data = result.data as { project: { name: string } }
      return `Retrieved project "${data.project.name}" dashboard`
    },
  } as ToolDefinition,

  {
    name: 'create_project',
    description: 'Create a new game design project with a name and optional description, genre, platform, and status.',
    category: 'project',
    mutationType: 'create',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Brief project description' },
        genre: { type: 'string', description: 'Game genre (e.g. RPG, platformer)' },
        platform: { type: 'string', description: 'Target platform (e.g. PC, mobile)' },
        status: { type: 'string', enum: ['ideation', 'active', 'archived'], description: 'Initial project status' },
      },
      required: ['name'],
    },
    parameterSchema: createProjectSchema,
    requiresConfirmation: false,
    execute: async (params: CreateProjectParams) => {
      return projectService.createProject(params)
    },
    describe: (params: CreateProjectParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to create project: ${result.error}`
      return `Created project "${params.name}"`
    },
    revalidatePaths: () => ['/', '/dashboard'],
  } as ToolDefinition,

  {
    name: 'update_project',
    description: 'Update the current project\'s name, description, genre, platform, or status.',
    category: 'project',
    mutationType: 'update',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'New project name' },
        description: { type: 'string', description: 'New description' },
        genre: { type: 'string', description: 'New genre' },
        platform: { type: 'string', description: 'New platform' },
        status: { type: 'string', enum: ['ideation', 'active', 'archived'], description: 'New status' },
      },
    },
    parameterSchema: updateProjectSchema,
    requiresConfirmation: false,
    execute: async (params: UpdateProjectParams, context: ToolContext) => {
      return projectService.updateProject(context.projectId, params)
    },
    describe: (params: UpdateProjectParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to update project: ${result.error}`
      const fields = Object.keys(params).join(', ')
      return `Updated project fields: ${fields}`
    },
  } as ToolDefinition,

  {
    name: 'delete_project',
    description: 'Permanently delete a project and all its data. This action cannot be undone.',
    category: 'project',
    mutationType: 'delete',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID of the project to delete' },
      },
      required: ['projectId'],
    },
    parameterSchema: deleteProjectSchema,
    requiresConfirmation: true,
    execute: async (params: DeleteProjectParams) => {
      return projectService.deleteProject(params.projectId)
    },
    describe: (params: DeleteProjectParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to delete project: ${result.error}`
      return `Deleted project ${params.projectId}`
    },
    revalidatePaths: () => ['/', '/dashboard'],
  } as ToolDefinition,

  {
    name: 'get_project_activity',
    description: 'Get the recent activity feed for the current project. Returns a paginated list of activity items.',
    category: 'project',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of activity items to return (max 50)' },
        cursor: { type: 'string', description: 'Pagination cursor (ISO date string) for fetching older items' },
      },
    },
    parameterSchema: getProjectActivitySchema,
    requiresConfirmation: false,
    execute: async (params: GetProjectActivityParams, context: ToolContext) => {
      return projectService.getProjectActivity(context.projectId, params.limit ?? 20, params.cursor)
    },
    describe: (_params: GetProjectActivityParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to get activity: ${result.error}`
      const data = result.data as { items: unknown[] }
      return `Retrieved ${data.items.length} activity items`
    },
  } as ToolDefinition,
]
