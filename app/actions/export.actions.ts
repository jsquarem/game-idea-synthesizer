'use server'

import { revalidatePath } from 'next/cache'
import * as exportService from '@/lib/services/export.service'

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
