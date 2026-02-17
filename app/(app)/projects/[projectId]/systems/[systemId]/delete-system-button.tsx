'use client'

import { useTransition } from 'react'

type Props = {
  projectId: string
  systemId: string
  deleteAction: (projectId: string, systemId: string) => Promise<void>
}

export function DeleteSystemButton({ projectId, systemId, deleteAction }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => {
        if (confirm('Delete this system? This cannot be undone.')) {
          startTransition(() => deleteAction(projectId, systemId))
        }
      }}
      disabled={isPending}
      className="rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
