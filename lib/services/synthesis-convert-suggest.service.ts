import { findSynthesizedOutputById } from '@/lib/repositories/synthesized-output.repository'
import { getProjectById } from '@/lib/repositories/project.repository'
import { getOrCreateDefaultWorkspace } from '@/lib/repositories/workspace.repository'
import { getAllGameSystems } from '@/lib/repositories/game-system.repository'
import { runCompletion } from '@/lib/ai/run-completion'
import type { ExtractedSystemStub } from '@/lib/ai/parse-synthesis-response'

const CONVERT_SUGGEST_MAX_TOKENS = 1536

export type ConvertSuggestInput = {
  outputId: string
  projectId: string
  providerId: string
  model?: string
}

export type ConvertSuggestion = {
  create: number[]
  merge: { candidateIndex: number; intoExistingSlug: string }[]
  discard: number[]
  dependencies: { sourceSlug: string; targetSlug: string }[]
  /** Optional short explanation of the overall suggestion (create/merge/discard/dependencies). */
  rationale?: string
}

export type ConvertSuggestResult = {
  success: true
  suggestion: ConvertSuggestion
  existingSystems: { id: string; systemSlug: string }[]
  userPrompt: string
  promptSummary: { candidateCount: number; existingCount: number }
} | {
  success: false
  error: string
}

const SYSTEM_PROMPT = `You suggest which synthesis candidates to create as new systems, merge into existing systems, or discard. Respond with only a single JSON object in this exact shape (no markdown). You may include an optional "rationale" string explaining your suggestions in one short paragraph.
{"create":[0,1],"merge":[{"candidateIndex":2,"intoExistingSlug":"combat"}],"discard":[3],"dependencies":[{"sourceSlug":"inventory","targetSlug":"combat"}],"rationale":"Optional: one short paragraph explaining why you suggested this create/merge/discard and these dependencies."}

Rules:
- create: array of candidate indices (0-based) to create as new game systems.
- merge: array of { candidateIndex, intoExistingSlug }; merge that candidate into the existing system with that slug.
- discard: array of candidate indices to not create and not merge (skip for this conversion; do not remove any existing systems).
- dependencies: optional array of { sourceSlug, targetSlug } for new systems (use candidate slugs or existing slugs).
- rationale: optional string — one short paragraph explaining your create/merge/discard and dependency choices.
- Every candidate index from 0 to N-1 must appear in exactly one of create, merge, or discard.
- intoExistingSlug must be one of the existing system slugs provided.`

export async function runConvertSuggest(
  input: ConvertSuggestInput
): Promise<ConvertSuggestResult> {
  const output = await findSynthesizedOutputById(input.outputId)
  if (!output || output.projectId !== input.projectId) {
    return { success: false, error: 'Synthesis output not found or project mismatch' }
  }

  const project = await getProjectById(input.projectId)
  const workspaceId =
    project.workspaceId ?? (await getOrCreateDefaultWorkspace()).id

  const extractedSystems = JSON.parse(
    output.extractedSystems || '[]'
  ) as ExtractedSystemStub[]
  const existingSystems = await getAllGameSystems(input.projectId)

  const candidatesText = extractedSystems
    .map(
      (s, i) =>
        `${i}: ${s.name ?? 'Unnamed'} (slug: ${s.systemSlug ?? 'none'}) — ${(s.purpose ?? '').slice(0, 80)}`
    )
    .join('\n')
  const existingText = existingSystems
    .map((s) => `- ${s.systemSlug}: ${s.name}`)
    .join('\n')

  const userPrompt = `Candidates (index, name, slug, purpose):
${candidatesText}

Existing project systems (slug: name):
${existingText || '(none)'}

Suggest create/merge/discard and optional dependencies. Include an optional "rationale" field (one short paragraph) explaining your choices. Respond with only the JSON object.`

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`

  const completion = await runCompletion({
    workspaceId,
    providerId: input.providerId,
    prompt: fullPrompt,
    model: input.model,
    maxTokens: CONVERT_SUGGEST_MAX_TOKENS,
  })

  if (!completion?.content) {
    return { success: false, error: 'No response from AI' }
  }

  const raw = completion.content.trim()
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  const jsonStr = jsonMatch ? jsonMatch[0] : raw
  let suggestion: ConvertSuggestion
  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>
    const rationale =
      typeof parsed.rationale === 'string' && parsed.rationale.trim()
        ? parsed.rationale.trim()
        : undefined
    suggestion = {
      create: Array.isArray(parsed.create) ? parsed.create : [],
      merge: Array.isArray(parsed.merge)
        ? parsed.merge.filter(
            (m): m is { candidateIndex: number; intoExistingSlug: string } =>
              typeof m === 'object' &&
              m !== null &&
              typeof (m as { candidateIndex?: unknown }).candidateIndex === 'number' &&
              typeof (m as { intoExistingSlug?: unknown }).intoExistingSlug === 'string'
          )
        : [],
      discard: Array.isArray(parsed.discard) ? parsed.discard : [],
      dependencies: Array.isArray(parsed.dependencies)
        ? parsed.dependencies.filter(
            (d): d is { sourceSlug: string; targetSlug: string } =>
              typeof d === 'object' &&
              d !== null &&
              typeof (d as { sourceSlug?: unknown }).sourceSlug === 'string' &&
              typeof (d as { targetSlug?: unknown }).targetSlug === 'string'
          )
        : [],
      rationale,
    }
  } catch {
    return { success: false, error: 'Invalid JSON in AI response' }
  }

  const existingSlugs = new Set(existingSystems.map((s) => s.systemSlug))
  for (const m of suggestion.merge) {
    if (!existingSlugs.has(m.intoExistingSlug)) {
      return {
        success: false,
        error: `Merge target slug "${m.intoExistingSlug}" is not an existing system`,
      }
    }
  }

  const allIndices = new Set<number>()
  for (const i of suggestion.create) allIndices.add(i)
  for (const m of suggestion.merge) allIndices.add(m.candidateIndex)
  for (const i of suggestion.discard) allIndices.add(i)
  for (let i = 0; i < extractedSystems.length; i++) {
    if (!allIndices.has(i)) {
      suggestion.discard.push(i)
      allIndices.add(i)
    }
  }

  return {
    success: true,
    suggestion,
    existingSystems: existingSystems.map((s) => ({
      id: s.id,
      systemSlug: s.systemSlug,
    })),
    userPrompt,
    promptSummary: {
      candidateCount: extractedSystems.length,
      existingCount: existingSystems.length,
    },
  }
}
