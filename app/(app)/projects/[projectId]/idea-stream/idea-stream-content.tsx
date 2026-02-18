'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  createIdeaStreamThreadAction,
  postIdeaStreamMessageAction,
  editIdeaStreamMessageAction,
  deleteIdeaStreamMessageAction,
  markIdeaStreamThreadReadAction,
  finalizeIdeaStreamThreadsAction,
} from '@/app/actions/idea-stream.actions'
import { ActionPlanSidebar } from './action-plan-sidebar'
import { MessageCircle, Send, Reply, Pencil, Trash2, RefreshCw, Check, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { avatarColorFromUser, getInitials } from '@/lib/avatar'

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

type ReadByUser = { id: string; displayName: string | null; avatarColor: string | null }

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
  readBy: ReadByUser[]
}

export function IdeaStreamContent({ projectId }: { projectId: string }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [threads, setThreads] = useState<ThreadListItem[]>([])
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set())
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null)
  const [replyToSnippet, setReplyToSnippet] = useState<string>('')
  const [replyToAuthor, setReplyToAuthor] = useState<string | null>(null)
  const [draftContent, setDraftContent] = useState('')
  const [newThreadContent, setNewThreadContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [sseReconnect, setSseReconnect] = useState(0)
  const [showActionPlan, setShowActionPlan] = useState(false)
  const [actionPlanThreadIds, setActionPlanThreadIds] = useState<string[]>([])
  const activeThreadIdRef = useRef(activeThreadId)
  activeThreadIdRef.current = activeThreadId

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
  }, [userId, fetchThreads])

  useEffect(() => {
    if (!userId || !activeThreadId) return
    markIdeaStreamThreadReadAction(projectId, activeThreadId).catch(() => {})
    fetchMessages()
  }, [userId, activeThreadId, projectId, fetchMessages])

  const FALLBACK_POLL_MS = 25_000
  useEffect(() => {
    if (!userId) return
    const poll = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchThreads()
        if (activeThreadIdRef.current) fetchMessages()
      }
    }
    const t = setInterval(poll, FALLBACK_POLL_MS)
    return () => clearInterval(t)
  }, [userId, activeThreadId, fetchThreads, fetchMessages])

  useEffect(() => {
    if (!userId) return
    const url = `/api/projects/${projectId}/idea-stream/events`
    const es = new EventSource(url)
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as { type: string; threadId?: string }
        if (event.type === 'threads_updated') fetchThreads()
        if (event.type === 'messages_updated' && event.threadId === activeThreadIdRef.current) fetchMessages()
      } catch {
        // ignore parse errors (e.g. keepalive comment)
      }
    }
    es.onerror = () => {
      es.close()
      const delay = Math.min(1000 * 2 ** Math.min(sseReconnect, 4), 30_000)
      reconnectTimeout = setTimeout(() => setSseReconnect((k) => k + 1), delay)
    }
    return () => {
      es.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [projectId, userId, sseReconnect, fetchThreads, fetchMessages])

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
      setReplyToAuthor(null)
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

  const handleSynthesize = () => {
    setActionPlanThreadIds([...selectedThreadIds])
    setShowActionPlan(true)
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
    <div className="flex h-full min-h-0">
      {/* Thread list */}
      <div className="flex w-[300px] min-w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-background">
        <div className="border-b border-white/[0.06] px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Threads</h2>
            <Button size="sm" variant="ghost" asChild className="h-7 text-xs">
              <a href={`/projects/${projectId}/idea-stream#new-thread`}>New</a>
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
              className="min-h-0 resize-none text-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="size-8 shrink-0"
              disabled={!newThreadContent.trim() || isSubmitting}
              aria-label="Post new thread"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
          {error && (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  'flex cursor-pointer items-start gap-2 border-b border-white/[0.06] px-3 py-2 hover:bg-muted/50',
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
                  className="mt-1 size-3.5 shrink-0 rounded border-border accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {thread.title || thread.lastMessagePreview || 'Untitled'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(thread.lastActivityAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t border-white/[0.06] p-2">
          <form onSubmit={handleFinalize}>
            <input
              type="hidden"
              name="threadIds"
              value={JSON.stringify([...selectedThreadIds])}
              readOnly
            />
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={selectedThreadIds.size === 0 || isSubmitting}
            >
              Finalize ({selectedThreadIds.size})
            </Button>
          </form>
        </div>
      </div>

      {/* Message content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {activeThreadId ? (
          <>
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium">
                  {activeThread?.title ||
                    activeThread?.lastMessagePreview ||
                    'Thread'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Created {activeThread ? new Date(activeThread.createdAt).toLocaleString() : ''}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedThreadIds.size === 0 || isSubmitting || showActionPlan}
                onClick={handleSynthesize}
                className="ml-3 shrink-0"
              >
                <Zap className="mr-1.5 size-3.5" />
                Synthesize ({selectedThreadIds.size})
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 p-4">
                {messages.map((msg) => {
                  const authorLabel =
                    msg.author.displayName?.trim() ||
                    (activeThread && msg.authorUserId === activeThread.createdByUserId
                      ? 'Creator'
                      : 'Responder')
                  return (
                  <div
                    key={msg.id}
                    className={cn(
                      'group flex gap-3',
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
                          {authorLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleString()}
                          {msg.editedAt && ' (edited)'}
                        </span>
                        {!msg.deletedAt && (
                          <span className="inline-flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() => {
                                setReplyToMessageId(msg.id)
                                setReplyToSnippet(msg.content.slice(0, 50))
                                setReplyToAuthor(authorLabel)
                              }}
                              aria-label="Reply"
                            >
                              <Reply className="size-3" />
                            </Button>
                            {msg.authorUserId === userId && (
                              <>
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
                              </>
                            )}
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
                      {Array.isArray(msg.readBy) && msg.readBy.length > 0 && (
                        <div className="mt-1 flex items-center gap-1" aria-label={`Read by ${msg.readBy.map((u) => u.displayName?.trim() || 'Unknown').join(', ')}`}>
                          {msg.readBy.map((reader) => (
                            <span
                              key={reader.id}
                              className="relative inline-flex shrink-0"
                              title={reader.displayName?.trim() || undefined}
                            >
                              <span
                                className="flex size-5 items-center justify-center rounded-full text-[10px] font-medium text-white ring-2 ring-background"
                                style={{ backgroundColor: avatarColorFromUser(reader.id, reader.avatarColor) }}
                              >
                                {getInitials(reader.displayName)}
                              </span>
                              <span
                                className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-black text-white"
                                aria-hidden
                              >
                                <Check className="size-2.5 stroke-[3]" />
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="border-t border-white/[0.06] p-3">
              {replyToMessageId && (
                <div className="mb-2 flex items-start justify-between gap-2 rounded border-l-2 border-primary/30 bg-muted/50 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      Replying to {replyToAuthor ?? '...'}
                    </p>
                    <p className="truncate text-muted-foreground">
                      {replyToSnippet}{replyToSnippet.length >= 50 ? '...' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyToMessageId(null)
                      setReplyToSnippet('')
                      setReplyToAuthor(null)
                    }}
                    aria-label="Cancel reply"
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
            <MessageCircle className="size-12" />
            <p>Select a thread or start a new one</p>
            {selectedThreadIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={isSubmitting || showActionPlan}
                onClick={handleSynthesize}
              >
                <Zap className="mr-1.5 size-3.5" />
                Synthesize ({selectedThreadIds.size} selected)
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Action plan sidebar */}
      {showActionPlan && (
        <ActionPlanSidebar
          projectId={projectId}
          threadIds={actionPlanThreadIds}
          onClose={() => setShowActionPlan(false)}
        />
      )}
    </div>
  )
}
