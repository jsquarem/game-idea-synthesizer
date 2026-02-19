'use client'

import { useTransition } from 'react'
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
import { clearProjectDataAction } from '@/app/actions/project.actions'

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

  return (
    <AlertDialog>
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
          <AlertDialogTitle>Clear project data</AlertDialogTitle>
          <AlertDialogDescription>
            Remove all brainstorms, systems, dependencies, version plans, prompts, exports, idea
            stream threads, and context snapshots. The project will remain so you can retest
            quickly. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault()
              startTransition(() => {
                clearProjectDataAction(projectId).then((r) => {
                  if (r?.ok) router.refresh()
                })
              })
            }}
            disabled={isPending}
          >
            {isPending ? 'Clearing…' : 'Clear all data'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
