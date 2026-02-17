import type { GameSystemData, ParseSystemMarkdownResult } from './system-parser.types'

function splitMarkdownSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>()
  const regex = /^## (.+)$/gm
  let lastEnd = 0
  let lastKey = ''
  let match: RegExpExecArray | null
  while ((match = regex.exec(markdown)) !== null) {
    if (lastKey) {
      const content = markdown.slice(lastEnd, match.index).trim()
      sections.set(lastKey, content)
    }
    lastKey = match[1].trim()
    lastEnd = regex.lastIndex
  }
  if (lastKey) {
    const content = markdown.slice(lastEnd).trim()
    sections.set(lastKey, content)
  }
  return sections
}

function getSection(sections: Map<string, string>, name: string): string | undefined {
  const exact = sections.get(name)
  if (exact !== undefined) return exact
  for (const [key, value] of sections) {
    if (key.toLowerCase() === name.toLowerCase()) return value
  }
  return undefined
}

function parseMarkdownList(text: string): string[] {
  if (!text.trim()) return []
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}

function parseChangeLogEntries(text: string): { date: string; version: string; summary: string }[] {
  if (!text.trim()) return []
  const entries: { date: string; version: string; summary: string }[] = []
  const lines = text.split('\n').filter((l) => l.trim())
  const re = /^-\s*\[?(\d{4}-\d{2}-\d{2})\]?\s*(?:\(([^)]*)\))?\s*(.*)$/
  for (const line of lines) {
    const m = line.match(re)
    if (m) {
      entries.push({ date: m[1], version: m[2] ?? '', summary: m[3].trim() })
    } else {
      const simple = line.replace(/^-\s*/, '').trim()
      if (simple) entries.push({ date: '', version: '', summary: simple })
    }
  }
  return entries
}

function normalizeStatus(s: string): string {
  const lower = s.trim().toLowerCase()
  if (['draft', 'active', 'deprecated'].includes(lower)) return lower
  return lower || 'draft'
}

function normalizeCriticality(s: string): string {
  const lower = s.trim().toLowerCase()
  if (['core', 'important', 'later'].includes(lower)) return lower
  return lower || 'important'
}

export function parseSystemMarkdown(markdown: string): ParseSystemMarkdownResult {
  if (!markdown || !markdown.trim()) {
    return { ok: false, error: 'Empty input' }
  }
  const nameMatch = markdown.match(/^# (?:System:\s*)?(.+)$/m)
  const name = nameMatch?.[1]?.trim() ?? ''
  if (!name) return { ok: false, error: 'Missing system name (H1 header)' }

  const sections = splitMarkdownSections(markdown)
  const systemId = getSection(sections, 'System ID')?.trim()
  if (!systemId) return { ok: false, error: 'Missing System ID section' }

  const version = getSection(sections, 'Version')?.trim() ?? 'v0.1'
  if (!/^v\d+(\.\d+)?$/i.test(version)) {
    return { ok: false, error: 'Version must match vX.Y format' }
  }

  const status = normalizeStatus(getSection(sections, 'Status') ?? 'draft')
  const mvpCriticality = normalizeCriticality(getSection(sections, 'MVP Criticality') ?? 'important')

  const data: GameSystemData = {
    name,
    systemSlug: systemId,
    version,
    status,
    purpose: getSection(sections, 'Purpose')?.trim() ?? '',
    currentState: getSection(sections, 'Current State')?.trim() ?? '',
    targetState: getSection(sections, 'Target State')?.trim() ?? '',
    coreMechanics: getSection(sections, 'Core Mechanics')?.trim() ?? '',
    inputs: getSection(sections, 'Inputs')?.trim() ?? '',
    outputs: getSection(sections, 'Outputs')?.trim() ?? '',
    dependencies: parseMarkdownList(getSection(sections, 'Dependencies') ?? ''),
    dependedOnBy: parseMarkdownList(getSection(sections, 'Depended On By') ?? ''),
    failureStates: getSection(sections, 'Failure States')?.trim() ?? '',
    scalingBehavior: getSection(sections, 'Scaling Behavior')?.trim() ?? '',
    mvpCriticality,
    implementationNotes: getSection(sections, 'Implementation Notes')?.trim() ?? '',
    openQuestions: getSection(sections, 'Open Questions')?.trim() ?? '',
    changeLog: parseChangeLogEntries(getSection(sections, 'Change Log') ?? ''),
  }
  return { ok: true, data }
}

export function renderSystemMarkdown(system: GameSystemData): string {
  const depList = system.dependencies.length ? system.dependencies.map((d) => `- ${d}`).join('\n') : ''
  const dependedOnByList = system.dependedOnBy.length
    ? system.dependedOnBy.map((d) => `- ${d}`).join('\n')
    : ''
  const changeLogList = system.changeLog.length
    ? system.changeLog
        .map((e) => `- ${e.date ? `[${e.date}]` : ''} ${e.version ? `(${e.version})` : ''} ${e.summary}`.trim())
        .join('\n')
    : ''

  return `# ${system.name}

## System ID
${system.systemSlug}

## Version
${system.version}

## Status
${system.status}

## Purpose
${system.purpose}

## Current State
${system.currentState}

## Target State
${system.targetState}

## Core Mechanics
${system.coreMechanics}

## Inputs
${system.inputs}

## Outputs
${system.outputs}

## Dependencies
${depList}

## Depended On By
${dependedOnByList}

## Failure States
${system.failureStates}

## Scaling Behavior
${system.scalingBehavior}

## MVP Criticality
${system.mvpCriticality}

## Implementation Notes
${system.implementationNotes}

## Open Questions
${system.openQuestions}

## Change Log
${changeLogList}
`
}
