import Link from 'next/link'
import { getProjectGraph } from '@/lib/services/dependency.service'
import { getAllGameSystems } from '@/lib/repositories/game-system.repository'
import { listDependenciesByProject } from '@/lib/repositories/dependency.repository'
import { notFound } from 'next/navigation'
import { AddDependencyForm } from './add-dependency-form'

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
  const { nodes, implementationOrder } = graphResult.data
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dependency Graph</h1>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Implementation order</h2>
        {implementationOrder.length === 0 ? (
          <p className="text-muted-foreground">No systems or no dependencies yet.</p>
        ) : (
          <ol className="list-inside list-decimal space-y-1 font-mono text-sm">
            {implementationOrder.map((id) => (
              <li key={id}>
                <Link
                  href={`/projects/${projectId}/systems/${id}`}
                  className="text-primary hover:underline"
                >
                  {nodeMap.get(id)?.label ?? id}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Edges</h2>
        {deps.length === 0 ? (
          <p className="text-muted-foreground">No dependencies defined.</p>
        ) : (
          <ul className="space-y-1 font-mono text-sm">
            {deps.map((d) => (
              <li key={`${d.sourceSystemId}-${d.targetSystemId}`}>
                <Link
                  href={`/projects/${projectId}/systems/${d.sourceSystemId}`}
                  className="text-primary hover:underline"
                >
                  {d.sourceSystem.name}
                </Link>
                {' → '}
                <Link
                  href={`/projects/${projectId}/systems/${d.targetSystemId}`}
                  className="text-primary hover:underline"
                >
                  {d.targetSystem.name}
                </Link>
                <span className="ml-2 text-muted-foreground">({d.dependencyType})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Add dependency</h2>
        <AddDependencyForm projectId={projectId} systems={systems} />
      </section>
    </div>
  )
}
