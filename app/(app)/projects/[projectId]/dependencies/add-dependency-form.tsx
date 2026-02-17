'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GameSystem } from '@prisma/client'
import { addDependencyAction } from '@/app/actions/dependency.actions'

type Props = {
  projectId: string
  systems: GameSystem[]
}

export function AddDependencyForm({ projectId, systems }: Props) {
  const router = useRouter()
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!sourceId || !targetId) {
      setError('Select source and target system')
      return
    }
    if (sourceId === targetId) {
      setError('Source and target must be different')
      return
    }
    setPending(true)
    const result = await addDependencyAction(projectId, sourceId, targetId)
    setPending(false)
    if (result?.ok === false) {
      setError(result.error)
      return
    }
    router.refresh()
    setSourceId('')
    setTargetId('')
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
      <div>
        <label htmlFor="source" className="mb-1 block text-sm font-medium">
          Source (depends on)
        </label>
        <select
          id="source"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select system</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.systemSlug})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="target" className="mb-1 block text-sm font-medium">
          Target (depended on)
        </label>
        <select
          id="target"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select system</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.systemSlug})
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add dependency'}
      </button>
      {error && (
        <p className="w-full text-sm text-destructive">{error}</p>
      )}
    </form>
  )
}
