import { NextResponse } from 'next/server'
import { getProjectActivity } from '@/lib/services/project.service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') ?? undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20

  const result = await getProjectActivity(projectId, limit, cursor)
  if (!result.success) {
    if (result.code === 'NOT_FOUND')
      return NextResponse.json({ error: result.error }, { status: 404 })
    return NextResponse.json(
      { error: result.error ?? 'Failed to load activity' },
      { status: 500 }
    )
  }
  return NextResponse.json(result.data)
}
