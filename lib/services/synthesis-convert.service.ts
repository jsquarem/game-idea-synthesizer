import type { GameSystem, Dependency } from '@prisma/client'
import { getSynthesizedOutputById } from '@/lib/repositories/synthesized-output.repository'
import { createGameSystem, getGameSystemBySlug, findGameSystemById, getAllGameSystems } from '@/lib/repositories/game-system.repository'
import { createManySystemDetails } from '@/lib/repositories/system-detail.repository'
import { listDependenciesByProject } from '@/lib/repositories/dependency.repository'
import { addDependency } from '@/lib/services/dependency.service'
import type { ExtractedSystemStub, ExtractedSystemDetailStub } from '@/lib/ai/parse-synthesis-response'

export type CandidateSelection = {
  candidateIndex: number
  action: 'create' | 'merge' | 'discard'
  slug?: string
  existingSystemId?: string
  detailIndices: number[]
}

export type ConvertSynthesisInput = {
  outputId: string
  selections: CandidateSelection[]
  dependencyEdges: { sourceSlug: string; targetSlug: string; description?: string }[]
}

export type ConvertSynthesisResult = {
  success: boolean
  error?: string
  createdSystems?: GameSystem[]
  createdDependencies?: Dependency[]
  cycleError?: string
  cycleEdge?: { sourceSlug: string; targetSlug: string }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Suggest a unique slug for a new system (e.g. combat -> combat-2 if combat exists).
 */
export async function suggestSlugForNewSystem(
  projectId: string,
  baseSlug: string
): Promise<string> {
  const existing = await getGameSystemBySlug(projectId, baseSlug)
  if (!existing) return baseSlug
  let n = 2
  while (await getGameSystemBySlug(projectId, `${baseSlug}-${n}`)) n++
  return `${baseSlug}-${n}`
}

/**
 * Convert synthesis output to GameSystems, SystemDetails, and Dependencies.
 * Cycles are allowed (natural for systems interaction flow).
 */
export async function convertSynthesisToSystems(
  input: ConvertSynthesisInput
): Promise<ConvertSynthesisResult> {
  const output = await getSynthesizedOutputById(input.outputId)
  const extractedSystems = JSON.parse(output.extractedSystems || '[]') as ExtractedSystemStub[]
  const extractedSystemDetails = JSON.parse(
    output.extractedSystemDetails || '[]'
  ) as ExtractedSystemDetailStub[]
  const projectId = output.projectId

  const slugToId = new Map<string, string>()
  const existingSystems = await getAllGameSystems(projectId)
  for (const s of existingSystems) slugToId.set(s.systemSlug, s.id)

  const createdSystems: GameSystem[] = []
  const createdDependencies: Dependency[] = []

  for (const sel of input.selections) {
    if (sel.action === 'discard') continue

    const stub = extractedSystems[sel.candidateIndex]
    if (!stub) continue

    const slug =
      sel.action === 'create'
        ? (sel.slug ?? stub.systemSlug ?? slugify(stub.name ?? 'system'))
        : undefined
    let gameSystemId: string

    if (sel.action === 'create') {
      const finalSlug =
        slug && (await getGameSystemBySlug(projectId, slug))
          ? await suggestSlugForNewSystem(projectId, slug)
          : slug ?? (await suggestSlugForNewSystem(projectId, slugify(stub.name ?? 'system')))
      const system = await createGameSystem({
        projectId,
        synthesizedOutputId: output.id,
        systemSlug: finalSlug,
        name: stub.name ?? finalSlug,
        purpose: stub.purpose ?? undefined,
        version: stub.version ?? 'v0.1',
        mvpCriticality: stub.mvpCriticality ?? 'important',
      })
      createdSystems.push(system)
      gameSystemId = system.id
      slugToId.set(system.systemSlug, system.id)
    } else {
      if (!sel.existingSystemId) continue
      const existing = await findGameSystemById(sel.existingSystemId)
      if (!existing || existing.projectId !== projectId) continue
      gameSystemId = sel.existingSystemId
      slugToId.set(existing.systemSlug, existing.id)
    }

    const detailInputs = sel.detailIndices
      .map((i) => extractedSystemDetails[i])
      .filter(Boolean)
      .map((b) => ({
        gameSystemId,
        name: b.name ?? 'System detail',
        detailType: b.detailType ?? 'mechanic',
        spec: b.spec ?? '',
        synthesizedOutputId: output.id,
      }))
    if (detailInputs.length > 0) {
      await createManySystemDetails(detailInputs)
    }
  }

  for (const edge of input.dependencyEdges) {
    const sourceId = slugToId.get(edge.sourceSlug)
    const targetId = slugToId.get(edge.targetSlug)
    if (!sourceId || !targetId) continue
    const result = await addDependency(
      sourceId,
      targetId,
      undefined,
      edge.description ?? null
    )
    if (result.success && result.data) createdDependencies.push(result.data)
  }

  return {
    success: true,
    createdSystems,
    createdDependencies,
  }
}
