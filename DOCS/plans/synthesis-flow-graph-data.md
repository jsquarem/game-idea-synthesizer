# Synthesis Flow and Graph Data — Plan

This document plans updates to the synthesis flow (extraction + convert suggest + convert apply) so it can populate the data required to generate the **systems interaction flowchart** (labeled edges, appropriate system granularity). It is based on a gap analysis of the current prompt/output vs the desired graph (see [dependency-graph-reconceptualization.md](dependency-graph-reconceptualization.md)).

**References:** [dependency-graph-reconceptualization.md](dependency-graph-reconceptualization.md), [app-systems/dependency-graph.md](../app-systems/dependency-graph.md). Examples: [DOCS/examples/prompt.md](../examples/prompt.md), [DOCS/examples/output.json](../examples/output.json).

---

## 1. Gap: Are the current prompt and output sufficient?

**No.** To generate the desired interaction flowchart (e.g. Guild of Emergent Minds with labeled edges like "sends parties / objectives", "upgrades capacity", "expands nodes / logic"), the current pipeline is missing:

- **Edge labels (descriptions):** The graph needs a short label per edge. Extraction outputs `dependencies` as `string[]` (slugs only). Convert suggest outputs `dependencies: [{ sourceSlug, targetSlug }]` with no `description`. Neither produces the interaction phrase; the DB supports `Dependency.description` but nothing in the flow populates it.
- **System granularity:** The desired flowchart has ~12 nodes (Guild Management, Quest Selection, Reputation, Resource Production, Hero Training, Combat, Boss Mechanics, Heroes/Units, Roles, Behavior Trees, AI Learning, Player Intervention). The example extraction output has 5 coarser systems. The prompt does not ask for "one system per major interface" or flowchart-level granularity. This plan's extraction update addresses granularity and dependency flow (see §3.4).
- **Layers (optional):** The target UI uses "Base / Guild Layer" and "Dungeon / Combat Layer" subgraphs. There is no `layer` (or group) field in extraction or on `GameSystem`; that can be a later addition.

---

## 2. Recommendation: Update the synthesize flow

The synthesize flow should be updated so that:

1. **Convert suggest** can output an optional **description** per dependency (interaction label).
2. **Convert apply** and **dependency.service** accept and persist that description when creating edges.
3. **Extraction** (optional but recommended) encourages flowchart-level system granularity and/or per-edge labels so the graph can be populated from synthesis end-to-end.
4. **Examples** (prompt.md, output.json) reflect the extended schema and desired granularity.

---

## 3. Deliverables (when implementing)

### 3.1 Convert suggest: edge description

- **File:** [lib/services/synthesis-convert-suggest.service.ts](../../lib/services/synthesis-convert-suggest.service.ts)
- **Changes:** Extend the schema so each dependency can include an optional `description` (e.g. `{ sourceSlug, targetSlug, description?: string }`). Update the system prompt example and rules to ask for a short interaction phrase per edge when helpful. In the parsed `ConvertSuggestion` type and normalization, accept and pass through `description` (missing → `undefined`).

### 3.2 Convert apply: pass description when creating dependencies

- **File:** [lib/services/synthesis-convert.service.ts](../../lib/services/synthesis-convert.service.ts)
- **Changes:** Extend `dependencyEdges` (or equivalent) to `{ sourceSlug, targetSlug, description?: string }[]`. When calling `addDependency` for each edge, pass the optional description.

### 3.3 Dependency service: accept description

- **File:** [lib/services/dependency.service.ts](../../lib/services/dependency.service.ts)
- **Changes:** Add an optional `description` parameter to `addDependency(sourceSystemId, targetSystemId, dependencyType?, description?)` and pass it through to `createDependency`. Repository already supports `CreateDependencyInput.description`.

### 3.4 Extraction (optional)

- **File:** [lib/services/context-builder.service.ts](../../lib/services/context-builder.service.ts) (EXTRACTION_INSTRUCTIONS)
- **Changes:** Clarify that systems should be at "flowchart" granularity (one node per major interface boundary) so extraction tends to produce finer systems (e.g. Quest Selection, Hero Training, Behavior Trees) rather than a few coarse buckets. Optionally extend extraction so `dependencies` can be an array of objects like `{ targetSlug, description }` and wire those into convert so edge labels can come from extraction as well.
- **Implemented:** Flowchart granularity and dependency-flow rules are now in EXTRACTION_INSTRUCTIONS (context-builder.service.ts); examples (prompt.md, output.json) updated to the graph-ready shape.

### 3.5 Examples and docs

- **Files:** [DOCS/examples/prompt.md](../examples/prompt.md), [DOCS/examples/output.json](../examples/output.json)
- **Changes:** Update the example extraction output to show more systems and/or the convert-suggest shape with optional `description` and an example labeled edge. Keeps examples aligned with the pipeline and the desired graph.

### 3.6 Out of scope for this plan

- **Layers/subgraphs:** Adding a `layer` (or group) field to `GameSystem` and rendering subgraph boxes in the UI is not required for this plan; can be added later.

---

## 4. Summary

| Current | After implementation |
|--------|----------------------|
| Convert suggest: `{ sourceSlug, targetSlug }` only | Optional `description` per edge (interaction label) |
| Convert apply: no description passed | Pass description to `addDependency` |
| addDependency: no description param | Optional `description` param; persist via repo |
| Extraction: coarse systems, dependencies = slugs only | Optional: finer granularity and/or per-edge description in extraction |

Once these changes are in place, the synthesize flow can populate the data required to generate the desired systems interaction graph (nodes + edges + edge labels).

---

## Change Log

- 2026-02: Initial plan: gap analysis (prompt/output vs desired graph); recommendation to add edge description to convert suggest/apply and dependency service; optional extraction and examples updates.
- 2026-02: Added [DOCS/examples/prompt-new.md](../examples/prompt-new.md) and [DOCS/examples/output-new.json](../examples/output-new.json): prompt and extraction output capable of producing the 12-system interaction graph (Guild of Emergent Minds flowchart).
- 2026-02-18: Extraction instructions updated for flowchart-level granularity and interaction-flow dependencies; examples aligned (prompt.md, output.json); §3.4 extraction item implemented.
