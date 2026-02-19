import type { Dependency } from '@prisma/client'
import type { ServiceResult } from './types'
import {
  listDependenciesByProject,
  createDependency,
  deleteDependencyByPair,
} from '../repositories/dependency.repository'
import { getAllGameSystems } from '../repositories/game-system.repository'
import { findGameSystemById } from '../repositories/game-system.repository'
import { buildGraph, topologicalSort, getTransitiveDownstream, detectCycles } from '../graph/graph-engine'
import type { GraphNode, GraphEdge } from '../graph/types'

export async function getProjectGraph(projectId: string): Promise<
  ServiceResult<{
    nodes: GraphNode[]
    edges: GraphEdge[]
    implementationOrder: string[]
    hasCycles: boolean
  }>
> {
  try {
    const [systems, deps] = await Promise.all([
      getAllGameSystems(projectId),
      listDependenciesByProject(projectId),
    ])
    const nodes: GraphNode[] = systems.map((s) => ({
      id: s.id,
      label: s.name,
      metadata: { slug: s.systemSlug },
    }))
    const edges: GraphEdge[] = deps.map((d) => ({
      source: d.sourceSystemId,
      target: d.targetSystemId,
      type: d.dependencyType,
    }))
    const graph = buildGraph(nodes, edges)
    const order = topologicalSort(graph)
    const cycles = detectCycles(graph)
    return {
      success: true,
      data: {
        nodes,
        edges,
        implementationOrder: order ?? [],
        hasCycles: cycles.length > 0,
      },
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to load graph',
      code: 'INTERNAL',
    }
  }
}

export async function addDependency(
  sourceSystemId: string,
  targetSystemId: string,
  dependencyType?: string,
  description?: string | null
): Promise<ServiceResult<Dependency>> {
  if (sourceSystemId === targetSystemId) {
    return { success: false, error: 'System cannot depend on itself', code: 'VALIDATION' }
  }
  const [source, target] = await Promise.all([
    findGameSystemById(sourceSystemId),
    findGameSystemById(targetSystemId),
  ])
  if (!source) return { success: false, error: 'Source system not found', code: 'NOT_FOUND' }
  if (!target) return { success: false, error: 'Target system not found', code: 'NOT_FOUND' }
  if (source.projectId !== target.projectId) {
    return { success: false, error: 'Systems must belong to the same project', code: 'VALIDATION' }
  }
  try {
    const dep = await createDependency({
      sourceSystemId,
      targetSystemId,
      dependencyType: dependencyType ?? 'requires',
      description: description ?? undefined,
    })
    return { success: true, data: dep }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to add dependency',
      code: 'INTERNAL',
    }
  }
}

export async function removeDependency(
  sourceSystemId: string,
  targetSystemId: string
): Promise<ServiceResult<void>> {
  try {
    await deleteDependencyByPair(sourceSystemId, targetSystemId)
    return { success: true, data: undefined }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to remove dependency',
      code: 'INTERNAL',
    }
  }
}

export async function getImpact(projectId: string, systemId: string): Promise<
  ServiceResult<{
    downstream: string[]
  }>
> {
  const systems = await getAllGameSystems(projectId)
  const deps = await listDependenciesByProject(projectId)
  const nodes: GraphNode[] = systems.map((s) => ({ id: s.id, label: s.name, metadata: {} }))
  const edges: GraphEdge[] = deps.map((d) => ({
    source: d.sourceSystemId,
    target: d.targetSystemId,
    type: d.dependencyType,
  }))
  const graph = buildGraph(nodes, edges)
  if (!graph.nodes.has(systemId)) {
    return { success: false, error: 'System not found', code: 'NOT_FOUND' }
  }
  const downstream = getTransitiveDownstream(graph, systemId)
  return { success: true, data: { downstream } }
}
