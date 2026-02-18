'use server'

import { getCurrentUserId } from '@/lib/get-current-user'
import {
  getOrCreateDefaultWorkspace,
  isWorkspaceMember,
  addWorkspaceMember,
} from '@/lib/repositories/workspace.repository'
import { revalidatePath } from 'next/cache'

export async function addWorkspaceMemberAction(
  workspaceId: string,
  userId: string
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
  try {
    await addWorkspaceMember(workspaceId, userId)
    revalidatePath('/settings')
    return { success: true }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to add user',
    }
  }
}
