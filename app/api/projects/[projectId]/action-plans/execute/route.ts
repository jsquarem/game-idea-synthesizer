import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/get-current-user'
import { findProjectById } from '@/lib/repositories/project.repository'
import { getOrCreateDefaultWorkspace } from '@/lib/repositories/workspace.repository'
import { actionPlanSchema } from '@/lib/ai/action-plan/types'
import { executeActionPlan } from '@/lib/ai/action-plan/executor'
import type { PlanExecutionEvent } from '@/lib/ai/action-plan/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params

  const userId = request.headers.get('X-User-Id')
    ? await getCurrentUserId(request)
    : await getCurrentUserId()

  const project = await findProjectById(projectId)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = actionPlanSchema.safeParse((body as Record<string, unknown>)?.plan)
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Invalid plan: ${parsed.error.issues.map((i) => i.message).join(', ')}` },
      { status: 400 }
    )
  }

  const plan = parsed.data
  const workspace = await getOrCreateDefaultWorkspace()
  const workspaceId = project.workspaceId ?? workspace.id

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: PlanExecutionEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          )
        } catch {
          // Stream may have been closed
        }
      }

      try {
        await executeActionPlan(
          plan,
          { projectId, workspaceId, userId },
          send
        )
      } catch (e) {
        send({
          type: 'plan_failed',
          error: e instanceof Error ? e.message : 'Execution failed',
          failedAtStep: -1,
        })
      } finally {
        try {
          controller.close()
        } catch {
          // Already closed
        }
      }
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
