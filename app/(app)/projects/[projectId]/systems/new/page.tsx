import Link from 'next/link'
import { createSystemAction } from '@/app/actions/game-system.actions'
import { SystemForm } from '../[systemId]/system-form'

export default async function NewSystemPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { projectId } = await params
  const { error } = await searchParams

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/projects/${projectId}/systems`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Systems
        </Link>
      </div>
      <h1 className="text-2xl font-bold">New Game System</h1>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeURIComponent(error)}
        </p>
      )}
      <SystemForm
        projectId={projectId}
        system={null}
        createAction={createSystemAction}
      />
    </div>
  )
}
