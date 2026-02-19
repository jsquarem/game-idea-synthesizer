'use server'

import { getCurrentUserId } from '@/lib/get-current-user'
import {
  getOrCreateDefaultWorkspace,
  isWorkspaceMember,
} from '@/lib/repositories/workspace.repository'
import {
  findWorkspaceAiConfig,
  upsertWorkspaceAiConfig,
  updateWorkspaceAiConfigAvailableModels,
} from '@/lib/repositories/workspace-ai-config.repository'
import { encryptSecret, decryptSecret } from '@/lib/security/encryption'
import { revalidatePath } from 'next/cache'
import { listModelsForProvider } from '@/lib/ai/list-models'

const ALLOWED_PROVIDERS = ['openai', 'anthropic'] as const

export async function saveWorkspaceAiConfigAction(
  workspaceId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId()
  const workspace = await getOrCreateDefaultWorkspace(currentUserId)
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
    let apiKeyForList: string | null = rawApiKey || null
    if (!apiKeyForList && existing) {
      try {
        apiKeyForList = decryptSecret(existing.encryptedApiKey)
      } catch {
        apiKeyForList = null
      }
    }
    if (apiKeyForList) {
      try {
        const ids = await listModelsForProvider(providerId, {
          apiKey: apiKeyForList,
          baseUrl,
        })
        await updateWorkspaceAiConfigAvailableModels(
          workspaceId,
          providerId,
          ids.length > 0 ? JSON.stringify(ids) : null
        )
      } catch {
        // Leave availableModels unchanged on list failure
      }
    }
    revalidatePath('/settings')
    revalidatePath('/projects', 'layout')
    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to save API config'
    if (message.includes('WORKSPACE_SECRETS_MASTER_KEY')) {
      return { success: false, error: 'Server encryption key not configured' }
    }
    return { success: false, error: message }
  }
}

export async function refreshWorkspaceModelsAction(
  workspaceId: string,
  providerId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId()
  const workspace = await getOrCreateDefaultWorkspace(currentUserId)
  if (workspace.id !== workspaceId) {
    return { success: false, error: 'Workspace not found' }
  }
  const isMember = await isWorkspaceMember(workspaceId, currentUserId)
  if (!isMember) {
    return { success: false, error: 'Not a workspace member' }
  }
  if (!providerId || !ALLOWED_PROVIDERS.includes(providerId as (typeof ALLOWED_PROVIDERS)[number])) {
    return { success: false, error: 'Invalid provider' }
  }
  const config = await findWorkspaceAiConfig(workspaceId, providerId)
  if (!config?.encryptedApiKey) {
    return { success: false, error: 'No API key configured' }
  }
  let apiKey: string
  try {
    apiKey = decryptSecret(config.encryptedApiKey)
  } catch {
    return { success: false, error: 'Could not read API key' }
  }
  try {
    const ids = await listModelsForProvider(providerId, {
      apiKey,
      baseUrl: config.baseUrl,
    })
    await updateWorkspaceAiConfigAvailableModels(
      workspaceId,
      providerId,
      ids.length > 0 ? JSON.stringify(ids) : null
    )
    revalidatePath('/settings')
    revalidatePath('/projects', 'layout')
    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to refresh models'
    return { success: false, error: message }
  }
}
