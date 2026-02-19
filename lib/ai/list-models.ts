/**
 * List available model IDs for an AI provider. Server-only; uses API key.
 * Used when saving workspace AI config or refreshing models.
 */

export function parseAvailableModels(json: string | null | undefined): string[] {
  if (json == null || json === '') return []
  try {
    const parsed = JSON.parse(json) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : []
  } catch {
    return []
  }
}

export type ListModelsConfig = {
  apiKey: string
  baseUrl?: string | null
}

export async function listModelsForProvider(
  providerId: string,
  config: ListModelsConfig
): Promise<string[]> {
  if (providerId === 'openai') {
    return listOpenAIModels(config)
  }
  if (providerId === 'anthropic') {
    return listAnthropicModels(config)
  }
  return []
}

async function listOpenAIModels(config: ListModelsConfig): Promise<string[]> {
  const base = (config.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '')
  const url = `${base}/models`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  })
  if (!res.ok) {
    return []
  }
  const json = (await res.json()) as { data?: { id?: string }[] }
  const data = json?.data
  if (!Array.isArray(data)) return []
  return data.map((m) => m?.id).filter((id): id is string => typeof id === 'string')
}

async function listAnthropicModels(config: ListModelsConfig): Promise<string[]> {
  const base = (config.baseUrl ?? 'https://api.anthropic.com').replace(/\/$/, '')
  const url = `${base}/v1/models`
  const res = await fetch(url, {
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
  })
  if (!res.ok) {
    return []
  }
  const json = (await res.json()) as { data?: { id?: string }[]; model?: { id?: string }[] }
  const data = json?.data ?? json?.model
  if (!Array.isArray(data)) return []
  return data.map((m) => m?.id).filter((id): id is string => typeof id === 'string')
}
