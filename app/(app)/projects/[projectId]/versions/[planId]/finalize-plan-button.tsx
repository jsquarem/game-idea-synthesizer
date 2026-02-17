'use client'

import { useTransition } from 'react'

type Props = {
  projectId: string
  planId: string
  finalizeAction: (projectId: string, planId: string) => Promise<void>
}

export function FinalizePlanButton({ projectId, planId, finalizeAction }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => {
        if (confirm('Finalize this plan? It will become immutable.')) {
          startTransition(() => finalizeAction(projectId, planId))
        }
      }}
      disabled={isPending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {isPending ? 'Finalizing…' : 'Finalize plan'}
    </button>
  )
}
