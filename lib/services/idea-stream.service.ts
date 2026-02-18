import type { IdeaStreamThread, IdeaStreamMessage, BrainstormSession } from '@prisma/client'
import type { ServiceResult } from './types'
import { findProjectById } from '../repositories/project.repository'
import {
  createThread as createThreadRepo,
  createMessage as createMessageRepo,
  findThreadById,
  findMessageById,
  listThreadsForProject,
  listRecentThreadsForOverview,
  listMessagesWithReadBy,
  updateMessageContent,
  softDeleteMessage,
  upsertThreadRead,
  getThreadsWithMessagesForFinalize,
  isProjectMember,
  type ThreadListItem,
  type RecentThreadForOverview,
  type MessageWithAuthorAndReadBy,
  type ThreadWithMessagesAndAuthors,
} from '../repositories/idea-stream.repository'
import { createBrainstorm } from '../repositories/brainstorm.repository'
import { prisma } from '@/lib/db'
import { publish } from '@/lib/idea-stream-events'

const MAX_MESSAGE_LENGTH = 10_000

export async function ensureUserCanAccessProject(
  projectId: string,
  userId: string
): Promise<ServiceResult<void>> {
  const project = await findProjectById(projectId)
  if (!project)
    return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  const member = await isProjectMember(projectId, userId)
  if (!member) {
    const anyMembers = await prisma.projectMembership.count({
      where: { projectId },
    })
    if (anyMembers > 0)
      return { success: false, error: 'Not a project member', code: 'FORBIDDEN' }
  }
  return { success: true, data: undefined }
}

export async function createThreadWithFirstMessage(
  projectId: string,
  userId: string,
  content: string,
  title?: string | null
): Promise<
  ServiceResult<{ thread: IdeaStreamThread; message: IdeaStreamMessage }>
> {
  const access = await ensureUserCanAccessProject(projectId, userId)
  if (!access.success) return access

  const trimmed = content.trim()
  if (!trimmed)
    return { success: false, error: 'Content is required', code: 'VALIDATION' }
  if (trimmed.length > MAX_MESSAGE_LENGTH)
    return {
      success: false,
      error: `Content must be at most ${MAX_MESSAGE_LENGTH} characters`,
      code: 'VALIDATION',
    }

  try {
    const thread = await createThreadRepo({
      projectId,
      createdByUserId: userId,
      title: title ?? null,
    })
    const message = await createMessageRepo({
      projectId,
      threadId: thread.id,
      authorUserId: userId,
      content: trimmed,
    })
    publish(projectId, { type: 'threads_updated' })
    publish(projectId, { type: 'messages_updated', threadId: thread.id })
    return { success: true, data: { thread, message } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create thread',
      code: 'INTERNAL',
    }
  }
}

export async function postMessage(
  projectId: string,
  threadId: string,
  userId: string,
  content: string,
  parentMessageId?: string | null
): Promise<ServiceResult<IdeaStreamMessage>> {
  const access = await ensureUserCanAccessProject(projectId, userId)
  if (!access.success) return access

  const thread = await findThreadById(threadId)
  if (!thread || thread.projectId !== projectId)
    return { success: false, error: 'Thread not found', code: 'NOT_FOUND' }

  const trimmed = content.trim()
  if (!trimmed)
    return { success: false, error: 'Content is required', code: 'VALIDATION' }
  if (trimmed.length > MAX_MESSAGE_LENGTH)
    return {
      success: false,
      error: `Content must be at most ${MAX_MESSAGE_LENGTH} characters`,
      code: 'VALIDATION',
    }

  try {
    const message = await createMessageRepo({
      projectId,
      threadId,
      authorUserId: userId,
      content: trimmed,
      parentMessageId: parentMessageId ?? null,
    })
    publish(projectId, { type: 'threads_updated' })
    publish(projectId, { type: 'messages_updated', threadId })
    return { success: true, data: message }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to post message',
      code: 'INTERNAL',
    }
  }
}

export async function editMessage(
  messageId: string,
  userId: string,
  content: string
): Promise<ServiceResult<IdeaStreamMessage>> {
  const message = await findMessageById(messageId)
  if (!message)
    return { success: false, error: 'Message not found', code: 'NOT_FOUND' }
  if (message.authorUserId !== userId)
    return { success: false, error: 'Only the author can edit', code: 'FORBIDDEN' }
  if (message.deletedAt)
    return { success: false, error: 'Cannot edit deleted message', code: 'VALIDATION' }

  const trimmed = content.trim()
  if (!trimmed)
    return { success: false, error: 'Content is required', code: 'VALIDATION' }
  if (trimmed.length > MAX_MESSAGE_LENGTH)
    return {
      success: false,
      error: `Content must be at most ${MAX_MESSAGE_LENGTH} characters`,
      code: 'VALIDATION',
    }

  try {
    const updated = await updateMessageContent(messageId, trimmed)
    await prisma.ideaStreamThread.update({
      where: { id: message.threadId },
      data: { updatedAt: new Date() },
    })
    publish(message.projectId, { type: 'threads_updated' })
    publish(message.projectId, { type: 'messages_updated', threadId: message.threadId })
    return { success: true, data: updated }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to edit message',
      code: 'INTERNAL',
    }
  }
}

export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<ServiceResult<IdeaStreamMessage>> {
  const message = await findMessageById(messageId)
  if (!message)
    return { success: false, error: 'Message not found', code: 'NOT_FOUND' }
  if (message.authorUserId !== userId)
    return { success: false, error: 'Only the author can delete', code: 'FORBIDDEN' }
  if (message.deletedAt)
    return { success: true, data: message }

  try {
    const updated = await softDeleteMessage(messageId, userId)
    await prisma.ideaStreamThread.update({
      where: { id: message.threadId },
      data: { updatedAt: new Date() },
    })
    publish(message.projectId, { type: 'threads_updated' })
    publish(message.projectId, { type: 'messages_updated', threadId: message.threadId })
    return { success: true, data: updated }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to delete message',
      code: 'INTERNAL',
    }
  }
}

export async function markThreadRead(
  projectId: string,
  threadId: string,
  userId: string,
  lastReadAt?: Date
): Promise<ServiceResult<void>> {
  const access = await ensureUserCanAccessProject(projectId, userId)
  if (!access.success) return access

  const thread = await findThreadById(threadId)
  if (!thread || thread.projectId !== projectId)
    return { success: false, error: 'Thread not found', code: 'NOT_FOUND' }

  try {
    await upsertThreadRead(projectId, threadId, userId, lastReadAt)
    publish(projectId, { type: 'messages_updated', threadId })
    return { success: true, data: undefined }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to mark read',
      code: 'INTERNAL',
    }
  }
}

export async function getThreadList(
  projectId: string,
  userId: string,
  params?: { cursor?: string; limit?: number }
): Promise<ServiceResult<ThreadListItem[]>> {
  const access = await ensureUserCanAccessProject(projectId, userId)
  if (!access.success) return access

  try {
    const list = await listThreadsForProject(projectId, userId, params)
    return { success: true, data: list }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list threads',
      code: 'INTERNAL',
    }
  }
}

export async function getRecentThreadActivity(
  projectId: string,
  limit: number,
  cursor?: string
): Promise<ServiceResult<RecentThreadForOverview[]>> {
  const project = await findProjectById(projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const list = await listRecentThreadsForOverview(projectId, limit, cursor)
    return { success: true, data: list }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to load recent activity',
      code: 'INTERNAL',
    }
  }
}

export async function getIdeaStreamUnreadCount(
  projectId: string,
  userId: string
): Promise<ServiceResult<number>> {
  const access = await ensureUserCanAccessProject(projectId, userId)
  if (!access.success) return access
  try {
    const threads = await listThreadsForProject(projectId, userId, { limit: 100 })
    const total = threads.reduce((sum, t) => sum + t.unreadCount, 0)
    return { success: true, data: total }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to get unread count',
      code: 'INTERNAL',
    }
  }
}

export async function getThreadMessages(
  projectId: string,
  threadId: string,
  userId: string,
  since?: Date
): Promise<ServiceResult<MessageWithAuthorAndReadBy[]>> {
  const access = await ensureUserCanAccessProject(projectId, userId)
  if (!access.success) return access

  const thread = await findThreadById(threadId)
  if (!thread || thread.projectId !== projectId)
    return { success: false, error: 'Thread not found', code: 'NOT_FOUND' }

  try {
    const messages = await listMessagesWithReadBy(threadId, since)
    return { success: true, data: messages }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to load messages',
      code: 'INTERNAL',
    }
  }
}

function authorDisplay(author: { displayName: string | null }): string {
  return author.displayName?.trim() || 'Unknown'
}

function buildFinalizeMarkdown(
  projectName: string,
  threads: ThreadWithMessagesAndAuthors[],
  generatedAt: Date
): string {
  const lines: string[] = [
    `# Idea Stream Finalize — ${projectName}`,
    `Generated: ${generatedAt.toISOString()}`,
    `Threads: ${threads.length}`,
    '',
    '---',
    '',
  ]

  for (const thread of threads) {
    const title =
      thread.title?.trim() ||
      (thread.messages[0] && !thread.messages[0].deletedAt
        ? thread.messages[0].content.trim().slice(0, 60) + (thread.messages[0].content.length > 60 ? '…' : '')
        : 'Untitled')
    lines.push(`## Thread — ${title}`)
    lines.push(`Created by: ${authorDisplay(thread.createdBy)}`)
    lines.push(`Created at: ${thread.createdAt.toISOString()}`)
    lines.push('')

    for (const msg of thread.messages) {
      const name = authorDisplay(msg.author)
      const time = msg.createdAt.toISOString()
      if (msg.parentMessageId) {
        if (msg.deletedAt) {
          lines.push(`  - ↳ reply by ${name}: (deleted)`)
        } else {
          const edited = msg.editedAt ? ' (edited)' : ''
          lines.push(`  - ↳ reply by ${name} @ ${time}: ${msg.content}${edited}`)
        }
      } else {
        if (msg.deletedAt) {
          lines.push(`- ${time} ${name}: (deleted)`)
        } else {
          const edited = msg.editedAt ? ' (edited)' : ''
          lines.push(`- ${time} ${name}: ${msg.content}${edited}`)
        }
      }
    }
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

export async function finalizeThreads(
  projectId: string,
  userId: string,
  threadIds: string[],
  title?: string | null,
  authorDisplay?: string | null
): Promise<ServiceResult<BrainstormSession>> {
  const access = await ensureUserCanAccessProject(projectId, userId)
  if (!access.success) return access

  if (!threadIds.length)
    return { success: false, error: 'At least one thread is required', code: 'VALIDATION' }

  try {
    const threadsUnsorted = await getThreadsWithMessagesForFinalize(threadIds)
    if (threadsUnsorted.length === 0)
      return { success: false, error: 'No valid threads found', code: 'NOT_FOUND' }
    const orderMap = new Map(threadIds.map((id, i) => [id, i]))
    const threads = [...threadsUnsorted].sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
    )

    const project = await findProjectById(projectId)
    const projectName = project?.name ?? 'Project'
    const generatedAt = new Date()
    const content = buildFinalizeMarkdown(projectName, threads, generatedAt)
    const sessionTitle =
      title?.trim() ||
      `Idea Stream — ${generatedAt.toISOString().slice(0, 10)}`
    const author = authorDisplay?.trim() || undefined

    const session = await createBrainstorm({
      projectId,
      title: sessionTitle,
      source: 'idea-stream',
      content,
      author: author ?? undefined,
      sourceThreadIds: threadIds,
    })

    return { success: true, data: session }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to finalize threads',
      code: 'INTERNAL',
    }
  }
}
