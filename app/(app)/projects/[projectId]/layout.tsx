import { notFound } from 'next/navigation'
import { findProjectById } from '@/lib/repositories/project.repository'
import { ProjectSidebar } from '@/components/project-sidebar'
import { SetProjectBreadcrumb } from '@/components/set-project-breadcrumb'
import { ProjectContentArea } from './project-content-area'
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
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col md:flex-row md:h-[calc(100vh-3.5rem)]">
      <SetProjectBreadcrumb projectId={projectId} projectName={project.name} />
      <ProjectSidebar projectId={projectId} />
      <ProjectContentArea>
        <ProjectContentWrapper>{children}</ProjectContentWrapper>
      </ProjectContentArea>
    </div>
  )
}
