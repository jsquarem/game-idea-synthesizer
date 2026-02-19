import { prisma } from '@/lib/db'
import type { SynthesizedOutput, GameSystem } from '@prisma/client'
import type { PaginatedResult, PaginationParams } from './types'

export type CreateSynthesizedOutputInput = {
  projectId: string
  brainstormSessionId: string
  title: string
  content: string
  extractedSystems: object[]
  extractedSystemDetails?: object[]
  suggestedSystems?: object[]
  suggestedSystemDetails?: object[]
  aiProvider?: string
  aiModel?: string
  promptTokens?: number
  completionTokens?: number
}

export type UpdateSynthesizedOutputInput = {
  status?: string
  content?: string
  extractedSystems?: object[]
  extractedSystemDetails?: object[]
  suggestedSystems?: object[]
  suggestedSystemDetails?: object[]
}

export async function createSynthesizedOutput(
  data: CreateSynthesizedOutputInput
): Promise<SynthesizedOutput> {
  return prisma.synthesizedOutput.create({
    data: {
      projectId: data.projectId,
      brainstormSessionId: data.brainstormSessionId,
      title: data.title,
      content: data.content,
      extractedSystems: JSON.stringify(data.extractedSystems),
      extractedSystemDetails: data.extractedSystemDetails
        ? JSON.stringify(data.extractedSystemDetails)
        : undefined,
      suggestedSystems: data.suggestedSystems
        ? JSON.stringify(data.suggestedSystems)
        : undefined,
      suggestedSystemDetails: data.suggestedSystemDetails
        ? JSON.stringify(data.suggestedSystemDetails)
        : undefined,
      aiProvider: data.aiProvider,
      aiModel: data.aiModel,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
    },
  })
}

export async function getSynthesizedOutputById(id: string): Promise<SynthesizedOutput> {
  return prisma.synthesizedOutput.findUniqueOrThrow({ where: { id } })
}

export async function findSynthesizedOutputById(id: string): Promise<SynthesizedOutput | null> {
  return prisma.synthesizedOutput.findUnique({ where: { id } })
}

export async function listSynthesizedOutputs(
  projectId: string,
  pagination?: PaginationParams
): Promise<PaginatedResult<SynthesizedOutput>> {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.synthesizedOutput.findMany({
      where: { projectId },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.synthesizedOutput.count({ where: { projectId } }),
  ])

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function listOutputsByBrainstorm(
  brainstormSessionId: string
): Promise<SynthesizedOutput[]> {
  return prisma.synthesizedOutput.findMany({
    where: { brainstormSessionId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateSynthesizedOutput(
  id: string,
  data: UpdateSynthesizedOutputInput
): Promise<SynthesizedOutput> {
  const update: {
    status?: string
    content?: string
    extractedSystems?: string
    extractedSystemDetails?: string
    suggestedSystems?: string
    suggestedSystemDetails?: string
  } = {}
  if (data.status !== undefined) update.status = data.status
  if (data.content !== undefined) update.content = data.content
  if (data.extractedSystems !== undefined)
    update.extractedSystems = JSON.stringify(data.extractedSystems)
  if (data.extractedSystemDetails !== undefined)
    update.extractedSystemDetails = JSON.stringify(data.extractedSystemDetails)
  if (data.suggestedSystems !== undefined)
    update.suggestedSystems = JSON.stringify(data.suggestedSystems)
  if (data.suggestedSystemDetails !== undefined)
    update.suggestedSystemDetails = JSON.stringify(data.suggestedSystemDetails)
  return prisma.synthesizedOutput.update({ where: { id }, data: update })
}

export async function deleteSynthesizedOutput(id: string): Promise<void> {
  await prisma.synthesizedOutput.delete({ where: { id } })
}

export async function getOutputWithSystems(id: string): Promise<
  SynthesizedOutput & { gameSystems: GameSystem[] }
> {
  return prisma.synthesizedOutput.findUniqueOrThrow({
    where: { id },
    include: { gameSystems: true },
  })
}
