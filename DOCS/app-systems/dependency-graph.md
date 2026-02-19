# System: Dependency Graph

## Purpose
Builds, maintains, and queries the **systems interaction graph** between game systems: which systems interface with which, and how (data flow, triggers, “A uses B”). The primary view is **what systems interact with which and how**. Implementation ordering (topological sort), impact assessment, and scope validation are **derived** from the same graph.

## Responsibilities
- Maintain directed edges between game systems (cycles allowed; natural for systems interaction flow)
- Compute topological sort (implementation ordering when graph is acyclic)
- Perform upstream/downstream impact analysis
- Detect risk surfaces (high fan-in/fan-out nodes)
- Validate version plan scope completeness
- Compute implementation phases from dependency layers

## Inputs
- GameSystem records (nodes)
- Dependency records (edges)
- System IDs for targeted analysis
- Scope sets for validation

## Outputs
- Full dependency graph structure (nodes + edges)
- Topologically sorted implementation order
- Impact analysis reports
- Risk surface identification
- Phase groupings
- Cycle detection results
- Scope validation results

## Dependencies
- doc-store (reads system and dependency data)

## Code Mapping
- Engine: `lib/graph/graph-engine.ts`
- Types: `lib/graph/types.ts`
- Service: `lib/services/dependency.service.ts`
- Repository: `lib/repositories/dependency.repository.ts`
- Actions: `app/actions/dependency.actions.ts`

## Current Implementation
- **Backend:** Graph engine, dependency service, and `getProjectGraph` / `addDependency` / `removeDependency` / `getImpact` are implemented. Cycles are allowed; `getProjectGraph` returns `hasCycles`. Server Actions: `addDependencyAction` and `removeDependencyAction` (revalidate dependencies + overview). Edges support optional `description` for interaction labels (e.g. “sends encounter events”).
- **Frontend (Phase 1 MVP):** Interactive **systems interaction** graph at `/projects/[projectId]/dependencies` (framed as “How systems connect” / systems interface flow). React Flow (`@xyflow/react`) and dagre layout. Project layout gives sidebar a fixed-height band below the top nav; full-width routes use a viewport-height–constrained container. Transform: `lib/graph/transform.ts` maps systems + edges to React Flow nodes/edges. Two-column layout: graph area 2:1 wider than right column. Page copy frames the graph as systems interfacing with each other; implementation order is shown as a **derived** “Suggested build order (from dependencies).” Zustand graph store holds selection, layout, filters, and edge-edit state. Custom system node shows label, status badge, criticality-based styling. Node click opens side panel; “Add interaction link” adds edges (source uses or interfaces with target). Edge optional description shows how. Edges list shows edge description when present. See [plans/graph-system-and-ui.md](../plans/graph-system-and-ui.md) and [plans/dependency-graph-reconceptualization.md](../plans/dependency-graph-reconceptualization.md) for interaction framing and phased plan.

## Known Limitations
- Graph is recomputed on each request (not cached in v1)
- No weighted edges (all dependencies treated equally except type)
- Visualization is frontend concern, engine only provides data

## Target Evolution
- Cached/incremental graph updates
- Weighted dependency strengths
- **Suggested dependency detection via AI:** dedicated “Suggest links” action: given current systems and their purpose/specs, AI suggests missing interaction edges (see [plans/dependency-graph-reconceptualization.md](../plans/dependency-graph-reconceptualization.md)).
- Graph diff between version plan snapshots

## Change Log

- 2026-02-17: Doc synced with codebase; current implementation and code mapping.
- 2026-02-18: Current Implementation filled: Phase 1 graph UI (React Flow, dagre, store, canvas, add/remove from graph and list); reference to graph-system-and-ui plan.
- 2026-02-18: Edge visibility (stroke/strokeWidth), explicit canvas height, 2:1 layout, explanatory copy, empty state; Current Implementation updated.
- 2026-02-18: Layout: sidebar below top nav (min-h/h calc viewport), FullWidthPageContainer in ProjectContentWrapper, ProjectContentArea conditional padding, dependencies content viewport-constrained (flex/min-h-0), canvas fills flex parent.
- 2026-02: Purpose and Current Implementation reframed as systems interaction flowchart; Target Evolution note on AI suggest-links; reference to dependency-graph-reconceptualization plan.
- 2026-02-19: Synthesis "Create selected" redirects to this page (dependency graph) after convert; new dependencies come from extraction stubs when user does not use Get AI suggestion.
- 2026-02-19: Purpose clarified: primary view is "what systems interact with which and how"; build order derived. Current Implementation: Add interaction link (replacing former "Add dependency" label); edge description for "how."
- 2026-02-19: Cycle guard removed; cycles allowed for natural systems interaction flow. getProjectGraph returns hasCycles; Suggested build order shows explanatory message when graph has cycles.
