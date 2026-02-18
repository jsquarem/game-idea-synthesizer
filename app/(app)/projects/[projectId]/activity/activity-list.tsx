'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  MessageCircle,
  Lightbulb,
  Boxes,
  FileOutput,
  Calendar,
  GitBranch,
  type LucideIcon,
} from 'lucide-react'

export type ActivityItem = {
  type: string
  id: string
  label: string
  occurredAt: string
  href: string
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  thread: MessageCircle,
  brainstorm: Lightbulb,
  system: Boxes,
  export: FileOutput,
  version_plan: Calendar,
  dependency: GitBranch,
}

export function ActivityList({
  projectId,
  initialItems,
  initialNextCursor,
  pageSize = 20,
}: {
  projectId: string
  initialItems: ActivityItem[]
  initialNextCursor: string | null
  pageSize?: number
}) {
  const [items, setItems] = useState<ActivityItem[]>(initialItems)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [loading, setLoading] = useState(false)

  function formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60_000)
    const diffHours = Math.floor(diffMs / 3_600_000)
    const diffDays = Math.floor(diffMs / 86_400_000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    return date.toLocaleDateString()
  }

  async function loadMore() {
    if (!nextCursor || loading) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/activity?limit=${pageSize}&cursor=${encodeURIComponent(nextCursor)}`
      )
      if (!res.ok) throw new Error('Failed to load')
      const data = (await res.json()) as { items: ActivityItem[]; nextCursor: string | null }
      setItems((prev) => [...prev, ...data.items])
      setNextCursor(data.nextCursor)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No activity yet. Create a brainstorm, add systems, start a thread, or run an export.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {items.map((item) => {
          const Icon = TYPE_ICONS[item.type] ?? MessageCircle
          return (
            <li key={`${item.type}-${item.id}`} className="flex gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground">
                  <Link href={item.href} className="hover:underline">
                    {item.label}
                  </Link>
                </p>
                <p className="text-muted-foreground">
                  {formatRelativeTime(new Date(item.occurredAt))}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      {nextCursor && (
        <Button variant="outline" onClick={loadMore} disabled={loading}>
          {loading ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  )
}
