import { findWorkspaceAiConfig } from '@/lib/repositories/workspace-ai-config.repository'
import { decryptSecret } from '@/lib/security/encryption'

export type WorkspaceProviderConfig = {
  apiKey: string
  baseUrl: string | null
  defaultModel: string | null
}

/**
 * Returns decrypted AI provider config for a workspace. Use only in server
 * runtime (e.g. Server Actions, API routes, server components that pass config
 * to server-only code). Never send the returned apiKey to the client.
 */
export async function getDecryptedWorkspaceProviderConfig(
  workspaceId: string,
  providerId: string
): Promise<WorkspaceProviderConfig | null> {
  const row = await findWorkspaceAiConfig(workspaceId, providerId)
  if (!row?.encryptedApiKey) return null
  try {
    const apiKey = decryptSecret(row.encryptedApiKey)
    return {
      apiKey,
      baseUrl: row.baseUrl ?? null,
      defaultModel: row.defaultModel ?? null,
    }
  } catch {
    return null
  }
}
