import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { CriticalityBadge } from '@/components/criticality-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type DependencySidePanelSystem = {
  id: string
  name: string
  systemSlug: string
  purpose?: string | null
  status: string
  mvpCriticality: string
  dependsOn?: { id: string; name: string; systemSlug: string }[]
  dependedOnBy?: { id: string; name: string; systemSlug: string }[]
}

type DependencySidePanelProps = {
  system: DependencySidePanelSystem
  projectId: string
  className?: string
}

export function DependencySidePanel({ system, projectId, className }: DependencySidePanelProps) {
  const dependsOn = system.dependsOn ?? []
  const dependedOnBy = system.dependedOnBy ?? []

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{system.name}</h3>
            <p className="font-mono text-xs text-muted-foreground">{system.systemSlug}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <StatusBadge status={system.status} />
            <CriticalityBadge value={system.mvpCriticality} />
          </div>
        </div>
        {system.purpose && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{system.purpose}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Depends on
          </h4>
          {dependsOn.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">None</p>
          ) : (
            <ScrollArea className="mt-1 h-24">
              <ul className="space-y-1">
                {dependsOn.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/projects/${projectId}/systems/${s.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Depended on by
          </h4>
          {dependedOnBy.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">None</p>
          ) : (
            <ScrollArea className="mt-1 h-24">
              <ul className="space-y-1">
                {dependedOnBy.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/projects/${projectId}/systems/${s.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/projects/${projectId}/dependencies`}>View in Graph →</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
