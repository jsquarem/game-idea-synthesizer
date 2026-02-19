import { notFound } from 'next/navigation'
import { getSynthesisConfig } from '@/app/actions/synthesis.actions'
import { getBrainstormById } from '@/lib/repositories/brainstorm.repository'
import { getAllGameSystemsWithDetails } from '@/lib/repositories/game-system.repository'
import { findSynthesizedOutputById } from '@/lib/repositories/synthesized-output.repository'
import { SynthesizeWizard } from './synthesize-wizard'

export default async function SynthesizePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; sessionId: string }>
  searchParams: Promise<{ output?: string }>
}) {
  const { projectId, sessionId } = await params
  const { output: outputId } = await searchParams

  const configResult = await getSynthesisConfig(projectId, sessionId)
  if ('error' in configResult) notFound()

  const [session, existingProjectSystems] = await Promise.all([
    getBrainstormById(sessionId),
    getAllGameSystemsWithDetails(projectId),
  ])
  const sourcePreview = session.content.slice(0, 800)

  let existingOutput: {
    extractedSystems: { name?: string; systemSlug?: string; purpose?: string; [key: string]: unknown }[]
    extractedSystemDetails: { name?: string; detailType?: string; spec?: string; targetSystemSlug?: string; systemSlug?: string; [key: string]: unknown }[]
    suggestedSystems?: { name?: string; systemSlug?: string; purpose?: string; [key: string]: unknown }[]
    suggestedSystemDetails?: { name?: string; detailType?: string; spec?: string; targetSystemSlug?: string; systemSlug?: string; [key: string]: unknown }[]
    content: string
  } | null = null
  let existingOutputId: string | null = null

  if (outputId) {
    const output = await findSynthesizedOutputById(outputId).catch(() => null)
    if (output && output.projectId === projectId) {
      const raw = output as {
        extractedSystems: string
        extractedSystemDetails?: string | null
        suggestedSystems?: string | null
        suggestedSystemDetails?: string | null
        content: string
        id: string
      }
      existingOutputId = output.id
      existingOutput = {
        extractedSystems: JSON.parse(raw.extractedSystems || '[]') as { name?: string; systemSlug?: string; purpose?: string; [key: string]: unknown }[],
        extractedSystemDetails: JSON.parse(raw.extractedSystemDetails || '[]') as { name?: string; detailType?: string; spec?: string; targetSystemSlug?: string; systemSlug?: string; [key: string]: unknown }[],
        suggestedSystems: JSON.parse(raw.suggestedSystems || '[]') as { name?: string; systemSlug?: string; purpose?: string; [key: string]: unknown }[],
        suggestedSystemDetails: JSON.parse(raw.suggestedSystemDetails || '[]') as { name?: string; detailType?: string; spec?: string; targetSystemSlug?: string; systemSlug?: string; [key: string]: unknown }[],
        content: raw.content,
      }
    }
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] w-full flex-col overflow-hidden px-20">
      <h1 className="shrink-0 text-2xl font-bold">Synthesize</h1>
      <div className="min-h-0 flex-1 flex flex-col">
        <SynthesizeWizard
        initialConfig={{
          projectId: configResult.projectId,
          sessionId: configResult.sessionId,
          sessionTitle: configResult.sessionTitle,
          snapshotDate: configResult.snapshotDate,
          providerConfigs: configResult.providerConfigs,
          sourcePreview,
        }}
        existingOutputId={existingOutputId}
        existingOutput={existingOutput}
        existingProjectSystems={existingProjectSystems}
      />
      </div>
    </div>
  )
}
