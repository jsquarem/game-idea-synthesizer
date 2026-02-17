import { NextResponse } from 'next/server'
import { getExportById } from '@/lib/repositories/export.repository'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const record = await getExportById(id)
    const ext = record.format === 'json' ? 'json' : 'md'
    const contentType = record.format === 'json' ? 'application/json' : 'text/markdown'
    return new NextResponse(record.content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="export-${record.exportType}-${id.slice(0, 8)}.${ext}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export not found' }, { status: 404 })
  }
}
