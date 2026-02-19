import { NextResponse } from 'next/server'
import { getBrainstormById } from '@/lib/repositories/brainstorm.repository'
import { runSynthesisStream } from '@/lib/services/synthesis.service'

export const maxDuration = 120

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId: routeProjectId } = await params
  let body: { sessionId?: string; providerId?: string; model?: string; rerunMode?: string; title?: string; rawInput?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const sessionId = body.sessionId
  const providerId = body.providerId
  if (!sessionId || !providerId) {
    return NextResponse.json(
      { error: 'sessionId and providerId are required' },
      { status: 400 }
    )
  }
  const session = await getBrainstormById(sessionId).catch(() => null)
  if (!session || session.projectId !== routeProjectId) {
    return NextResponse.json({ error: 'Session not found or project mismatch' }, { status: 404 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }
      try {
        const result = await runSynthesisStream(
          {
            brainstormSessionId: sessionId,
            providerId,
            model: body.model,
            rerunMode:
              body.rerunMode === 'update_context' ? 'update_context' : 'rerun',
            title: body.title,
            rawInput: body.rawInput,
          },
          (text) => send('chunk', { text }),
          (prompt) => send('prompt', { prompt })
        )
        if (result.error) {
          send('error', { message: result.error })
        } else if (result.output) {
          const systems = JSON.parse(result.output.extractedSystems || '[]') as unknown[]
          const systemDetails = JSON.parse(result.output.extractedSystemDetails || '[]') as unknown[]
          const suggestedSystems = JSON.parse(
            (result.output as { suggestedSystems?: string | null }).suggestedSystems || '[]'
          ) as unknown[]
          const suggestedSystemDetails = JSON.parse(
            (result.output as { suggestedSystemDetails?: string | null }).suggestedSystemDetails ||
              '[]'
          ) as unknown[]
          send('done', {
            outputId: result.output.id,
            promptTokens: result.output.promptTokens,
            completionTokens: result.output.completionTokens,
            extractedSystems: systems,
            extractedSystemDetails: systemDetails,
            suggestedSystems,
            suggestedSystemDetails,
            prompt: result.fullPrompt ?? undefined,
            rawContent: result.output.content,
          })
        } else {
          send('error', { message: 'No output produced' })
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Synthesis failed'
        send('error', { message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    },
  })
}
