'use server'

import { revalidatePath } from 'next/cache'
import * as exportService from '@/lib/services/export.service'
import { listExportsByProject } from '@/lib/repositories/export.repository'
import { updateExport } from '@/lib/repositories/export.repository'

export async function generateExportAction(
  projectId: string,
  exportType: string,
  format: string = 'markdown'
): Promise<{ ok: true; exportId: string } | { ok: false; error: string }> {
  const result = await exportService.generateExport(
    projectId,
    exportType as 'gdd' | 'version_prd' | 'system_doc' | 'roadmap' | 'prompt_bundle',
    format as 'markdown' | 'json'
  )
  if (!result.success) return { ok: false, error: result.error }
  revalidatePath(`/projects/${projectId}/export`)
  return { ok: true, exportId: result.data.id }
}

export async function markExportUpToDateAction(
  exportId: string,
  projectId: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await exportService.markExportUpToDate(exportId)
  if (!result.success) return { ok: false, error: result.error }
  revalidatePath(`/projects/${projectId}/export`)
  return { ok: true }
}

export async function markAllExportsUpToDateAction(
  projectId: string
): Promise<{ ok: boolean; error?: string }> {
  const list = await listExportsByProject(projectId, { pageSize: 500 })
  const needsUpdate = list.data.filter((e) => !e.markedUpToDateAt)
  for (const e of needsUpdate) {
    await updateExport(e.id, { markedUpToDateAt: new Date() })
  }
  revalidatePath(`/projects/${projectId}/export`)
  return { ok: true }
}
