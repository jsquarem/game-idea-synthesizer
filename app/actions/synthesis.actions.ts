'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserId } from '@/lib/get-current-user'
import { findProjectById } from '@/lib/repositories/project.repository'
import { getBrainstormById } from '@/lib/repositories/brainstorm.repository'
import { getLatestSnapshot } from '@/lib/services/context-snapshot.service'
import { listWorkspaceAiConfigs } from '@/lib/repositories/workspace-ai-config.repository'
import { convertSynthesisToSystems } from '@/lib/services/synthesis-convert.service'
import type { CandidateSelection } from '@/lib/services/synthesis-convert.service'

export type SynthesisConfigResult = {
  sessionId: string
  projectId: string
  workspaceId: string | null
  snapshotDate: string | null
  providerConfigs: { providerId: string; defaultModel: string | null }[]
  sessionTitle: string
}

export async function getSynthesisConfig(
  projectId: string,
  sessionId: string
): Promise<SynthesisConfigResult | { error: string }> {
  const project = await findProjectById(projectId)
  if (!project) return { error: 'Project not found' }
  const session = await getBrainstormById(sessionId).catch(() => null)
  if (!session || session.projectId !== projectId) return { error: 'Session not found' }
  const snapshot = await getLatestSnapshot(projectId)
  const workspaceId = project.workspaceId
  const configs = workspaceId
    ? await listWorkspaceAiConfigs(workspaceId)
    : []
  const providerConfigs =
    configs.length > 0
      ? configs.map((c) => ({
          providerId: c.providerId,
          defaultModel: c.defaultModel ?? 'gpt-4o-mini',
        }))
      : [{ providerId: 'openai', defaultModel: 'gpt-4o-mini' }]
  return {
    sessionId,
    projectId,
    workspaceId,
    snapshotDate: snapshot ? snapshot.createdAt.toISOString() : null,
    providerConfigs,
    sessionTitle: session.title,
  }
}

export type ConvertSynthesisResult = {
  success: boolean
  error?: string
  cycleError?: string
}

export async function convertSynthesisAction(
  outputId: string,
  selections: CandidateSelection[],
  dependencyEdges: { sourceSlug: string; targetSlug: string }[]
): Promise<ConvertSynthesisResult & { projectId?: string }> {
  const result = await convertSynthesisToSystems({
    outputId,
    selections,
    dependencyEdges,
  })
  if (result.success && result.createdSystems?.length) {
    const projectId = result.createdSystems[0].projectId
    revalidatePath(`/projects/${projectId}/systems`)
    revalidatePath(`/projects/${projectId}/brainstorms`)
    return { success: true, projectId }
  }
  return {
    success: result.success,
    error: result.error,
    cycleError: result.cycleError,
  }
}
