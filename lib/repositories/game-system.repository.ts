import { prisma } from '@/lib/db'
import type { GameSystem, ChangeLog, Dependency } from '@prisma/client'
import type { PaginatedResult, PaginationParams } from './types'

export type CreateGameSystemInput = {
  projectId: string
  synthesizedOutputId?: string
  systemSlug: string
  name: string
  version?: string
  status?: string
  purpose?: string
  currentState?: string
  targetState?: string
  coreMechanics?: string
  inputs?: string
  outputs?: string
  failureStates?: string
  scalingBehavior?: string
  mvpCriticality?: string
  implementationNotes?: string
  openQuestions?: string
  markdownContent?: string
}

export type UpdateGameSystemInput = Partial<
  Omit<CreateGameSystemInput, 'projectId' | 'systemSlug'>
>

export type GameSystemFilter = {
  projectId: string
  status?: string
  mvpCriticality?: string
  search?: string
}

export type GameSystemWithRelations = GameSystem & {
  dependsOn: (Dependency & { targetSystem: GameSystem })[]
  dependedOnBy: (Dependency & { sourceSystem: GameSystem })[]
  changeLogs: ChangeLog[]
}

const DEFAULT_PAGE_SIZE = 20

export async function createGameSystem(data: CreateGameSystemInput): Promise<GameSystem> {
  return prisma.gameSystem.create({ data })
}

export async function getGameSystemById(id: string): Promise<GameSystem> {
  return prisma.gameSystem.findUniqueOrThrow({ where: { id } })
}

export async function findGameSystemById(id: string): Promise<GameSystem | null> {
  return prisma.gameSystem.findUnique({ where: { id } })
}

export async function getGameSystemBySlug(
  projectId: string,
  systemSlug: string
): Promise<GameSystem | null> {
  return prisma.gameSystem.findUnique({
    where: { projectId_systemSlug: { projectId, systemSlug } },
  })
}

export async function listGameSystems(
  filter: GameSystemFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<GameSystem>> {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE
  const skip = (page - 1) * pageSize

  const where: {
    projectId: string
    status?: string
    mvpCriticality?: string
    OR?: { name?: { contains: string }; systemSlug?: { contains: string }; purpose?: { contains: string } }[]
  } = { projectId: filter.projectId }
  if (filter.status) where.status = filter.status
  if (filter.mvpCriticality) where.mvpCriticality = filter.mvpCriticality
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search } },
      { systemSlug: { contains: filter.search } },
      { purpose: { contains: filter.search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.gameSystem.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
      include: { _count: { select: { dependsOn: true } } },
    }),
    prisma.gameSystem.count({ where }),
  ])

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function getAllGameSystems(projectId: string): Promise<GameSystem[]> {
  return prisma.gameSystem.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
  })
}

export async function updateGameSystem(
  id: string,
  data: UpdateGameSystemInput
): Promise<GameSystem> {
  return prisma.gameSystem.update({ where: { id }, data })
}

export async function deleteGameSystem(id: string): Promise<void> {
  await prisma.gameSystem.delete({ where: { id } })
}

export async function getGameSystemFull(id: string): Promise<GameSystemWithRelations> {
  return prisma.gameSystem.findUniqueOrThrow({
    where: { id },
    include: {
      dependsOn: { include: { targetSystem: true } },
      dependedOnBy: { include: { sourceSystem: true } },
      changeLogs: true,
    },
  })
}

export async function createGameSystemsBatch(
  systems: CreateGameSystemInput[]
): Promise<GameSystem[]> {
  return prisma.$transaction(systems.map((data) => prisma.gameSystem.create({ data })))
}

export async function createChangeLog(data: {
  gameSystemId: string
  version: string
  summary: string
  details?: string
  changeType?: string
  author?: string
}): Promise<ChangeLog> {
  return prisma.changeLog.create({
    data: {
      gameSystemId: data.gameSystemId,
      version: data.version,
      summary: data.summary,
      details: data.details,
      changeType: data.changeType ?? 'update',
      author: data.author,
    },
  })
}

export async function listChangeLogs(gameSystemId: string): Promise<ChangeLog[]> {
  return prisma.changeLog.findMany({
    where: { gameSystemId },
    orderBy: { createdAt: 'desc' },
  })
}
