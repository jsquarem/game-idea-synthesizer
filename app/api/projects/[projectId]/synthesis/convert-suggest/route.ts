import { NextResponse } from 'next/server'
import { runConvertSuggest } from '@/lib/services/synthesis-convert-suggest.service'

export const maxDuration = 30

type Body = {
  outputId: string
  providerId: string
  model?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { outputId, providerId, model } = body
  if (!outputId || !providerId) {
    return NextResponse.json(
      { error: 'outputId and providerId are required' },
      { status: 400 }
    )
  }

  const result = await runConvertSuggest({
    outputId,
    projectId,
    providerId,
    model,
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    )
  }

  return NextResponse.json({
    suggestion: result.suggestion,
    existingSystems: result.existingSystems,
    userPrompt: result.userPrompt,
    promptSummary: result.promptSummary,
  })
}
