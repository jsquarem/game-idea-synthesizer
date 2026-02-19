import { prisma } from '@/lib/db'
import type { GameSystem, ChangeLog, Dependency, Prisma } from '@prisma/client'
import type { PaginatedResult, PaginationParams } from './types'

export type GameSystemWithRelations = Prisma.GameSystemGetPayload<{
  include: {
    dependsOn: { include: { targetSystem: true } }
    dependedOnBy: { include: { sourceSystem: true } }
    changeLogs: true
    systemDetails: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }
  }
}>

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

const buildListWhere = (filter: GameSystemFilter) => {
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
  return where
}

export type SystemDetailStub = {
  id: string
  name: string
  detailType: string
  spec: string
  sortOrder: number
}

export type GameSystemListItemWithDetails = GameSystem & {
  _count: { dependsOn: number }
  systemDetails: SystemDetailStub[]
}

export async function listGameSystems(
  filter: GameSystemFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<GameSystem>> {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE
  const skip = (page - 1) * pageSize
  const where = buildListWhere(filter)

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

export async function listGameSystemsWithDetails(
  filter: GameSystemFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<GameSystemListItemWithDetails>> {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE
  const skip = (page - 1) * pageSize
  const where = buildListWhere(filter)

  const [systems, total, allDetails] = await Promise.all([
    prisma.gameSystem.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
      include: { _count: { select: { dependsOn: true } } },
    }),
    prisma.gameSystem.count({ where }),
    prisma.gameSystem.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
      select: { id: true },
    }).then((ids) =>
      ids.length === 0
        ? []
        : prisma.systemDetail.findMany({
            where: { gameSystemId: { in: ids.map((s) => s.id) } },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            select: { gameSystemId: true, id: true, name: true, detailType: true, spec: true, sortOrder: true },
          })
    ),
  ])

  const detailsBySystemId = new Map<string, SystemDetailStub[]>()
  for (const d of allDetails) {
    const list = detailsBySystemId.get(d.gameSystemId) ?? []
    list.push({ id: d.id, name: d.name, detailType: d.detailType, spec: d.spec, sortOrder: d.sortOrder })
    detailsBySystemId.set(d.gameSystemId, list)
  }

  const data: GameSystemListItemWithDetails[] = systems.map(
    (s: GameSystem & { _count: { dependsOn: number } }) => ({
      ...s,
      systemDetails: detailsBySystemId.get(s.id) ?? [],
    })
  )

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

export type ProjectSystemForReview = {
  systemSlug: string
  systemDetails: { name: string; detailType: string }[]
}

export async function getAllGameSystemsWithDetails(
  projectId: string
): Promise<ProjectSystemForReview[]> {
  const systems = await prisma.gameSystem.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
    select: { id: true, systemSlug: true },
  })
  if (systems.length === 0) return []
  const systemIds = systems.map((s) => s.id)
  const details = await prisma.systemDetail.findMany({
    where: { gameSystemId: { in: systemIds } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { gameSystemId: true, name: true, detailType: true },
  })
  const detailsBySystemId = new Map<string, { name: string; detailType: string }[]>()
  for (const d of details) {
    const list = detailsBySystemId.get(d.gameSystemId) ?? []
    list.push({ name: d.name, detailType: d.detailType })
    detailsBySystemId.set(d.gameSystemId, list)
  }
  return systems.map((s) => ({
    systemSlug: s.systemSlug,
    systemDetails: detailsBySystemId.get(s.id) ?? [],
  }))
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
      systemDetails: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
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
