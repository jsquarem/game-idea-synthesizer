import type { SynthesizedOutput } from '@prisma/client'
import { getProjectById } from '@/lib/repositories/project.repository'
import { getBrainstormById } from '@/lib/repositories/brainstorm.repository'
import { getOrCreateDefaultWorkspace } from '@/lib/repositories/workspace.repository'
import { createSynthesizedOutput } from '@/lib/repositories/synthesized-output.repository'
import { getLatestSnapshot, createContextSnapshot, parseSnapshotContent } from '@/lib/services/context-snapshot.service'
import { generateExport } from '@/lib/services/export.service'
import { buildFullContext, buildDeltaSinceSnapshot, assembleForSynthesis } from '@/lib/services/context-builder.service'
import type { SnapshotContent } from '@/lib/services/context-builder.types'
import { runCompletionStream } from '@/lib/ai/run-completion'
import { parseSynthesisResponse } from '@/lib/ai/parse-synthesis-response'

export type SynthesisRunInput = {
  brainstormSessionId: string
  providerId: string
  model?: string
  focusAreas?: string
  rerunMode?: 'rerun' | 'update_context'
}

export type SynthesisStreamResult = {
  outputId: string | null
  error: string | null
  fullPrompt?: string
}

/**
 * Assemble context for synthesis: load or build snapshot, build delta, assemble prompt.
 */
export async function assembleSynthesisContext(
  projectId: string,
  brainstormSessionId: string,
  rerunMode: 'rerun' | 'update_context'
): Promise<{ fullPrompt: string; snapshotContent: SnapshotContent | null }> {
  const session = await getBrainstormById(brainstormSessionId)
  const newContent = session.content
  const newTitle = session.title

  let snapshotContent: SnapshotContent
  let snapshot: Awaited<ReturnType<typeof getLatestSnapshot>> = null

  if (rerunMode === 'update_context') {
    snapshotContent = await buildFullContext(projectId)
    snapshot = null
  } else {
    snapshot = await getLatestSnapshot(projectId)
    if (snapshot) {
      snapshotContent = parseSnapshotContent(snapshot.content)
    } else {
      snapshotContent = await buildFullContext(projectId)
    }
  }

  const delta =
    snapshot && rerunMode === 'rerun'
      ? await buildDeltaSinceSnapshot(projectId, snapshot)
      : []

  const assembled = assembleForSynthesis(
    snapshotContent,
    delta,
    newContent,
    newTitle
  )
  return {
    fullPrompt: assembled.fullPrompt,
    snapshotContent: snapshot ? parseSnapshotContent(snapshot.content) : null,
  }
}

/**
 * Run synthesis: assemble context, stream AI response, parse, persist output, create snapshot.
 * Returns the created SynthesizedOutput id, optional fullPrompt for display, and streams chunks to the provided callback.
 * If onPrompt is provided, it is called with the full prompt before streaming starts.
 */
export async function runSynthesisStream(
  input: SynthesisRunInput,
  onChunk: (text: string) => void,
  onPrompt?: (prompt: string) => void
): Promise<{ output: SynthesizedOutput | null; error: string | null; fullPrompt?: string }> {
  const session = await getBrainstormById(input.brainstormSessionId)
  const project = await getProjectById(session.projectId)
  const workspaceId =
    project.workspaceId ?? (await getOrCreateDefaultWorkspace()).id

  const { fullPrompt } = await assembleSynthesisContext(
    session.projectId,
    input.brainstormSessionId,
    input.rerunMode ?? 'rerun'
  )

  onPrompt?.(fullPrompt)

  let fullContent = ''
  let promptTokens = 0
  let completionTokens = 0

  try {
    for await (const chunk of runCompletionStream({
      workspaceId,
      providerId: input.providerId,
      prompt: fullPrompt,
      model: input.model,
      maxTokens: 10240,
    })) {
      if (chunk.type === 'text') {
        fullContent += chunk.text
        onChunk(chunk.text)
      } else if (chunk.type === 'done' && chunk.usage) {
        promptTokens = chunk.usage.promptTokens
        completionTokens = chunk.usage.completionTokens
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Synthesis request failed'
    return { output: null, error: message, fullPrompt }
  }

  const parsed = parseSynthesisResponse(fullContent)

  const output = await createSynthesizedOutput({
    projectId: session.projectId,
    brainstormSessionId: input.brainstormSessionId,
    title: session.title,
    content: fullContent,
    extractedSystems: parsed.extractedSystems,
    extractedSystemDetails: parsed.extractedSystemDetails,
    suggestedSystems: parsed.suggestedSystems?.length ? parsed.suggestedSystems : undefined,
    suggestedSystemDetails:
      parsed.suggestedSystemDetails?.length ? parsed.suggestedSystemDetails : undefined,
    aiProvider: input.providerId,
    aiModel: input.model ?? undefined,
    promptTokens: promptTokens || undefined,
    completionTokens: completionTokens || undefined,
  })

  await createContextSnapshot({
    projectId: session.projectId,
    trigger: 'synthesis',
    relatedSynthesisOutputId: output.id,
    relatedBrainstormSessionId: input.brainstormSessionId,
  })

  await generateExport(session.projectId, 'gdd', 'markdown', {
    synthesizedOutputId: output.id,
  }).catch(() => {})

  return { output, error: null, fullPrompt }
}
