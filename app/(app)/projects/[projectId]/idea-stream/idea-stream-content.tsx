'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/page-header'
import {
  createIdeaStreamThreadAction,
  postIdeaStreamMessageAction,
  editIdeaStreamMessageAction,
  deleteIdeaStreamMessageAction,
  markIdeaStreamThreadReadAction,
  finalizeIdeaStreamThreadsAction,
} from '@/app/actions/idea-stream.actions'
import { MessageCircle, Send, Reply, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { avatarColorFromUser, getInitials } from '@/lib/avatar'

const POLL_INTERVAL_MS = 2000

type ThreadListItem = {
  id: string
  projectId: string
  createdByUserId: string
  title: string | null
  createdAt: string
  updatedAt: string
  lastMessagePreview: string | null
  lastActivityAt: string
  unread: boolean
  unreadCount: number
}

type MessageItem = {
  id: string
  threadId: string
  parentMessageId: string | null
  authorUserId: string
  content: string
  createdAt: string
  updatedAt: string
  editedAt: string | null
  deletedAt: string | null
  author: { id: string; displayName: string | null; avatarColor: string | null }
}

export function IdeaStreamContent({ projectId }: { projectId: string }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [threads, setThreads] = useState<ThreadListItem[]>([])
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set())
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null)
  const [replyToSnippet, setReplyToSnippet] = useState<string>('')
  const [draftContent, setDraftContent] = useState('')
  const [newThreadContent, setNewThreadContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const fetchUserId = useCallback(async () => {
    const res = await fetch('/api/me')
    if (!res.ok) return
    const data = await res.json()
    if (data.userId) setUserId(data.userId)
  }, [])

  const fetchThreads = useCallback(async () => {
    if (!userId) return
    const res = await fetch(
      `/api/projects/${projectId}/idea-stream/threads?limit=50`,
      { headers: { 'X-User-Id': userId } }
    )
    if (!res.ok) return
    const data = await res.json()
    setThreads(data)
  }, [projectId, userId])

  const fetchMessages = useCallback(async () => {
    if (!userId || !activeThreadId) return
    const res = await fetch(
      `/api/projects/${projectId}/idea-stream/threads/${activeThreadId}/messages`,
      { headers: { 'X-User-Id': userId } }
    )
    if (!res.ok) return
    const data = await res.json()
    setMessages(data)
  }, [projectId, userId, activeThreadId])

  useEffect(() => {
    fetchUserId()
  }, [fetchUserId])

  useEffect(() => {
    if (!userId) return
    fetchThreads()
    const t = setInterval(fetchThreads, POLL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [userId, fetchThreads])

  useEffect(() => {
    if (!userId || !activeThreadId) return
    markIdeaStreamThreadReadAction(projectId, activeThreadId).catch(() => {})
    fetchMessages()
    const t = setInterval(fetchMessages, POLL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [userId, activeThreadId, projectId, fetchMessages])

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newThreadContent.trim()
    if (!content || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData()
    formData.set('content', content)
    const result = await createIdeaStreamThreadAction(projectId, formData)
    setIsSubmitting(false)
    if (result.success) {
      setNewThreadContent('')
      fetchThreads()
      if (result.data && typeof result.data === 'object' && 'thread' in result.data) {
        const thread = (result.data as { thread: { id: string } }).thread
        setActiveThreadId(thread.id)
      }
    } else setError(result.error)
  }

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = draftContent.trim()
    if (!content || !activeThreadId || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData()
    formData.set('content', content)
    if (replyToMessageId) {
      formData.set('parentMessageId', replyToMessageId)
    }
    const result = await postIdeaStreamMessageAction(
      projectId,
      activeThreadId,
      formData
    )
    setIsSubmitting(false)
    if (result.success) {
      setDraftContent('')
      setReplyToMessageId(null)
      setReplyToSnippet('')
      fetchMessages()
      fetchThreads()
    } else setError(result.error)
  }

  const handleEditMessage = async (messageId: string) => {
    const content = editingContent.trim()
    if (!content || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData()
    formData.set('content', content)
    const result = await editIdeaStreamMessageAction(messageId, formData)
    setIsSubmitting(false)
    if (result.success) {
      setEditingMessageId(null)
      setEditingContent('')
      fetchMessages()
      fetchThreads()
    } else setError(result.error)
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (isSubmitting) return
    if (!confirm('Delete this message?')) return
    setIsSubmitting(true)
    setError(null)
    const result = await deleteIdeaStreamMessageAction(messageId)
    setIsSubmitting(false)
    if (result.success) {
      fetchMessages()
      fetchThreads()
    } else setError(result.error)
  }

  const handleFinalize = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedThreadIds.size === 0 || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      await finalizeIdeaStreamThreadsAction(projectId, formData)
    } catch {
      setIsSubmitting(false)
    }
  }

  const toggleThreadSelection = (threadId: string) => {
    setSelectedThreadIds((prev) => {
      const next = new Set(prev)
      if (next.has(threadId)) next.delete(threadId)
      else next.add(threadId)
      return next
    })
  }

  const activeThread = threads.find((t) => t.id === activeThreadId)

  return (
    <div className="flex h-full min-h-0 gap-4">
      <Card className="flex w-[360px] min-w-[280px] shrink-0 flex-col">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Idea Stream</h2>
            <Button size="sm" asChild>
              <a href={`/projects/${projectId}/idea-stream#new-thread`}>New Thread</a>
            </Button>
          </div>
          <form
            id="new-thread"
            onSubmit={handleCreateThread}
            className="mt-2 flex gap-2"
          >
            <Textarea
              placeholder="Start a new thread..."
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
              rows={2}
              className="min-h-0 resize-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newThreadContent.trim() || isSubmitting}
              aria-label="Post new thread"
            >
              <Send className="size-4" />
            </Button>
          </form>
          {error && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-2 border-b px-3 py-2 hover:bg-muted/50',
                    activeThreadId === thread.id && 'bg-muted'
                  )}
                  onClick={() => setActiveThreadId(thread.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedThreadIds.has(thread.id)}
                    onChange={() => toggleThreadSelection(thread.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select thread ${thread.id}`}
                    className="mt-1 size-4 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {thread.title || thread.lastMessagePreview || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(thread.lastActivityAt).toLocaleString()}
                      {thread.unread && (
                        <span className="ml-1 inline-block size-2 rounded-full bg-primary" />
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <form className="border-t p-2" onSubmit={handleFinalize}>
            <input
              type="hidden"
              name="threadIds"
              value={JSON.stringify([...selectedThreadIds])}
              readOnly
            />
            <Button
              type="submit"
              className="w-full"
              disabled={selectedThreadIds.size === 0 || isSubmitting}
            >
              Finalize + Synthesize ({selectedThreadIds.size} selected)
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="flex min-w-0 flex-1 flex-col">
        {activeThreadId ? (
          <>
            <CardHeader className="border-b px-4 py-2">
              <h3 className="truncate font-medium">
                {activeThread?.title ||
                  activeThread?.lastMessagePreview ||
                  'Thread'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Created {activeThread ? new Date(activeThread.createdAt).toLocaleString() : ''}
              </p>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="space-y-3 p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3',
                      msg.parentMessageId && 'ml-6 border-l-2 border-muted pl-3'
                    )}
                  >
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: avatarColorFromUser(msg.author.id, msg.author.avatarColor) }}
                    >
                      {getInitials(msg.author.displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {msg.author.displayName?.trim() ||
                            (activeThread &&
                            msg.authorUserId === activeThread.createdByUserId
                              ? 'Creator'
                              : 'Responder')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleString()}
                          {msg.editedAt && ' (edited)'}
                        </span>
                        {msg.authorUserId === userId && !msg.deletedAt && (
                          <span className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() => {
                                setReplyToMessageId(msg.id)
                                setReplyToSnippet(msg.content.slice(0, 50))
                              }}
                              aria-label="Reply"
                            >
                              <Reply className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() => {
                                setEditingMessageId(msg.id)
                                setEditingContent(msg.content)
                              }}
                              aria-label="Edit"
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-destructive"
                              onClick={() => handleDeleteMessage(msg.id)}
                              aria-label="Delete"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </span>
                        )}
                      </div>
                      {editingMessageId === msg.id ? (
                        <form
                          className="mt-1 flex gap-2"
                          onSubmit={(e) => {
                            e.preventDefault()
                            handleEditMessage(msg.id)
                          }}
                        >
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={2}
                            className="min-h-0 flex-1 resize-none"
                          />
                          <Button type="submit" size="sm">
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMessageId(null)
                              setEditingContent('')
                            }}
                          >
                            Cancel
                          </Button>
                        </form>
                      ) : msg.deletedAt ? (
                        <p className="text-sm italic text-muted-foreground">
                          Message deleted
                        </p>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-3">
              {replyToMessageId && (
                <div className="mb-2 flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-sm">
                  <span className="text-muted-foreground">
                    Replying to: {replyToSnippet}…
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyToMessageId(null)
                      setReplyToSnippet('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <form onSubmit={handlePostMessage} className="flex gap-2">
                <Textarea
                  placeholder="Write a message..."
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  rows={2}
                  className="min-h-0 flex-1 resize-none"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draftContent.trim() || isSubmitting}
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
            <MessageCircle className="size-12" />
            <p>Select a thread or start a new one</p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
