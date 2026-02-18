'use server'

import { getCurrentUserId } from '@/lib/get-current-user'
import {
  getOrCreateDefaultWorkspace,
  isWorkspaceMember,
} from '@/lib/repositories/workspace.repository'
import {
  findWorkspaceAiConfig,
  upsertWorkspaceAiConfig,
} from '@/lib/repositories/workspace-ai-config.repository'
import { encryptSecret } from '@/lib/security/encryption'
import { revalidatePath } from 'next/cache'

const ALLOWED_PROVIDERS = ['openai', 'anthropic'] as const

export async function saveWorkspaceAiConfigAction(
  workspaceId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId()
  const workspace = await getOrCreateDefaultWorkspace()
  if (workspace.id !== workspaceId) {
    return { success: false, error: 'Workspace not found' }
  }
  const isMember = await isWorkspaceMember(workspaceId, currentUserId)
  if (!isMember) {
    return { success: false, error: 'Not a workspace member' }
  }

  const providerId = (formData.get('providerId') as string)?.trim()
  if (!providerId || !ALLOWED_PROVIDERS.includes(providerId as (typeof ALLOWED_PROVIDERS)[number])) {
    return { success: false, error: 'Invalid provider' }
  }

  const rawApiKey = (formData.get('apiKey') as string)?.trim() ?? ''
  const baseUrl = (formData.get('baseUrl') as string)?.trim() || null
  const defaultModel = (formData.get('defaultModel') as string)?.trim() || null

  let encryptedApiKey: string
  const existing = await findWorkspaceAiConfig(workspaceId, providerId)
  if (rawApiKey) {
    encryptedApiKey = encryptSecret(rawApiKey)
  } else if (existing) {
    encryptedApiKey = existing.encryptedApiKey
  } else {
    return { success: false, error: 'API key is required for new config' }
  }

  try {
    await upsertWorkspaceAiConfig({
      workspaceId,
      providerId,
      encryptedApiKey,
      baseUrl,
      defaultModel,
    })
    revalidatePath('/settings')
    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to save API config'
    if (message.includes('WORKSPACE_SECRETS_MASTER_KEY')) {
      return { success: false, error: 'Server encryption key not configured' }
    }
    return { success: false, error: message }
  }
}
