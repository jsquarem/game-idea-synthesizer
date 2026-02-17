import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSystem, getChangeLogs } from '@/lib/services/game-system.service'

export default async function SystemHistoryPage({
  params,
}: {
  params: Promise<{ projectId: string; systemId: string }>
}) {
  const { projectId, systemId } = await params
  const [systemResult, logsResult] = await Promise.all([
    getSystem(systemId),
    getChangeLogs(systemId),
  ])
  if (!systemResult.success) notFound()
  if (!logsResult.success) notFound()
  const system = systemResult.data
  const logs = logsResult.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/projects/${projectId}/systems/${systemId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {system.name}
        </Link>
      </div>
      <h1 className="text-2xl font-bold">Change log</h1>
      {logs.length === 0 ? (
        <p className="text-muted-foreground">No change log entries yet.</p>
      ) : (
        <ul className="space-y-3">
          {logs.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium capitalize">{entry.changeType}</span>
                <span>{entry.version}</span>
                {entry.createdAt && (
                  <span>
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="mt-1 font-medium">{entry.summary}</p>
              {entry.details && (
                <p className="mt-2 text-sm text-muted-foreground">{entry.details}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
