import type { Export } from '@prisma/client'
import type { ServiceResult } from './types'
import { createExport, getExportById, listExportsByProject } from '../repositories/export.repository'
import { findProjectById } from '../repositories/project.repository'
import { getAllGameSystems } from '../repositories/game-system.repository'
import { listDependenciesByProject } from '../repositories/dependency.repository'

export type ExportType = 'gdd' | 'version_prd' | 'system_doc' | 'roadmap' | 'prompt_bundle'
export type ExportFormat = 'markdown' | 'json'

export async function generateExport(
  projectId: string,
  exportType: ExportType,
  format: ExportFormat = 'markdown'
): Promise<ServiceResult<Export>> {
  const project = await findProjectById(projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  const systems = await getAllGameSystems(projectId)
  const deps = await listDependenciesByProject(projectId)

  let content: string
  if (exportType === 'gdd') {
    content = renderGDD(project, systems, deps)
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
  systems: { name: string; systemSlug: string; purpose?: string | null; markdownContent?: string | null }[],
  deps: { sourceSystem: { name: string }; targetSystem: { name: string }; dependencyType: string }[]
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
    lines.push(`### ${s.name} (${s.systemSlug})`)
    if (s.purpose) lines.push(s.purpose)
    if (s.markdownContent) lines.push('', s.markdownContent)
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
