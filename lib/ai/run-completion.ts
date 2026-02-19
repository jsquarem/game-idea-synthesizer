import { getDecryptedWorkspaceProviderConfig } from '@/lib/ai/get-workspace-provider-config'
import { createOpenAIProvider } from '@/lib/ai/providers/openai.provider'
import type { AIProvider, CompletionResult, CompletionOptions, StreamChunk } from '@/lib/ai/types'

export type RunCompletionInput = {
  workspaceId: string
  providerId: string
  prompt: string
  model?: string
  maxTokens?: number
}

/**
 * Get an AI provider instance for the workspace config.
 * Returns null if config not found or decryption fails.
 */
export async function getProvider(
  workspaceId: string,
  providerId: string
): Promise<AIProvider | null> {
  const config = await getDecryptedWorkspaceProviderConfig(workspaceId, providerId)
  if (!config) return null
  if (providerId === 'openai') return createOpenAIProvider(config)
  return null
}

/**
 * Run a non-streaming completion. Uses workspace provider config.
 */
export async function runCompletion(
  input: RunCompletionInput
): Promise<CompletionResult | null> {
  const provider = await getProvider(input.workspaceId, input.providerId)
  if (!provider) return null
  const options: CompletionOptions = {
    model: input.model,
    maxTokens: input.maxTokens,
  }
  return provider.complete(input.prompt, options)
}

/**
 * Run a streaming completion. Yields text chunks then a final done with usage if available.
 */
export async function* runCompletionStream(
  input: RunCompletionInput
): AsyncGenerator<StreamChunk, void, unknown> {
  const provider = await getProvider(input.workspaceId, input.providerId)
  if (!provider) return
  const options: CompletionOptions = {
    model: input.model,
    maxTokens: input.maxTokens,
  }
  yield* provider.stream(input.prompt, options)
}
