'use client'

import Link from 'next/link'
import type { GameSystemWithRelations } from '@/lib/repositories/game-system.repository'

type Props = {
  projectId: string
  system: GameSystemWithRelations | null
  createAction: ((projectId: string, formData: FormData) => Promise<void>) | null
  updateAction?: (
    projectId: string,
    systemId: string,
    formData: FormData
  ) => Promise<void>
}

export function SystemForm({ projectId, system, createAction, updateAction }: Props) {
  const isCreate = !system
  const formAction =
    isCreate && createAction
      ? (formData: FormData) => createAction(projectId, formData)
      : system && updateAction
        ? (formData: FormData) => updateAction(projectId, system.id, formData)
        : undefined

  return (
    <form action={formAction} method="post" className="space-y-4">
      {!isCreate && (
        <input type="hidden" name="changeSummary" value="Updated via form" />
      )}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Name *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={system?.name}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="systemSlug" className="mb-1 block text-sm font-medium">
          System ID (slug) *
        </label>
        <input
          id="systemSlug"
          name="systemSlug"
          required
          defaultValue={system?.systemSlug}
          readOnly={!!system}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="version" className="mb-1 block text-sm font-medium">
            Version
          </label>
          <input
            id="version"
            name="version"
            defaultValue={system?.version ?? 'v0.1'}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={system?.status ?? 'draft'}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="purpose" className="mb-1 block text-sm font-medium">
          Purpose
        </label>
        <textarea
          id="purpose"
          name="purpose"
          rows={3}
          defaultValue={system?.purpose ?? ''}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="mvpCriticality" className="mb-1 block text-sm font-medium">
          MVP Criticality
        </label>
        <select
          id="mvpCriticality"
          name="mvpCriticality"
          defaultValue={system?.mvpCriticality ?? 'important'}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="core">Core</option>
          <option value="important">Important</option>
          <option value="later">Later</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isCreate ? 'Create system' : 'Save changes'}
        </button>
        <Link
          href={`/projects/${projectId}/systems`}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
