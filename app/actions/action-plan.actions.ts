'use server'

import { getCurrentUserId } from '@/lib/get-current-user'
import { findProjectById } from '@/lib/repositories/project.repository'
import { getOrCreateDefaultWorkspace } from '@/lib/repositories/workspace.repository'
import { generateActionPlan } from '@/lib/ai/action-plan/generate'
import type { ActionPlan } from '@/lib/ai/action-plan/types'

export async function generateActionPlanAction(
  projectId: string,
  threadIds: string[]
): Promise<{ success: true; data: ActionPlan } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const project = await findProjectById(projectId)
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    const workspace = await getOrCreateDefaultWorkspace()
    const workspaceId = project.workspaceId ?? workspace.id

    const result = await generateActionPlan(threadIds, projectId, workspaceId)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to generate action plan',
    }
  }
}
