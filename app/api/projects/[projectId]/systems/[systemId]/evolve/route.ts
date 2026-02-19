import { NextResponse } from 'next/server'
import { findGameSystemById } from '@/lib/repositories/game-system.repository'
import { listMessagesByGameSystemId } from '@/lib/repositories/system-evolve.repository'
import { runSystemEvolve } from '@/lib/services/system-evolve.service'

export const maxDuration = 60

type EvolveBody = {
  providerId: string
  model?: string
  userMessage: string
  messages?: { role: 'user' | 'assistant'; content: string }[]
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; systemId: string }> }
) {
  const { projectId: routeProjectId, systemId } = await params
  const system = await findGameSystemById(systemId)
  if (!system || system.projectId !== routeProjectId) {
    return NextResponse.json(
      { error: 'System not found or project mismatch' },
      { status: 404 }
    )
  }
  const messages = await listMessagesByGameSystemId(systemId)
  return NextResponse.json({
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; systemId: string }> }
) {
  const { projectId: routeProjectId, systemId } = await params
  let body: EvolveBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { providerId, model, userMessage, messages } = body
  if (!providerId || userMessage == null) {
    return NextResponse.json(
      { error: 'providerId and userMessage are required' },
      { status: 400 }
    )
  }

  const system = await findGameSystemById(systemId)
  if (!system || system.projectId !== routeProjectId) {
    return NextResponse.json(
      { error: 'System not found or project mismatch' },
      { status: 404 }
    )
  }

  const result = await runSystemEvolve({
    systemId,
    providerId,
    model,
    userMessage: String(userMessage).trim(),
    messages: Array.isArray(messages) ? messages : undefined,
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    )
  }

  const systemForResponse = {
    id: result.system.id,
    name: result.system.name,
    systemSlug: result.system.systemSlug,
    purpose: result.system.purpose,
    version: result.system.version,
    status: result.system.status,
    mvpCriticality: result.system.mvpCriticality,
    systemDetails: result.system.systemDetails.map((d) => ({
      id: d.id,
      name: d.name,
      detailType: d.detailType,
      spec: d.spec,
      sortOrder: d.sortOrder,
    })),
  }

  return NextResponse.json({
    system: systemForResponse,
    rawContent: result.rawContent,
  })
}
