import { NextResponse } from 'next/server'
import { findSynthesizedOutputById } from '@/lib/repositories/synthesized-output.repository'
import { listMessagesByOutputId } from '@/lib/repositories/synthesis-conversation.repository'
import { runRefine } from '@/lib/services/synthesis-refine.service'
import type { ExtractedSystemStub, ExtractedSystemDetailStub } from '@/lib/ai/parse-synthesis-response'

export const maxDuration = 60

type RefineScope = {
  includeOtherSystems?: boolean
  includeSnapshot?: boolean
}

type RefineBody = {
  outputId: string
  providerId: string
  model?: string
  userMessage: string
  messages?: { role: 'user' | 'assistant'; content: string }[]
  extractedSystems: ExtractedSystemStub[]
  extractedSystemDetails: ExtractedSystemDetailStub[]
  scope?: RefineScope
  focusedSystemSlug?: string
  focusedSystemSlugs?: string[]
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId: routeProjectId } = await params
  let body: RefineBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { outputId, providerId, model, userMessage, extractedSystems, extractedSystemDetails } = body
  if (!outputId || !providerId || userMessage == null) {
    return NextResponse.json(
      { error: 'outputId, providerId, and userMessage are required' },
      { status: 400 }
    )
  }

  const output = await findSynthesizedOutputById(outputId)
  if (!output || output.projectId !== routeProjectId) {
    return NextResponse.json(
      { error: 'Synthesis output not found or project mismatch' },
      { status: 404 }
    )
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  const scope =
    body.scope && typeof body.scope === 'object'
      ? {
          includeOtherSystems: Boolean(body.scope.includeOtherSystems),
          includeSnapshot: Boolean(body.scope.includeSnapshot),
        }
      : undefined
  const focusedSystemSlug =
    typeof body.focusedSystemSlug === 'string' && body.focusedSystemSlug.trim()
      ? body.focusedSystemSlug.trim()
      : undefined
  const focusedSystemSlugs = Array.isArray(body.focusedSystemSlugs)
    ? body.focusedSystemSlugs.filter(
        (s): s is string => typeof s === 'string' && s.trim().length > 0
      ).map((s) => s.trim())
    : undefined

  const result = await runRefine({
    outputId,
    providerId,
    model,
    userMessage: String(userMessage).trim(),
    messages,
    extractedSystems: Array.isArray(extractedSystems) ? extractedSystems : [],
    extractedSystemDetails: Array.isArray(extractedSystemDetails) ? extractedSystemDetails : [],
    scope,
    focusedSystemSlug,
    focusedSystemSlugs,
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    )
  }

  return NextResponse.json({
    extractedSystems: result.extractedSystems,
    extractedSystemDetails: result.extractedSystemDetails,
    suggestedSystems: result.suggestedSystems ?? [],
    suggestedSystemDetails: result.suggestedSystemDetails ?? [],
    rawContent: result.rawContent,
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId: routeProjectId } = await params
  const { searchParams } = new URL(request.url)
  const outputId = searchParams.get('outputId')
  if (!outputId) {
    return NextResponse.json(
      { error: 'outputId is required' },
      { status: 400 }
    )
  }
  const output = await findSynthesizedOutputById(outputId)
  if (!output || output.projectId !== routeProjectId) {
    return NextResponse.json(
      { error: 'Synthesis output not found or project mismatch' },
      { status: 404 }
    )
  }
  const messages = await listMessagesByOutputId(outputId)
  return NextResponse.json({
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
}
