# Graph System and UI — Phased Plan

This document plans the dependency graph system and interactive UI. It is **plan-only**; implementation happens in follow-up work.

**References:** [design-specification.md](../design-specification.md) §1.3.13, §3.1.8, §4.8; [frontend-architecture.md](../frontend-architecture.md) §6; [dependency-graph-reconceptualization.md](dependency-graph-reconceptualization.md) (systems interaction framing and copy).

---

## 1. Purpose and scope

- **Purpose:** Replace the current list-only dependency view with an interactive DAG (directed acyclic graph) framed as a **systems interaction** view (how systems connect / interface with each other). Over time, embed graph previews on the project overview and version plan pages.
- **Scope:** Full graph vision is described here; delivery is phased (MVP → full dependencies page → full ecosystem). A Zustand graph store is used from the start for selection, layout, filters, and impact mode.
- **Out of scope for this plan:** AI-powered phase ordering (“Auto-generate Phases”), cached/incremental graph updates, weighted edges, or other backend evolution (see [app-systems/dependency-graph.md](../app-systems/dependency-graph.md) for target evolution).

---

## 2. Current state

**Backend / lib (sufficient for MVP and beyond):**

- `lib/graph/graph-engine.ts` — buildGraph, add/remove edge, cycle detection, topological sort, impact analysis, validateScope, computePhases, identifyRiskNodes.
- `lib/graph/types.ts` — GraphNode, GraphEdge, DirectedGraph.
- `lib/services/dependency.service.ts` — getProjectGraph, addDependency, removeDependency, getImpact.
- `app/actions/dependency.actions.ts` — **addDependencyAction only.** Gap: no **removeDependencyAction** (service exists; Server Action + revalidate missing).

**Current UI:**

- `app/(app)/projects/[projectId]/dependencies/page.tsx` — Fetches graph (nodes, implementationOrder), systems, deps; passes to content.
- `app/(app)/projects/[projectId]/dependencies/dependencies-content.tsx` — Placeholder “Graph coming soon”, disabled controls, implementation order list, edges list, AddDependencyForm, DependencySidePanel when a system is selected from lists.
- Project overview — “Graph preview placeholder” + “View Full Graph” link; no real mini-graph.

**Not yet in codebase:** @xyflow/react, dagre, graph store (Zustand), any graph canvas/node/edge components, or transform from server data to React Flow nodes/edges.

---

## 3. Library choices

| Library | Purpose |
|--------|---------|
| **@xyflow/react** (React Flow) | Interactive DAG: nodes, edges, pan, zoom, minimap, custom node/edge components, keyboard/ARIA. |
| **dagre** | Automatic directed layout (top-down or left-to-right); used to compute node positions before passing to React Flow. |

**Rationale (see frontend-architecture §6.1):** React Flow is purpose-built for node-based graphs in React, with good performance and built-in controls. Dagre provides deterministic hierarchical layout. We are not using D3/vis/Cytoscape/Mermaid for this feature.

---

## 4. Data flow

- **Server:** Dependencies page (or overview / version plan) fetches systems and dependencies; `getProjectGraph(projectId)` returns `{ nodes, edges, implementationOrder }`. Optional: for version plan scope, filter to plan systems and use graph-engine `extractSubgraph` then topological sort.
- **Client:** Transform systems + edges into React Flow `Node[]` and `Edge[]` using dagre for positions. Graph store holds selection, layout mode, filters, impact mode, and edge-edit state. Viewport (zoom/pan) lives on the React Flow instance.
- **Mutations:** Add dependency → `addDependencyAction(projectId, sourceId, targetId)` → revalidate dependencies (and overview). Remove dependency → `removeDependencyAction(projectId, sourceId, targetId)` (to be added) → same revalidation. Cycle check is done in dependency service before persisting.

---

## 5. Zustand graph store

Store holds UI state for the dependency graph; viewport (zoom/pan) remains with React Flow.

**State (from frontend-architecture §6):**

| Field | Type | Description |
|-------|------|--------------|
| selectedNodeId | string \| null | System ID of selected node; drives side panel. |
| highlightedPath | string[] | Node IDs in impact path (upstream/downstream) for highlight mode. |
| layoutAlgorithm | 'dagre' \| 'force' \| 'tree' | Layout mode; MVP can use a single dagre config. |
| criticalityFilter | ('core' \| 'important' \| 'later')[] | Visible criticalities; empty = all. |
| statusFilter | ('draft' \| 'active' \| 'deprecated')[] | Visible statuses; empty = all. |
| isEdgeEditMode | boolean | When true, next two clicks = source then target for add dependency. |
| pendingEdgeSource | string \| null | First node clicked in edge-add mode. |

**Actions:** selectNode, highlightDependencyPath, clearHighlight, setLayout, setCriticalityFilter, setStatusFilter, resetFilters, toggleEdgeEditMode, setPendingEdgeSource. Zoom/pan can be set on the store if needed for persistence; otherwise use React Flow refs for fitView/zoom.

---

## 6. Phase 1 — MVP

**Goal:** Interactive DAG on the dependencies page with node selection and add-dependency from graph; keep implementation order and edges list.

- **Dependencies:** Add `@xyflow/react` and `dagre` (and types if needed).
- **Transform:** New module (e.g. `lib/graph/transform.ts` or under `components/`) to map systems + edges → React Flow nodes/edges. Use dagre with fixed node dimensions; node IDs = system id, edge IDs = `sourceId-targetId`. Include in node data: label, status, mvpCriticality for styling.
- **Graph store:** Create `store/graph-store.ts` (Zustand) with at least: selectedNodeId, layoutAlgorithm (single value for MVP), isEdgeEditMode, pendingEdgeSource, and actions above.
- **Canvas:** Implement main graph component (e.g. `DependencyGraphCanvas`) using React Flow with a custom node type (system node: label, criticality-based fill, status border; use design tokens: `--graph-node-core`, `--graph-node-important`, `--graph-node-later`, `--graph-border-draft`, `--graph-border-active`). Edges: default style, arrow marker.
- **Page integration:** Replace “Graph coming soon” in `dependencies-content.tsx` with the canvas. Keep implementation order list and edges list below; keep AddDependencyForm and DependencySidePanel.
- **Node click:** On node click, update store `selectedNodeId`; existing DependencySidePanel shows selected system.
- **Add edge from graph:** Either (a) “Add dependency” button toggles edge-edit mode: click source node then target node → call `addDependencyAction` (cycle check in service) → revalidate; or (b) keep/add a small AddEdgeDialog (source/target selects) and optionally prefill from graph selection. Form-based add remains available.
- **Optional for MVP:** Add `removeDependencyAction` and a “Remove” action on each row in the edges list (no requirement for edge-click remove in Phase 1).
- **Acceptance:** User sees interactive DAG; clicking a node opens the side panel; user can add a dependency from graph or form; implementation order and edges list still work; no cycles can be created.

---

## 7. Phase 2 — Full dependencies page

**Goal:** Complete the dependencies page per design spec: remove edge from graph, impact mode, layout/filter controls, minimap, legend, accessibility.

- **Remove edge:** Edge click (or right-click context menu) → “Remove dependency” → RemoveEdgeDialog → `removeDependencyAction` → revalidate.
- **Impact mode:** Toggle in toolbar. When on and a node is selected, compute downstream (and optionally upstream) via `getImpact` or graph-engine; set `highlightedPath` in store; visually highlight those nodes/edges (e.g. design token `--graph-impact` for cascade).
- **Layout:** Layout switcher (Hierarchical / Force / LTR). Store `layoutAlgorithm`; transform supports multiple dagre rankdirs or force layout; recalc positions on change.
- **GraphControls:** Zoom in, zoom out, fit view (React Flow API), layout dropdown.
- **GraphFilterBar:** Filter by criticality and status; “hide deprecated” toggle. Apply to visibility or dimming of nodes.
- **GraphMiniMap:** React Flow `<MiniMap>` in corner. **GraphLegend:** Color key for criticality and status.
- **Accessibility:** Table-based alternative view of dependencies (design spec §5.6); `prefers-reduced-motion` disables or reduces graph animations (design spec §5.6).

---

## 8. Phase 3 — Full ecosystem

**Goal:** Embed graph in overview and version plan; optional mini-preview in system dependency picker.

- **Overview mini-graph:** Read-only compact view on project overview (replace “Graph preview placeholder”). Same data as full graph but smaller canvas or simplified node-link; “View Full Graph” link to dependencies page. Optionally: click node → navigate to system detail or to dependencies page with that node selected (via query or store init).
- **Version plan subgraph:** On version plan view/edit, show **PlanDependencySubgraph** — only systems in the plan’s scope. Use graph-engine `extractSubgraph` + same transform; embed in plan page.
- **System form / DependencyMultiSelect:** Per design spec, dependency multi-select can show a mini-graph preview. Lower priority; can be a “preview placeholder” until after overview and version plan are done.

---

## 9. Component checklist

Mapping to design spec §3.1.8; phase that introduces each:

| Component | Phase | Notes |
|-----------|-------|--------|
| DependencyGraphCanvas | 1 | React Flow wrapper + custom node/edge types. |
| GraphNode (custom node) | 1 | Label, status icon, criticality color. |
| GraphEdge | 1 | Default React Flow edge with arrow; styling from design tokens. |
| NodeDetailPanel | 1 | Existing DependencySidePanel. |
| AddEdgeDialog | 1 or 2 | Optional in MVP if using click-click; otherwise dialog for source/target. |
| GraphControls | 2 | Zoom, fit, layout dropdown. |
| GraphMiniMap | 2 | React Flow MiniMap. |
| GraphLegend | 2 | Criticality + status key. |
| GraphFilterBar | 2 | Criticality, status, deprecated toggle. |
| RemoveEdgeDialog | 2 | Confirm remove dependency. |
| ImpactHighlightToggle | 2 | Toggle impact mode. |
| LayoutModeSelect | 2 | Hierarchical / Force / LTR. |
| DependencyMiniGraph | 3 | Overview (and optionally version plan) compact view. |
| PlanDependencySubgraph | 3 | Filtered graph for version plan scope. |
| DependencyMultiSelect (with mini preview) | 3 | System form; can start as placeholder. |

---

## 10. Backend follow-ups

- **Add removeDependencyAction:** In `app/actions/dependency.actions.ts`, add an action that calls `dependency.service.removeDependency(sourceSystemId, targetSystemId)` and revalidates `/projects/[projectId]/dependencies` and `/projects/[projectId]/overview`. No graph-engine or service changes required.
- No other backend changes are required for Phases 1–3; graph-engine and dependency service already support all needed operations.

---

## 11. Docs and changelog

- When implementing, update **DOCS/app-systems/dependency-graph.md** “Current Implementation” to describe the graph UI and reference this plan.
- Keep this plan’s change log below.

---

## Change Log

- 2026-02-18: Initial phased plan (MVP → full dependencies page → full ecosystem); Zustand graph store; component checklist and backend follow-ups.
- 2026-02-18: Phase 1 MVP implemented: branch feature/dependency-graph-ui; @xyflow/react + dagre; removeDependencyAction; lib/graph/transform.ts; store/graph-store.ts; DependencyGraphCanvas + SystemNode; dependencies page wired with canvas, store-driven panel, add-edge from graph, remove from edges list.
- 2026-02: Purpose updated to systems interaction framing; reference to dependency-graph-reconceptualization plan for copy and interaction view.
- 2026-02-19: Phase 2 (partial): Layout direction (Top–down / Left–right) implemented via graph store layoutDirection and Layout dropdown; Zoom in, Zoom out, Fit view toolbar buttons wired to React Flow instance via onInit; dagre acyclicer and spacing tuned for coherent flowchart (see dependency-graph.md).
- 2026-02-19: Edge labels on graph, Interaction links definition-style list, system preview skeleton when no selection, removal of Suggested build order, Add link form optional description (see plans/edge-labels-and-visible-connections.md).
- 2026-02-19: Graph layout rebuilt with elkjs (replacing dagre): async getLayoutedFlow in lib/graph/transform.ts; custom dependencyEdge component for labeled edges; fitView after layout. Synthesis extraction and convert fallback now populate dependency descriptions; Interaction links list shows "— No description" when empty.
- 2026-02-19: Visibility/debug pass: orthogonal (right-angle) edge routing (ELK ORTHOGONAL + getSmoothStepPath borderRadius 0); temporary bright high-contrast edge/arrow colors; multiline wrapped labels; flowchart grid background. Polish (theme-aligned colors) to follow after user confirms visibility.
- 2026-02-19: Readability logic pass: pre-layout organization (levels, stable order, partition); ELK crossing minimization and spacing; edge path offset; zoom-dependent labels; default layout mode "Organized".
