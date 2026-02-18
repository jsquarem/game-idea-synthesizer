import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/get-current-user'
import * as ideaStreamService from '@/lib/services/idea-stream.service'
import { subscribe } from '@/lib/idea-stream-events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/projects/[projectId]/idea-stream/events
 * Server-Sent Events stream. Client subscribes and refetches on threads_updated / messages_updated.
 * Auth: same-origin cookies (getCurrentUserId) or X-User-Id header.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  // EventSource cannot send custom headers; use cookie when no X-User-Id
  const userId = request.headers.get('X-User-Id')
    ? await getCurrentUserId(request)
    : await getCurrentUserId()
  const access = await ideaStreamService.ensureUserCanAccessProject(
    projectId,
    userId
  )
  if (!access.success) {
    if (access.code === 'NOT_FOUND')
      return NextResponse.json({ error: access.error }, { status: 404 })
    if (access.code === 'FORBIDDEN')
      return NextResponse.json({ error: access.error }, { status: 403 })
    return NextResponse.json(
      { error: access.error ?? 'Forbidden' },
      { status: 500 }
    )
  }

  const encoder = new TextEncoder()
  const KEEPALIVE_MS = 15_000
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        )
      }
      const unsubscribe = subscribe(projectId, (event) => {
        send(event)
      })
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          clearInterval(keepalive)
        }
      }, KEEPALIVE_MS)
      request.signal.addEventListener('abort', () => {
        clearInterval(keepalive)
        unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Connection: 'keep-alive',
    },
  })
}
