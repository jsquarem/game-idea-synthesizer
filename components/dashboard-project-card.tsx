import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { DeleteProjectButton } from '@/components/delete-project-button'
import type { ProjectCardProject } from '@/components/project-card'

type DashboardProjectCardProps = {
  project: ProjectCardProject
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short' }).format(new Date(d))
}

export function DashboardProjectCard({ project }: DashboardProjectCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-lg flex flex-col h-full">
      <CardContent className="p-6 flex flex-col flex-1 min-h-0">
        <Link
          href={`/projects/${project.id}/overview`}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md -m-1 p-1 flex-1 min-h-0"
        >
          <h2 className="font-semibold line-clamp-1">{project.name}</h2>
          <div className="mt-1 min-h-[2.5rem]">
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {project.description ?? '\u00A0'}
            </p>
          </div>
          <div className="mt-3 min-h-6 flex flex-wrap gap-2 items-center">
            {project.genre && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{project.genre}</span>
            )}
            <StatusBadge status={project.status} />
          </div>
          <div className="mt-3 min-h-4 flex items-center gap-2 text-xs text-muted-foreground">
            {project.systemCount != null && (
              <span>{project.systemCount} system{project.systemCount !== 1 ? 's' : ''}</span>
            )}
            <span>Updated {formatDate(project.updatedAt)}</span>
          </div>
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 shrink-0">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/projects/${project.id}/overview`}>Open</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/projects/${project.id}/edit`}>Edit</Link>
          </Button>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
            variant="ghost"
            size="sm"
          />
        </div>
      </CardContent>
    </Card>
  )
}
