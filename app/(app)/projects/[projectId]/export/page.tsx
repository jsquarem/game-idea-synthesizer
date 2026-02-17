import Link from 'next/link'
import { notFound } from 'next/navigation'
import { listExports } from '@/lib/services/export.service'
import { GenerateExportForm } from './generate-export-form'

export default async function ExportPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const result = await listExports(projectId)
  if (!result.success || !result.data) notFound()
  const exports = result.data.data

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Export</h1>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Generate export</h2>
        <GenerateExportForm projectId={projectId} />
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Recent exports</h2>
        {exports.length === 0 ? (
          <p className="text-muted-foreground">No exports yet.</p>
        ) : (
          <ul className="space-y-2">
            {exports.map((e) => (
              <li key={e.id} className="flex items-center gap-4 rounded border border-border p-2">
                <span className="font-mono text-sm">{e.exportType}</span>
                <span className="text-sm text-muted-foreground">{e.format}</span>
                <Link
                  href={`/api/exports/${e.id}/download`}
                  className="text-sm text-primary hover:underline"
                >
                  Download
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
