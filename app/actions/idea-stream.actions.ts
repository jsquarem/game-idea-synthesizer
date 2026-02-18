'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/get-current-user'
import {
  createIdeaStreamThreadSchema,
  postIdeaStreamMessageSchema,
  editIdeaStreamMessageSchema,
  finalizeIdeaStreamThreadsSchema,
} from '@/lib/validations/schemas'
import * as ideaStreamService from '@/lib/services/idea-stream.service'

export type IdeaStreamActionResult =
  | { success: true; data?: unknown }
  | { success: false; error: string }

export async function createIdeaStreamThreadAction(
  projectId: string,
  formData: FormData
): Promise<IdeaStreamActionResult> {
  const userId = await getCurrentUserId()
  const content = (formData.get('content') as string) ?? ''
  const title = (formData.get('title') as string) || undefined
  const parsed = createIdeaStreamThreadSchema.safeParse({
    projectId,
    content,
    title: title || null,
  })
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Validation failed'
    return { success: false, error: msg }
  }
  const result = await ideaStreamService.createThreadWithFirstMessage(
    parsed.data.projectId,
    userId,
    parsed.data.content,
    parsed.data.title ?? undefined
  )
  if (!result.success) return { success: false, error: result.error }
  revalidatePath(`/projects/${projectId}/idea-stream`)
  return { success: true, data: { thread: result.data.thread, message: result.data.message } }
}

export async function postIdeaStreamMessageAction(
  projectId: string,
  threadId: string,
  formData: FormData
): Promise<IdeaStreamActionResult> {
  const userId = await getCurrentUserId()
  const content = (formData.get('content') as string) ?? ''
  const parentMessageId = (formData.get('parentMessageId') as string) || undefined
  const parsed = postIdeaStreamMessageSchema.safeParse({
    projectId,
    threadId,
    content,
    parentMessageId: parentMessageId || null,
  })
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Validation failed'
    return { success: false, error: msg }
  }
  const result = await ideaStreamService.postMessage(
    parsed.data.projectId,
    parsed.data.threadId,
    userId,
    parsed.data.content,
    parsed.data.parentMessageId ?? undefined
  )
  if (!result.success) return { success: false, error: result.error }
  revalidatePath(`/projects/${projectId}/idea-stream`)
  revalidatePath(`/projects/${projectId}/idea-stream/${threadId}`)
  return { success: true, data: result.data }
}

export async function editIdeaStreamMessageAction(
  messageId: string,
  formData: FormData
): Promise<IdeaStreamActionResult> {
  const userId = await getCurrentUserId()
  const content = (formData.get('content') as string) ?? ''
  const parsed = editIdeaStreamMessageSchema.safeParse({ messageId, content })
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Validation failed'
    return { success: false, error: msg }
  }
  const result = await ideaStreamService.editMessage(
    parsed.data.messageId,
    userId,
    parsed.data.content
  )
  if (!result.success) return { success: false, error: result.error }
  return { success: true, data: result.data }
}

export async function deleteIdeaStreamMessageAction(
  messageId: string
): Promise<IdeaStreamActionResult> {
  const userId = await getCurrentUserId()
  const result = await ideaStreamService.deleteMessage(messageId, userId)
  if (!result.success) return { success: false, error: result.error }
  return { success: true, data: result.data }
}

export async function markIdeaStreamThreadReadAction(
  projectId: string,
  threadId: string
): Promise<IdeaStreamActionResult> {
  const userId = await getCurrentUserId()
  const result = await ideaStreamService.markThreadRead(
    projectId,
    threadId,
    userId
  )
  if (!result.success) return { success: false, error: result.error }
  return { success: true }
}

export async function finalizeIdeaStreamThreadsAction(
  projectId: string,
  formData: FormData
): Promise<void> {
  const userId = await getCurrentUserId()
  const threadIdsRaw = formData.get('threadIds')
  const threadIds = threadIdsRaw
    ? (JSON.parse(threadIdsRaw as string) as string[])
    : []
  const title = (formData.get('title') as string) || undefined
  const authorDisplay = (formData.get('authorDisplay') as string) || undefined
  const parsed = finalizeIdeaStreamThreadsSchema.safeParse({
    projectId,
    threadIds,
    title: title ?? null,
    authorDisplay: authorDisplay ?? null,
  })
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Validation failed'
    redirect(
      `/projects/${projectId}/idea-stream?error=${encodeURIComponent(msg)}`
    )
  }
  const result = await ideaStreamService.finalizeThreads(
    parsed.data.projectId,
    userId,
    parsed.data.threadIds,
    parsed.data.title ?? undefined,
    parsed.data.authorDisplay ?? undefined
  )
  if (!result.success) {
    redirect(
      `/projects/${projectId}/idea-stream?error=${encodeURIComponent(result.error)}`
    )
  }
  revalidatePath(`/projects/${projectId}/brainstorms`)
  revalidatePath(`/projects/${projectId}/overview`)
  redirect(
    `/projects/${projectId}/brainstorms/${result.data.id}/synthesize`
  )
}
