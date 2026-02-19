'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createBrainstormSessionSchema } from '@/lib/validations/schemas'
import * as brainstormService from '@/lib/services/brainstorm.service'
import { getCurrentUserId } from '@/lib/get-current-user'
import { findUserById } from '@/lib/repositories/user.repository'

export async function createBrainstormAction(
  projectId: string,
  formData: FormData
): Promise<void> {
  const title = (formData.get('title') as string) || 'Untitled'
  const content = (formData.get('content') as string) ?? ''
  const source = (formData.get('source') as string) || 'manual'
  const tagsRaw = formData.get('tags') as string | null
  const tags = tagsRaw ? (JSON.parse(tagsRaw) as string[]) : undefined

  const userId = await getCurrentUserId()
  const user = await findUserById(userId)
  const author = user?.displayName?.trim() || 'Unknown'

  const parsed = createBrainstormSessionSchema.safeParse({
    projectId,
    title,
    content,
    source: source as 'manual' | 'discord' | 'upload',
    author,
    tags,
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    redirect(
      `/projects/${projectId}/brainstorms/new?error=${encodeURIComponent(first?.message ?? 'Validation failed')}`
    )
  }
  const result = await brainstormService.ingestBrainstorm({
    projectId: parsed.data.projectId,
    title: parsed.data.title,
    source: parsed.data.source,
    content: parsed.data.content,
    author: parsed.data.author,
    tags: parsed.data.tags,
  })
  if (!result.success)
    redirect(
      `/projects/${projectId}/brainstorms/new?error=${encodeURIComponent(result.error)}`
    )
  revalidatePath(`/projects/${projectId}/brainstorms`)
  revalidatePath(`/projects/${projectId}/overview`)
  redirect(`/projects/${projectId}/brainstorms/${result.data.id}/synthesize`)
}

export async function deleteBrainstormAction(
  projectId: string,
  brainstormId: string
): Promise<void> {
  const result = await brainstormService.deleteBrainstorm(brainstormId)
  if (!result.success)
    redirect(
      `/projects/${projectId}/brainstorms?error=${encodeURIComponent(result.error)}`
    )
  revalidatePath(`/projects/${projectId}/brainstorms`)
  revalidatePath(`/projects/${projectId}/overview`)
  redirect(`/projects/${projectId}/brainstorms`)
}
