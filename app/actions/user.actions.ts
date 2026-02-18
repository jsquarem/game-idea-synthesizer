'use server'

import { cookies } from 'next/headers'
import { getCurrentUserId, USER_ID_COOKIE } from '@/lib/get-current-user'
import {
  findUserById,
  createUser,
  updateUserDisplayName,
  updateUserAvatarColor,
} from '@/lib/repositories/user.repository'
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

export async function createUserAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const name = (formData.get('name') as string)?.trim() ?? ''
  if (!name) return { success: false, error: 'Name is required' }
  if (name.length > 100)
    return { success: false, error: 'Name must be at most 100 characters' }
  try {
    const user = await createUser({ displayName: name })
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true, userId: user.id }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create user',
    }
  }
}

export async function switchCurrentUserAction(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await findUserById(userId)
  if (!user) return { success: false, error: 'User not found' }
  try {
    const store = await cookies()
    store.set(USER_ID_COOKIE, userId, { path: '/', httpOnly: true, sameSite: 'lax' })
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to switch user',
    }
  }
}
