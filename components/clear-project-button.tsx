'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { clearProjectDataAction, type ClearProjectDataResult } from '@/app/actions/project.actions'

type Props = {
  projectId: string
  variant?: 'ghost' | 'outline' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function ClearProjectButton({
  projectId,
  variant = 'outline',
  size = 'sm',
  className,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<ClearProjectDataResult | null>(null)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setResult(null)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    startTransition(() => {
      clearProjectDataAction(projectId).then((r) => {
        setResult(r ?? { ok: false, error: 'Something went wrong' })
        if (r?.ok) router.refresh()
      })
    })
  }

  const handleClose = () => setOpen(false)

  const showResult = result !== null

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className ?? 'border-destructive/50 text-destructive hover:bg-destructive/10'}
        >
          Clear project data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {showResult ? (result.ok ? 'Success' : 'Failed') : 'Clear project data'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {showResult ? (
              <span className={result.ok ? 'text-foreground' : 'text-destructive'}>
                {result.ok
                  ? 'Project data has been cleared.'
                  : result.error}
              </span>
            ) : (
              <span>
                Remove all brainstorms, systems, dependencies, version plans, prompts, exports, idea
                stream threads, and context snapshots. The project will remain so you can retest
                quickly. This cannot be undone.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {showResult ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleClear}
                disabled={isPending}
              >
                {isPending ? 'Clearing…' : 'Clear all data'}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
