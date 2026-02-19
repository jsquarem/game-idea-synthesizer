import type { SystemDetail } from '@prisma/client'

const SPEC_SEP = '\n\n'
const PURPOSE_MAX_LEN = 280

export type DerivedSections = {
  purpose: string
  coreMechanics: string
  inputs: string
  outputs: string
  implementationNotes: string
  content: string
}

const SECTION_TYPES = [
  'mechanic',
  'input',
  'output',
  'ui_hint',
  'content',
] as const

/**
 * Derive GameSystem section content from system details (Option A roll-up).
 * Mapping: mechanic → coreMechanics, input → inputs, output → outputs,
 * ui_hint → implementationNotes, content → content (emitted in markdown/export only).
 * System details are ordered by sortOrder then createdAt.
 */
export function deriveSectionsFromSystemDetails(
  systemDetails: SystemDetail[]
): DerivedSections {
  const sorted = [...systemDetails].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.getTime() - b.createdAt.getTime()
  )

  const byType = new Map<string, SystemDetail[]>()
  for (const b of sorted) {
    const t = SECTION_TYPES.includes(b.detailType as (typeof SECTION_TYPES)[number])
      ? b.detailType
      : 'mechanic'
    const list = byType.get(t) ?? []
    list.push(b)
    byType.set(t, list)
  }

  function concat(type: string): string {
    const list = byType.get(type) ?? []
    return list.map((b) => b.spec.trim()).filter(Boolean).join(SPEC_SEP)
  }

  const coreMechanics = concat('mechanic')
  const inputs = concat('input')
  const outputs = concat('output')
  const implementationNotes = concat('ui_hint')
  const content = concat('content')

  const mechanics = byType.get('mechanic') ?? []
  const firstMechanicSpec = mechanics[0]?.spec?.trim()
  const purpose = firstMechanicSpec
    ? firstMechanicSpec.length <= PURPOSE_MAX_LEN
      ? firstMechanicSpec
      : firstMechanicSpec.slice(0, PURPOSE_MAX_LEN - 3) + '...'
    : mechanics.length > 0
      ? mechanics.map((b) => b.name).filter(Boolean).join(', ')
      : ''

  return {
    purpose,
    coreMechanics,
    inputs,
    outputs,
    implementationNotes,
    content,
  }
}

/**
 * Derive purpose from system details when system has no explicit purpose.
 * Returns derived purpose (first mechanic spec truncated or mechanic names).
 */
export function derivePurposeFromSystemDetails(
  systemDetails: SystemDetail[]
): string {
  return deriveSectionsFromSystemDetails(systemDetails).purpose
}
