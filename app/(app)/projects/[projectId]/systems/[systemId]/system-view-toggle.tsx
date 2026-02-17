'use client'

import { useState } from 'react'
import type { GameSystemWithRelations } from '@/lib/repositories/game-system.repository'
type Props = {
  system: GameSystemWithRelations
  projectId: string
  systemId: string
  updateAction: (
    projectId: string,
    systemId: string,
    formData: FormData
  ) => Promise<void>
  formComponent: React.ReactNode
}

export function SystemViewToggle({
  system,
  projectId,
  systemId,
  updateAction,
  formComponent,
}: Props) {
  const [mode, setMode] = useState<'form' | 'markdown'>('form')
  const markdown = system.markdownContent ?? ''

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('form')}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            mode === 'form' ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'
          }`}
        >
          Form view
        </button>
        <button
          type="button"
          onClick={() => setMode('markdown')}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            mode === 'markdown' ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'
          }`}
        >
          Markdown view
        </button>
      </div>

      {mode === 'form' ? (
        formComponent
      ) : (
        <div className="space-y-4">
          <form
            action={(formData: FormData) => updateAction(projectId, systemId, formData)}
            className="space-y-4"
          >
            <input type="hidden" name="changeSummary" value="Updated from markdown" />
            <input type="hidden" name="name" value={system.name} />
            <input type="hidden" name="version" value={system.version} />
            <input type="hidden" name="status" value={system.status} />
            <input type="hidden" name="purpose" value={system.purpose ?? ''} />
            <input type="hidden" name="mvpCriticality" value={system.mvpCriticality} />
            <div>
              <label htmlFor="md" className="mb-1 block text-sm font-medium">
                Markdown (read-only in this view; edit via Form view)
              </label>
              <pre
                id="md"
                className="max-h-[60vh] overflow-auto rounded-md border border-input bg-muted/20 p-4 font-mono text-sm whitespace-pre-wrap"
              >
                {markdown || '(No markdown content)'}
              </pre>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
