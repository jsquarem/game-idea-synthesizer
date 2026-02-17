import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getVersionPlan } from '@/lib/services/version-plan.service'
import { finalizeVersionPlanAction, deleteVersionPlanAction } from '@/app/actions/version-plan.actions'
import { FinalizePlanButton } from './finalize-plan-button'
import { DeletePlanButton } from './delete-plan-button'

export default async function VersionPlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; planId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { projectId, planId } = await params
  const { error } = await searchParams
  const result = await getVersionPlan(planId)
  if (!result.success) notFound()
  const plan = result.data

  return (
    <div className="space-y-6">
      <Link
        href={`/projects/${projectId}/versions`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Version plans
      </Link>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeURIComponent(error)}
        </p>
      )}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          <p className="mt-1 text-muted-foreground">{plan.versionLabel}</p>
          <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-sm capitalize">
            {plan.status}
          </span>
        </div>
        {plan.status === 'draft' && (
          <div className="flex gap-2">
            <FinalizePlanButton
              projectId={projectId}
              planId={planId}
              finalizeAction={finalizeVersionPlanAction}
            />
            <DeletePlanButton
              projectId={projectId}
              planId={planId}
              deleteAction={deleteVersionPlanAction}
            />
          </div>
        )}
      </header>
      {plan.description && (
        <p className="text-muted-foreground">{plan.description}</p>
      )}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Systems in scope</h2>
        <ul className="space-y-1">
          {plan.planItems
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => (
              <li key={item.id}>
                <Link
                  href={`/projects/${projectId}/systems/${item.gameSystem.id}`}
                  className="text-primary hover:underline"
                >
                  {item.gameSystem.name} ({item.gameSystem.systemSlug})
                </Link>
                <span className="ml-2 text-sm text-muted-foreground">
                  Phase {item.phase}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  )
}
