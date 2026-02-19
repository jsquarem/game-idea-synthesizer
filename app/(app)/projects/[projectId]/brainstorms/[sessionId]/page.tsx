import { redirect, notFound } from 'next/navigation'
import { findBrainstormById } from '@/lib/repositories/brainstorm.repository'

export default async function BrainstormSessionPage({
  params,
}: {
  params: Promise<{ projectId: string; sessionId: string }>
}) {
  const { projectId, sessionId } = await params
  const session = await findBrainstormById(sessionId)
  if (!session || session.projectId !== projectId) notFound()
  redirect(`/projects/${projectId}/brainstorms/${sessionId}/synthesize`)
}
