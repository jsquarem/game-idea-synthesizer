import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { CriticalityBadge } from '@/components/criticality-badge'
import { cn } from '@/lib/utils'

export type SystemCardSystem = {
  id: string
  name: string
  systemSlug: string
  status: string
  mvpCriticality: string
  version?: string
  updatedAt: Date
  dependencyCount?: number
}

type SystemCardProps = {
  system: SystemCardSystem
  projectId: string
  className?: string
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short' }).format(new Date(d))
}

export function SystemCard({ system, projectId, className }: SystemCardProps) {
  return (
    <Link href={`/projects/${projectId}/systems/${system.id}`}>
      <Card
        className={cn(
          'transition-shadow duration-150 hover:shadow-md',
          className
        )}
      >
        <CardContent>
          <h2 className="font-semibold">{system.name}</h2>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{system.systemSlug}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={system.status} />
            <CriticalityBadge value={system.mvpCriticality} />
          </div>
          {system.dependencyCount != null && (
            <p className="mt-2 text-xs text-muted-foreground">
              {system.dependencyCount} dependenc{system.dependencyCount === 1 ? 'y' : 'ies'}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(system.updatedAt)}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
