import { prisma } from '@/lib/db'
import type { PromptHistory } from '@prisma/client'
import type { PaginatedResult, PaginationParams } from './types'

export type CreatePromptHistoryInput = {
  projectId: string
  gameSystemId?: string
  versionPlanId?: string
  promptType: string
  promptTemplate: string
  promptInput: string
  promptContext?: object
  response?: string
  aiProvider: string
  aiModel: string
  promptTokens?: number
  completionTokens?: number
  durationMs?: number
  status?: string
  error?: string
}

export type UpdatePromptHistoryInput = {
  response?: string
  promptTokens?: number
  completionTokens?: number
  durationMs?: number
  status?: string
  error?: string
}

export type PromptHistoryFilter = {
  projectId: string
  gameSystemId?: string
  promptType?: string
}

const DEFAULT_PAGE_SIZE = 20

export async function createPromptHistory(
  data: CreatePromptHistoryInput
): Promise<PromptHistory> {
  return prisma.promptHistory.create({
    data: {
      projectId: data.projectId,
      gameSystemId: data.gameSystemId,
      versionPlanId: data.versionPlanId,
      promptType: data.promptType,
      promptTemplate: data.promptTemplate,
      promptInput: data.promptInput,
      promptContext: data.promptContext ? JSON.stringify(data.promptContext) : null,
      response: data.response,
      aiProvider: data.aiProvider,
      aiModel: data.aiModel,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      durationMs: data.durationMs,
      status: data.status ?? 'completed',
      error: data.error,
    },
  })
}

export async function getPromptHistoryById(id: string): Promise<PromptHistory> {
  return prisma.promptHistory.findUniqueOrThrow({ where: { id } })
}

export async function updatePromptHistory(
  id: string,
  data: UpdatePromptHistoryInput
): Promise<PromptHistory> {
  return prisma.promptHistory.update({ where: { id }, data })
}

export async function listPromptHistory(
  filter: PromptHistoryFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<PromptHistory>> {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE
  const skip = (page - 1) * pageSize

  const where: { projectId: string; gameSystemId?: string; promptType?: string } = {
    projectId: filter.projectId,
  }
  if (filter.gameSystemId) where.gameSystemId = filter.gameSystemId
  if (filter.promptType) where.promptType = filter.promptType

  const [data, total] = await Promise.all([
    prisma.promptHistory.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.promptHistory.count({ where }),
  ])

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function listPromptHistoryForSystem(
  gameSystemId: string
): Promise<PromptHistory[]> {
  return prisma.promptHistory.findMany({
    where: { gameSystemId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function deletePromptHistory(id: string): Promise<void> {
  await prisma.promptHistory.delete({ where: { id } })
}
