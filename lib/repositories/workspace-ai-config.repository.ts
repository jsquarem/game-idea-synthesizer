import { prisma } from '@/lib/db'
import type { WorkspaceAiConfig } from '@prisma/client'

export async function findWorkspaceAiConfig(
  workspaceId: string,
  providerId: string
): Promise<WorkspaceAiConfig | null> {
  return prisma.workspaceAiConfig.findUnique({
    where: {
      workspaceId_providerId: { workspaceId, providerId },
    },
  })
}

export async function listWorkspaceAiConfigs(workspaceId: string) {
  return prisma.workspaceAiConfig.findMany({
    where: { workspaceId },
    orderBy: { providerId: 'asc' },
  })
}

export type UpsertWorkspaceAiConfigInput = {
  workspaceId: string
  providerId: string
  encryptedApiKey: string
  baseUrl?: string | null
  defaultModel?: string | null
}

export async function upsertWorkspaceAiConfig(
  input: UpsertWorkspaceAiConfigInput
): Promise<WorkspaceAiConfig> {
  return prisma.workspaceAiConfig.upsert({
    where: {
      workspaceId_providerId: {
        workspaceId: input.workspaceId,
        providerId: input.providerId,
      },
    },
    create: {
      workspaceId: input.workspaceId,
      providerId: input.providerId,
      encryptedApiKey: input.encryptedApiKey,
      baseUrl: input.baseUrl ?? null,
      defaultModel: input.defaultModel ?? null,
    },
    update: {
      encryptedApiKey: input.encryptedApiKey,
      baseUrl: input.baseUrl ?? null,
      defaultModel: input.defaultModel ?? null,
      updatedAt: new Date(),
    },
  })
}
