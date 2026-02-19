'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserId } from '@/lib/get-current-user'
import { findProjectById } from '@/lib/repositories/project.repository'
import { getBrainstormById } from '@/lib/repositories/brainstorm.repository'
import { getOrCreateDefaultWorkspace } from '@/lib/repositories/workspace.repository'
import { getLatestSnapshot } from '@/lib/services/context-snapshot.service'
import { listWorkspaceAiConfigs } from '@/lib/repositories/workspace-ai-config.repository'
import { parseAvailableModels } from '@/lib/ai/list-models'
import { convertSynthesisToSystems } from '@/lib/services/synthesis-convert.service'
import type { CandidateSelection } from '@/lib/services/synthesis-convert.service'
import { getSynthesizedOutputById, updateSynthesizedOutput } from '@/lib/repositories/synthesized-output.repository'
import type { ExtractedSystemStub, ExtractedSystemDetailStub } from '@/lib/ai/parse-synthesis-response'

export type SynthesisConfigResult = {
  sessionId: string
  projectId: string
  workspaceId: string | null
  snapshotDate: string | null
  providerConfigs: { providerId: string; defaultModel: string | null; availableModels?: string[] }[]
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
  let workspaceId = project.workspaceId
  if (!workspaceId) {
    const userId = await getCurrentUserId()
    const defaultWorkspace = await getOrCreateDefaultWorkspace(userId)
    workspaceId = defaultWorkspace.id
  }
  const configs = await listWorkspaceAiConfigs(workspaceId)
  const providerConfigs =
    configs.length > 0
      ? configs.map((c) => ({
          providerId: c.providerId,
          defaultModel: c.defaultModel ?? null,
          availableModels: parseAvailableModels(c.availableModels),
        }))
      : [{ providerId: 'openai', defaultModel: 'gpt-4o-mini', availableModels: [] }]
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
  cycleEdge?: { sourceSlug: string; targetSlug: string }
}

export async function convertSynthesisAction(
  outputId: string,
  selections: CandidateSelection[],
  dependencyEdges: { sourceSlug: string; targetSlug: string; description?: string }[]
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
    cycleEdge: result.cycleEdge,
  }
}

export type AddSuggestedToExtractionResult = {
  success: boolean
  error?: string
  extractedSystems?: ExtractedSystemStub[]
  extractedSystemDetails?: ExtractedSystemDetailStub[]
  suggestedSystems?: ExtractedSystemStub[]
  suggestedSystemDetails?: ExtractedSystemDetailStub[]
}

/** Move one or more suggested systems (by index) into extracted systems and persist. Promoted systems are then included in Create selected. */
export async function addSuggestedSystemsToExtractionAction(
  outputId: string,
  suggestedIndices: number[]
): Promise<AddSuggestedToExtractionResult> {
  if (suggestedIndices.length === 0) {
    return { success: true }
  }
  const output = await getSynthesizedOutputById(outputId)
  const extractedSystems = JSON.parse(output.extractedSystems || '[]') as ExtractedSystemStub[]
  const extractedSystemDetails = JSON.parse(
    output.extractedSystemDetails || '[]'
  ) as ExtractedSystemDetailStub[]
  const suggestedSystems = JSON.parse(
    (output as { suggestedSystems?: string | null }).suggestedSystems || '[]'
  ) as ExtractedSystemStub[]
  const suggestedSystemDetails = JSON.parse(
    (output as { suggestedSystemDetails?: string | null }).suggestedSystemDetails || '[]'
  ) as ExtractedSystemDetailStub[]

  const slugNorm = (s: string | undefined) => (s ?? '').toLowerCase().trim()
  const indicesToRemove = new Set(suggestedIndices.filter((i) => i >= 0 && i < suggestedSystems.length).sort((a, b) => b - a))

  for (const i of indicesToRemove) {
    const stub = suggestedSystems[i]
    if (!stub) continue
    const slug = slugNorm(stub.systemSlug ?? stub.name)
    extractedSystems.push(stub)
    const detailsForThis = suggestedSystemDetails.filter(
      (d) => slugNorm(d.targetSystemSlug ?? d.systemSlug) === slug
    )
    extractedSystemDetails.push(...detailsForThis)
  }

  const newSuggestedSystems = suggestedSystems.filter((_, i) => !indicesToRemove.has(i))
  const newSuggestedDetails = suggestedSystemDetails.filter((d) => {
    const slug = slugNorm(d.targetSystemSlug ?? d.systemSlug)
    return !Array.from(indicesToRemove).some((i) => {
      const stub = suggestedSystems[i]
      return stub && slugNorm(stub.systemSlug ?? stub.name) === slug
    })
  })

  await updateSynthesizedOutput(outputId, {
    extractedSystems,
    extractedSystemDetails,
    suggestedSystems: newSuggestedSystems,
    suggestedSystemDetails: newSuggestedDetails,
  })

  return {
    success: true,
    extractedSystems,
    extractedSystemDetails,
    suggestedSystems: newSuggestedSystems,
    suggestedSystemDetails: newSuggestedDetails,
  }
}
