import { prisma } from '@/lib/db'
import type { SystemDetail } from '@prisma/client'

export const DETAIL_TYPES = [
  'mechanic',
  'input',
  'output',
  'content',
  'ui_hint',
] as const
export type DetailType = (typeof DETAIL_TYPES)[number]

export type CreateSystemDetailInput = {
  gameSystemId: string
  name: string
  detailType: string
  spec: string
  sortOrder?: number
  synthesizedOutputId?: string
}

export type UpdateSystemDetailInput = {
  name?: string
  detailType?: string
  spec?: string
  sortOrder?: number
}

export async function createSystemDetail(
  data: CreateSystemDetailInput
): Promise<SystemDetail> {
  return prisma.systemDetail.create({
    data: {
      gameSystemId: data.gameSystemId,
      name: data.name,
      detailType: data.detailType,
      spec: data.spec,
      sortOrder: data.sortOrder ?? 0,
      synthesizedOutputId: data.synthesizedOutputId ?? undefined,
    },
  })
}

export async function createManySystemDetails(
  items: CreateSystemDetailInput[]
): Promise<number> {
  if (items.length === 0) return 0
  const result = await prisma.systemDetail.createManyAndReturn({
    data: items.map((item) => ({
      gameSystemId: item.gameSystemId,
      name: item.name,
      detailType: item.detailType,
      spec: item.spec,
      sortOrder: item.sortOrder ?? 0,
      synthesizedOutputId: item.synthesizedOutputId ?? undefined,
    })),
  })
  return result.length
}

export async function getSystemDetailById(id: string): Promise<SystemDetail> {
  return prisma.systemDetail.findUniqueOrThrow({ where: { id } })
}

export async function findSystemDetailById(
  id: string
): Promise<SystemDetail | null> {
  return prisma.systemDetail.findUnique({ where: { id } })
}

export async function listSystemDetailsByGameSystemId(
  gameSystemId: string
): Promise<SystemDetail[]> {
  return prisma.systemDetail.findMany({
    where: { gameSystemId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function listSystemDetailsByProjectId(
  projectId: string
): Promise<(SystemDetail & { gameSystem: { systemSlug: string } })[]> {
  return prisma.systemDetail.findMany({
    where: { gameSystem: { projectId } },
    include: { gameSystem: { select: { systemSlug: true } } },
    orderBy: [{ gameSystemId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function updateSystemDetail(
  id: string,
  data: UpdateSystemDetailInput
): Promise<SystemDetail> {
  return prisma.systemDetail.update({ where: { id }, data })
}

export async function deleteSystemDetail(id: string): Promise<void> {
  await prisma.systemDetail.delete({ where: { id } })
}
