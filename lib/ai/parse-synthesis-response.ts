/**
 * Parse AI synthesis response into extractedSystems and extractedSystemDetails.
 * Expects JSON with keys extractedSystems (array) and extractedSystemDetails (array).
 * Handles markdown code blocks (```json ... ```) around the payload.
 */

/** One dependency: slug only (legacy) or slug + optional description. */
export type ExtractedDependencyEntry = string | { slug: string; description?: string }

export type ExtractedSystemStub = {
  name?: string
  systemSlug?: string
  purpose?: string
  version?: string
  mvpCriticality?: string
  /** Slug-only array (legacy) or array of { slug, description? } for labeled links. */
  dependencies?: ExtractedDependencyEntry[]
  [key: string]: unknown
}

/**
 * Normalize a single dependency entry to { slug, description? }.
 * Use when building edges from extracted systems so descriptions are preserved.
 */
export function normalizeDependencyEntry(
  entry: ExtractedDependencyEntry
): { slug: string; description?: string } {
  if (typeof entry === 'string') {
    return { slug: entry }
  }
  const desc = typeof entry.description === 'string' ? entry.description.trim() : undefined
  return { slug: entry.slug, description: desc || undefined }
}

export type ExtractedSystemDetailStub = {
  name?: string
  detailType?: string
  spec?: string
  targetSystemSlug?: string
  systemSlug?: string
  [key: string]: unknown
}

export type ParsedSynthesis = {
  extractedSystems: ExtractedSystemStub[]
  extractedSystemDetails: ExtractedSystemDetailStub[]
  suggestedSystems?: ExtractedSystemStub[]
  suggestedSystemDetails?: ExtractedSystemDetailStub[]
  rawContent: string
}

const JSON_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)```/
const EXTRACTED_SYSTEMS_REGEX = /"extractedSystems"\s*:\s*(\[[\s\S]*?\])\s*[,}]/
const EXTRACTED_SYSTEM_DETAILS_REGEX = /"extractedSystemDetails"\s*:\s*(\[[\s\S]*?\])\s*[,}]/

/**
 * Find the end index of the first complete JSON object starting at start (bracket-matched).
 * Returns -1 if no object found. Respects strings so braces inside strings don't affect depth.
 */
function findJsonObjectEnd(jsonStr: string, start: number): number {
  let depth = 0
  let inDoubleQuote = false
  let i = start
  while (i < jsonStr.length) {
    const c = jsonStr[i]
    if (inDoubleQuote) {
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === '"') inDoubleQuote = false
      i++
      continue
    }
    if (c === '"') {
      inDoubleQuote = true
      i++
      continue
    }
    if (c === '{' || c === '[') depth++
    else if (c === '}' || c === ']') {
      depth--
      if (depth === 0) return i
    }
    i++
  }
  return -1
}

function tryParseJsonObject(str: string): Record<string, unknown> | null {
  let jsonStr = str.trim()
  const blockMatch = jsonStr.match(JSON_BLOCK_REGEX)
  if (blockMatch) jsonStr = blockMatch[1].trim()
  // Try parse as-is first
  try {
    const parsed = JSON.parse(jsonStr) as unknown
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    // Fallback: find all top-level JSON objects (handles "example}, {real" when model echoes example then responds)
    let best: Record<string, unknown> | null = null
    let bestSystemCount = 0
    let searchStart = 0
    for (;;) {
      const start = jsonStr.indexOf('{', searchStart)
      if (start === -1) break
      const end = findJsonObjectEnd(jsonStr, start)
      if (end === -1) break
      try {
        const parsed = JSON.parse(jsonStr.slice(start, end + 1)) as unknown
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          !Array.isArray(parsed) &&
          Array.isArray((parsed as Record<string, unknown>).extractedSystems)
        ) {
          const obj = parsed as Record<string, unknown>
          const count = (obj.extractedSystems as unknown[]).length
          if (count >= bestSystemCount) {
            bestSystemCount = count
            best = obj
          }
        }
      } catch {
        // skip invalid slice
      }
      searchStart = end + 1
    }
    return best
  }
}

function extractArrayWithRegex(
  content: string,
  regex: RegExp
): unknown[] {
  const match = content.match(regex)
  if (!match) return []
  try {
    const arr = JSON.parse(match[1]) as unknown
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/**
 * Parse synthesis response content into structured extraction.
 * Falls back to empty arrays if JSON is missing or invalid.
 */
export function parseSynthesisResponse(content: string): ParsedSynthesis {
  const obj = tryParseJsonObject(content)
  if (obj) {
    const systems = Array.isArray(obj.extractedSystems)
      ? (obj.extractedSystems as ExtractedSystemStub[])
      : []
    const details = Array.isArray(obj.extractedSystemDetails)
      ? (obj.extractedSystemDetails as ExtractedSystemDetailStub[])
      : []
    const suggested = Array.isArray(obj.suggestedSystems)
      ? (obj.suggestedSystems as ExtractedSystemStub[])
      : []
    const suggestedDetails = Array.isArray(obj.suggestedSystemDetails)
      ? (obj.suggestedSystemDetails as ExtractedSystemDetailStub[])
      : []
    return {
      extractedSystems: systems,
      extractedSystemDetails: details,
      suggestedSystems: suggested,
      suggestedSystemDetails: suggestedDetails,
      rawContent: content,
    }
  }
  const systems = extractArrayWithRegex(content, EXTRACTED_SYSTEMS_REGEX) as ExtractedSystemStub[]
  const details = extractArrayWithRegex(content, EXTRACTED_SYSTEM_DETAILS_REGEX) as ExtractedSystemDetailStub[]
  return {
    extractedSystems: systems,
    extractedSystemDetails: details,
    suggestedSystems: [],
    suggestedSystemDetails: [],
    rawContent: content,
  }
}
