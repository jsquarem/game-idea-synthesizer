import { prisma } from '@/lib/db'
import type { Dependency } from '@prisma/client'

export type CreateDependencyInput = {
  sourceSystemId: string
  targetSystemId: string
  dependencyType?: string
  description?: string
}

export type DependencyWithSystems = Dependency & {
  sourceSystem: { id: string; name: string; systemSlug: string }
  targetSystem: { id: string; name: string; systemSlug: string }
}

export async function createDependency(data: CreateDependencyInput): Promise<Dependency> {
  return prisma.dependency.create({
    data: {
      sourceSystemId: data.sourceSystemId,
      targetSystemId: data.targetSystemId,
      dependencyType: data.dependencyType ?? 'requires',
      description: data.description,
    },
  })
}

export async function deleteDependency(id: string): Promise<void> {
  await prisma.dependency.delete({ where: { id } })
}

export async function deleteDependencyByPair(
  sourceSystemId: string,
  targetSystemId: string
): Promise<void> {
  await prisma.dependency.deleteMany({
    where: { sourceSystemId, targetSystemId },
  })
}

export async function listDependenciesByProject(
  projectId: string
): Promise<DependencyWithSystems[]> {
  const deps = await prisma.dependency.findMany({
    where: {
      sourceSystem: { projectId },
    },
    include: {
      sourceSystem: { select: { id: true, name: true, systemSlug: true } },
      targetSystem: { select: { id: true, name: true, systemSlug: true } },
    },
  })
  return deps as DependencyWithSystems[]
}

export async function listDependenciesFrom(
  systemId: string
): Promise<DependencyWithSystems[]> {
  const deps = await prisma.dependency.findMany({
    where: { sourceSystemId: systemId },
    include: {
      sourceSystem: { select: { id: true, name: true, systemSlug: true } },
      targetSystem: { select: { id: true, name: true, systemSlug: true } },
    },
  })
  return deps as DependencyWithSystems[]
}

export async function listDependenciesTo(
  systemId: string
): Promise<DependencyWithSystems[]> {
  const deps = await prisma.dependency.findMany({
    where: { targetSystemId: systemId },
    include: {
      sourceSystem: { select: { id: true, name: true, systemSlug: true } },
      targetSystem: { select: { id: true, name: true, systemSlug: true } },
    },
  })
  return deps as DependencyWithSystems[]
}

export async function createDependenciesBatch(
  deps: CreateDependencyInput[]
): Promise<Dependency[]> {
  return prisma.$transaction(
    deps.map((data) =>
      prisma.dependency.create({
        data: {
          sourceSystemId: data.sourceSystemId,
          targetSystemId: data.targetSystemId,
          dependencyType: data.dependencyType ?? 'requires',
          description: data.description,
        },
      })
    )
  )
}

export async function deleteAllDependenciesForSystem(systemId: string): Promise<void> {
  await prisma.dependency.deleteMany({
    where: { OR: [{ sourceSystemId: systemId }, { targetSystemId: systemId }] },
  })
}

export async function dependencyExists(
  sourceSystemId: string,
  targetSystemId: string
): Promise<boolean> {
  const count = await prisma.dependency.count({
    where: { sourceSystemId, targetSystemId },
  })
  return count > 0
}
