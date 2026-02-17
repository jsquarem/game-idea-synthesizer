'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as versionPlanService from '@/lib/services/version-plan.service'

export async function createVersionPlanAction(
  projectId: string,
  formData: FormData
): Promise<void> {
  const versionLabel = (formData.get('versionLabel') as string)?.trim()
  const title = (formData.get('title') as string)?.trim()
  const systemIdsRaw = formData.get('systemIds') as string
  const systemIds = systemIdsRaw ? (JSON.parse(systemIdsRaw) as string[]) : []
  if (!versionLabel || !title) {
    redirect(`/projects/${projectId}/versions/new?error=${encodeURIComponent('Version and title required')}`)
  }
  const result = await versionPlanService.createVersionPlanFromSystems(
    projectId,
    versionLabel,
    title,
    systemIds,
    (formData.get('description') as string) || undefined
  )
  if (!result.success) {
    redirect(`/projects/${projectId}/versions/new?error=${encodeURIComponent(result.error)}`)
  }
  revalidatePath(`/projects/${projectId}/versions`)
  revalidatePath(`/projects/${projectId}/overview`)
  redirect(`/projects/${projectId}/versions/${result.data.id}`)
}

export async function finalizeVersionPlanAction(projectId: string, planId: string): Promise<void> {
  const result = await versionPlanService.finalizeVersionPlanAction(planId)
  if (!result.success) {
    redirect(`/projects/${projectId}/versions/${planId}?error=${encodeURIComponent(result.error)}`)
  }
  revalidatePath(`/projects/${projectId}/versions`)
  redirect(`/projects/${projectId}/versions/${planId}`)
}

export async function deleteVersionPlanAction(projectId: string, planId: string): Promise<void> {
  const result = await versionPlanService.deleteVersionPlanAction(planId)
  if (!result.success) {
    redirect(`/projects/${projectId}/versions/${planId}?error=${encodeURIComponent(result.error)}`)
  }
  revalidatePath(`/projects/${projectId}/versions`)
  redirect(`/projects/${projectId}/versions`)
}
