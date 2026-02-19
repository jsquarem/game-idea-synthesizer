import type { ExtractedSystemStub, ExtractedSystemDetailStub } from '@/lib/ai/parse-synthesis-response'
import { findSynthesizedOutputById } from '@/lib/repositories/synthesized-output.repository'
import { getProjectById } from '@/lib/repositories/project.repository'
import { getOrCreateDefaultWorkspace } from '@/lib/repositories/workspace.repository'
import { updateSynthesizedOutput } from '@/lib/repositories/synthesized-output.repository'
import { appendMessage } from '@/lib/repositories/synthesis-conversation.repository'
import { getLatestSnapshot } from '@/lib/services/context-snapshot.service'
import { runCompletion } from '@/lib/ai/run-completion'
import { parseSynthesisResponse } from '@/lib/ai/parse-synthesis-response'

const SNAPSHOT_SUMMARY_MAX_LEN = 800

const MAX_HISTORY_PAIRS = 6
const REFINE_MAX_TOKENS = 4096
const PURPOSE_MAX_LEN = 200
const SPEC_SNIPPET_LEN = 150

export type RefineScope = {
  includeOtherSystems?: boolean
  includeSnapshot?: boolean
}

export type RefineInput = {
  outputId: string
  providerId: string
  model?: string
  userMessage: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  extractedSystems: ExtractedSystemStub[]
  extractedSystemDetails: ExtractedSystemDetailStub[]
  scope?: RefineScope
  focusedSystemSlug?: string
  focusedSystemSlugs?: string[]
}

export type RefineResult = {
  success: true
  extractedSystems: ExtractedSystemStub[]
  extractedSystemDetails: ExtractedSystemDetailStub[]
  rawContent: string
} | {
  success: false
  error: string
}

function compactSystem(s: ExtractedSystemStub): Record<string, unknown> {
  const purpose =
    typeof s.purpose === 'string' && s.purpose.length > PURPOSE_MAX_LEN
      ? s.purpose.slice(0, PURPOSE_MAX_LEN) + '...'
      : s.purpose
  return {
    name: s.name,
    systemSlug: s.systemSlug,
    purpose,
    version: s.version,
    mvpCriticality: s.mvpCriticality,
    dependencies: s.dependencies,
  }
}

function compactSystemDetail(b: ExtractedSystemDetailStub): Record<string, unknown> {
  const spec =
    typeof b.spec === 'string' && b.spec.length > SPEC_SNIPPET_LEN
      ? b.spec.slice(0, SPEC_SNIPPET_LEN) + '...'
      : b.spec
  return {
    name: b.name,
    detailType: b.detailType,
    spec,
    targetSystemSlug: b.targetSystemSlug ?? b.systemSlug,
  }
}

function buildCompactExtraction(
  systems: ExtractedSystemStub[],
  systemDetails: ExtractedSystemDetailStub[]
): string {
  const compactSystems = systems.map(compactSystem)
  const compactDetails = systemDetails.map(compactSystemDetail)
  return JSON.stringify(
    { extractedSystems: compactSystems, extractedSystemDetails: compactDetails },
    null,
    2
  )
}

const REFINE_SYSTEM_PROMPT = `You are helping refine a set of extracted game systems and their system details from a brainstorm. The user will provide the current extraction (as JSON) and their request. You must respond with a single JSON object containing the updated extraction in this exact shape—no other text or markdown around it:

{"extractedSystems": [...], "extractedSystemDetails": [...]}

Rules:
- extractedSystems: array of objects with name, systemSlug, purpose, version (optional), mvpCriticality (optional), dependencies (optional array of slugs).
- extractedSystemDetails: array of objects with name, detailType, spec, targetSystemSlug or systemSlug (which system this detail belongs to).
- Preserve or add all fields the user expects. You may add, remove, or merge systems; add or edit system details; rename or re-slug systems.
- If the user asks to "merge" two systems, combine them into one system and attach both systems' details to the merged system.
- Return only the JSON object, no markdown code fence.`

export async function runRefine(input: RefineInput): Promise<RefineResult> {
  const output = await findSynthesizedOutputById(input.outputId)
  if (!output) return { success: false, error: 'Synthesis output not found' }

  const project = await getProjectById(output.projectId)
  const workspaceId =
    project.workspaceId ?? (await getOrCreateDefaultWorkspace()).id

  const historyPairs = input.messages.slice(-MAX_HISTORY_PAIRS * 2)
  const compactExtraction = buildCompactExtraction(
    input.extractedSystems,
    input.extractedSystemDetails
  )

  let extraContext = ''
  if (input.scope?.includeOtherSystems && input.extractedSystems.length > 0) {
    const otherSystems = input.focusedSystemSlug
      ? input.extractedSystems.filter(
          (s) => (s.systemSlug ?? s.name) !== input.focusedSystemSlug
        )
      : input.extractedSystems
    if (otherSystems.length > 0) {
      const otherCompact = otherSystems.map(compactSystem)
      extraContext +=
        '\nOther systems (for context):\n' +
        JSON.stringify(otherCompact, null, 2) +
        '\n\n'
    }
  }
  if (input.scope?.includeSnapshot) {
    const snapshot = await getLatestSnapshot(output.projectId)
    if (snapshot) {
      const summary =
        snapshot.content.length > SNAPSHOT_SUMMARY_MAX_LEN
          ? snapshot.content.slice(0, SNAPSHOT_SUMMARY_MAX_LEN) + '...'
          : snapshot.content
      extraContext +=
        `\nProject context snapshot (${snapshot.createdAt.toISOString()}):\n${summary}\n\n`
    } else {
      extraContext += '\nNo project context snapshot available.\n\n'
    }
  }

  let conversationBlock = ''
  if (historyPairs.length > 0) {
    conversationBlock =
      'Previous conversation:\n' +
      historyPairs
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n') +
      '\n\n'
  }

  const focusInstruction =
    input.focusedSystemSlugs && input.focusedSystemSlugs.length > 0
      ? `IMPORTANT: Refine ONLY the following systems (by slug): ${input.focusedSystemSlugs.join(', ')}. Preserve all other systems and their details unchanged in the output. Return the FULL extraction (all systems and all details) with only the specified systems modified.\n\n`
      : input.focusedSystemSlug
        ? `IMPORTANT: Focus on refining the system with slug: ${input.focusedSystemSlug}. Return the full extraction with your changes applied.\n\n`
        : ''

  const userBlock = `${extraContext}${focusInstruction}Current extraction (JSON):
${compactExtraction}

User request: ${input.userMessage}

Respond with only the updated JSON object (extractedSystems and extractedSystemDetails).`

  const fullPrompt = `${REFINE_SYSTEM_PROMPT}\n\n${conversationBlock}${userBlock}`

  const completion = await runCompletion({
    workspaceId,
    providerId: input.providerId,
    prompt: fullPrompt,
    model: input.model,
    maxTokens: REFINE_MAX_TOKENS,
  })

  if (!completion?.content) {
    return { success: false, error: 'No response from AI' }
  }

  const parsed = parseSynthesisResponse(completion.content)
  if (
    parsed.extractedSystems.length === 0 &&
    parsed.extractedSystemDetails.length === 0
  ) {
    return {
      success: false,
      error: 'AI response did not contain valid extracted systems or system details',
    }
  }

  await updateSynthesizedOutput(input.outputId, {
    extractedSystems: parsed.extractedSystems,
    extractedSystemDetails: parsed.extractedSystemDetails,
  })

  await appendMessage({
    synthesizedOutputId: input.outputId,
    role: 'user',
    content: input.userMessage,
  })
  await appendMessage({
    synthesizedOutputId: input.outputId,
    role: 'assistant',
    content: completion.content,
  })

  return {
    success: true,
    extractedSystems: parsed.extractedSystems,
    extractedSystemDetails: parsed.extractedSystemDetails,
    rawContent: completion.content,
  }
}
