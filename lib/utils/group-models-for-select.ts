/**
 * Groups and sorts model IDs for use in <select> with <optgroup> or grouped lists.
 * Handles OpenAI-style (gpt-4o, gpt-4, o1, gpt-5*, etc.) and Anthropic-style (claude-3-5-*) ids.
 * Exports getModelDescription, getSuggestedModel, resolveSuggestedModel for descriptions and suggested model.
 */

import {
  OPENAI_MODEL_DESCRIPTIONS,
  SUGGESTED_MODEL_PREFIX,
} from './model-descriptions'

export type ModelOptionGroup = {
  label: string
  models: string[]
}

const OPENAI_GROUP_ORDER = [
  'o1',
  'o3',
  'o4',
  'gpt-4o',
  'gpt-4',
  'gpt-3.5',
  'gpt-3',
  'gpt-5.2',
  'gpt-5.1',
  'gpt-5',
  'realtime',
  'audio',
  'image',
  'embedding',
  'moderation',
  'legacy',
  'other',
]

const OPENAI_GROUP_LABELS: Record<string, string> = {
  o1: 'O1',
  o3: 'O3',
  o4: 'O4',
  'gpt-4o': 'GPT-4o',
  'gpt-4': 'GPT-4',
  'gpt-3.5': 'GPT-3.5',
  'gpt-3': 'GPT-3',
  'gpt-5.2': 'GPT-5.2',
  'gpt-5.1': 'GPT-5.1',
  'gpt-5': 'GPT-5',
  realtime: 'Realtime',
  audio: 'Audio',
  image: 'Image',
  embedding: 'Embeddings',
  moderation: 'Moderation',
  legacy: 'Legacy',
  other: 'Other',
}

const ANTHROPIC_PREFIXES: { prefix: string; label: string }[] = [
  { prefix: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { prefix: 'claude-3-5-haiku', label: 'Claude 3.5 Haiku' },
  { prefix: 'claude-3-opus', label: 'Claude 3 Opus' },
  { prefix: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { prefix: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { prefix: 'claude-3', label: 'Claude 3' },
  { prefix: 'claude-2', label: 'Claude 2' },
]

function getOpenAIGroupKey(id: string): string {
  const lower = id.toLowerCase()
  if (lower.startsWith('o1')) return 'o1'
  if (lower.startsWith('o3')) return 'o3'
  if (lower.startsWith('o4')) return 'o4'
  if (lower.includes('realtime')) return 'realtime'
  if (
    lower.startsWith('whisper') ||
    lower.startsWith('tts-') ||
    lower.startsWith('gpt-audio') ||
    lower.includes('transcribe') ||
    lower.includes('-tts') ||
    lower.includes('audio')
  ) {
    return 'audio'
  }
  if (lower.startsWith('gpt-4o')) return 'gpt-4o'
  if (lower.startsWith('gpt-4')) return 'gpt-4'
  if (lower.startsWith('gpt-3.5')) return 'gpt-3.5'
  if (lower.startsWith('gpt-3')) return 'gpt-3'
  if (lower.startsWith('gpt-5.2')) return 'gpt-5.2'
  if (lower.startsWith('gpt-5.1')) return 'gpt-5.1'
  if (lower.startsWith('gpt-5')) return 'gpt-5'
  if (
    lower.startsWith('dall-e') ||
    lower.startsWith('gpt-image') ||
    lower.startsWith('sora')
  ) {
    return 'image'
  }
  if (lower.startsWith('text-embedding')) return 'embedding'
  if (lower.startsWith('omni-moderation')) return 'moderation'
  if (
    lower.startsWith('babbage') ||
    lower.startsWith('davinci') ||
    lower.startsWith('chatgpt')
  ) {
    return 'legacy'
  }
  return 'other'
}

function getOpenAIGroupLabel(key: string): string {
  return OPENAI_GROUP_LABELS[key] ?? key
}

function getAnthropicGroupKey(id: string): string {
  const lower = id.toLowerCase()
  for (const { prefix } of ANTHROPIC_PREFIXES) {
    if (lower.startsWith(prefix)) return prefix
  }
  return lower.split('-').slice(0, 4).join('-') || 'other'
}

function getAnthropicGroupLabel(key: string): string {
  const found = ANTHROPIC_PREFIXES.find((p) => p.prefix === key)
  return found?.label ?? key
}

function isLikelyAnthropic(modelIds: string[]): boolean {
  return modelIds.some((id) => id.toLowerCase().startsWith('claude'))
}

export function groupAndSortModels(modelIds: string[]): ModelOptionGroup[] {
  if (modelIds.length === 0) return []
  const anthropic = isLikelyAnthropic(modelIds)
  const byGroup = new Map<string, string[]>()
  for (const id of modelIds) {
    const key = anthropic ? getAnthropicGroupKey(id) : getOpenAIGroupKey(id)
    const list = byGroup.get(key) ?? []
    list.push(id)
    byGroup.set(key, list)
  }
  for (const list of byGroup.values()) {
    list.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }
  const groupOrder = anthropic
    ? ANTHROPIC_PREFIXES.map((p) => p.prefix).filter((k) => byGroup.has(k))
    : OPENAI_GROUP_ORDER.filter((k) => byGroup.has(k))
  const otherKeys = [...byGroup.keys()].filter((k) => !groupOrder.includes(k)).sort()
  const orderedKeys = [...groupOrder, ...otherKeys]
  return orderedKeys.map((key) => ({
    label: anthropic ? getAnthropicGroupLabel(key) : getOpenAIGroupLabel(key),
    models: byGroup.get(key) ?? [],
  }))
}

/**
 * Returns a short description for the model if available (exact id or prefix match for dated variants).
 */
export function getModelDescription(
  providerId: string,
  modelId: string
): string | undefined {
  if (providerId !== 'openai') return undefined
  const id = modelId.toLowerCase()
  if (OPENAI_MODEL_DESCRIPTIONS[id]) return OPENAI_MODEL_DESCRIPTIONS[id]
  const sortedKeys = Object.keys(OPENAI_MODEL_DESCRIPTIONS).sort(
    (a, b) => b.length - a.length
  )
  for (const key of sortedKeys) {
    if (id.startsWith(key) || id === key) return OPENAI_MODEL_DESCRIPTIONS[key]
  }
  return undefined
}

/**
 * Returns the suggested model id/prefix for the provider (powerful, price-sensitive).
 */
export function getSuggestedModel(providerId: string): string | undefined {
  return SUGGESTED_MODEL_PREFIX[providerId]
}

/**
 * Returns the first model in availableModels that equals or starts with the suggested id for the provider.
 */
export function resolveSuggestedModel(
  providerId: string,
  availableModels: string[]
): string | undefined {
  const prefix = getSuggestedModel(providerId)
  if (!prefix || availableModels.length === 0) return undefined
  const lower = prefix.toLowerCase()
  return (
    availableModels.find(
      (id) => id.toLowerCase() === lower || id.toLowerCase().startsWith(lower + '-')
    ) ?? availableModels.find((id) => id.toLowerCase().startsWith(lower))
  )
}
