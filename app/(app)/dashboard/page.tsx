import { listProjects, getDashboardCounts } from '@/lib/services/project.service'
import { DashboardContent } from './dashboard-content'

type PageProps = {
  searchParams: Promise<{ search?: string; status?: string; sort?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
  const sort = params.sort ?? 'recent'

  const [projectsResult, countsResult] = await Promise.all([
    listProjects(
      {
        ...(search && { search }),
        ...(status && { status }),
      },
      { pageSize: 50 }
    ),
    getDashboardCounts(),
  ])
  const projects = projectsResult.success ? projectsResult.data.data : []
  const counts = countsResult.success ? countsResult.data : null

  const sorted =
    sort === 'name'
      ? [...projects].sort((a, b) => a.name.localeCompare(b.name))
      : sort === 'updated'
        ? [...projects].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        : projects

  const projectCards = sorted.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    genre: p.genre,
    platform: p.platform,
    status: p.status,
    updatedAt: p.updatedAt,
    systemCount: '_count' in p ? (p as { _count: { gameSystems: number } })._count.gameSystems : undefined,
  }))

  return (
    <DashboardContent
      projects={projectCards}
      counts={counts}
      initialSearch={search}
      initialStatus={status}
      initialSort={sort}
    />
  )
}
