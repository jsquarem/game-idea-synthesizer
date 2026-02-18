import { prisma } from '@/lib/db'
import type { BrainstormSession, SynthesizedOutput } from '@prisma/client'
import type { PaginatedResult, PaginationParams } from './types'

export type CreateBrainstormInput = {
  projectId: string
  title: string
  source?: string
  content: string
  author?: string
  tags?: string[]
  sourceThreadIds?: string[]
}

export type BrainstormFilter = {
  projectId: string
  source?: string
  search?: string
}

const DEFAULT_PAGE_SIZE = 20

export async function createBrainstorm(data: CreateBrainstormInput): Promise<BrainstormSession> {
  const tagsStr = data.tags ? JSON.stringify(data.tags) : null
  const sourceThreadIdsStr = data.sourceThreadIds
    ? JSON.stringify(data.sourceThreadIds)
    : null
  return prisma.brainstormSession.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      source: data.source ?? 'manual',
      content: data.content,
      author: data.author,
      tags: tagsStr,
      sourceThreadIds: sourceThreadIdsStr,
    },
  })
}

export async function getBrainstormById(id: string): Promise<BrainstormSession> {
  return prisma.brainstormSession.findUniqueOrThrow({ where: { id } })
}

export async function findBrainstormById(id: string): Promise<BrainstormSession | null> {
  return prisma.brainstormSession.findUnique({ where: { id } })
}

export async function listBrainstorms(
  filter: BrainstormFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<BrainstormSession>> {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE
  const skip = (page - 1) * pageSize

  const where: { projectId: string; source?: string; OR?: { title?: { contains: string }; content?: { contains: string } }[] } = {
    projectId: filter.projectId,
  }
  if (filter.source) where.source = filter.source
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search } },
      { content: { contains: filter.search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.brainstormSession.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.brainstormSession.count({ where }),
  ])

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function deleteBrainstorm(id: string): Promise<void> {
  await prisma.brainstormSession.delete({ where: { id } })
}

export async function getBrainstormWithOutputs(id: string): Promise<
  BrainstormSession & { synthesizedOutputs: SynthesizedOutput[] }
> {
  return prisma.brainstormSession.findUniqueOrThrow({
    where: { id },
    include: { synthesizedOutputs: true },
  })
}
