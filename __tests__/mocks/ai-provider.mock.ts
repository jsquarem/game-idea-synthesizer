/**
 * Deterministic mock AI provider for tests.
 * Conforms to the AI provider interface used by the AI engine.
 */

export type MockCompletionOptions = {
  delayMs?: number
  throwError?: boolean
}

const defaultResponse = `## Extracted Systems

### Combat System
- **Slug:** combat
- **Purpose:** Handles all combat interactions
- **MVP Criticality:** core
- **Dependencies:** health, movement
`

let mockResponse = defaultResponse
let mockOptions: MockCompletionOptions = {}

export function getMockAiProvider() {
  return {
    id: 'mock',
    name: 'Mock Provider',
    async complete(_prompt: string, _options?: { model?: string; maxTokens?: number }) {
      if (mockOptions.throwError) throw new Error('Mock AI error')
      if (mockOptions.delayMs) await new Promise((r) => setTimeout(r, mockOptions.delayMs))
      return {
        content: mockResponse,
        usage: { promptTokens: 10, completionTokens: 20 },
        finishReason: 'stop',
      }
    },
    async stream(_prompt: string, _options?: { model?: string; maxTokens?: number }) {
      if (mockOptions.throwError) throw new Error('Mock AI error')
      async function* gen() {
        for (const chunk of mockResponse.split(/\s/)) {
          const delay = mockOptions.delayMs ?? 0
          if (delay > 0) await new Promise((r) => setTimeout(r, delay / 10))
          yield { type: 'text' as const, text: chunk + ' ' }
        }
      }
      return gen()
    },
  }
}

export function setMockAiResponse(response: string): void {
  mockResponse = response
}

export function setMockAiOptions(options: MockCompletionOptions): void {
  mockOptions = options
}

export function resetMockAi(): void {
  mockResponse = defaultResponse
  mockOptions = {}
}
