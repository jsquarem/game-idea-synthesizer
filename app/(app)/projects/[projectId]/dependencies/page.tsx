import { getProjectGraph } from '@/lib/services/dependency.service'
import { getAllGameSystems } from '@/lib/repositories/game-system.repository'
import { listDependenciesByProject } from '@/lib/repositories/dependency.repository'
import { notFound } from 'next/navigation'
import { DependenciesContent } from './dependencies-content'

export default async function DependenciesPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const [graphResult, systems, deps] = await Promise.all([
    getProjectGraph(projectId),
    getAllGameSystems(projectId),
    listDependenciesByProject(projectId),
  ])
  if (!graphResult.success) notFound()

  const { nodes, implementationOrder, hasCycles } = graphResult.data
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  const implementationOrderList = implementationOrder.map((id) => ({
    id,
    label: nodeMap.get(id)?.label ?? id,
  }))

  const edgesList = deps.map((d) => ({
    sourceId: d.sourceSystemId,
    sourceName: d.sourceSystem.name,
    targetId: d.targetSystemId,
    targetName: d.targetSystem.name,
    type: d.dependencyType,
    description: d.description ?? null,
  }))

  const systemsForPanel = systems.map((s) => ({
    id: s.id,
    name: s.name,
    systemSlug: s.systemSlug,
    purpose: s.purpose ?? null,
    status: s.status,
    mvpCriticality: s.mvpCriticality,
    dependsOn: deps.filter((d) => d.sourceSystemId === s.id).map((d) => d.targetSystem),
    dependedOnBy: deps.filter((d) => d.targetSystemId === s.id).map((d) => d.sourceSystem),
  }))

  return (
    <DependenciesContent
      projectId={projectId}
      implementationOrder={implementationOrderList}
      hasCycles={hasCycles}
      edges={edgesList}
      systemsForPanel={systemsForPanel}
      systems={systems}
    />
  )
}
