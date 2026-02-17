import Link from 'next/link'
import { listProjects } from '@/lib/services/project.service'

export default async function DashboardPage() {
  const result = await listProjects(undefined, { pageSize: 50 })
  const projects = result.success ? result.data.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-muted-foreground">No projects yet.</p>
          <Link
            href="/projects/new"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}/overview`}
                className="block rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow"
              >
                <h2 className="font-semibold">{project.name}</h2>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.genre && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs">
                      {project.genre}
                    </span>
                  )}
                  <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                    {project.status}
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
