import Link from 'next/link'
import { createBrainstormAction } from '@/app/actions/brainstorm.actions'
import { BrainstormNewForm } from './brainstorm-new-form'

export default async function NewBrainstormPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { projectId } = await params
  const { error } = await searchParams

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/projects/${projectId}/brainstorms`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Brainstorms
        </Link>
      </div>
      <h1 className="text-2xl font-bold">New Brainstorm Session</h1>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeURIComponent(error)}
        </p>
      )}
      <BrainstormNewForm projectId={projectId} createAction={createBrainstormAction} />
    </div>
  )
}
