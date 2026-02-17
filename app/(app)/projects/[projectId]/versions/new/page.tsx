import Link from 'next/link'
import { createVersionPlanAction, validateVersionPlanScopeAction } from '@/app/actions/version-plan.actions'
import { getAllGameSystems } from '@/lib/repositories/game-system.repository'
import { VersionPlanForm } from './version-plan-form'

export default async function NewVersionPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { projectId } = await params
  const { error } = await searchParams
  const systems = await getAllGameSystems(projectId)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/projects/${projectId}/versions`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Version plans
      </Link>
      <h1 className="text-2xl font-bold">New Version Plan</h1>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeURIComponent(error)}
        </p>
      )}
      <VersionPlanForm
        projectId={projectId}
        systems={systems}
        createAction={createVersionPlanAction}
        validateScope={validateVersionPlanScopeAction}
      />
    </div>
  )
}
