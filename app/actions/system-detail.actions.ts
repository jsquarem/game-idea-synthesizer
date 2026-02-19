'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  createSystemDetailSchema,
  updateSystemDetailSchema,
} from '@/lib/validations/schemas'
import {
  createSystemDetail,
  updateSystemDetail,
  deleteSystemDetail,
  listSystemDetailsByGameSystemId,
} from '@/lib/repositories/system-detail.repository'
import { findGameSystemById } from '@/lib/repositories/game-system.repository'

export async function createSystemDetailAction(
  projectId: string,
  systemId: string,
  formData: FormData
): Promise<void> {
  const raw = {
    gameSystemId: systemId,
    name: formData.get('name') as string,
    detailType: (formData.get('detailType') as string) || 'mechanic',
    spec: (formData.get('spec') as string) || '',
  }
  const parsed = createSystemDetailSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    redirect(
      `/projects/${projectId}/systems/${systemId}?error=${encodeURIComponent(first?.message ?? 'Validation failed')}`
    )
  }
  const system = await findGameSystemById(systemId)
  if (!system || system.projectId !== projectId) {
    redirect(`/projects/${projectId}/systems/${systemId}?error=System+not+found`)
  }
  const existing = await listSystemDetailsByGameSystemId(systemId)
  await createSystemDetail({
    ...parsed.data,
    sortOrder: existing.length,
  })
  revalidatePath(`/projects/${projectId}/systems/${systemId}`)
  redirect(`/projects/${projectId}/systems/${systemId}`)
}

export async function updateSystemDetailAction(
  projectId: string,
  systemId: string,
  detailId: string,
  formData: FormData
): Promise<void> {
  const raw = {
    name: formData.get('name') as string,
    detailType: (formData.get('detailType') as string) || 'mechanic',
    spec: (formData.get('spec') as string) || '',
  }
  const parsed = updateSystemDetailSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    redirect(
      `/projects/${projectId}/systems/${systemId}?error=${encodeURIComponent(first?.message ?? 'Validation failed')}`
    )
  }
  const system = await findGameSystemById(systemId)
  if (!system || system.projectId !== projectId) {
    redirect(`/projects/${projectId}/systems/${systemId}?error=System+not+found`)
  }
  await updateSystemDetail(detailId, parsed.data)
  revalidatePath(`/projects/${projectId}/systems/${systemId}`)
  redirect(`/projects/${projectId}/systems/${systemId}`)
}

export async function deleteSystemDetailAction(
  projectId: string,
  systemId: string,
  detailId: string
): Promise<void> {
  const system = await findGameSystemById(systemId)
  if (!system || system.projectId !== projectId) {
    redirect(`/projects/${projectId}/systems/${systemId}?error=System+not+found`)
  }
  await deleteSystemDetail(detailId)
  revalidatePath(`/projects/${projectId}/systems/${systemId}`)
  redirect(`/projects/${projectId}/systems/${systemId}`)
}
