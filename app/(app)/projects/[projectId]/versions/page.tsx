import Link from 'next/link'
import { listVersionPlans } from '@/lib/services/version-plan.service'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'

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
      <PageHeader
        title="Version Plans"
        actions={
          <Button asChild>
            <Link href={`/projects/${projectId}/versions/new`}>New Version Plan</Link>
          </Button>
        }
      />

      {plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-muted-foreground">No version plans yet.</p>
          <Button className="mt-4" asChild>
            <Link href={`/projects/${projectId}/versions/new`}>
              Create a version plan
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-4">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link href={`/projects/${projectId}/versions/${plan.id}`}>
                <Card className="transition-shadow duration-150 hover:shadow-md">
                  <CardContent>
                    <h2 className="font-semibold">{plan.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.versionLabel}</p>
                    <Badge variant="secondary" className="mt-2">
                      {plan.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
