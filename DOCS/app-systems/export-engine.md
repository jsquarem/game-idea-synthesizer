# System: Export Engine

## Purpose
Generates exportable documents in markdown and JSON formats. Assembles composite documents (GDD, Version PRD, Roadmap) from individual system and plan data.

## Responsibilities
- Render full Game Design Documents
- Render Version PRDs
- Render individual system documentation
- Render roadmap plans
- Render prompt bundles
- Store export records for history
- Support markdown and JSON output formats
- Provide download endpoints

## Inputs
- Project data
- GameSystem records with relations
- VersionPlan records
- DependencyGraph data
- PromptHistory records (for prompt bundles)
- Export configuration options

## Outputs
- Rendered document content (string)
- Export records (stored for retrieval)
- Downloadable file responses

## Dependencies
- doc-store (reads all domain data)
- system-parser (for individual system markdown)
- version-plan-parser (for version plan markdown)
- export-parser (for composite document assembly)
- dependency-graph (for graph data in documents)

## Code Mapping
- Service: `lib/services/export.service.ts`, `lib/services/system-detail-roll-up.service.ts` (deriveSectionsFromSystemDetails for GDD)
- Repository: `lib/repositories/system-detail.repository.ts` (listSystemDetailsByProjectId)
- Parser: `lib/parsers/export-parser.ts`
- Actions: `app/actions/export.actions.ts`
- API route: `app/api/exports/[id]/download/route.ts`

## Current Implementation
- **System detail roll-up (Option A):** GDD export derives per-system section content from system details: mechanic→Core Mechanics, input→Inputs, output→Outputs, ui_hint→Implementation Notes, content→Content. Purpose is system.purpose or derived from first mechanic detail when empty. Standalone fields (Current State, Target State, Failure States, Scaling Behavior, Open Questions) remain from GameSystem.
- **Export center:** List view of all exports; type/label (exportType); "Needs submission" badge when not marked up to date; "From synthesis run" when `synthesizedOutputId` is set; preview (expand); per-doc actions: Download (marks as up to date when user downloads), Copy, Mark as up to date; "Mark all as up to date". Export model has `synthesizedOutputId` and `markedUpToDateAt`. After each synthesis run a GDD export is created and linked to that run.

## Known Limitations
- No PDF export in v1
- No collaborative editing of exports
- Export is a point-in-time snapshot, not live-linked

## Target Evolution
- PDF rendering via headless browser or mdx
- HTML export with styled theme
- Live-updating document links
- Export templates (customizable document structure)

## Change Log

- 2026-02-17: Doc synced with codebase; current implementation and code mapping.
- 2026-02-18: Behavior roll-up strategy documented (dedicated Behaviors section).
- 2026-02-18: Export center list view; Needs submission badge; Mark up to date / Mark all; Download marks up to date; synthesizedOutputId and markedUpToDateAt; GDD export created per synthesis run.
- 2026-02-18: GDD uses Option A roll-up (derive sections from system details); listSystemDetailsByProjectId; system-detail-roll-up.service; code mapping updated.
- 2026-02-18: Renamed behaviors → system details in code mapping and roll-up description.
