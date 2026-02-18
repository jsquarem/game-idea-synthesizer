import { prisma } from '@/lib/db'
import type {
  IdeaStreamThread,
  IdeaStreamMessage,
  IdeaStreamThreadRead,
  AppUser,
} from '@prisma/client'
export type CreateIdeaStreamThreadInput = {
  projectId: string
  createdByUserId: string
  title?: string | null
}

export type CreateIdeaStreamMessageInput = {
  projectId: string
  threadId: string
  authorUserId: string
  content: string
  parentMessageId?: string | null
}

export type ThreadListItem = {
  id: string
  projectId: string
  createdByUserId: string
  title: string | null
  createdAt: Date
  updatedAt: Date
  lastMessagePreview: string | null
  lastActivityAt: Date
  unread: boolean
  unreadCount: number
}

export type MessageWithAuthor = IdeaStreamMessage & {
  author: Pick<AppUser, 'id' | 'displayName' | 'avatarColor'>
}

export type ThreadWithMessagesAndAuthors = IdeaStreamThread & {
  messages: MessageWithAuthor[]
  createdBy: Pick<AppUser, 'id' | 'displayName' | 'avatarColor'>
}

export async function createThread(
  data: CreateIdeaStreamThreadInput
): Promise<IdeaStreamThread> {
  return prisma.ideaStreamThread.create({
    data: {
      projectId: data.projectId,
      createdByUserId: data.createdByUserId,
      title: data.title ?? null,
    },
  })
}

export async function createMessage(
  data: CreateIdeaStreamMessageInput
): Promise<IdeaStreamMessage> {
  const message = await prisma.ideaStreamMessage.create({
    data: {
      projectId: data.projectId,
      threadId: data.threadId,
      authorUserId: data.authorUserId,
      content: data.content,
      parentMessageId: data.parentMessageId ?? null,
    },
  })
  await prisma.ideaStreamThread.update({
    where: { id: data.threadId },
    data: { updatedAt: new Date() },
  })
  return message
}

export async function findThreadById(
  threadId: string
): Promise<IdeaStreamThread | null> {
  return prisma.ideaStreamThread.findUnique({ where: { id: threadId } })
}

export async function findMessageById(
  messageId: string
): Promise<IdeaStreamMessage | null> {
  return prisma.ideaStreamMessage.findUnique({ where: { id: messageId } })
}

export async function listThreadsForProject(
  projectId: string,
  userId: string,
  params?: { cursor?: string; limit?: number }
): Promise<ThreadListItem[]> {
  const limit = Math.min(params?.limit ?? 30, 100)
  const threads = await prisma.ideaStreamThread.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
    take: limit + 1,
    ...(params?.cursor
      ? { cursor: { id: params.cursor }, skip: 1 }
      : {}),
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, createdAt: true, updatedAt: true },
      },
      reads: { where: { userId }, take: 1 },
    },
  })

  const hasMore = threads.length > limit
  const list = hasMore ? threads.slice(0, limit) : threads

  const threadIds = list.map((t) => t.id)
  const lastReadMap = await prisma.ideaStreamThreadRead.findMany({
    where: { threadId: { in: threadIds }, userId },
  }).then((rows) => new Map(rows.map((r) => [r.threadId, r.lastReadAt])))

  const unreadCounts = await Promise.all(
    list.map((t) =>
      prisma.ideaStreamMessage.count({
        where: {
          threadId: t.id,
          ...(lastReadMap.get(t.id)
            ? { updatedAt: { gt: lastReadMap.get(t.id)! } }
            : {}),
        },
      })
    )
  )

  return list.map((t, i) => {
    const lastMsg = t.messages[0] as { content: string } | undefined
    const lastRead = lastReadMap.get(t.id)
    const lastActivityAt = t.updatedAt
    return {
      id: t.id,
      projectId: t.projectId,
      createdByUserId: t.createdByUserId,
      title: t.title,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      lastMessagePreview: lastMsg ? truncatePreview(lastMsg.content) : null,
      lastActivityAt,
      unread: lastRead ? lastActivityAt > lastRead : true,
      unreadCount: unreadCounts[i] ?? 0,
    }
  })
}

function truncatePreview(content: string, max = 80): string {
  const trimmed = content.trim().replace(/\s+/g, ' ')
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max) + '…'
}

export async function listMessages(
  threadId: string,
  since?: Date
): Promise<(IdeaStreamMessage & { author: Pick<AppUser, 'id' | 'displayName' | 'avatarColor'> })[]> {
  return prisma.ideaStreamMessage.findMany({
    where: {
      threadId,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, displayName: true, avatarColor: true } },
    },
  })
}

export async function updateMessageContent(
  messageId: string,
  content: string
): Promise<IdeaStreamMessage> {
  return prisma.ideaStreamMessage.update({
    where: { id: messageId },
    data: { content, editedAt: new Date(), updatedAt: new Date() },
  })
}

export async function softDeleteMessage(
  messageId: string,
  deletedByUserId: string
): Promise<IdeaStreamMessage> {
  return prisma.ideaStreamMessage.update({
    where: { id: messageId },
    data: {
      deletedAt: new Date(),
      deletedByUserId: deletedByUserId,
      updatedAt: new Date(),
    },
  })
}

export async function upsertThreadRead(
  projectId: string,
  threadId: string,
  userId: string,
  lastReadAt?: Date
): Promise<IdeaStreamThreadRead> {
  const at = lastReadAt ?? new Date()
  return prisma.ideaStreamThreadRead.upsert({
    where: {
      threadId_userId: { threadId, userId },
    },
    create: { projectId, threadId, userId, lastReadAt: at },
    update: { lastReadAt: at },
  })
}

export async function getThreadsWithMessagesForFinalize(
  threadIds: string[]
): Promise<ThreadWithMessagesAndAuthors[]> {
  if (threadIds.length === 0) return []
  return prisma.ideaStreamThread.findMany({
    where: { id: { in: threadIds } },
    orderBy: { createdAt: 'asc' },
    include: {
      createdBy: { select: { id: true, displayName: true, avatarColor: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, displayName: true, avatarColor: true } },
        },
      },
    },
  })
}

export async function isProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  const m = await prisma.projectMembership.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  return !!m
}
