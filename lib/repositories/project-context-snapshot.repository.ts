import { prisma } from '@/lib/db'
import type { ProjectContextSnapshot } from '@prisma/client'
import type { PaginatedResult, PaginationParams } from './types'

export type CreateProjectContextSnapshotInput = {
  projectId: string
  content: string
  contentVersion?: number
  trigger?: string
  relatedSynthesisOutputId?: string
  relatedBrainstormSessionId?: string
}

export async function createProjectContextSnapshot(
  data: CreateProjectContextSnapshotInput
): Promise<ProjectContextSnapshot> {
  return prisma.projectContextSnapshot.create({
    data: {
      projectId: data.projectId,
      content: data.content,
      contentVersion: data.contentVersion ?? 1,
      trigger: data.trigger ?? 'synthesis',
      relatedSynthesisOutputId: data.relatedSynthesisOutputId ?? undefined,
      relatedBrainstormSessionId: data.relatedBrainstormSessionId ?? undefined,
    },
  })
}

export async function getLatestByProjectId(
  projectId: string
): Promise<ProjectContextSnapshot | null> {
  return prisma.projectContextSnapshot.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listByProject(
  projectId: string,
  pagination?: PaginationParams
): Promise<PaginatedResult<ProjectContextSnapshot>> {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.projectContextSnapshot.findMany({
      where: { projectId },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.projectContextSnapshot.count({ where: { projectId } }),
  ])

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}
