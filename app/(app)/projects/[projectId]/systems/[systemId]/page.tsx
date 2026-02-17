import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSystem } from '@/lib/services/game-system.service'
import { updateSystemAction, deleteSystemAction } from '@/app/actions/game-system.actions'
import { SystemForm } from './system-form'
import { SystemViewToggle } from './system-view-toggle'
import { DeleteSystemButton } from './delete-system-button'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${projectId}/systems`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Systems
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/projects/${projectId}/systems/${systemId}/history`}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            History
          </Link>
          <DeleteSystemButton
            projectId={projectId}
            systemId={systemId}
            deleteAction={deleteSystemAction}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeURIComponent(error)}
        </p>
      )}

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
  )
}
