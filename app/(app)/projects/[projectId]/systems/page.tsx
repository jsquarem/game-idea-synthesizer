import { listSystems } from '@/lib/services/game-system.service'
import { notFound } from 'next/navigation'
import { SystemsContent } from './systems-content'

type PageProps = {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ search?: string; status?: string; criticality?: string; view?: string }>
}

export default async function SystemsListPage({ params, searchParams }: PageProps) {
  const { projectId } = await params
  const q = await searchParams

  const result = await listSystems(
    {
      projectId,
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
      ...(q.criticality && { mvpCriticality: q.criticality }),
    },
    { pageSize: 100 }
  )
  if (!result.success) notFound()

  const { data: systems } = result.data

  const systemItems = systems.map((s) => ({
    id: s.id,
    name: s.name,
    systemSlug: s.systemSlug,
    status: s.status,
    mvpCriticality: s.mvpCriticality,
    version: s.version,
    updatedAt: s.updatedAt,
    dependencyCount: '_count' in s ? (s as { _count: { dependsOn: number } })._count.dependsOn : undefined,
  }))

  return (
    <SystemsContent
      projectId={projectId}
      systems={systemItems}
      initialSearch={q.search ?? ''}
      initialStatus={q.status ?? ''}
      initialCriticality={q.criticality ?? ''}
      initialView={q.view === 'table' ? 'table' : 'grid'}
    />
  )
}
