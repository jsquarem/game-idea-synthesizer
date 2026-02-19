import { NextResponse } from 'next/server'
import { findSynthesizedOutputById } from '@/lib/repositories/synthesized-output.repository'

/**
 * GET ?outputId=... - returns raw content for an existing synthesis output (for Prompt & raw tab).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId: routeProjectId } = await params
  const { searchParams } = new URL(request.url)
  const outputId = searchParams.get('outputId')
  if (!outputId) {
    return NextResponse.json({ error: 'outputId required' }, { status: 400 })
  }
  const output = await findSynthesizedOutputById(outputId).catch(() => null)
  if (!output || output.projectId !== routeProjectId) {
    return NextResponse.json({ error: 'Output not found' }, { status: 404 })
  }
  return NextResponse.json({ content: output.content })
}
