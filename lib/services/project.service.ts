import type { Project } from '@prisma/client'
import type { ServiceResult } from './types'
import type { PaginatedResult, PaginationParams } from '../repositories/types'
import {
  createProject as createProjectRepo,
  findProjectById,
  listProjects as listProjectsRepo,
  updateProject as updateProjectRepo,
  deleteProject as deleteProjectRepo,
  clearProjectData as clearProjectDataRepo,
  getProjectSummary,
} from '../repositories/project.repository'
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilter,
  ProjectCountsByStatus,
} from '../repositories/project.repository'
import { getProjectCountsByStatus as getProjectCountsByStatusRepo } from '../repositories/project.repository'
import { listDependenciesByProject } from '../repositories/dependency.repository'
import {
  listProjectActivity,
  getLatestActivityPerType,
  type ProjectActivityItem,
} from '../repositories/project-activity.repository'

export async function createProject(
  input: CreateProjectInput
): Promise<ServiceResult<Project>> {
  try {
    const project = await createProjectRepo(input)
    return { success: true, data: project }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create project',
      code: 'INTERNAL',
    }
  }
}

export async function getProject(id: string): Promise<ServiceResult<Project>> {
  const project = await findProjectById(id)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  return { success: true, data: project }
}

export async function listProjects(
  filter?: ProjectFilter,
  pagination?: PaginationParams
): Promise<ServiceResult<PaginatedResult<Project>>> {
  try {
    const result = await listProjectsRepo(filter, pagination)
    return { success: true, data: result }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list projects',
      code: 'INTERNAL',
    }
  }
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<ServiceResult<Project>> {
  const existing = await findProjectById(id)
  if (!existing) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const project = await updateProjectRepo(id, input)
    return { success: true, data: project }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to update project',
      code: 'INTERNAL',
    }
  }
}

export async function deleteProject(id: string): Promise<ServiceResult<void>> {
  const existing = await findProjectById(id)
  if (!existing) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    await deleteProjectRepo(id)
    return { success: true, data: undefined }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to delete project',
      code: 'INTERNAL',
    }
  }
}

export async function clearProjectData(projectId: string): Promise<ServiceResult<void>> {
  const existing = await findProjectById(projectId)
  if (!existing) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    await clearProjectDataRepo(projectId)
    return { success: true, data: undefined }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to clear project data',
      code: 'INTERNAL',
    }
  }
}

export async function getDashboardCounts(): Promise<
  ServiceResult<ProjectCountsByStatus>
> {
  try {
    const counts = await getProjectCountsByStatusRepo()
    return { success: true, data: counts }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to load dashboard counts',
      code: 'INTERNAL',
    }
  }
}

export async function getProjectDashboard(id: string): Promise<
  ServiceResult<{
    project: Project
    systemCount: number
    brainstormCount: number
    versionPlanCount: number
    synthesizedOutputCount: number
    dependencyCount: number
    threadCount: number
  }>
> {
  const project = await findProjectById(id)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const summary = await getProjectSummary(id)
    const deps = await listDependenciesByProject(id)
    return {
      success: true,
      data: {
        project,
        systemCount: summary._count.gameSystems,
        brainstormCount: summary._count.brainstorms,
        versionPlanCount: summary._count.versionPlans,
        synthesizedOutputCount: summary._count.synthesizedOutputs,
        dependencyCount: deps.length,
        threadCount: summary._count.ideaStreamThreads,
      },
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to load dashboard',
      code: 'INTERNAL',
    }
  }
}

export type ProjectActivityResult = {
  items: ProjectActivityItem[]
  nextCursor: string | null
}

export async function getProjectActivity(
  projectId: string,
  limit: number,
  cursor?: string
): Promise<ServiceResult<ProjectActivityResult>> {
  const project = await findProjectById(projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const beforeDate = cursor ? new Date(cursor) : undefined
    const items = await listProjectActivity(projectId, limit, beforeDate)
    const nextCursor =
      items.length >= limit && items.length > 0
        ? items[items.length - 1].occurredAt.toISOString()
        : null
    return { success: true, data: { items, nextCursor } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to load activity',
      code: 'INTERNAL',
    }
  }
}

export async function getOverviewRecentActivity(
  projectId: string
): Promise<ServiceResult<ProjectActivityItem[]>> {
  const project = await findProjectById(projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const items = await getLatestActivityPerType(projectId)
    return { success: true, data: items }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to load recent activity',
      code: 'INTERNAL',
    }
  }
}
