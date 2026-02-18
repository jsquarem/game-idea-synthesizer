import { z } from 'zod'
import * as ideaStreamService from '@/lib/services/idea-stream.service'
import type { ToolDefinition, ToolContext } from './types'
import type { ServiceResult } from '@/lib/services/types'

const listIdeaThreadsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
})
type ListIdeaThreadsParams = z.infer<typeof listIdeaThreadsSchema>

const getThreadMessagesSchema = z.object({
  threadId: z.string(),
})
type GetThreadMessagesParams = z.infer<typeof getThreadMessagesSchema>

const createIdeaThreadSchema = z.object({
  content: z.string().min(1),
  title: z.string().optional(),
})
type CreateIdeaThreadParams = z.infer<typeof createIdeaThreadSchema>

const postIdeaMessageSchema = z.object({
  threadId: z.string(),
  content: z.string().min(1),
  parentMessageId: z.string().optional(),
})
type PostIdeaMessageParams = z.infer<typeof postIdeaMessageSchema>

const finalizeThreadsToBrainstormSchema = z.object({
  threadIds: z.array(z.string()).min(1),
  title: z.string().optional(),
  authorDisplay: z.string().optional(),
})
type FinalizeThreadsToBrainstormParams = z.infer<typeof finalizeThreadsToBrainstormSchema>

export const ideaStreamTools: ToolDefinition[] = [
  {
    name: 'list_idea_threads',
    description: 'List idea stream threads for the current project. Returns threads with unread counts and latest message preview.',
    category: 'idea-stream',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        cursor: { type: 'string', description: 'Pagination cursor for fetching older threads' },
        limit: { type: 'number', description: 'Number of threads to return (max 100)' },
      },
    },
    parameterSchema: listIdeaThreadsSchema,
    requiresConfirmation: false,
    execute: async (params: ListIdeaThreadsParams, context: ToolContext) => {
      return ideaStreamService.getThreadList(
        context.projectId,
        context.userId,
        params.cursor || params.limit ? { cursor: params.cursor, limit: params.limit } : undefined
      )
    },
    describe: (_params: ListIdeaThreadsParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to list idea threads: ${result.error}`
      const data = result.data as unknown[]
      return `Found ${data.length} idea threads`
    },
  } as ToolDefinition,

  {
    name: 'get_thread_messages',
    description: 'Get all messages in an idea stream thread, including author info and read status.',
    category: 'idea-stream',
    mutationType: 'read',
    parameters: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'The thread ID to get messages for' },
      },
      required: ['threadId'],
    },
    parameterSchema: getThreadMessagesSchema,
    requiresConfirmation: false,
    execute: async (params: GetThreadMessagesParams, context: ToolContext) => {
      return ideaStreamService.getThreadMessages(
        context.projectId,
        params.threadId,
        context.userId
      )
    },
    describe: (params: GetThreadMessagesParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to get thread messages: ${result.error}`
      const data = result.data as unknown[]
      return `Retrieved ${data.length} messages from thread ${params.threadId}`
    },
  } as ToolDefinition,

  {
    name: 'create_idea_thread',
    description: 'Create a new idea stream thread with an initial message. Optionally provide a title.',
    category: 'idea-stream',
    mutationType: 'create',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The initial message content for the thread' },
        title: { type: 'string', description: 'Optional thread title' },
      },
      required: ['content'],
    },
    parameterSchema: createIdeaThreadSchema,
    requiresConfirmation: false,
    execute: async (params: CreateIdeaThreadParams, context: ToolContext) => {
      return ideaStreamService.createThreadWithFirstMessage(
        context.projectId,
        context.userId,
        params.content,
        params.title
      )
    },
    describe: (params: CreateIdeaThreadParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to create idea thread: ${result.error}`
      const title = params.title ?? params.content.slice(0, 50)
      return `Created idea thread "${title}${!params.title && params.content.length > 50 ? '...' : ''}"`
    },
  } as ToolDefinition,

  {
    name: 'post_idea_message',
    description: 'Post a new message to an existing idea stream thread. Optionally reply to a specific message.',
    category: 'idea-stream',
    mutationType: 'create',
    parameters: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'The thread to post the message to' },
        content: { type: 'string', description: 'The message content' },
        parentMessageId: { type: 'string', description: 'ID of the message to reply to (optional)' },
      },
      required: ['threadId', 'content'],
    },
    parameterSchema: postIdeaMessageSchema,
    requiresConfirmation: false,
    execute: async (params: PostIdeaMessageParams, context: ToolContext) => {
      return ideaStreamService.postMessage(
        context.projectId,
        params.threadId,
        context.userId,
        params.content,
        params.parentMessageId
      )
    },
    describe: (params: PostIdeaMessageParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to post message: ${result.error}`
      return params.parentMessageId
        ? `Posted reply in thread ${params.threadId}`
        : `Posted message in thread ${params.threadId}`
    },
  } as ToolDefinition,

  {
    name: 'finalize_threads_to_brainstorm',
    description: 'Finalize one or more idea threads into a brainstorm session. This captures all thread content as a permanent brainstorm record.',
    category: 'idea-stream',
    mutationType: 'action',
    parameters: {
      type: 'object',
      properties: {
        threadIds: { type: 'string', description: 'Array of thread IDs to finalize', items: { type: 'string' } },
        title: { type: 'string', description: 'Optional title for the resulting brainstorm session' },
        authorDisplay: { type: 'string', description: 'Optional author display name' },
      },
      required: ['threadIds'],
    },
    parameterSchema: finalizeThreadsToBrainstormSchema,
    requiresConfirmation: true,
    execute: async (params: FinalizeThreadsToBrainstormParams, context: ToolContext) => {
      return ideaStreamService.finalizeThreads(
        context.projectId,
        context.userId,
        params.threadIds,
        params.title,
        params.authorDisplay
      )
    },
    describe: (params: FinalizeThreadsToBrainstormParams, result: ServiceResult<unknown>) => {
      if (!result.success) return `Failed to finalize threads: ${result.error}`
      return `Finalized ${params.threadIds.length} threads into a brainstorm session`
    },
    revalidatePaths: (context: ToolContext) => [
      `/projects/${context.projectId}`,
      `/projects/${context.projectId}/brainstorms`,
    ],
  } as ToolDefinition,
]
