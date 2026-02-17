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
- External AI provider APIs (OpenAI, Anthropic, Google)
- Prompt history repository (for persistence)

## Code Mapping
- Provider interface: `lib/ai/provider.interface.ts`
- Provider implementations: `lib/ai/providers/*.provider.ts`
- Engine: `lib/ai/engine.ts`
- Types: `lib/ai/types.ts`
- Templates: `lib/ai/templates/*.ts`
- Template registry: `lib/ai/templates/registry.ts`
- Context assembly: `lib/ai/context.ts`
- Service integration: `lib/services/prompt.service.ts`
- API route (streaming): `app/api/ai/stream/route.ts`

## Current Implementation
(To be filled during implementation)

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
(Chronological updates)
