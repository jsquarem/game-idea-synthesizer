/**
 * Parse AI synthesis response into extractedSystems and extractedSystemDetails.
 * Expects JSON with keys extractedSystems (array) and extractedSystemDetails (array).
 * Handles markdown code blocks (```json ... ```) around the payload.
 */

export type ExtractedSystemStub = {
  name?: string
  systemSlug?: string
  purpose?: string
  version?: string
  mvpCriticality?: string
  dependencies?: string[]
  [key: string]: unknown
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
  rawContent: string
}

const JSON_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)```/
const EXTRACTED_SYSTEMS_REGEX = /"extractedSystems"\s*:\s*(\[[\s\S]*?\])\s*[,}]/
const EXTRACTED_SYSTEM_DETAILS_REGEX = /"extractedSystemDetails"\s*:\s*(\[[\s\S]*?\])\s*[,}]/

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
    // Fallback: find first { and bracket-match to get a single JSON object (handles preamble text)
    const start = jsonStr.indexOf('{')
    if (start === -1) return null
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
        if (depth === 0) {
          try {
            const parsed = JSON.parse(jsonStr.slice(start, i + 1)) as unknown
            return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
              ? (parsed as Record<string, unknown>)
              : null
          } catch {
            return null
          }
        }
      }
      i++
    }
  }
  return null
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
    return { extractedSystems: systems, extractedSystemDetails: details, rawContent: content }
  }
  const systems = extractArrayWithRegex(content, EXTRACTED_SYSTEMS_REGEX) as ExtractedSystemStub[]
  const details = extractArrayWithRegex(content, EXTRACTED_SYSTEM_DETAILS_REGEX) as ExtractedSystemDetailStub[]
  return { extractedSystems: systems, extractedSystemDetails: details, rawContent: content }
}
