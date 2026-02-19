import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/services/project.service'
import { ProjectEditForm } from './project-edit-form'
import { ClearProjectButton } from '@/components/clear-project-button'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const result = await getProject(projectId)
  if (!result.success) notFound()
  const project = result.data

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/projects/${projectId}/overview`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Overview
        </Link>
      </div>
      <h1 className="text-2xl font-bold">Edit project</h1>
      <ProjectEditForm project={project} />
      <section className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Project data</h2>
        <p className="text-sm text-muted-foreground">
          Clear all data in this project (brainstorms, systems, dependencies, version plans, etc.)
          to reset and retest. The project itself is kept.
        </p>
        <ClearProjectButton projectId={project.id} />
      </section>
    </div>
  )
}
