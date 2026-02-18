import { prisma } from '@/lib/db'
import type { WorkspaceAiFeatureConfig } from '@prisma/client'

export async function getFeatureConfig(
  workspaceId: string,
  featureId: string
): Promise<WorkspaceAiFeatureConfig | null> {
  return prisma.workspaceAiFeatureConfig.findUnique({
    where: {
      workspaceId_featureId: { workspaceId, featureId },
    },
  })
}

export async function listFeatureConfigs(
  workspaceId: string
): Promise<WorkspaceAiFeatureConfig[]> {
  return prisma.workspaceAiFeatureConfig.findMany({
    where: { workspaceId },
    orderBy: { featureId: 'asc' },
  })
}

export async function upsertFeatureConfig(
  workspaceId: string,
  featureId: string,
  providerId: string,
  modelId: string
): Promise<WorkspaceAiFeatureConfig> {
  return prisma.workspaceAiFeatureConfig.upsert({
    where: {
      workspaceId_featureId: { workspaceId, featureId },
    },
    create: { workspaceId, featureId, providerId, modelId },
    update: { providerId, modelId, updatedAt: new Date() },
  })
}

export async function deleteFeatureConfig(
  workspaceId: string,
  featureId: string
): Promise<void> {
  await prisma.workspaceAiFeatureConfig.deleteMany({
    where: { workspaceId, featureId },
  })
}
