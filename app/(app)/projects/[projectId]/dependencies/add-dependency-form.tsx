'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GameSystem } from '@prisma/client'
import { addDependencyAction } from '@/app/actions/dependency.actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  projectId: string
  systems: GameSystem[]
}

export function AddDependencyForm({ projectId, systems }: Props) {
  const router = useRouter()
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [description, setDescription] = useState('')
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
    const result = await addDependencyAction(
      projectId,
      sourceId,
      targetId,
      undefined,
      description || null
    )
    setPending(false)
    if (result?.ok === false) {
      setError(result.error)
      return
    }
    router.refresh()
    setSourceId('')
    setTargetId('')
    setDescription('')
  }

  const selectClass = cn(
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs',
    'transition-[color,box-shadow] outline-none focus-visible:ring-ring focus-visible:ring-[3px]'
  )

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
      <div className="grid flex-1 gap-2 min-w-[180px]">
        <label htmlFor="source" className="text-sm font-medium">
          Source (uses / interfaces with)
        </label>
        <select
          id="source"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className={selectClass}
        >
          <option value="">Select system</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.systemSlug})
            </option>
          ))}
        </select>
      </div>
      <div className="grid flex-1 gap-2 min-w-[180px]">
        <label htmlFor="target" className="text-sm font-medium">
          Target (used by / interfaced with)
        </label>
        <select
          id="target"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className={selectClass}
        >
          <option value="">Select system</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.systemSlug})
            </option>
          ))}
        </select>
      </div>
      <div className="grid flex-1 gap-2 min-w-[180px]">
        <label htmlFor="description" className="text-sm font-medium">
          Link description (optional)
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. sends encounter events"
          className={selectClass}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add interaction link'}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  )
}
