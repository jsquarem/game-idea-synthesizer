import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { LanguageModel } from 'ai'
import { getFeatureConfig } from '@/lib/repositories/workspace-ai-feature-config.repository'
import { getDecryptedWorkspaceProviderConfig } from './get-workspace-provider-config'

export async function getModelForFeature(
  workspaceId: string,
  featureId: string
): Promise<LanguageModel> {
  let config = await getFeatureConfig(workspaceId, featureId)
  if (!config && featureId !== 'default') {
    config = await getFeatureConfig(workspaceId, 'default')
  }

  if (!config) {
    throw new Error(
      `No AI model configured for feature "${featureId}". ` +
        'Configure a model in Settings > AI Model Routing.'
    )
  }

  const providerConfig = await getDecryptedWorkspaceProviderConfig(
    workspaceId,
    config.providerId
  )
  if (!providerConfig) {
    throw new Error(
      `No API key configured for provider "${config.providerId}". ` +
        'Add an API key in Settings > Workspace > AI Provider.'
    )
  }

  if (config.providerId === 'openai') {
    const openai = createOpenAI({
      apiKey: providerConfig.apiKey,
      ...(providerConfig.baseUrl ? { baseURL: providerConfig.baseUrl } : {}),
    })
    return openai(config.modelId)
  }

  if (config.providerId === 'anthropic') {
    const anthropic = createAnthropic({
      apiKey: providerConfig.apiKey,
      ...(providerConfig.baseUrl ? { baseURL: providerConfig.baseUrl } : {}),
    })
    return anthropic(config.modelId)
  }

  throw new Error(`Unsupported AI provider: "${config.providerId}"`)
}
