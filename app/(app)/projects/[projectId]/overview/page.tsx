import Link from 'next/link'
import { getProjectDashboard } from '@/lib/services/project.service'
import { notFound } from 'next/navigation'

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const result = await getProjectDashboard(projectId)
  if (!result.success) notFound()

  const { project, systemCount, brainstormCount, versionPlanCount, dependencyCount } =
    result.data

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {(project.genre || project.platform) && (
          <div className="mt-2 flex gap-2">
            {project.genre && (
              <span className="rounded bg-muted px-2 py-0.5 text-sm">
                {project.genre}
              </span>
            )}
            {project.platform && (
              <span className="rounded bg-muted px-2 py-0.5 text-sm">
                {project.platform}
              </span>
            )}
            <span className="rounded bg-muted px-2 py-0.5 text-sm capitalize">
              {project.status}
            </span>
          </div>
        )}
        {project.description && (
          <p className="mt-2 text-muted-foreground">{project.description}</p>
        )}
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Quick stats</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <li className="rounded-lg border border-border bg-card p-4">
            <Link
              href={`/projects/${projectId}/brainstorms`}
              className="font-medium text-primary hover:underline"
            >
              Brainstorms
            </Link>
            <p className="mt-1 text-2xl font-bold">{brainstormCount}</p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4">
            <Link
              href={`/projects/${projectId}/systems`}
              className="font-medium text-primary hover:underline"
            >
              Systems
            </Link>
            <p className="mt-1 text-2xl font-bold">{systemCount}</p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4">
            <Link
              href={`/projects/${projectId}/dependencies`}
              className="font-medium text-primary hover:underline"
            >
              Dependencies
            </Link>
            <p className="mt-1 text-2xl font-bold">{dependencyCount}</p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4">
            <Link
              href={`/projects/${projectId}/versions`}
              className="font-medium text-primary hover:underline"
            >
              Version plans
            </Link>
            <p className="mt-1 text-2xl font-bold">{versionPlanCount}</p>
          </li>
        </ul>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href={`/projects/${projectId}/brainstorms/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Brainstorm
        </Link>
        <Link
          href={`/projects/${projectId}/systems/new`}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          New System
        </Link>
        <Link
          href={`/projects/${projectId}/versions/new`}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          New Version Plan
        </Link>
      </section>
    </div>
  )
}
