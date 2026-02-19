import type { Export, SystemDetail } from '@prisma/client'
import type { ServiceResult } from './types'
import { createExport, getExportById, listExportsByProject, updateExport } from '../repositories/export.repository'
import { findProjectById } from '../repositories/project.repository'
import { getAllGameSystems } from '../repositories/game-system.repository'
import { listDependenciesByProject } from '../repositories/dependency.repository'
import { listSystemDetailsByProjectId } from '../repositories/system-detail.repository'
import { deriveSectionsFromSystemDetails } from './system-detail-roll-up.service'

export type ExportType = 'gdd' | 'version_prd' | 'system_doc' | 'roadmap' | 'prompt_bundle'
export type ExportFormat = 'markdown' | 'json'

export async function generateExport(
  projectId: string,
  exportType: ExportType,
  format: ExportFormat = 'markdown',
  options?: { synthesizedOutputId?: string }
): Promise<ServiceResult<Export>> {
  const project = await findProjectById(projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  const [systems, systemDetailsByProject, deps] = await Promise.all([
    getAllGameSystems(projectId),
    listSystemDetailsByProjectId(projectId),
    listDependenciesByProject(projectId),
  ])
  const systemDetailsBySystemId = new Map<string, SystemDetail[]>()
  for (const b of systemDetailsByProject) {
    const list = systemDetailsBySystemId.get(b.gameSystemId) ?? []
    list.push(b)
    systemDetailsBySystemId.set(b.gameSystemId, list)
  }

  let content: string
  if (exportType === 'gdd') {
    content = renderGDD(project, systems, deps, systemDetailsBySystemId)
  } else {
    content = `# ${exportType}\n\n(Placeholder for ${exportType})\n`
  }

  try {
    const record = await createExport({
      projectId,
      exportType,
      format,
      content,
      metadata: { generatedAt: new Date().toISOString(), systemCount: systems.length },
      synthesizedOutputId: options?.synthesizedOutputId,
    })
    return { success: true, data: record }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create export',
      code: 'INTERNAL',
    }
  }
}

function renderGDD(
  project: { name: string; description?: string | null; genre?: string | null; platform?: string | null },
  systems: { id: string; name: string; systemSlug: string; purpose?: string | null; currentState?: string | null; targetState?: string | null; failureStates?: string | null; scalingBehavior?: string | null; openQuestions?: string | null }[],
  deps: { sourceSystem: { name: string }; targetSystem: { name: string }; dependencyType: string }[],
  systemDetailsBySystemId: Map<string, SystemDetail[]>
): string {
  const lines: string[] = [
    `# ${project.name}`,
    '',
    project.description ? `${project.description}\n` : '',
    project.genre ? `**Genre:** ${project.genre}` : '',
    project.platform ? `**Platform:** ${project.platform}` : '',
    '',
    '## Systems',
    '',
  ]
  for (const s of systems) {
    const systemDetails = systemDetailsBySystemId.get(s.id) ?? []
    const derived = systemDetails.length ? deriveSectionsFromSystemDetails(systemDetails) : null
    const purpose = s.purpose || derived?.purpose || ''
    lines.push(`### ${s.name} (${s.systemSlug})`)
    if (purpose) lines.push(purpose)
    if (derived) {
      if (derived.coreMechanics) lines.push('', '#### Core Mechanics', '', derived.coreMechanics)
      if (derived.inputs) lines.push('', '#### Inputs', '', derived.inputs)
      if (derived.outputs) lines.push('', '#### Outputs', '', derived.outputs)
      if (derived.implementationNotes) lines.push('', '#### Implementation Notes', '', derived.implementationNotes)
      if (derived.content) lines.push('', '#### Content', '', derived.content)
    }
    if (s.currentState) lines.push('', '#### Current State', '', s.currentState)
    if (s.targetState) lines.push('', '#### Target State', '', s.targetState)
    if (s.failureStates) lines.push('', '#### Failure States', '', s.failureStates)
    if (s.scalingBehavior) lines.push('', '#### Scaling Behavior', '', s.scalingBehavior)
    if (s.openQuestions) lines.push('', '#### Open Questions', '', s.openQuestions)
    lines.push('')
  }
  lines.push('## Dependency graph', '')
  for (const d of deps) {
    lines.push(`- ${d.sourceSystem.name} → ${d.targetSystem.name} (${d.dependencyType})`)
  }
  return lines.join('\n')
}

export async function getExport(id: string) {
  try {
    const record = await getExportById(id)
    return { success: true as const, data: record }
  } catch {
    return { success: false as const, error: 'Export not found', code: 'NOT_FOUND' as const }
  }
}

export async function listExports(projectId: string, pageSize = 20) {
  const project = await findProjectById(projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const result = await listExportsByProject(projectId, { pageSize })
    return { success: true, data: result }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list exports',
      code: 'INTERNAL',
    }
  }
}

export async function markExportUpToDate(id: string): Promise<ServiceResult<Export>> {
  try {
    const record = await updateExport(id, { markedUpToDateAt: new Date() })
    return { success: true, data: record }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to update export',
      code: 'INTERNAL',
    }
  }
}
