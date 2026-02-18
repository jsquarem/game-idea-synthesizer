'use server'

import { getCurrentUserId } from '@/lib/get-current-user'
import { updateUserDisplayName, updateUserAvatarColor } from '@/lib/repositories/user.repository'
import { isAllowedAvatarColor } from '@/lib/avatar'
import { revalidatePath } from 'next/cache'

export async function updateDisplayNameAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  const displayName = (formData.get('displayName') as string)?.trim() ?? null
  if (displayName && displayName.length > 100)
    return { success: false, error: 'Display name must be at most 100 characters' }
  try {
    await updateUserDisplayName(userId, displayName || null)
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to update display name',
    }
  }
}

export async function updateAvatarColorAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  const raw = formData.get('avatarColor')
  const avatarColor =
    raw === null || raw === undefined
      ? null
      : typeof raw === 'string'
        ? raw.trim() || null
        : null
  if (avatarColor !== null && !isAllowedAvatarColor(avatarColor))
    return { success: false, error: 'Invalid avatar color' }
  try {
    await updateUserAvatarColor(userId, avatarColor)
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to update avatar color',
    }
  }
}
