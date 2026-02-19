import { notFound } from 'next/navigation'
import { listExports } from '@/lib/services/export.service'
import { GenerateExportForm } from './generate-export-form'
import { ExportList } from './export-list'

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
        <h2 className="mb-2 text-lg font-semibold">Export list</h2>
        {exports.length === 0 ? (
          <p className="text-muted-foreground">No exports yet.</p>
        ) : (
          <ExportList projectId={projectId} exports={exports} />
        )}
      </section>
    </div>
  )
}
