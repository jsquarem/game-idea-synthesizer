import { prisma } from '@/lib/db'
import type { VersionPlan, VersionPlanItem, GameSystem } from '@prisma/client'
import type { PaginatedResult, PaginationParams } from './types'

export type CreateVersionPlanInput = {
  projectId: string
  versionLabel: string
  title: string
  description?: string
  includedSystems: string[]
  excludedSystems?: string[]
  phases?: object[]
  milestones?: object[]
  riskAreas?: string[]
  implementationOrder?: string[]
  scopeValidation?: string
  markdownContent?: string
}

export type UpdateVersionPlanInput = Partial<
  Omit<CreateVersionPlanInput, 'projectId' | 'versionLabel'>
> & {
  status?: string
}

export type VersionPlanWithItems = VersionPlan & {
  planItems: (VersionPlanItem & { gameSystem: GameSystem })[]
}

const DEFAULT_PAGE_SIZE = 20

export async function createVersionPlan(data: CreateVersionPlanInput): Promise<VersionPlan> {
  return prisma.versionPlan.create({
    data: {
      projectId: data.projectId,
      versionLabel: data.versionLabel,
      title: data.title,
      description: data.description,
      includedSystems: JSON.stringify(data.includedSystems),
      excludedSystems: data.excludedSystems ? JSON.stringify(data.excludedSystems) : null,
      phases: data.phases ? JSON.stringify(data.phases) : null,
      milestones: data.milestones ? JSON.stringify(data.milestones) : null,
      riskAreas: data.riskAreas ? JSON.stringify(data.riskAreas) : null,
      implementationOrder: data.implementationOrder
        ? JSON.stringify(data.implementationOrder)
        : null,
      scopeValidation: data.scopeValidation,
      markdownContent: data.markdownContent,
    },
  })
}

export async function getVersionPlanById(id: string): Promise<VersionPlan> {
  return prisma.versionPlan.findUniqueOrThrow({ where: { id } })
}

export async function findVersionPlanById(id: string): Promise<VersionPlan | null> {
  return prisma.versionPlan.findUnique({ where: { id } })
}

export async function getVersionPlanByLabel(
  projectId: string,
  versionLabel: string
): Promise<VersionPlan | null> {
  return prisma.versionPlan.findUnique({
    where: { projectId_versionLabel: { projectId, versionLabel } },
  })
}

export async function listVersionPlans(
  projectId: string,
  pagination?: PaginationParams
): Promise<PaginatedResult<VersionPlan>> {
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.versionPlan.findMany({
      where: { projectId },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.versionPlan.count({ where: { projectId } }),
  ])

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function updateVersionPlan(
  id: string,
  data: UpdateVersionPlanInput
): Promise<VersionPlan> {
  const update: Record<string, unknown> = { ...data }
  if (data.includedSystems !== undefined) update.includedSystems = JSON.stringify(data.includedSystems)
  if (data.excludedSystems !== undefined) update.excludedSystems = JSON.stringify(data.excludedSystems)
  if (data.phases !== undefined) update.phases = JSON.stringify(data.phases)
  if (data.milestones !== undefined) update.milestones = JSON.stringify(data.milestones)
  if (data.riskAreas !== undefined) update.riskAreas = JSON.stringify(data.riskAreas)
  if (data.implementationOrder !== undefined)
    update.implementationOrder = JSON.stringify(data.implementationOrder)
  return prisma.versionPlan.update({ where: { id }, data: update })
}

export async function finalizeVersionPlan(id: string): Promise<VersionPlan> {
  return prisma.versionPlan.update({
    where: { id },
    data: { status: 'finalized', finalizedAt: new Date() },
  })
}

export async function deleteVersionPlan(id: string): Promise<void> {
  await prisma.versionPlan.delete({ where: { id } })
}

export async function getVersionPlanFull(id: string): Promise<VersionPlanWithItems> {
  return prisma.versionPlan.findUniqueOrThrow({
    where: { id },
    include: { planItems: { include: { gameSystem: true } } },
  })
}

export async function addPlanItem(data: {
  versionPlanId: string
  gameSystemId: string
  phase?: number
  sortOrder?: number
  notes?: string
}): Promise<VersionPlanItem> {
  return prisma.versionPlanItem.create({
    data: {
      versionPlanId: data.versionPlanId,
      gameSystemId: data.gameSystemId,
      phase: data.phase ?? 1,
      sortOrder: data.sortOrder ?? 0,
      notes: data.notes,
    },
  })
}

export async function removePlanItem(
  versionPlanId: string,
  gameSystemId: string
): Promise<void> {
  await prisma.versionPlanItem.deleteMany({
    where: { versionPlanId, gameSystemId },
  })
}

export async function updatePlanItem(
  id: string,
  data: { phase?: number; sortOrder?: number; notes?: string }
): Promise<VersionPlanItem> {
  return prisma.versionPlanItem.update({ where: { id }, data })
}

export async function setPlanItems(
  versionPlanId: string,
  items: { gameSystemId: string; phase: number; sortOrder: number; notes?: string }[]
): Promise<VersionPlanItem[]> {
  await prisma.versionPlanItem.deleteMany({ where: { versionPlanId } })
  if (items.length === 0) return []
  return prisma.$transaction(
    items.map((item) =>
      prisma.versionPlanItem.create({
        data: {
          versionPlanId,
          gameSystemId: item.gameSystemId,
          phase: item.phase,
          sortOrder: item.sortOrder,
          notes: item.notes,
        },
      })
    )
  )
}
