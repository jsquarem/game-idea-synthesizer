import Link from 'next/link'
import { listVersionPlans } from '@/lib/services/version-plan.service'
import { notFound } from 'next/navigation'

export default async function VersionPlansPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const result = await listVersionPlans(projectId, { pageSize: 50 })
  if (!result.success) notFound()
  const plans = result.data.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Version Plans</h1>
        <Link
          href={`/projects/${projectId}/versions/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New version plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-muted-foreground">No version plans yet.</p>
          <Link
            href={`/projects/${projectId}/versions/new`}
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create a version plan
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link
                href={`/projects/${projectId}/versions/${plan.id}`}
                className="block rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/50"
              >
                <h2 className="font-semibold">{plan.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.versionLabel}</p>
                <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-xs capitalize">
                  {plan.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
