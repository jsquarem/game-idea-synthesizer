import type { ExtractedSystemStub, ExtractedSystemDetailStub } from '@/lib/ai/parse-synthesis-response'

function norm(s: string | undefined | null): string {
  return (s ?? '').toString().trim().toLowerCase()
}

function getSystemDetailsForSystem(
  system: ExtractedSystemStub,
  allSystemDetails: ExtractedSystemDetailStub[]
): ExtractedSystemDetailStub[] {
  const systemId = norm(system.systemSlug ?? system.name)
  if (!systemId) return []
  return allSystemDetails.filter((b) => {
    const target = norm(b.targetSystemSlug ?? b.systemSlug)
    if (target) return target === systemId || target === norm(system.name)
    return false
  })
}

/**
 * Build markdown from extracted systems and system details for the synthesis preview panel.
 * Structure mirrors GDD-style export: # title, ## Systems, ### name (slug), purpose, #### System details.
 */
export function extractionToMarkdown(
  systems: ExtractedSystemStub[],
  systemDetails: ExtractedSystemDetailStub[],
  sessionTitle?: string | null
): string {
  const title = sessionTitle?.trim() || 'Synthesis preview'
  const lines: string[] = [`# ${title}`, '', '## Systems', '', '']
  if (systems.length === 0) {
    lines.push('_No systems yet._')
    return lines.join('\n')
  }
  for (const s of systems) {
    const name = s.name ?? s.systemSlug ?? 'Unnamed'
    const slug = s.systemSlug ?? (s.name ?? 'system').toLowerCase().replace(/\s+/g, '-')
    lines.push(`### ${name} (${slug})`, '')
    if (s.purpose) lines.push((s.purpose as string).trim(), '')
    const detailsForSystem = getSystemDetailsForSystem(s, systemDetails)
    if (detailsForSystem.length > 0) {
      lines.push('#### System details', '')
      for (const b of detailsForSystem) {
        const bName = b.name ?? 'Unnamed'
        const bType = b.detailType ?? 'mechanic'
        const spec = ((b.spec ?? '').trim() || '—').replace(/\n+/g, ' ')
        lines.push(`- **${bName}** (${bType}): ${spec}`)
      }
      lines.push('')
    }
    lines.push('')
  }
  return lines.join('\n')
}
