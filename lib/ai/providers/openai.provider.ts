import OpenAI from 'openai'
import type { WorkspaceProviderConfig } from '@/lib/ai/get-workspace-provider-config'
import type { CompletionResult, CompletionOptions, StreamChunk } from '@/lib/ai/types'

export function createOpenAIProvider(config: WorkspaceProviderConfig): {
  id: string
  name: string
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>
  stream(
    prompt: string,
    options?: CompletionOptions
  ): AsyncGenerator<StreamChunk, void, unknown>
} {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl ?? undefined,
  })
  const defaultModel = config.defaultModel ?? 'gpt-4o-mini'

  return {
    id: 'openai',
    name: 'OpenAI',
    async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
      const model = options?.model ?? defaultModel
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: options?.maxTokens ?? 4096,
      })
      const choice = response.choices[0]
      const content = choice?.message?.content ?? ''
      const usage = response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : { promptTokens: 0, completionTokens: 0 }
      return {
        content,
        usage,
        finishReason: choice?.finish_reason ?? undefined,
      }
    },
    async *stream(
      prompt: string,
      options?: CompletionOptions
    ): AsyncGenerator<StreamChunk, void, unknown> {
      const model = options?.model ?? defaultModel
      const stream = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: options?.maxTokens ?? 4096,
        stream: true,
      })
      let usage: CompletionResult['usage'] | undefined
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) yield { type: 'text', text: delta }
      }
      yield { type: 'done', usage }
    },
  }
}
