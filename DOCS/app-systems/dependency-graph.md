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
- **Frontend (Phase 1 MVP + layout/controls):** Interactive **systems interaction** graph at `/projects/[projectId]/dependencies` (framed as “How systems connect” / systems interface flow). React Flow (`@xyflow/react`) with a layout bake-off in `lib/graph/transform.ts`: candidate **ELK layered** and candidate **Graphviz DOT**, both scored on readability metrics (near-square footprint + lower crossing proxy), with the winner used for render and env override support via `NEXT_PUBLIC_GRAPH_LAYOUT_STRATEGY` (`auto`/`elk`/`graphviz`). ELK candidate no longer force-partitions nodes by precomputed dependency levels. Custom edge: right-angle paths with per-edge offset; labels multiline, shown when zoom ≥ 0.45. Layout mode "Organized" default; Layout dropdown: Top–down / Left–right. Canvas: flowchart grid; toolbar Zoom, Fit view. Two-column layout: graph area 2:1 wider than right column. Right column: (1) System preview — `DependencySidePanel` when a system is selected, skeleton when none selected; (2) Interaction links card (definition-style list: source → target, then description or "— No description" when empty; Remove on the right); (3) Add interaction link card (form includes optional link description). Zustand graph store holds selection, layout direction (TB/LR), filters, and edge-edit state. Custom system node shows label, status badge, criticality-based styling. Node click opens side panel; “Add interaction link” adds edges (source uses or interfaces with target). See [plans/graph-system-and-ui.md](../plans/graph-system-and-ui.md) and [plans/dependency-graph-reconceptualization.md](../plans/dependency-graph-reconceptualization.md) for interaction framing and phased plan.

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
- 2026-02-19: Coherent flowchart layout: dagre acyclicer 'greedy', nodesep/ranksep tuning; toolbar Zoom in/out and Fit view wired via onInit; layout direction (Top–down / Left–right) in store and Layout dropdown; Current Implementation updated.
- 2026-02-19: Edge labels on graph (description/type), edgesForGraph passes description; smoothstep edges, filter to existing nodes, defaultEdgeOptions. Right column: system preview with skeleton when no selection; Suggested build order removed; Interaction links definition-style (2 rows per link, description centered, Remove right); Add link form supports optional description. Implementation order / hasCycles no longer in UI (see plans/edge-labels-and-visible-connections.md).
- 2026-02-19: Graph layout rebuilt: dagre replaced with elkjs layered layout (async getLayoutedFlow); custom dependencyEdge component for labeled edges; fitView after layout. Synthesis extraction and convert fallback now populate dependency descriptions (prompt + parser + wizard edge builders). Interaction links list shows "— No description" when description is missing or empty.
- 2026-02-19: Flowchart rendering pass: orthogonal edge routing (ELK ORTHOGONAL + getSmoothStepPath borderRadius 0); temporary bright high-contrast edge/arrow colors for visibility; multiline wrapped edge labels; major/minor grid background.
- 2026-02-19: Readability logic: pre-layout organization (dependency levels, stable order, partition); ELK crossing minimization and spacing; edge path offset to reduce overlap; zoom-dependent label visibility; default layout mode "Organized" in store and Layout dropdown.
- 2026-02-19: Layout bake-off introduced in `lib/graph/transform.ts`: ELK vs Graphviz candidate layouts scored by readability (aspect ratio + crossing proxy + span); winner rendered by default (`NEXT_PUBLIC_GRAPH_LAYOUT_STRATEGY=auto`). Removed forced ELK partitioning from precomputed dependency levels.
