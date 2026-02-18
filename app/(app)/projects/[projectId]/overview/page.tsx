import Link from 'next/link'
import { Settings, Lightbulb, Boxes, GitBranch, Calendar, ArrowRight, MessageCircle } from 'lucide-react'
import { getProjectDashboard, getOverviewRecentActivity } from '@/lib/services/project.service'
import { getIdeaStreamUnreadCount } from '@/lib/services/idea-stream.service'
import { getCurrentUserId } from '@/lib/get-current-user'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { StatCard } from '@/components/stat-card'
import type { ProjectActivityType } from '@/lib/repositories/project-activity.repository'

const ACTIVITY_TYPE_LABELS: Record<ProjectActivityType, string> = {
  thread: 'Idea Stream',
  brainstorm: 'Brainstorm',
  system: 'System',
  export: 'Export',
  version_plan: 'Version plan',
  dependency: 'Dependency',
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  return date.toLocaleDateString()
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const [dashboardResult, activityResult, unreadResult] = await Promise.all([
    getProjectDashboard(projectId),
    getOverviewRecentActivity(projectId),
    getCurrentUserId().then((uid) =>
      uid ? getIdeaStreamUnreadCount(projectId, uid) : Promise.resolve({ success: true as const, data: 0 })
    ),
  ])
  if (!dashboardResult.success) notFound()

  const { project, systemCount, brainstormCount, versionPlanCount, dependencyCount, threadCount } =
    dashboardResult.data
  const recentActivity = activityResult.success ? activityResult.data : []
  const ideaStreamUnread = unreadResult.success ? unreadResult.data : 0
  const ideaStreamBadge = ideaStreamUnread > 0 ? `${ideaStreamUnread} unread` : 'Up to date'

  return (
    <div className="space-y-8">
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.genre && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-sm">{project.genre}</span>
              )}
              {project.platform && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-sm">{project.platform}</span>
              )}
              <StatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="mt-2 text-muted-foreground">{project.description}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" aria-label="Edit project" asChild>
            <Link href={`/projects/${projectId}/edit`}>
              <Settings className="size-4" />
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <section>
        <h2 className="sr-only">Quick stats</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <li>
            <StatCard
              icon={MessageCircle}
              label="Idea Stream"
              value={threadCount}
              href={`/projects/${projectId}/idea-stream`}
              badge={ideaStreamBadge}
            />
          </li>
          <li>
            <StatCard
              icon={Lightbulb}
              label="Brainstorms"
              value={brainstormCount}
              href={`/projects/${projectId}/brainstorms`}
            />
          </li>
          <li>
            <StatCard
              icon={Boxes}
              label="Systems"
              value={systemCount}
              href={`/projects/${projectId}/systems`}
            />
          </li>
          <li>
            <StatCard
              icon={GitBranch}
              label="Dependencies"
              value={dependencyCount}
              href={`/projects/${projectId}/dependencies`}
            />
          </li>
          <li>
            <StatCard
              icon={Calendar}
              label="Version Plans"
              value={versionPlanCount}
              href={`/projects/${projectId}/versions`}
            />
          </li>
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="rounded-xl">
            <CardHeader>
              <h2 className="text-lg font-semibold">Dependency graph</h2>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground">
                Graph preview placeholder
              </div>
              <Button variant="link" className="mt-4 p-0" asChild>
                <Link href={`/projects/${projectId}/dependencies`}>
                  View Full Graph <ArrowRight className="ml-1 inline size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="rounded-xl">
            <CardHeader>
              <h2 className="text-lg font-semibold">Recent activity</h2>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Last activity of each type
              </p>
              <ul className="space-y-4">
                {recentActivity.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No activity yet</li>
                ) : (
                  recentActivity.map((item) => (
                    <li key={`${item.type}-${item.id}`} className="flex gap-3 text-sm">
                      <span className="size-2 shrink-0 rounded-full bg-muted-foreground/50 mt-1.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground">
                          <Link href={item.href} className="hover:underline">
                            <span className="font-medium text-muted-foreground">
                              {ACTIVITY_TYPE_LABELS[item.type]}:{' '}
                            </span>
                            {item.label}
                          </Link>
                        </p>
                        <p className="text-muted-foreground">
                          {formatRelativeTime(item.occurredAt)}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <Button variant="link" className="mt-2 p-0 text-sm" asChild>
                <Link href={`/projects/${projectId}/activity`}>View full history</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/projects/${projectId}/brainstorms/new`}>New Brainstorm</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/projects/${projectId}/systems/new`}>New System</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/projects/${projectId}/versions/new`}>Generate Version Plan</Link>
        </Button>
      </section>
    </div>
  )
}
