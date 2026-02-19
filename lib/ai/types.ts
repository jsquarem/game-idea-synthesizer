export type CompletionUsage = {
  promptTokens: number
  completionTokens: number
  totalTokens?: number
}

export type CompletionResult = {
  content: string
  usage: CompletionUsage
  finishReason?: string
}

export type StreamChunk = { type: 'text'; text: string } | { type: 'done'; usage?: CompletionUsage }

export type CompletionOptions = {
  model?: string
  maxTokens?: number
}

export type AIProvider = {
  id: string
  name: string
  complete(
    prompt: string,
    options?: CompletionOptions
  ): Promise<CompletionResult>
  stream(
    prompt: string,
    options?: CompletionOptions
  ): AsyncGenerator<StreamChunk, void, unknown>
}
