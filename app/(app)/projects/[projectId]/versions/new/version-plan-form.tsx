'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { GameSystem } from '@prisma/client'

type Props = {
  projectId: string
  systems: GameSystem[]
  createAction: (projectId: string, formData: FormData) => Promise<void>
  validateScope: (
    projectId: string,
    systemIds: string[]
  ) => Promise<{ success: boolean; data?: { valid: boolean; missingDependencies: { nodeId: string; missingDep: string }[] } }>
}

export function VersionPlanForm({ projectId, systems, createAction, validateScope }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [scopeError, setScopeError] = useState<string | null>(null)

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setScopeError(null)
  }

  async function checkScope() {
    const result = await validateScope(projectId, Array.from(selectedIds))
    if (!result.success) {
      setScopeError('validation failed')
      return
    }
    if (result.data && !result.data.valid) {
      setScopeError(
        result.data.missingDependencies
          .map((m) => `Missing dependency: ${m.missingDep}`)
          .join('; ')
      )
    } else {
      setScopeError(null)
    }
  }

  return (
    <form
      action={(formData: FormData) => {
        formData.set('systemIds', JSON.stringify(Array.from(selectedIds)))
        return createAction(projectId, formData)
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="versionLabel" className="mb-1 block text-sm font-medium">
          Version label *
        </label>
        <input
          id="versionLabel"
          name="versionLabel"
          required
          placeholder="v1"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title *
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="MVP"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Systems in scope</span>
          <button type="button" onClick={checkScope} className="text-sm text-primary hover:underline">
            Validate scope
          </button>
        </div>
        {scopeError && (
          <p className="mb-2 text-sm text-destructive">{scopeError}</p>
        )}
        <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input p-2">
          {systems.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`sys-${s.id}`}
                checked={selectedIds.has(s.id)}
                onChange={() => toggle(s.id)}
                className="rounded"
              />
              <label htmlFor={`sys-${s.id}`} className="text-sm">
                {s.name} ({s.systemSlug})
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create plan
        </button>
        <Link
          href={`/projects/${projectId}/versions`}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
