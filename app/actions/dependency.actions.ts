'use server'

import { revalidatePath } from 'next/cache'
import * as dependencyService from '@/lib/services/dependency.service'

export type AddDependencyResult = { ok: true } | { ok: false; error: string }

export async function addDependencyAction(
  projectId: string,
  sourceSystemId: string,
  targetSystemId: string,
  dependencyType?: string
): Promise<AddDependencyResult | void> {
  const result = await dependencyService.addDependency(
    sourceSystemId,
    targetSystemId,
    dependencyType
  )
  if (!result.success) return { ok: false, error: result.error }
  revalidatePath(`/projects/${projectId}/dependencies`)
  revalidatePath(`/projects/${projectId}/overview`)
}

export type RemoveDependencyResult = { ok: true } | { ok: false; error: string }

export async function removeDependencyAction(
  projectId: string,
  sourceSystemId: string,
  targetSystemId: string
): Promise<RemoveDependencyResult | void> {
  const result = await dependencyService.removeDependency(sourceSystemId, targetSystemId)
  if (!result.success) return { ok: false, error: result.error }
  revalidatePath(`/projects/${projectId}/dependencies`)
  revalidatePath(`/projects/${projectId}/overview`)
}
