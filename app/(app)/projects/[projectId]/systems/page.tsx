import { listSystemsWithDetails } from '@/lib/services/game-system.service'
import { findProjectById } from '@/lib/repositories/project.repository'
import { listWorkspaceAiConfigs } from '@/lib/repositories/workspace-ai-config.repository'
import { parseAvailableModels } from '@/lib/ai/list-models'
import { notFound } from 'next/navigation'
import { SystemsContent } from './systems-content'

type PageProps = {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ search?: string; status?: string; criticality?: string }>
}

export default async function SystemsListPage({ params, searchParams }: PageProps) {
  const { projectId } = await params
  const q = await searchParams

  const [result, project] = await Promise.all([
    listSystemsWithDetails(
      {
        projectId,
        ...(q.search && { search: q.search }),
        ...(q.status && { status: q.status }),
        ...(q.criticality && { mvpCriticality: q.criticality }),
      },
      { pageSize: 100 }
    ),
    findProjectById(projectId),
  ])
  if (!result.success || !project) notFound()

  const systems = result.data.data
  const workspaceId = project.workspaceId
  const aiConfigs = workspaceId ? await listWorkspaceAiConfigs(workspaceId) : []
  const providerConfigs =
    aiConfigs.length > 0
      ? aiConfigs.map((c) => ({
          providerId: c.providerId,
          defaultModel: c.defaultModel ?? 'gpt-4o-mini',
          availableModels: parseAvailableModels(c.availableModels),
        }))
      : [{ providerId: 'openai', defaultModel: 'gpt-4o-mini', availableModels: [] }]

  return (
    <SystemsContent
      projectId={projectId}
      systems={systems}
      initialSearch={q.search ?? ''}
      initialStatus={q.status ?? ''}
      initialCriticality={q.criticality ?? ''}
      providerConfigs={providerConfigs}
    />
  )
}
