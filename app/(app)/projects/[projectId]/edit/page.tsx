import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/services/project.service'
import { ProjectEditForm } from './project-edit-form'

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
    <div className="mx-auto max-w-lg space-y-6">
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
    </div>
  )
}
