import { prisma } from '@/lib/db'
import type { Project } from '@prisma/client'
import type { PaginatedResult, PaginationParams } from './types'

export type CreateProjectInput = {
  name: string
  description?: string
  genre?: string
  platform?: string
  status?: string
}

export type UpdateProjectInput = Partial<CreateProjectInput>

export type ProjectFilter = {
  status?: string
  search?: string
}

const DEFAULT_PAGE_SIZE = 20

export async function createProject(data: CreateProjectInput): Promise<Project> {
  return prisma.project.create({ data })
}

export async function getProjectById(id: string): Promise<Project> {
  return prisma.project.findUniqueOrThrow({ where: { id } })
}

export async function findProjectById(id: string): Promise<Project | null> {
  return prisma.project.findUnique({ where: { id } })
}

export async function listProjects(
  filter?: ProjectFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<Project>> {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE
  const skip = (page - 1) * pageSize

  const where: { status?: string; OR?: { name?: { contains: string }; description?: { contains: string } }[] } = {}
  if (filter?.status) where.status = filter.status
  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search } },
      { description: { contains: filter.search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.project.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.project.count({ where }),
  ])

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
  return prisma.project.update({ where: { id }, data })
}

export async function deleteProject(id: string): Promise<void> {
  await prisma.project.delete({ where: { id } })
}

export async function getProjectSummary(id: string) {
  return prisma.project.findUniqueOrThrow({
    where: { id },
    include: {
      _count: {
        select: {
          brainstorms: true,
          gameSystems: true,
          versionPlans: true,
          synthesizedOutputs: true,
        },
      },
    },
  })
}
