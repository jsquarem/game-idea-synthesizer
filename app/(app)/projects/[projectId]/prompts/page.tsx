import Link from 'next/link'
import { listPromptHistory } from '@/lib/repositories/prompt-history.repository'
import { notFound } from 'next/navigation'
import { findProjectById } from '@/lib/repositories/project.repository'

export default async function PromptsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await findProjectById(projectId)
  if (!project) notFound()
  const result = await listPromptHistory({ projectId }, { pageSize: 20 })
  const prompts = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prompt History</h1>
        <Link
          href={`/projects/${projectId}/prompts/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New prompt
        </Link>
      </div>
      {prompts.length === 0 ? (
        <p className="text-muted-foreground">No prompt history yet.</p>
      ) : (
        <ul className="space-y-2">
          {prompts.map((p) => (
            <li key={p.id} className="rounded border border-border p-3">
              <span className="font-mono text-sm">{p.promptType}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">
                {p.aiProvider} / {p.aiModel}
              </span>
              <p className="mt-1 line-clamp-2 text-sm">{p.promptInput.slice(0, 120)}…</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
