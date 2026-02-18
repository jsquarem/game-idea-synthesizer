import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/get-current-user'
import * as ideaStreamService from '@/lib/services/idea-stream.service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const userId = await getCurrentUserId(request)
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') ?? undefined
  const limit = searchParams.get('limit')
  const limitNum = limit ? Math.min(parseInt(limit, 10) || 30, 100) : 30

  const result = await ideaStreamService.getThreadList(projectId, userId, {
    cursor,
    limit: limitNum,
  })
  if (!result.success) {
    if (result.code === 'NOT_FOUND')
      return NextResponse.json({ error: result.error }, { status: 404 })
    if (result.code === 'FORBIDDEN')
      return NextResponse.json({ error: result.error }, { status: 403 })
    return NextResponse.json(
      { error: result.error ?? 'Failed to list threads' },
      { status: 500 }
    )
  }
  return NextResponse.json(result.data)
}
