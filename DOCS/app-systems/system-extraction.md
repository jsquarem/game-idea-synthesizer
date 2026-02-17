# System: System Extraction

## Purpose
Transforms raw brainstorm content into structured game system definitions through AI-assisted synthesis and user-guided review.

## Responsibilities
- Orchestrate the brainstorm → synthesized output pipeline
- Call AI engine with synthesis prompt template and brainstorm context
- Parse AI response into system stubs (name, slug, purpose, mechanics, dependencies)
- Store intermediate SynthesizedOutput artifacts
- Present structured review interface data
- Convert user-approved stubs into full GameSystem records
- Detect conflicts with existing systems (duplicate slugs)

## Inputs
- BrainstormSession content
- AI provider/model selection
- User review decisions (select, modify, discard)

## Outputs
- SynthesizedOutput records
- GameSystem records (upon conversion)
- ChangeLog entries for newly created systems
- Initial Dependency records between new systems

## Dependencies
- ingestion (provides brainstorm data)
- ai-engine (for synthesis completion)
- doc-store (for persistence)
- dependency-graph (for initial dependency creation)
- system-parser (for markdown rendering of new systems)

## Code Mapping
- Service: `lib/services/synthesis.service.ts`
- Repository: `lib/repositories/synthesized-output.repository.ts`
- Parser: `lib/parsers/system-parser.ts`
- AI Template: `lib/ai/templates/synthesis.ts`
- Context: `lib/ai/context.ts` → `assembleSynthesisContext`
- Actions: `app/actions/synthesis.actions.ts`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- AI extraction quality depends on brainstorm clarity
- No confidence scoring on extracted systems
- Single-pass extraction (no iterative refinement loop in v1)

## Target Evolution
- Multi-pass extraction with refinement
- Confidence scoring per extracted system
- Interactive extraction where user guides AI in real-time
- Pattern library for common game system archetypes

## Change Log
(Chronological updates)
