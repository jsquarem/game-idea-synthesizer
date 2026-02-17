'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createGameSystemSchema } from '@/lib/validations/schemas'
import * as gameSystemService from '@/lib/services/game-system.service'

export async function createSystemAction(
  projectId: string,
  formData: FormData
): Promise<void> {
  const raw = {
    projectId,
    systemId: (formData.get('systemSlug') as string) || (formData.get('systemId') as string),
    name: formData.get('name') as string,
    version: (formData.get('version') as string) || 'v0.1',
    status: (formData.get('status') as string) || 'draft',
    purpose: (formData.get('purpose') as string) || undefined,
    mvpCriticality: (formData.get('mvpCriticality') as string) || 'important',
  }
  const parsed = createGameSystemSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    redirect(
      `/projects/${projectId}/systems/new?error=${encodeURIComponent(first?.message ?? 'Validation failed')}`
    )
  }
  const result = await gameSystemService.createSystem({
    projectId: parsed.data.projectId,
    systemSlug: parsed.data.systemId,
    name: parsed.data.name,
    version: parsed.data.version,
    status: parsed.data.status,
    purpose: parsed.data.purpose,
    mvpCriticality: parsed.data.mvpCriticality,
  })
  if (!result.success)
    redirect(
      `/projects/${projectId}/systems/new?error=${encodeURIComponent(result.error)}`
    )
  revalidatePath(`/projects/${projectId}/systems`)
  revalidatePath(`/projects/${projectId}/overview`)
  redirect(`/projects/${projectId}/systems/${result.data.id}`)
}

export async function updateSystemAction(
  projectId: string,
  systemId: string,
  formData: FormData
): Promise<void> {
  const summary = (formData.get('changeSummary') as string) || 'Updated'
  const raw = {
    name: formData.get('name') as string,
    version: formData.get('version') as string,
    status: formData.get('status') as string,
    purpose: formData.get('purpose') as string,
    mvpCriticality: formData.get('mvpCriticality') as string,
  }
  const result = await gameSystemService.updateSystem(
    systemId,
    {
      name: raw.name,
      version: raw.version,
      status: raw.status,
      purpose: raw.purpose || undefined,
      mvpCriticality: raw.mvpCriticality,
    },
    summary
  )
  if (!result.success)
    redirect(
      `/projects/${projectId}/systems/${systemId}?error=${encodeURIComponent(result.error)}`
    )
  revalidatePath(`/projects/${projectId}/systems`)
  revalidatePath(`/projects/${projectId}/systems/${systemId}`)
  revalidatePath(`/projects/${projectId}/overview`)
  redirect(`/projects/${projectId}/systems/${systemId}`)
}

export async function deleteSystemAction(
  projectId: string,
  systemId: string
): Promise<void> {
  const result = await gameSystemService.deleteSystem(systemId)
  if (!result.success)
    redirect(
      `/projects/${projectId}/systems/${systemId}?error=${encodeURIComponent(result.error)}`
    )
  revalidatePath(`/projects/${projectId}/systems`)
  revalidatePath(`/projects/${projectId}/overview`)
  redirect(`/projects/${projectId}/systems`)
}
