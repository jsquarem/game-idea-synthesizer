import { notFound } from 'next/navigation'
import { findProjectById } from '@/lib/repositories/project.repository'
import { ProjectSidebar } from '@/components/project-sidebar'
import { SetProjectBreadcrumb } from '@/components/set-project-breadcrumb'
import { ProjectContentWrapper } from './project-content-wrapper'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await findProjectById(projectId)
  if (!project) notFound()

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <SetProjectBreadcrumb projectId={projectId} projectName={project.name} />
      <ProjectSidebar projectId={projectId} />
      <div className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-10">
        <ProjectContentWrapper>{children}</ProjectContentWrapper>
      </div>
    </div>
  )
}
