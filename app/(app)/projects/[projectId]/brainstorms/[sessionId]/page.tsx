import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBrainstormWithSynthesis } from '@/lib/services/brainstorm.service'
import { deleteBrainstormAction } from '@/app/actions/brainstorm.actions'
import { DeleteBrainstormButton } from './delete-brainstorm-button'

export default async function ViewBrainstormPage({
  params,
}: {
  params: Promise<{ projectId: string; sessionId: string }>
}) {
  const { projectId, sessionId } = await params
  const result = await getBrainstormWithSynthesis(sessionId)
  if (!result.success) notFound()

  const { brainstorm, synthesizedOutputs } = result.data
  const tags = brainstorm.tags ? (JSON.parse(brainstorm.tags) as string[]) : []

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{brainstorm.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {brainstorm.author && <span>by {brainstorm.author}</span>}
            <span>{new Date(brainstorm.createdAt).toLocaleDateString()}</span>
            <span className="capitalize">{brainstorm.source}</span>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${projectId}/brainstorms/${sessionId}/synthesize`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Synthesize
          </Link>
          <DeleteBrainstormButton
            projectId={projectId}
            sessionId={sessionId}
            deleteAction={deleteBrainstormAction}
          />
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Content (read-only)</h2>
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/20 p-4 font-mono text-sm">
          {brainstorm.content}
        </div>
      </section>

      {synthesizedOutputs.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium">Synthesized outputs</h2>
          <ul className="space-y-2">
            {synthesizedOutputs.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/projects/${projectId}/brainstorms/${sessionId}/synthesize?output=${o.id}`}
                  className="text-primary hover:underline"
                >
                  {o.title} ({o.status})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href={`/projects/${projectId}/brainstorms`}
        className="inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to brainstorms
      </Link>
    </div>
  )
}
