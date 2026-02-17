import Link from 'next/link'
import { listSystems } from '@/lib/services/game-system.service'
import { notFound } from 'next/navigation'

export default async function SystemsListPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const result = await listSystems({ projectId }, { pageSize: 100 })
  if (!result.success) notFound()
  const { data: systems } = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Systems</h1>
        <Link
          href={`/projects/${projectId}/systems/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New system
        </Link>
      </div>

      {systems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-muted-foreground">No game systems yet.</p>
          <Link
            href={`/projects/${projectId}/systems/new`}
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create your first system
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((system) => (
            <li key={system.id}>
              <Link
                href={`/projects/${projectId}/systems/${system.id}`}
                className="block rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow"
              >
                <h2 className="font-semibold">{system.name}</h2>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {system.systemSlug}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                    {system.status}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">
                    {system.mvpCriticality}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">
                    {system.version}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
