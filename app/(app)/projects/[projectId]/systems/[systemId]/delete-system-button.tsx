'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
  projectId: string
  systemId: string
  deleteAction: (projectId: string, systemId: string) => Promise<void>
}

export function DeleteSystemButton({ projectId, systemId, deleteAction }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      className="border-destructive/50 text-destructive hover:bg-destructive/10"
      onClick={() => {
        if (confirm('Delete this system? This cannot be undone.')) {
          startTransition(() => deleteAction(projectId, systemId))
        }
      }}
      disabled={isPending}
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </Button>
  )
}
