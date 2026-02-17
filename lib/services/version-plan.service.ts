import type { VersionPlan } from '@prisma/client'
import type { ServiceResult } from './types'
import type { PaginatedResult, PaginationParams } from '../repositories/types'
import {
  createVersionPlan,
  findVersionPlanById,
  listVersionPlans as listVersionPlansRepo,
  finalizeVersionPlan,
  deleteVersionPlan,
  getVersionPlanFull,
  setPlanItems,
} from '../repositories/version-plan.repository'
import { findProjectById } from '../repositories/project.repository'
import { getProjectGraph } from './dependency.service'
import { validateScope, buildGraph } from '../graph/graph-engine'

export async function createVersionPlanFromSystems(
  projectId: string,
  versionLabel: string,
  title: string,
  systemIds: string[],
  description?: string
): Promise<ServiceResult<VersionPlan>> {
  const project = await findProjectById(projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  if (systemIds.length === 0) return { success: false, error: 'At least one system required', code: 'VALIDATION' }
  const graphResult = await getProjectGraph(projectId)
  if (!graphResult.success) return { success: false, error: graphResult.error, code: graphResult.code }
  const scopeIds = new Set(systemIds)
  const validation = validateScope(
    buildGraph(graphResult.data.nodes, graphResult.data.edges),
    scopeIds
  )
  if (!validation.valid) {
    const msg = validation.missingDependencies
      .map((m) => `System ${m.nodeId} depends on ${m.missingDep} which is not in scope`)
      .join('; ')
    return { success: false, error: msg, code: 'VALIDATION' }
  }
  try {
    const plan = await createVersionPlan({
      projectId,
      versionLabel,
      title,
      description,
      includedSystems: systemIds,
      excludedSystems: [],
    })
    const order = graphResult.data.implementationOrder.filter((id) => systemIds.includes(id))
    await setPlanItems(
      plan.id,
      order.map((id, i) => ({ gameSystemId: id, phase: 1, sortOrder: i }))
    )
    return { success: true, data: plan }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create version plan',
      code: 'INTERNAL',
    }
  }
}

export async function listVersionPlans(
  projectId: string,
  pagination?: PaginationParams
): Promise<ServiceResult<PaginatedResult<VersionPlan>>> {
  const project = await findProjectById(projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const result = await listVersionPlansRepo(projectId, pagination)
    return { success: true, data: result }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list version plans',
      code: 'INTERNAL',
    }
  }
}

export async function getVersionPlan(id: string) {
  const plan = await findVersionPlanById(id)
  if (!plan) return { success: false as const, error: 'Version plan not found', code: 'NOT_FOUND' as const }
  const full = await getVersionPlanFull(id)
  return { success: true as const, data: full }
}

export async function finalizeVersionPlanAction(id: string): Promise<ServiceResult<VersionPlan>> {
  const plan = await findVersionPlanById(id)
  if (!plan) return { success: false, error: 'Version plan not found', code: 'NOT_FOUND' }
  if (plan.status === 'finalized') return { success: false, error: 'Plan is already finalized', code: 'IMMUTABLE' }
  try {
    const updated = await finalizeVersionPlan(id)
    return { success: true, data: updated }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to finalize',
      code: 'INTERNAL',
    }
  }
}

export async function deleteVersionPlanAction(id: string): Promise<ServiceResult<void>> {
  const plan = await findVersionPlanById(id)
  if (!plan) return { success: false, error: 'Version plan not found', code: 'NOT_FOUND' }
  if (plan.status === 'finalized') return { success: false, error: 'Cannot delete finalized plan', code: 'IMMUTABLE' }
  try {
    await deleteVersionPlan(id)
    return { success: true, data: undefined }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to delete',
      code: 'INTERNAL',
    }
  }
}

export async function validateVersionPlanScope(projectId: string, systemIds: string[]) {
  const graphResult = await getProjectGraph(projectId)
  if (!graphResult.success) return graphResult
  const graph = buildGraph(graphResult.data.nodes, graphResult.data.edges)
  const scopeIds = new Set(systemIds)
  const validation = validateScope(graph, scopeIds)
  return {
    success: true as const,
    data: {
      valid: validation.valid,
      missingDependencies: validation.missingDependencies,
    },
  }
}
