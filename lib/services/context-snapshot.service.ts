import type { ProjectContextSnapshot } from '@prisma/client'
import { buildFullContext } from './context-builder.service'
import { createProjectContextSnapshot, getLatestByProjectId } from '@/lib/repositories/project-context-snapshot.repository'
import type { SnapshotContent } from './context-builder.types'

export type CreateSnapshotInput = {
  projectId: string
  trigger?: string
  relatedSynthesisOutputId?: string
  relatedBrainstormSessionId?: string
}

/**
 * Create a new context snapshot after successful synthesis (or other trigger).
 * Uses context builder to produce content, then stores it.
 */
export async function createContextSnapshot(
  input: CreateSnapshotInput
): Promise<ProjectContextSnapshot> {
  const content = await buildFullContext(input.projectId)
  const contentStr = JSON.stringify(content)
  return createProjectContextSnapshot({
    projectId: input.projectId,
    content: contentStr,
    contentVersion: content.schemaVersion,
    trigger: input.trigger ?? 'synthesis',
    relatedSynthesisOutputId: input.relatedSynthesisOutputId,
    relatedBrainstormSessionId: input.relatedBrainstormSessionId,
  })
}

/**
 * Get the latest snapshot for a project (by createdAt desc).
 * Used as base for next synthesis run.
 */
export async function getLatestSnapshot(
  projectId: string
): Promise<ProjectContextSnapshot | null> {
  return getLatestByProjectId(projectId)
}

/**
 * Parse snapshot content from stored string.
 */
export function parseSnapshotContent(content: string): SnapshotContent {
  return JSON.parse(content) as SnapshotContent
}
