'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { markExportUpToDateAction, markAllExportsUpToDateAction } from '@/app/actions/export.actions'
import type { Export } from '@prisma/client'

type ExportListProps = {
  projectId: string
  exports: Export[]
}

export function ExportList({ projectId, exports: initialExports }: ExportListProps) {
  const [exports, setExports] = useState(initialExports)
  const [copyId, setCopyId] = useState<string | null>(null)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const needsSubmission = exports.filter((e) => !e.markedUpToDateAt)

  async function handleCopy(content: string, id: string) {
    setCopyId(id)
    try {
      await navigator.clipboard.writeText(content)
    } finally {
      setTimeout(() => setCopyId(null), 1500)
    }
  }

  async function handleMarkUpToDate(id: string) {
    setMarkingId(id)
    const result = await markExportUpToDateAction(id, projectId)
    setMarkingId(null)
    if (result.ok) {
      setExports((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, markedUpToDateAt: new Date() } : e
        )
      )
    }
  }

  async function handleDownload(e: Export) {
    if (!e.markedUpToDateAt) {
      await markExportUpToDateAction(e.id, projectId)
      setExports((prev) =>
        prev.map((x) =>
          x.id === e.id ? { ...x, markedUpToDateAt: new Date() } : x
        )
      )
    }
    window.open(`/api/exports/${e.id}/download`, '_blank')
  }

  async function handleMarkAllUpToDate() {
    setMarkingAll(true)
    const result = await markAllExportsUpToDateAction(projectId)
    setMarkingAll(false)
    if (result.ok) {
      setExports((prev) =>
        prev.map((e) => ({ ...e, markedUpToDateAt: new Date() }))
      )
    }
  }

  return (
    <div className="space-y-4">
      {needsSubmission.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            Needs submission ({needsSubmission.length})
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllUpToDate}
            disabled={markingAll}
          >
            {markingAll ? 'Updating…' : 'Mark all as up to date'}
          </Button>
        </div>
      )}
      <ul className="space-y-3">
        {exports.map((e) => (
          <li
            key={e.id}
            className="flex flex-col gap-2 rounded-lg border border-border p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{e.exportType}</span>
                {!e.markedUpToDateAt && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                    Needs submission
                  </span>
                )}
                {e.synthesizedOutputId && (
                  <span className="text-xs text-muted-foreground">
                    From synthesis run
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => handleDownload(e)}
                >
                  Download
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(e.content, e.id)}
                >
                  {copyId === e.id ? 'Copied' : 'Copy'}
                </Button>
                {!e.markedUpToDateAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkUpToDate(e.id)}
                    disabled={markingId === e.id}
                  >
                    {markingId === e.id ? 'Updating…' : 'Mark as up to date'}
                  </Button>
                )}
              </div>
            </div>
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">Preview</summary>
              <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-muted/30 p-2 text-xs">
                {e.content.slice(0, 400)}
                {e.content.length > 400 ? '…' : ''}
              </pre>
            </details>
          </li>
        ))}
      </ul>
    </div>
  )
}
