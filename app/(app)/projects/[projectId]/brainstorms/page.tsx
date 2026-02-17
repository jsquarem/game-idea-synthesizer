import Link from 'next/link'
import { listBrainstorms } from '@/lib/services/brainstorm.service'
import { notFound } from 'next/navigation'

export default async function BrainstormsListPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const result = await listBrainstorms(projectId, { pageSize: 50 })
  if (!result.success) notFound()
  const { data } = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Brainstorms</h1>
        <Link
          href={`/projects/${projectId}/brainstorms/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New session
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-muted-foreground">No brainstorm sessions yet.</p>
          <Link
            href={`/projects/${projectId}/brainstorms/new`}
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create your first session
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((session) => (
            <li key={session.id}>
              <Link
                href={`/projects/${projectId}/brainstorms/${session.id}`}
                className="block rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow"
              >
                <h2 className="font-semibold">{session.title}</h2>
                {session.author && (
                  <p className="mt-1 text-sm text-muted-foreground">by {session.author}</p>
                )}
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {session.content.slice(0, 120)}
                  {session.content.length > 120 ? '…' : ''}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                    {session.source}
                  </span>
                  {session.tags && (
                    <>
                      {(JSON.parse(session.tags) as string[]).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-muted px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
