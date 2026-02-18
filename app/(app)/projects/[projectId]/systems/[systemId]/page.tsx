import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSystem } from '@/lib/services/game-system.service'
import { updateSystemAction, deleteSystemAction } from '@/app/actions/game-system.actions'
import { SystemForm } from './system-form'
import { SystemViewToggle } from './system-view-toggle'
import { DeleteSystemButton } from './delete-system-button'
import { StatusBadge } from '@/components/status-badge'
import { CriticalityBadge } from '@/components/criticality-badge'
import { Button } from '@/components/ui/button'
import { DependencySidePanel } from '@/components/dependency-side-panel'

export default async function SystemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; systemId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { projectId, systemId } = await params
  const { error } = await searchParams
  const result = await getSystem(systemId)
  if (!result.success) notFound()
  const system = result.data

  const dependencyPanelSystem = {
    id: system.id,
    name: system.name,
    systemSlug: system.systemSlug,
    purpose: system.purpose,
    status: system.status,
    mvpCriticality: system.mvpCriticality,
    dependsOn: system.dependsOn.map((d) => ({
      id: d.targetSystem.id,
      name: d.targetSystem.name,
      systemSlug: d.targetSystem.systemSlug,
    })),
    dependedOnBy: system.dependedOnBy.map((d) => ({
      id: d.sourceSystem.id,
      name: d.sourceSystem.name,
      systemSlug: d.sourceSystem.systemSlug,
    })),
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{system.name}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{system.systemSlug}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={system.status} />
            <CriticalityBadge value={system.mvpCriticality} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" form="system-form" size="sm">
            Save Changes
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/projects/${projectId}/systems/${systemId}/history`}>History</Link>
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Evolve
          </Button>
          <DeleteSystemButton
            projectId={projectId}
            systemId={systemId}
            deleteAction={deleteSystemAction}
          />
        </div>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,360px)]">
        <div className="min-w-0">
          <SystemViewToggle
            system={system}
            projectId={projectId}
            systemId={systemId}
            updateAction={updateSystemAction}
            formComponent={
              <SystemForm
                projectId={projectId}
                system={system}
                createAction={null}
                updateAction={updateSystemAction}
              />
            }
          />
        </div>
        <aside className="lg:order-none">
          <DependencySidePanel system={dependencyPanelSystem} projectId={projectId} />
        </aside>
      </div>
    </div>
  )
}
