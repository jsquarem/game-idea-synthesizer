import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'

export type ProjectCardProject = {
  id: string
  name: string
  description?: string | null
  genre?: string | null
  platform?: string | null
  status: string
  updatedAt: Date
  systemCount?: number
}

type ProjectCardProps = {
  project: ProjectCardProject
  className?: string
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short' }).format(new Date(d))
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}/overview`}>
      <Card
        className={cn(
          'transition-shadow hover:shadow-lg hover:-translate-y-0.5',
          className
        )}
      >
        <CardContent className="p-6">
          <h2 className="font-semibold">{project.name}</h2>
          {project.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {project.genre && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{project.genre}</span>
            )}
            <StatusBadge status={project.status} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            {project.systemCount != null && (
              <span>{project.systemCount} system{project.systemCount !== 1 ? 's' : ''}</span>
            )}
            <span>Updated {formatDate(project.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
