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
- Service: `lib/services/export.service.ts`
- Parser: `lib/parsers/export-parser.ts`
- Actions: `app/actions/export.actions.ts`
- API route: `app/api/exports/[id]/download/route.ts`

## Current Implementation
(To be filled during implementation)

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
(Chronological updates)
