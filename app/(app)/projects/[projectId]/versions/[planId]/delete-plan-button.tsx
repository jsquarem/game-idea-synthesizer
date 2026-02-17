'use client'

import { useTransition } from 'react'

type Props = {
  projectId: string
  planId: string
  deleteAction: (projectId: string, planId: string) => Promise<void>
}

export function DeletePlanButton({ projectId, planId, deleteAction }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => {
        if (confirm('Delete this version plan?')) {
          startTransition(() => deleteAction(projectId, planId))
        }
      }}
      disabled={isPending}
      className="rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
