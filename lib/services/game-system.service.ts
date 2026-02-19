import type { GameSystem, SystemDetail } from '@prisma/client'
import type { ServiceResult } from './types'
import type { PaginatedResult, PaginationParams } from '../repositories/types'
import type {
  GameSystemWithRelations,
  CreateGameSystemInput,
  UpdateGameSystemInput,
  GameSystemFilter,
  GameSystemListItemWithDetails,
} from '../repositories/game-system.repository'
import {
  createGameSystem,
  getGameSystemById,
  findGameSystemById,
  getGameSystemBySlug,
  listGameSystems as listGameSystemsRepo,
  listGameSystemsWithDetails as listGameSystemsWithDetailsRepo,
  updateGameSystem,
  deleteGameSystem as deleteGameSystemRepo,
  getGameSystemFull,
  createChangeLog,
  listChangeLogs,
} from '../repositories/game-system.repository'
import { findProjectById } from '../repositories/project.repository'
import { createManySystemDetails } from '../repositories/system-detail.repository'
import { parseSystemMarkdown, renderSystemMarkdown } from '../parsers/system-parser'
import type { GameSystemData } from '../parsers/system-parser.types'
import { deriveSectionsFromSystemDetails } from './system-detail-roll-up.service'

export async function createSystem(
  input: CreateGameSystemInput
): Promise<ServiceResult<GameSystem>> {
  const project = await findProjectById(input.projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  const existing = await getGameSystemBySlug(input.projectId, input.systemSlug)
  if (existing) return { success: false, error: 'A system with this slug already exists', code: 'CONFLICT' }
  try {
    const system = await createGameSystem(input)
    const data = systemToData(system)
    const rendered = renderSystemMarkdown(data)
    await updateGameSystem(system.id, { markdownContent: rendered })
    const updated = await getGameSystemById(system.id)
    await createChangeLog({
      gameSystemId: updated.id,
      version: updated.version,
      summary: 'System created',
      changeType: 'create',
    })
    return { success: true, data: updated }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create system',
      code: 'INTERNAL',
    }
  }
}

export async function getSystem(id: string): Promise<ServiceResult<GameSystemWithRelations>> {
  try {
    const system = await getGameSystemFull(id)
    return { success: true, data: system }
  } catch {
    return { success: false, error: 'System not found', code: 'NOT_FOUND' }
  }
}

export async function getSystemBySlug(
  projectId: string,
  slug: string
): Promise<ServiceResult<GameSystem>> {
  const system = await getGameSystemBySlug(projectId, slug)
  if (!system) return { success: false, error: 'System not found', code: 'NOT_FOUND' }
  return { success: true, data: system }
}

export async function listSystems(
  filter: GameSystemFilter,
  pagination?: PaginationParams
): Promise<ServiceResult<PaginatedResult<GameSystem>>> {
  const project = await findProjectById(filter.projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const result = await listGameSystemsRepo(filter, pagination)
    return { success: true, data: result }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list systems',
      code: 'INTERNAL',
    }
  }
}

export async function listSystemsWithDetails(
  filter: GameSystemFilter,
  pagination?: PaginationParams
): Promise<ServiceResult<PaginatedResult<GameSystemListItemWithDetails>>> {
  const project = await findProjectById(filter.projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const result = await listGameSystemsWithDetailsRepo(filter, pagination)
    return { success: true, data: result }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list systems',
      code: 'INTERNAL',
    }
  }
}

export async function updateSystem(
  id: string,
  input: UpdateGameSystemInput,
  changeSummary: string
): Promise<ServiceResult<GameSystem>> {
  const existing = await findGameSystemById(id)
  if (!existing) return { success: false, error: 'System not found', code: 'NOT_FOUND' }
  try {
    const updated = await updateGameSystem(id, input)
    await createChangeLog({
      gameSystemId: id,
      version: updated.version,
      summary: changeSummary,
      changeType: 'update',
    })
    return { success: true, data: updated }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to update system',
      code: 'INTERNAL',
    }
  }
}

export async function deleteSystem(id: string): Promise<ServiceResult<void>> {
  const existing = await findGameSystemById(id)
  if (!existing) return { success: false, error: 'System not found', code: 'NOT_FOUND' }
  try {
    await deleteGameSystemRepo(id)
    return { success: true, data: undefined }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to delete system',
      code: 'INTERNAL',
    }
  }
}

export function systemToData(
  system: GameSystem,
  systemDetails?: SystemDetail[]
): GameSystemData {
  const changeLog = system.markdownContent
    ? (() => {
        const parsed = parseSystemMarkdown(system.markdownContent!)
        return parsed.ok ? parsed.data.changeLog : []
      })()
    : []
  const derived = systemDetails?.length
    ? deriveSectionsFromSystemDetails(systemDetails)
    : null
  return {
    name: system.name,
    systemSlug: system.systemSlug,
    version: system.version,
    status: system.status,
    purpose: derived ? derived.purpose : (system.purpose ?? ''),
    currentState: system.currentState ?? '',
    targetState: system.targetState ?? '',
    coreMechanics: derived ? derived.coreMechanics : (system.coreMechanics ?? ''),
    inputs: derived ? derived.inputs : (system.inputs ?? ''),
    outputs: derived ? derived.outputs : (system.outputs ?? ''),
    dependencies: [],
    dependedOnBy: [],
    failureStates: system.failureStates ?? '',
    scalingBehavior: system.scalingBehavior ?? '',
    mvpCriticality: system.mvpCriticality,
    implementationNotes: derived ? derived.implementationNotes : (system.implementationNotes ?? ''),
    openQuestions: system.openQuestions ?? '',
    changeLog,
    ...(derived?.content ? { content: derived.content } : {}),
    ...(systemDetails?.length
      ? {
          systemDetails: systemDetails.map((b) => ({
            name: b.name,
            detailType: b.detailType,
            spec: b.spec,
          })),
        }
      : {}),
  }
}

export async function renderSystemMarkdownForId(id: string): Promise<ServiceResult<string>> {
  const system = await getGameSystemFull(id).catch(() => null)
  if (!system) return { success: false, error: 'System not found', code: 'NOT_FOUND' }
  const data = systemToData(system, system.systemDetails)
  return { success: true, data: renderSystemMarkdown(data) }
}

export async function importSystemFromMarkdown(
  projectId: string,
  markdown: string
): Promise<ServiceResult<GameSystem>> {
  const project = await findProjectById(projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  const parsed = parseSystemMarkdown(markdown)
  if (!parsed.ok) return { success: false, error: parsed.error, code: 'VALIDATION' }
  const { data } = parsed
  const existing = await getGameSystemBySlug(projectId, data.systemSlug)
  if (existing) return { success: false, error: 'A system with this slug already exists', code: 'CONFLICT' }
  const rendered = renderSystemMarkdown(data)
  const input: CreateGameSystemInput = {
    projectId,
    systemSlug: data.systemSlug,
    name: data.name,
    version: data.version,
    status: data.status,
    purpose: data.purpose || undefined,
    currentState: data.currentState || undefined,
    targetState: data.targetState || undefined,
    coreMechanics: data.coreMechanics || undefined,
    inputs: data.inputs || undefined,
    outputs: data.outputs || undefined,
    failureStates: data.failureStates || undefined,
    scalingBehavior: data.scalingBehavior || undefined,
    mvpCriticality: data.mvpCriticality,
    implementationNotes: data.implementationNotes || undefined,
    openQuestions: data.openQuestions || undefined,
    markdownContent: rendered,
  }
  const result = await createSystem(input)
  if (result.success && result.data && data.systemDetails?.length) {
    await createManySystemDetails(
      data.systemDetails.map((b, i) => ({
        gameSystemId: result.data!.id,
        name: b.name,
        detailType: b.detailType,
        spec: b.spec,
        sortOrder: i,
      }))
    )
  }
  return result
}

export async function getChangeLogs(systemId: string) {
  const system = await findGameSystemById(systemId)
  if (!system) return { success: false as const, error: 'System not found', code: 'NOT_FOUND' as const }
  const logs = await listChangeLogs(systemId)
  return { success: true as const, data: logs }
}
