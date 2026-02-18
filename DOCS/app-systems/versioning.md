# System: Versioning

## Purpose
Manages version plans that scope game systems into release targets (v1, v1.1, v2). Enforces immutability after finalization and provides phased implementation roadmaps.

## Responsibilities
- Create version plans with selected system scope
- Compute dependency-ordered implementation phases
- Validate scope completeness (no dangling dependencies)
- Generate milestones and risk assessments
- Enforce immutability on finalized plans
- Render version plan markdown documents

## Inputs
- Project reference
- Version label (v1, v1.1, etc.)
- Selected system IDs
- User edits to draft plans

## Outputs
- VersionPlan records with phases, milestones, risks
- VersionPlanItem records (system ↔ plan junction)
- Scope validation results
- Rendered version plan markdown

## Dependencies
- doc-store (persistence)
- dependency-graph (phase computation, scope validation, implementation ordering)
- system-parser (for system data assembly)
- version-plan-parser (for markdown rendering)

## Code Mapping
- Service: `lib/services/version-plan.service.ts`
- Repository: `lib/repositories/version-plan.repository.ts`
- Parser: `lib/parsers/version-plan-parser.ts`
- Actions: `app/actions/version-plan.actions.ts`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- No version plan diffing between revisions
- No automatic system version bumping
- Finalization is one-way (no unfinalizing)

## Target Evolution
- Version plan comparison/diff view
- Auto-suggest scope based on MVP criticality
- Branching plans (experimental variants)
- System version auto-increment on plan finalization

## Change Log

- 2026-02-17: Doc synced with codebase; current implementation and code mapping.
