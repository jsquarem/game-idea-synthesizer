# System: AI Engine

## Purpose
Provides a provider-agnostic interface for AI completion calls. Manages prompt templates, context assembly, provider routing, and prompt/response history tracking.

## Responsibilities
- Abstract multiple AI providers (OpenAI, Anthropic, Google) behind a common interface
- Register and manage provider configurations
- Route completion requests (primary, fallback, A/B testing)
- Manage prompt templates (registration, retrieval, interpolation)
- Assemble prompt context from domain data (systems, dependencies, plans)
- Execute completion calls (standard and streaming)
- Track token usage and latency
- Coordinate with prompt history repository for persistence

## Inputs
- Prompt type and template selection
- Target entity (system ID, version plan ID, brainstorm ID)
- AI provider/model preferences
- Additional user context

## Outputs
- Generated prompt text
- AI completion responses
- Token usage statistics
- PromptHistory records

## Dependencies
- doc-store (for context assembly — reads systems, plans, dependencies)
- workspace (for provider config: API keys stored encrypted per workspace)
- External AI provider APIs (OpenAI, Anthropic, Google)
- Prompt history repository (for persistence)

## Code Mapping
- Types: `lib/ai/types.ts` (CompletionResult, StreamChunk, AIProvider)
- Provider: `lib/ai/providers/openai.provider.ts` (createOpenAIProvider)
- Run completion: `lib/ai/run-completion.ts` — getProvider(workspaceId, providerId), runCompletion, runCompletionStream
- Context assembly: `lib/services/context-builder.service.ts` (build full context, delta since snapshot, assemble for synthesis); consumed by synthesis service.
- **Workspace provider config (decrypt at runtime):** `lib/ai/get-workspace-provider-config.ts` — getDecryptedWorkspaceProviderConfig(workspaceId, providerId); never send apiKey to client.
- Synthesis streaming: `app/api/projects/[projectId]/synthesis/stream/route.ts`; refine: `.../synthesis/refine/route.ts` (accepts optional **focusedSystemSlugs** for refine-selected-systems); convert-suggest: `.../synthesis/convert-suggest/route.ts`
- System evolve: `app/api/projects/[projectId]/systems/[systemId]/evolve/route.ts` (GET history, POST evolve); `lib/services/system-evolve.service.ts` (runSystemEvolve, runCompletion, parse, apply to GameSystem + SystemDetail)

## Current Implementation
- Workspace-scoped AI config is stored encrypted (see workspace app-system and `lib/security/encryption.ts`). Provider config is decrypted only in server runtime. Synthesis uses context snapshot + delta (context builder) and single AI request (streaming); prompt assembled in synthesis.service; OpenAI provider used when providerId is "openai".

## Known Limitations
- No function calling / tool use support in v1
- No automatic prompt optimization
- No cost tracking beyond token counts
- A/B testing is random split, not user-segmented

## Target Evolution
- Function calling for structured AI responses
- Prompt optimization via feedback loop
- Cost tracking and budgeting
- Provider performance comparison dashboard
- Fine-tuned model support
- Local model support (Ollama, vLLM)

## Change Log

- 2026-02-17: Doc synced with codebase; current implementation and code mapping.
- 2026-02-18: Context assembly via context-builder (snapshot + delta); run-completion and OpenAI provider; synthesis streaming route.
- 2026-02-18: Refine and convert-suggest routes use runCompletion (non-streaming).
- 2026-02-18: Refine route accepts optional focusedSystemSlugs (array) for "refine selected systems" in one call.
- 2026-02-18: System evolve API and service: single-system refinement with persisted conversation (SystemEvolveMessage), apply AI response to GameSystem and SystemDetails.
