'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createProjectSchema, updateProjectSchema } from '@/lib/validations/schemas'
import * as projectService from '@/lib/services/project.service'

export type UpdateProjectResult = { ok: true } | { ok: false; error: string }
export type DeleteProjectResult = { ok: true } | { ok: false; error: string }
export type ClearProjectDataResult = { ok: true } | { ok: false; error: string }

export async function createProjectAction(formData: FormData): Promise<void> {
  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    genre: (formData.get('genre') as string) || undefined,
    platform: (formData.get('platform') as string) || undefined,
    status: (formData.get('status') as string) || undefined,
  }
  const parsed = createProjectSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    redirect(`/projects/new?error=${encodeURIComponent(first?.message ?? 'Validation failed')}`)
  }
  const result = await projectService.createProject(parsed.data)
  if (!result.success) redirect(`/projects/new?error=${encodeURIComponent(result.error)}`)
  revalidatePath('/')
  revalidatePath('/dashboard')
  redirect(`/projects/${result.data.id}/overview`)
}

export async function updateProjectAction(
  projectId: string,
  _prev: unknown,
  formData: FormData
): Promise<UpdateProjectResult> {
  const raw = {
    name: formData.get('name') as string | null,
    description: formData.get('description') as string | null,
    genre: formData.get('genre') as string | null,
    platform: formData.get('platform') as string | null,
    status: formData.get('status') as string | null,
  }
  const data: Record<string, string | undefined> = {}
  if (raw.name != null) data.name = raw.name || undefined
  if (raw.description != null) data.description = raw.description || undefined
  if (raw.genre != null) data.genre = raw.genre || undefined
  if (raw.platform != null) data.platform = raw.platform || undefined
  if (raw.status != null) data.status = raw.status || undefined
  const parsed = updateProjectSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? 'Validation failed' }
  }
  const result = await projectService.updateProject(projectId, parsed.data)
  if (!result.success) return { ok: false, error: result.error }
  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/overview`)
  return { ok: true }
}

export async function deleteProjectAction(projectId: string): Promise<DeleteProjectResult> {
  const result = await projectService.deleteProject(projectId)
  if (!result.success) return { ok: false, error: result.error }
  revalidatePath('/')
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function clearProjectDataAction(
  projectId: string
): Promise<ClearProjectDataResult> {
  const result = await projectService.clearProjectData(projectId)
  if (!result.success) return { ok: false, error: result.error }
  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/overview`)
  revalidatePath(`/projects/${projectId}/edit`)
  return { ok: true }
}
