import type { ExtractedSystemStub, ExtractedSystemDetailStub } from '@/lib/ai/parse-synthesis-response'
import { parseSynthesisResponse } from '@/lib/ai/parse-synthesis-response'
import { runCompletion } from '@/lib/ai/run-completion'
import { getProjectById } from '@/lib/repositories/project.repository'
import { getOrCreateDefaultWorkspace } from '@/lib/repositories/workspace.repository'
import { getGameSystemFull, updateGameSystem, createChangeLog } from '@/lib/repositories/game-system.repository'
import {
  deleteSystemDetailsByGameSystemId,
  createManySystemDetails,
} from '@/lib/repositories/system-detail.repository'
import {
  listMessagesByGameSystemId,
  appendMessage,
} from '@/lib/repositories/system-evolve.repository'

const MAX_HISTORY_PAIRS = 6
const EVOLVE_MAX_TOKENS = 4096
const PURPOSE_MAX_LEN = 300
const SPEC_SNIPPET_LEN = 200

export type SystemEvolveInput = {
  systemId: string
  providerId: string
  model?: string
  userMessage: string
  messages?: { role: 'user' | 'assistant'; content: string }[]
}

export type SystemEvolveResult =
  | {
      success: true
      system: Awaited<ReturnType<typeof getGameSystemFull>>
      rawContent: string
    }
  | { success: false; error: string }

function compactSystemForPrompt(s: {
  name: string
  systemSlug: string
  purpose?: string | null
  version?: string | null
  status?: string | null
  mvpCriticality?: string | null
}): Record<string, unknown> {
  const purpose =
    typeof s.purpose === 'string' && s.purpose.length > PURPOSE_MAX_LEN
      ? s.purpose.slice(0, PURPOSE_MAX_LEN) + '...'
      : s.purpose ?? ''
  return {
    name: s.name,
    systemSlug: s.systemSlug,
    purpose,
    version: s.version ?? 'v0.1',
    status: s.status ?? 'draft',
    mvpCriticality: s.mvpCriticality ?? 'important',
  }
}

function compactDetailForPrompt(d: { name: string; detailType: string; spec: string }): Record<string, unknown> {
  const spec =
    typeof d.spec === 'string' && d.spec.length > SPEC_SNIPPET_LEN
      ? d.spec.slice(0, SPEC_SNIPPET_LEN) + '...'
      : d.spec
  return { name: d.name, detailType: d.detailType, spec }
}

const EVOLVE_SYSTEM_PROMPT = `You are helping evolve a single game system and its system details. The user will provide the current system (as JSON) and their request. You must respond with a single JSON object in this exact shape—no other text or markdown around it:

{"extractedSystems": [ {...single system...} ], "extractedSystemDetails": [ {...}, ... ]}

Rules:
- extractedSystems: array with exactly ONE object. Fields: name, systemSlug (must match the current system's systemSlug - do not change it), purpose, version (optional), status (optional), mvpCriticality (optional).
- extractedSystemDetails: array of objects with name, detailType, spec. These belong to the single system; do not include targetSystemSlug.
- You may update the system's name, purpose, status, mvpCriticality, version. You may add, remove, or edit system details.
- Return only the JSON object, no markdown code fence.`

export async function runSystemEvolve(input: SystemEvolveInput): Promise<SystemEvolveResult> {
  const system = await getGameSystemFull(input.systemId).catch(() => null)
  if (!system) return { success: false, error: 'System not found' }

  const project = await getProjectById(system.projectId)
  const workspaceId =
    project.workspaceId ?? (await getOrCreateDefaultWorkspace()).id

  const historyMessages = await listMessagesByGameSystemId(input.systemId)
  const historyPairs = (input.messages?.length
    ? input.messages
    : historyMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  ).slice(-MAX_HISTORY_PAIRS * 2)

  const currentSystemJson = compactSystemForPrompt(system)
  const currentDetailsJson = system.systemDetails.map((d) =>
    compactDetailForPrompt(d)
  )
  const currentState = JSON.stringify(
    {
      extractedSystems: [currentSystemJson],
      extractedSystemDetails: currentDetailsJson,
    },
    null,
    2
  )

  let conversationBlock = ''
  if (historyPairs.length > 0) {
    conversationBlock =
      'Previous conversation:\n' +
      historyPairs
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n') +
      '\n\n'
  }

  const userBlock = `Current system (JSON):
${currentState}

User request: ${input.userMessage}

Respond with only the updated JSON object (extractedSystems with one system, extractedSystemDetails array). Keep systemSlug as "${system.systemSlug}".`

  const fullPrompt = `${EVOLVE_SYSTEM_PROMPT}\n\n${conversationBlock}${userBlock}`

  const completion = await runCompletion({
    workspaceId,
    providerId: input.providerId,
    prompt: fullPrompt,
    model: input.model,
    maxTokens: EVOLVE_MAX_TOKENS,
  })

  if (!completion?.content) {
    return { success: false, error: 'No response from AI' }
  }

  const parsed = parseSynthesisResponse(completion.content)
  const updatedSystemStub = parsed.extractedSystems[0] as ExtractedSystemStub | undefined
  if (!updatedSystemStub) {
    return {
      success: false,
      error: 'AI response did not contain a valid system object',
    }
  }

  await updateGameSystem(input.systemId, {
    name: typeof updatedSystemStub.name === 'string' ? updatedSystemStub.name : system.name,
    purpose:
      typeof updatedSystemStub.purpose === 'string'
        ? updatedSystemStub.purpose
        : system.purpose ?? undefined,
    version:
      typeof updatedSystemStub.version === 'string'
        ? updatedSystemStub.version
        : system.version,
    status:
      typeof updatedSystemStub.status === 'string'
        ? updatedSystemStub.status
        : system.status,
    mvpCriticality:
      typeof updatedSystemStub.mvpCriticality === 'string'
        ? updatedSystemStub.mvpCriticality
        : system.mvpCriticality,
  })

  await deleteSystemDetailsByGameSystemId(input.systemId)
  const details = Array.isArray(parsed.extractedSystemDetails)
    ? (parsed.extractedSystemDetails as ExtractedSystemDetailStub[])
    : []
  if (details.length > 0) {
    await createManySystemDetails(
      details.map((d, i) => ({
        gameSystemId: input.systemId,
        name: typeof d.name === 'string' ? d.name : `Detail ${i + 1}`,
        detailType: typeof d.detailType === 'string' ? d.detailType : 'mechanic',
        spec: typeof d.spec === 'string' ? d.spec : '',
        sortOrder: i,
      }))
    )
  }

  const updated = await getGameSystemFull(input.systemId)
  await createChangeLog({
    gameSystemId: input.systemId,
    version: updated.version,
    summary: 'Evolved via AI',
    changeType: 'update',
  })

  await appendMessage({
    gameSystemId: input.systemId,
    role: 'user',
    content: input.userMessage,
  })
  await appendMessage({
    gameSystemId: input.systemId,
    role: 'assistant',
    content: completion.content,
  })

  return {
    success: true,
    system: updated,
    rawContent: completion.content,
  }
}
