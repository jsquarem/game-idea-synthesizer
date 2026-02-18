'use server'

import { getCurrentUserId } from '@/lib/get-current-user'
import {
  getOrCreateDefaultWorkspace,
  isWorkspaceMember,
} from '@/lib/repositories/workspace.repository'
import { upsertFeatureConfig } from '@/lib/repositories/workspace-ai-feature-config.repository'
import { revalidatePath } from 'next/cache'

const ALLOWED_PROVIDERS = ['openai', 'anthropic'] as const
const ALLOWED_FEATURES = ['default', 'plan_generation'] as const

export async function saveFeatureConfigAction(
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

  const featureId = (formData.get('featureId') as string)?.trim()
  if (!featureId || !ALLOWED_FEATURES.includes(featureId as (typeof ALLOWED_FEATURES)[number])) {
    return { success: false, error: 'Invalid feature' }
  }

  const providerId = (formData.get('providerId') as string)?.trim()
  if (!providerId || !ALLOWED_PROVIDERS.includes(providerId as (typeof ALLOWED_PROVIDERS)[number])) {
    return { success: false, error: 'Invalid provider' }
  }

  const modelId = (formData.get('modelId') as string)?.trim()
  if (!modelId) {
    return { success: false, error: 'Model ID is required' }
  }

  try {
    await upsertFeatureConfig(workspaceId, featureId, providerId, modelId)
    revalidatePath('/settings')
    return { success: true }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to save feature config',
    }
  }
}
