import Link from 'next/link'
import { createBrainstormAction } from '@/app/actions/brainstorm.actions'
import { BrainstormNewForm } from './brainstorm-new-form'

function defaultBrainstormTitle(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `Brainstorm - ${y}-${m}-${day} ${h}:${min}`
}

export default async function NewBrainstormPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { projectId } = await params
  const { error } = await searchParams
  const defaultTitle = defaultBrainstormTitle()

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
      <BrainstormNewForm
        projectId={projectId}
        defaultTitle={defaultTitle}
        createAction={createBrainstormAction}
      />
    </div>
  )
}
