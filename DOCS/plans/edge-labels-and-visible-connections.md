# Edge labels and visible connections

This plan describes how to show connection labels (descriptions) on the dependency graph and in the Interaction links list, redesign the list for readability, simplify the dependencies sidebar (skeleton for system preview, remove Suggested build order), and allow adding link descriptions from the Add link form.

**References:** [app-systems/dependency-graph.md](../app-systems/dependency-graph.md), [graph-system-and-ui.md](graph-system-and-ui.md), [dependency-graph-reconceptualization.md](dependency-graph-reconceptualization.md).

---

## 1. What's going wrong

**Connection labels are collected and stored, but not shown on the graph.**

- **Synthesis:** [lib/services/synthesis-convert-suggest.service.ts](../../lib/services/synthesis-convert-suggest.service.ts) asks the AI for optional `description` per dependency; [synthesis-convert.service.ts](../../lib/services/synthesis-convert.service.ts) persists it. **Schema:** [prisma/schema.prisma](../../prisma/schema.prisma) `Dependency` has `description String?`; the page loads it and passes `edgesList` with `description`.
- **Dropped before graph:** In [dependencies-content.tsx](../../app/(app)/projects/[projectId]/dependencies/dependencies-content.tsx), `edgesForGraph` is built with only `sourceId`, `targetId`, and `type` — **description is omitted**.
- **Transform doesn't use labels:** [lib/graph/transform.ts](../../lib/graph/transform.ts) defines `EdgeForTransform` without `description` and builds React Flow edges with no `label`.

Descriptions are not clearly visible in the current Interaction links list. We will make them prominent in a definition-style list and add edge labels on the graph.

**Edges (arrows):** The transform does create edges with `source`, `target`, `markerEnd`, and `style`. If they don't appear, check viewport/overflow or stroke contrast.

---

## 2. Pass description into the graph pipeline

**File:** [app/(app)/projects/[projectId]/dependencies/dependencies-content.tsx](../../app/(app)/projects/[projectId]/dependencies/dependencies-content.tsx)

Include `description` in the payload passed to the canvas. Change `edgesForGraph` to:

`edges.map((e) => ({ sourceId: e.sourceId, targetId: e.targetId, type: e.type, description: e.description ?? null }))`

---

## 3. Extend transform and add edge labels

**File:** [lib/graph/transform.ts](../../lib/graph/transform.ts)

- Extend **EdgeForTransform** with `description?: string | null`.
- When building **edgeList**, add a **label** for each edge: `label: e.description ?? e.type ?? ''`.
- Set **labelShowBg: true** and **labelStyle** / **labelBgStyle** (e.g. theme-aware fill/stroke) so labels stay readable.

Example edge shape:

```ts
{
  id: `${e.sourceId}-${e.targetId}`,
  source: e.sourceId,
  target: e.targetId,
  type: 'default',
  label: e.description ?? e.type ?? '',
  labelShowBg: true,
  labelStyle: { fontSize: 10 },
  labelBgStyle: { fill: 'hsl(var(--background))', stroke: 'hsl(var(--border))' },
  markerEnd: { type: 'arrowclosed' },
  style: { stroke: 'hsl(var(--foreground) / 0.75)', strokeWidth: 2 },
}
```

---

## 4. Ensure edges are visible (if needed)

If arrows don't show: ensure the graph container is not clipping edges; optionally bump **strokeWidth** or use higher-contrast **stroke**. The default React Flow edge type supports the `label` property.

---

## 5. Interaction links: definition-style list (2 rows per link, delete right)

**File:** [dependencies-content.tsx](../../app/(app)/projects/[projectId]/dependencies/dependencies-content.tsx)

Redesign the Interaction links list:

- **Row 1:** Source system name → Target system name (optionally type in muted text). Keep source/target as buttons that call `selectNode`.
- **Row 2:** Link description, centered below the connection. Show `e.description` when present; if missing, show nothing or a muted placeholder.
- **Delete button:** On the right, vertically and horizontally centered, spanning both rows (CSS grid: `grid-template-columns: 1fr auto`, button in second column with `grid-row: 1 / -1`, `align-self: center`).

Each edge item: `<div>` with `display: grid`, `grid-template-columns: 1fr auto`, `grid-template-rows: auto auto`. First column: row 1 = source → target; row 2 = description (text-center). Second column: Remove button spanning both rows.

---

## 6. System preview with skeleton + remove Suggested build order

**File:** [dependencies-content.tsx](../../app/(app)/projects/[projectId]/dependencies/dependencies-content.tsx)

- **Keep the system preview.** When a system is selected, show `DependencySidePanel` in the same Card/slot as now.
- **Use a skeleton when no system is selected** so the layout does not jump. Replace the current placeholder text and "View all" button with a **skeleton** (from [components/ui/skeleton.tsx](../../components/ui/skeleton.tsx)) that reserves roughly the same vertical space as the side panel (e.g. Card with several `<Skeleton className="h-4 w-full" />` lines and a title-sized skeleton).
- **Remove the "Suggested build order" card** — Delete the entire Card (header + content). Remove `implementationOrder` and `hasCycles` from `DependenciesContent` and from the page if unused.

Right column order after changes: (1) System preview (DependencySidePanel when selected, skeleton when not), (2) Interaction links card, (3) Add interaction link card.

---

## 7. Add link description in the UI (Add link form + action)

Users should be able to enter an optional link description when adding a link from the "Add interaction link" form. The schema, repository, and dependency service already accept and persist `description`; only the Server Action and the form need changes.

- **File: [app/actions/dependency.actions.ts](../../app/actions/dependency.actions.ts)** — Add optional parameter `description?: string | null` to `addDependencyAction`; pass it through to `dependencyService.addDependency(..., description)`.
- **File: [add-dependency-form.tsx](../../app/(app)/projects/[projectId]/dependencies/add-dependency-form.tsx)** — Add state for optional description; add an optional text input (e.g. "Link description (optional)", placeholder "e.g. sends encounter events"); on submit pass `description || null` to the action; clear description on success.

---

## 8. Documents to update

After implementing, update the following. Each updated doc must have a **Change Log** section; append `- YYYY-MM-DD: brief description` (chronological). See [.cursor/rules/docs-sync-after-code.mdc](../../.cursor/rules/docs-sync-after-code.mdc).

| Document | What to update |
|----------|----------------|
| **DOCS/app-systems/dependency-graph.md** | Current Implementation: (1) Transform/graph edge labels from description (and type fallback); edgesForGraph passes description. (2) Right column: system preview with skeleton when no selection; Suggested build order removed; Interaction links definition-style (2 rows per link, description centered, delete right). (3) Add link form supports optional description. Remove mention of implementation order / hasCycles. Change Log: add entry. |
| **DOCS/plans/graph-system-and-ui.md** | Change Log: add entry that edge labels, Interaction links definition list, system preview skeleton, removal of Suggested build order, and Add link description were implemented (reference this plan). |
| **DOCS/design-specification.md** | If dependencies page is described: align with edge labels, list layout, no Suggested build order, skeleton. Change Log if edited. |
| **DOCS/frontend-architecture.md** | If dependencies route is described: update for skeleton, removal of Suggested build order, Interaction links as definition list. Change Log if edited. |

No new doc files are required.

---

## Summary

| Area | Change |
|------|--------|
| **dependencies-content.tsx** | Include `description` in `edgesForGraph`; definition list for Interaction links; skeleton when no system selected; remove Suggested build order. |
| **lib/graph/transform.ts** | Add `description` to EdgeForTransform and edge `label` (and optional labelStyle/labelShowBg). |
| **dependency.actions.ts** | Add optional `description` param to `addDependencyAction`; pass to service. |
| **add-dependency-form.tsx** | Add optional description state and text input; pass to action on submit; clear on success. |
| **Visibility** | If arrows are still hard to see, strengthen stroke or fix container overflow. |

After this, connection descriptions appear in the list (below each link) and on graph edges; the sidebar shows the system panel (or skeleton), Interaction links, and Add interaction link; and users can add link descriptions from the form.

---

## Change Log

- 2026-02-19: Plan added: edge labels on graph, Interaction links definition list, system preview skeleton, remove Suggested build order, Add link description in form and action; documents to update.
- 2026-02-19: Implemented: synthesis extraction/convert fallback now populate descriptions; graph rebuilt with elkjs and custom labeled edges; Interaction links list shows "— No description" when empty.
