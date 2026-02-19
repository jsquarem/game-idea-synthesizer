import { prisma } from '@/lib/db'
import type { Export } from '@prisma/client'
import type { PaginationParams, PaginatedResult } from './types'

export type CreateExportInput = {
  projectId: string
  exportType: string
  format?: string
  content: string
  metadata?: object
  synthesizedOutputId?: string
}

export type UpdateExportInput = {
  content?: string
  metadata?: object
  markedUpToDateAt?: Date | null
}

const DEFAULT_PAGE_SIZE = 20

export async function createExport(data: CreateExportInput): Promise<Export> {
  return prisma.export.create({
    data: {
      projectId: data.projectId,
      exportType: data.exportType,
      format: data.format ?? 'markdown',
      content: data.content,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      synthesizedOutputId: data.synthesizedOutputId ?? undefined,
    },
  })
}

export async function updateExport(
  id: string,
  data: UpdateExportInput
): Promise<Export> {
  const update: { content?: string; metadata?: string; markedUpToDateAt?: Date | null } = {}
  if (data.content !== undefined) update.content = data.content
  if (data.metadata !== undefined) update.metadata = JSON.stringify(data.metadata)
  if (data.markedUpToDateAt !== undefined) update.markedUpToDateAt = data.markedUpToDateAt
  return prisma.export.update({ where: { id }, data: update })
}

export async function getExportById(id: string): Promise<Export> {
  return prisma.export.findUniqueOrThrow({ where: { id } })
}

export async function findExportById(id: string): Promise<Export | null> {
  return prisma.export.findUnique({ where: { id } })
}

export async function listExportsByProject(
  projectId: string,
  pagination?: PaginationParams
): Promise<PaginatedResult<Export>> {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.export.findMany({
      where: { projectId },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.export.count({ where: { projectId } }),
  ])

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function deleteExport(id: string): Promise<void> {
  await prisma.export.delete({ where: { id } })
}
