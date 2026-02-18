import Link from 'next/link'
import { Settings, Lightbulb, Boxes, GitBranch, Calendar, ArrowRight } from 'lucide-react'
import { getProjectDashboard } from '@/lib/services/project.service'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { StatCard } from '@/components/stat-card'

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const result = await getProjectDashboard(projectId)
  if (!result.success) notFound()

  const { project, systemCount, brainstormCount, versionPlanCount, dependencyCount } = result.data

  const recentActivity = [
    { icon: 'system', text: 'System "Combat" updated', time: '2 hours ago' },
    { icon: 'brainstorm', text: 'New brainstorm session added', time: '1 day ago' },
    { icon: 'dependency', text: 'Dependency added: Core → Combat', time: '2 days ago' },
  ]

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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <ul className="space-y-4">
                {recentActivity.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="size-2 shrink-0 rounded-full bg-muted-foreground/50 mt-1.5" />
                    <div>
                      <p className="text-foreground">{item.text}</p>
                      <p className="text-muted-foreground">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
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
