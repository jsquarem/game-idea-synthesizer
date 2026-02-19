'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  groupAndSortModels,
  getModelDescription,
  resolveSuggestedModel,
} from '@/lib/utils/group-models-for-select'

type SystemEvolveChatProps = {
  projectId: string
  systemId: string
  providerConfigs: {
    providerId: string
    defaultModel: string | null
    availableModels?: string[]
  }[]
  onSystemUpdated?: () => void
  /** If false, messages are not fetched until needed (e.g. when parent expands) */
  fetchMessagesOnMount?: boolean
}

export function SystemEvolveChat({
  projectId,
  systemId,
  providerConfigs,
  onSystemUpdated,
  fetchMessagesOnMount = true,
}: SystemEvolveChatProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const router = useRouter()
  const firstProvider = providerConfigs[0]
  const providerId = firstProvider?.providerId ?? 'openai'
  const defaultModel = firstProvider?.defaultModel ?? undefined
  const availableModels = firstProvider?.availableModels ?? []
  const suggestedModel = resolveSuggestedModel(providerId, availableModels)
  const [model, setModel] = useState<string | undefined>(
    defaultModel ?? suggestedModel ?? (availableModels[0] ?? undefined)
  )
  const effectiveModel =
    model ?? defaultModel ?? suggestedModel ?? availableModels[0]

  useEffect(() => {
    if (!fetchMessagesOnMount || loaded) return
    setLoaded(true)
    fetch(`/api/projects/${projectId}/systems/${systemId}/evolve`)
      .then((res) => res.json())
      .then((data: { messages?: { role: string; content: string }[] }) => {
        if (Array.isArray(data?.messages)) {
          setMessages(data.messages)
        }
      })
      .catch(() => {})
  }, [projectId, systemId, loaded, fetchMessagesOnMount])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setError(null)
    setLoading(true)
    setInput('')
    const userMessage = { role: 'user' as const, content: text }
    setMessages((prev) => [...prev, userMessage])
    try {
      const res = await fetch(
        `/api/projects/${projectId}/systems/${systemId}/evolve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            model: effectiveModel || undefined,
            userMessage: text,
            messages,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Evolve failed')
        setMessages((prev) => prev.slice(0, -1))
        setInput(text)
        return
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Updated system applied.' },
      ])
      onSystemUpdated?.()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evolve failed')
      setMessages((prev) => prev.slice(0, -1))
      setInput(text)
    } finally {
      setLoading(false)
    }
  }, [projectId, systemId, providerId, effectiveModel, input, messages, loading, onSystemUpdated, router])

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-medium">
          <MessageSquare className="size-3.5 shrink-0" aria-hidden />
          Evolve with AI
        </h4>
        {availableModels.length > 0 && (
          <select
            className="rounded border border-input bg-background px-2 py-1 text-xs"
            value={effectiveModel ?? ''}
            onChange={(e) => setModel(e.target.value || undefined)}
          >
            {groupAndSortModels(availableModels).map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.models.map((id) => (
                  <option
                    key={id}
                    value={id}
                    title={getModelDescription(providerId, id) ?? undefined}
                  >
                    {id}
                    {suggestedModel === id ? ' — Suggested' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="max-h-48 space-y-2 overflow-y-auto rounded border bg-background/80 p-2">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No messages yet. Ask to refine this system (e.g. add a mechanic, clarify purpose).
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'rounded px-2 py-1.5 text-sm',
              m.role === 'user'
                ? 'ml-4 bg-primary/10 text-foreground'
                : 'mr-4 bg-muted'
            )}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {m.role === 'user' ? 'You' : 'AI'}:
            </span>{' '}
            {m.role === 'assistant' && m.content !== 'Updated system applied.' ? (
              <div className="prose prose-sm dark:prose-invert mt-0.5 max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
            ) : (
              m.content
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          className="min-w-0 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="e.g. Add a mechanic for level-up rewards"
          disabled={loading}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
        </Button>
      </div>
    </div>
  )
}
