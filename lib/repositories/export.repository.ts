import { prisma } from '@/lib/db'
import type { Export } from '@prisma/client'
import type { PaginationParams, PaginatedResult } from './types'

export type CreateExportInput = {
  projectId: string
  exportType: string
  format?: string
  content: string
  metadata?: object
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
    },
  })
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
