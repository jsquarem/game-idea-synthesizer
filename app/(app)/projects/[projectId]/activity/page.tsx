import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getProjectActivity } from '@/lib/services/project.service'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ActivityList } from './activity-list'
import { findProjectById } from '@/lib/repositories/project.repository'

const PAGE_SIZE = 20

export type ActivityItemSerialized = {
  type: string
  id: string
  label: string
  occurredAt: string
  href: string
}

export default async function ProjectActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await findProjectById(projectId)
  if (!project) notFound()

  const result = await getProjectActivity(projectId, PAGE_SIZE)
  const initialItems: ActivityItemSerialized[] = result.success
    ? result.data.items.map((item) => ({
        type: item.type,
        id: item.id,
        label: item.label,
        occurredAt: item.occurredAt.toISOString(),
        href: item.href,
      }))
    : []
  const initialNextCursor = result.success ? result.data.nextCursor : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground">
          All project activity: brainstorms, systems, idea stream, exports, version plans, dependencies
        </p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Project activity</h2>
        </CardHeader>
        <CardContent>
          <ActivityList
            projectId={projectId}
            initialItems={initialItems}
            initialNextCursor={initialNextCursor}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
      <Button variant="link" className="p-0" asChild>
        <Link href={`/projects/${projectId}/idea-stream`}>
          Open Idea Stream <ArrowRight className="ml-1 inline size-4" />
        </Link>
      </Button>
    </div>
  )
}
