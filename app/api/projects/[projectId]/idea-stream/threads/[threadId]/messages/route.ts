import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/get-current-user'
import * as ideaStreamService from '@/lib/services/idea-stream.service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; threadId: string }> }
) {
  const { projectId, threadId } = await params
  const userId = await getCurrentUserId(request)
  const { searchParams } = new URL(request.url)
  const sinceParam = searchParams.get('since')
  const since = sinceParam ? new Date(sinceParam) : undefined

  const result = await ideaStreamService.getThreadMessages(
    projectId,
    threadId,
    userId,
    since
  )
  if (!result.success) {
    if (result.code === 'NOT_FOUND')
      return NextResponse.json({ error: result.error }, { status: 404 })
    if (result.code === 'FORBIDDEN')
      return NextResponse.json({ error: result.error }, { status: 403 })
    return NextResponse.json(
      { error: result.error ?? 'Failed to load messages' },
      { status: 500 }
    )
  }
  return NextResponse.json(result.data)
}
