# QA & Testing Specification
## GamePlan AI — v1.0

**Status:** Draft  
**Derived From:** `DOCS/game-idea-synthesizer-PRD.md`, `.cursor/rules/nextjs-engineering.mdc`  
**Testing Stack:** Vitest · React Testing Library · Playwright  

---

# 1. Testing Strategy Overview

## 1.1 Testing Philosophy

> **"Test behavior, not implementation."**  
> — Engineering Guidelines

Every test validates **what** the system does for its consumers (users, callers, downstream systems), not **how** it does it internally. Tests should remain stable across refactors and only break when observable behavior changes.

## 1.2 Test Pyramid

| Layer | Tool | What It Covers | Approximate Share |
|-------|------|----------------|-------------------|
| **Unit** | Vitest | Pure functions, parsers, graph algorithms, Zod schemas, service logic in isolation | ~60% |
| **Integration** | Vitest + real SQLite | Service ↔ repository, multi-service workflows, Server Actions | ~25% |
| **E2E** | Playwright | Critical user flows through the browser | ~15% |

## 1.3 Decision Matrix: What Gets Tested Where

| Concern | Unit | Integration | E2E |
|---------|------|-------------|-----|
| Markdown ↔ struct parsing | ✅ | — | — |
| Zod schema validation | ✅ | — | — |
| Graph algorithms (cycles, topo-sort) | ✅ | — | — |
| Service business logic (merge, split, delta) | ✅ | — | — |
| AI engine template rendering | ✅ | — | — |
| Service + DB round-trip | — | ✅ | — |
| Multi-service workflows (synthesize → convert) | — | ✅ | — |
| Server Actions input validation | — | ✅ | — |
| Export generation from real data | — | ✅ | — |
| Full user workflow (brainstorm → export) | — | — | ✅ |
| UI state transitions & navigation | — | — | ✅ |
| Accessibility (keyboard, focus) | — | — | ✅ |

---

# 2. Unit Test Plan (Vitest)

All unit test files live alongside their source in a `__tests__` directory or as sibling `.test.ts` files.

```
lib/
  parsers/
    __tests__/
      system-parser.test.ts
      brainstorm-parser.test.ts
      version-plan-parser.test.ts
  graph/
    __tests__/
      engine.test.ts
  services/
    __tests__/
      game-system.service.test.ts
      dependency.service.test.ts
      synthesis.service.test.ts
      version-plan.service.test.ts
      export.service.test.ts
  ai/
    __tests__/
      engine.test.ts
  validators/
    __tests__/
      schemas.test.ts
```

---

## 2.1 `lib/parsers/__tests__/system-parser.test.ts`

Target: `lib/parsers/system-parser.ts`

### Round-Trip Tests

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should parse a complete system markdown into a GameSystem struct` | Every field from the Section 7 schema is populated correctly |
| 2 | `should serialize a GameSystem struct back to canonical markdown` | Output matches the Section 7 template format exactly |
| 3 | `should round-trip: parse → serialize → parse produces identical struct` | Deep equality between first and second parse result |
| 4 | `should round-trip: serialize → parse → serialize produces identical markdown` | String equality between first and second serialized output |

### Field Coverage (Section 7 Schema)

| # | Test Case | Assertions |
|---|-----------|------------|
| 5 | `should parse System Name from H1 header` | `result.name === 'Combat'` |
| 6 | `should parse System ID slug` | `result.systemId === 'combat'` |
| 7 | `should parse Version in vX.Y format` | `result.version === 'v1.0'` |
| 8 | `should parse Status enum (Draft \| Active \| Deprecated)` | `result.status === 'Draft'` |
| 9 | `should parse Purpose section` | `result.purpose` contains expected text |
| 10 | `should parse Current State section` | `result.currentState` is populated |
| 11 | `should parse Target State section` | `result.targetState` is populated |
| 12 | `should parse Core Mechanics section` | `result.coreMechanics` is populated |
| 13 | `should parse Inputs section` | `result.inputs` is populated |
| 14 | `should parse Outputs section` | `result.outputs` is populated |
| 15 | `should parse Dependencies as list of system IDs` | `result.dependencies` is `['health', 'movement']` |
| 16 | `should parse Depended On By as optional list` | `result.dependedOnBy` is `['economy']` or `[]` |
| 17 | `should parse Failure States section` | `result.failureStates` is populated |
| 18 | `should parse Scaling Behavior section` | `result.scalingBehavior` is populated |
| 19 | `should parse MVP Criticality enum (Core \| Important \| Later)` | `result.mvpCriticality === 'Core'` |
| 20 | `should parse Implementation Notes section` | `result.implementationNotes` is populated |
| 21 | `should parse Open Questions section` | `result.openQuestions` is populated |
| 22 | `should parse Change Log section` | `result.changeLog` is a non-empty array |

### Missing / Malformed Input

| # | Test Case | Assertions |
|---|-----------|------------|
| 23 | `should return error for empty string input` | Throws or returns parse error |
| 24 | `should return error for markdown with no H1 header` | Error identifies missing system name |
| 25 | `should return error for missing System ID section` | Error identifies missing field |
| 26 | `should return error for missing Version section` | Error identifies missing field |
| 27 | `should handle missing optional Depended On By gracefully` | Defaults to empty array |
| 28 | `should handle missing Change Log gracefully` | Defaults to empty array |
| 29 | `should handle extra unrecognized sections without error` | Parses known fields, ignores unknown |
| 30 | `should handle Status value not in enum` | Returns validation error |
| 31 | `should handle MVP Criticality value not in enum` | Returns validation error |
| 32 | `should handle markdown with inconsistent heading levels` | Best-effort parse or clear error |
| 33 | `should handle section content with nested markdown (lists, code blocks)` | Content preserved verbatim |

---

## 2.2 `lib/parsers/__tests__/brainstorm-parser.test.ts`

Target: `lib/parsers/brainstorm-parser.ts`

### Discord Format Parsing

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should parse Discord conversation with username:message format` | Array of `{ author, content, timestamp? }` |
| 2 | `should parse Discord timestamps in common formats` | Parsed `Date` objects or ISO strings |
| 3 | `should handle multi-line messages from a single user` | Content includes all lines until next author |
| 4 | `should handle Discord nicknames with special characters` | Author name preserved correctly |
| 5 | `should handle empty messages between author lines` | Skipped or represented as empty content |
| 6 | `should parse Discord thread with quoted replies` | Quoted content attributed correctly |

### Plain Text / Freeform Input

| # | Test Case | Assertions |
|---|-----------|------------|
| 7 | `should parse freeform text as a single brainstorm entry` | Single entry with full text as content |
| 8 | `should parse markdown-formatted freeform text` | Content preserved with formatting |
| 9 | `should handle text with bullet points as structured ideas` | Entries or ideas array populated |

### Edge Cases

| # | Test Case | Assertions |
|---|-----------|------------|
| 10 | `should return empty array for empty string` | `result.messages.length === 0` |
| 11 | `should return empty array for whitespace-only input` | `result.messages.length === 0` |
| 12 | `should handle extremely long messages (>10K chars)` | Parses without error or timeout |
| 13 | `should handle mixed Discord and freeform content` | Best-effort parsing, no crash |
| 14 | `should strip common Discord markdown (bold, italic, code)` | Optional: normalized or preserved |

---

## 2.3 `lib/parsers/__tests__/version-plan-parser.test.ts`

Target: `lib/parsers/version-plan-parser.ts`

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should parse a complete version plan markdown into struct` | All fields populated |
| 2 | `should serialize a VersionPlan struct back to markdown` | Canonical format output |
| 3 | `should round-trip: parse → serialize → parse` | Deep equality |
| 4 | `should parse included systems list` | Array of system IDs |
| 5 | `should parse explicit exclusions list` | Array of system IDs |
| 6 | `should parse development phases` | Ordered array of phase objects |
| 7 | `should parse milestones` | Array with names and criteria |
| 8 | `should parse risk areas` | Array of risk descriptions |
| 9 | `should parse dependency-ordered implementation sequence` | Ordered array of system IDs |
| 10 | `should parse scope validation notes` | String or structured notes |
| 11 | `should handle version plan with no exclusions` | Empty exclusions array |
| 12 | `should handle version plan with no risk areas` | Empty risks array |
| 13 | `should return error for missing version identifier` | Parse error |
| 14 | `should return error for missing included systems` | Parse error |

---

## 2.4 `lib/graph/__tests__/engine.test.ts`

Target: `lib/graph/engine.ts`

### Graph Construction

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should create an empty graph` | Node count = 0, edge count = 0 |
| 2 | `should add a single node` | Node count = 1, can retrieve it |
| 3 | `should add an edge between two nodes` | Edge exists in adjacency list |
| 4 | `should reject edge to non-existent node` | Error thrown |
| 5 | `should reject duplicate edges` | Edge count unchanged, no error or specific error |

### Cycle Detection

| # | Test Case | Assertions |
|---|-----------|------------|
| 6 | `should detect no cycle in a linear DAG: A → B → C` | `hasCycle() === false` |
| 7 | `should detect no cycle in a diamond DAG: A → B, A → C, B → D, C → D` | `hasCycle() === false` |
| 8 | `should detect direct cycle: A → B → A` | `hasCycle() === true`, returns cycle path |
| 9 | `should detect indirect cycle: A → B → C → A` | `hasCycle() === true`, returns cycle path |
| 10 | `should detect cycle in complex graph with non-cyclic branches` | Only cyclic subgraph reported |
| 11 | `should report no cycle in empty graph` | `hasCycle() === false` |
| 12 | `should report no cycle in single-node graph` | `hasCycle() === false` |
| 13 | `should detect self-loop: A → A` | `hasCycle() === true` |

### Topological Sort

| # | Test Case | Assertions |
|---|-----------|------------|
| 14 | `should return single node for single-node graph` | `[A]` |
| 15 | `should return correct order for linear chain: A → B → C` | A before B before C |
| 16 | `should return valid order for diamond: A → B, A → C, B → D, C → D` | A first, D last, B and C in middle |
| 17 | `should return valid order for wide graph (many roots)` | All roots appear before their dependents |
| 18 | `should return valid order for deep graph (long chain)` | Strict order preserved |
| 19 | `should throw or return error for cyclic graph` | Error: cannot topologically sort cyclic graph |
| 20 | `should handle disconnected components` | All nodes included, each subgraph ordered correctly |
| 21 | `should return deterministic order for equivalent choices` | Same input → same output every time |

### Impact Analysis

| # | Test Case | Assertions |
|---|-----------|------------|
| 22 | `should return empty impact for leaf node (no dependents)` | `impactOf('leaf') === []` |
| 23 | `should return direct dependents for root node` | All direct children returned |
| 24 | `should return transitive dependents` | All reachable downstream nodes |
| 25 | `should return impact for node in middle of chain` | Only downstream nodes, not upstream |
| 26 | `should handle impact analysis on single-node graph` | `impactOf('only') === []` |

---

## 2.5 `lib/services/__tests__/game-system.service.test.ts`

Target: `lib/services/game-system.service.ts`

Dependencies mocked: repository layer, graph engine.

### CRUD Operations

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should create a game system from valid struct` | Returns created system with ID |
| 2 | `should reject creation with duplicate slug in same project` | Error: slug already exists |
| 3 | `should retrieve a system by ID` | Correct system returned |
| 4 | `should update system fields` | Updated fields persisted |
| 5 | `should delete a system` | System no longer retrievable |
| 6 | `should list all systems for a project` | Returns array of all systems |

### Merge Logic

| # | Test Case | Assertions |
|---|-----------|------------|
| 7 | `should merge two systems into one with combined content` | New system contains merged fields |
| 8 | `should combine dependencies from both source systems` | Union of dependency sets |
| 9 | `should generate changelog entry for merge` | Changelog includes merge record |
| 10 | `should mark source systems as deprecated after merge` | Source system status = 'Deprecated' |
| 11 | `should update dependents to point to merged system` | Dependents reference new system slug |
| 12 | `should reject merge of systems from different projects` | Error thrown |

### Split Logic

| # | Test Case | Assertions |
|---|-----------|------------|
| 13 | `should split one system into two` | Two new systems created |
| 14 | `should distribute dependencies appropriately` | Each child gets relevant deps |
| 15 | `should generate changelog entries for split` | Both children have split record |
| 16 | `should mark parent system as deprecated` | Parent status = 'Deprecated' |
| 17 | `should update dependents to point to appropriate child` | Dependents re-pointed |

### Evolution Delta

| # | Test Case | Assertions |
|---|-----------|------------|
| 18 | `should compute delta between current and target state` | Delta summary generated |
| 19 | `should identify required changes list` | Non-empty changes array |
| 20 | `should identify dependency impact of changes` | Impacted system IDs returned |
| 21 | `should suggest refactor order` | Ordered list based on dependencies |
| 22 | `should handle system with identical current and target state` | Empty delta |

### Changelog Generation

| # | Test Case | Assertions |
|---|-----------|------------|
| 23 | `should append changelog entry with timestamp` | Entry has ISO timestamp |
| 24 | `should preserve existing changelog entries` | Previous entries unchanged |
| 25 | `should format changelog entry as markdown list item` | Matches `- YYYY-MM-DD: description` format |

---

## 2.6 `lib/services/__tests__/dependency.service.test.ts`

Target: `lib/services/dependency.service.ts`

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should validate a valid dependency set (no cycles)` | Validation passes |
| 2 | `should reject dependency that would create a cycle` | Error: cycle detected, includes cycle path |
| 3 | `should reject dependency on non-existent system` | Error: system not found |
| 4 | `should reject self-dependency` | Error: system cannot depend on itself |
| 5 | `should return implementation order for a project` | Topologically sorted system IDs |
| 6 | `should return impact analysis for a given system` | List of affected downstream systems |
| 7 | `should handle project with no dependencies` | Order is arbitrary but valid |
| 8 | `should add a dependency between two systems` | Dependency persisted, graph updated |
| 9 | `should remove a dependency between two systems` | Dependency removed, graph updated |
| 10 | `should rebuild graph from persisted dependency data` | Graph matches stored relationships |

---

## 2.7 `lib/services/__tests__/synthesis.service.test.ts`

Target: `lib/services/synthesis.service.ts`

AI calls mocked.

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should synthesize brainstorm into structured output` | Returns structured synthesis result |
| 2 | `should extract system suggestions from synthesis` | Array of suggested system names/slugs |
| 3 | `should extract suggested dependencies from synthesis` | Dependency pairs returned |
| 4 | `should handle brainstorm with minimal content` | Returns partial or minimal synthesis |
| 5 | `should handle brainstorm with no clear systems` | Returns empty suggestions, not error |
| 6 | `should convert synthesis output to draft GameSystem structs` | Array of valid GameSystem objects |
| 7 | `should mark converted systems as Draft status` | All `system.status === 'Draft'` |
| 8 | `should preserve synthesis metadata (source session ID)` | Source brainstorm ID attached |
| 9 | `should handle AI provider error gracefully` | Returns typed error, not crash |
| 10 | `should store synthesis prompt and response` | Prompt-response pair persisted |

---

## 2.8 `lib/services/__tests__/version-plan.service.test.ts`

Target: `lib/services/version-plan.service.ts`

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should create a version plan with valid scope` | Plan created with included systems |
| 2 | `should reject scope that excludes a required dependency` | Error: missing dependency in scope |
| 3 | `should auto-include transitive dependencies in scope` | Transitive deps added to included list |
| 4 | `should generate development phases from dependency order` | Phases array populated, ordered |
| 5 | `should generate milestones` | Milestones array populated |
| 6 | `should identify risk areas` | Risk areas populated |
| 7 | `should produce dependency-ordered implementation sequence` | Matches topological sort of scoped graph |
| 8 | `should finalize a version plan` | Status changes to 'Finalized' |
| 9 | `should reject modification of finalized plan` | Error: plan is immutable |
| 10 | `should reject re-finalization of already finalized plan` | Error or no-op |
| 11 | `should allow modification of draft plan` | Update succeeds |
| 12 | `should validate version identifier format (vX.Y)` | Rejects 'abc', accepts 'v1.0' |
| 13 | `should list version plans for a project` | Array of plans returned |

---

## 2.9 `lib/services/__tests__/export.service.test.ts`

Target: `lib/services/export.service.ts`

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should export individual system as markdown` | Valid markdown matching Section 7 schema |
| 2 | `should export individual system as JSON` | Valid JSON with all fields |
| 3 | `should export full GDD as composite markdown` | Contains all systems, TOC, metadata |
| 4 | `should export version PRD as markdown` | Contains scoped systems, phases, milestones |
| 5 | `should export roadmap plan as markdown` | Contains phases, implementation order |
| 6 | `should export prompt bundle as markdown` | Contains prompts with context |
| 7 | `should generate copy-to-clipboard format` | Plain string output, no file operations |
| 8 | `should handle project with no systems` | Empty or minimal document, no error |
| 9 | `should handle project with single system` | Valid document without TOC or partial TOC |
| 10 | `should include dependency graph summary in GDD export` | Graph section present |
| 11 | `should order systems by dependency in GDD export` | Systems appear in topological order |

---

## 2.10 `lib/ai/__tests__/engine.test.ts`

Target: `lib/ai/engine.ts`

All external API calls mocked.

### Provider Registration

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should register an AI provider (OpenAI)` | Provider in registry |
| 2 | `should register multiple providers (OpenAI, Claude, Gemini)` | All in registry |
| 3 | `should reject duplicate provider registration` | Error or overwrite behavior defined |
| 4 | `should list registered providers` | Returns array of provider names |

### Routing

| # | Test Case | Assertions |
|---|-----------|------------|
| 5 | `should route request to specified provider` | Correct provider called |
| 6 | `should fall back to default provider if none specified` | Default provider called |
| 7 | `should return error for unregistered provider` | Error: provider not found |

### Template Rendering

| # | Test Case | Assertions |
|---|-----------|------------|
| 8 | `should render implementation prompt template` | Template variables replaced |
| 9 | `should render architecture prompt template` | Template variables replaced |
| 10 | `should render refactor prompt template` | Template variables replaced |
| 11 | `should render balance prompt template` | Template variables replaced |
| 12 | `should render expansion prompt template` | Template variables replaced |
| 13 | `should inject system context into prompt` | System markdown embedded in prompt |
| 14 | `should inject dependency context into prompt` | Dependency list embedded |
| 15 | `should handle missing optional template variables` | Graceful fallback or placeholder |

### Prompt History

| # | Test Case | Assertions |
|---|-----------|------------|
| 16 | `should store prompt-response pair after completion` | Retrievable from history |
| 17 | `should associate prompt history with source system/plan` | Correct foreign key |
| 18 | `should list prompt history for a system` | Returns chronological array |

---

## 2.11 `lib/validators/__tests__/schemas.test.ts`

Target: Zod schemas (e.g., `lib/validators/schemas.ts`)

### Project Schema

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should accept valid project input` | Parses without error |
| 2 | `should reject project without name` | Zod error on `name` |
| 3 | `should reject project with invalid status` | Must be `Ideation \| Active \| Archived` |
| 4 | `should accept project with optional fields omitted` | Parses, optional fields undefined |

### Game System Schema

| # | Test Case | Assertions |
|---|-----------|------------|
| 5 | `should accept valid game system input` | Parses without error |
| 6 | `should reject system without systemId` | Zod error |
| 7 | `should reject system with invalid status` | Must be `Draft \| Active \| Deprecated` |
| 8 | `should reject system with invalid mvpCriticality` | Must be `Core \| Important \| Later` |
| 9 | `should reject system with invalid version format` | Must match `vX.Y` pattern |
| 10 | `should accept system with empty dependencies array` | Valid |
| 11 | `should accept system with populated dependencies` | Valid |

### Brainstorm Session Schema

| # | Test Case | Assertions |
|---|-----------|------------|
| 12 | `should accept valid brainstorm session` | Parses without error |
| 13 | `should reject session without content` | Zod error |
| 14 | `should reject session without author` | Zod error |
| 15 | `should accept session with optional tags` | Valid |

### Version Plan Schema

| # | Test Case | Assertions |
|---|-----------|------------|
| 16 | `should accept valid version plan` | Parses without error |
| 17 | `should reject plan without version identifier` | Zod error |
| 18 | `should reject plan without included systems` | Zod error |
| 19 | `should reject plan with invalid status` | Must be `Draft \| Finalized` |

### Dependency Edge Schema

| # | Test Case | Assertions |
|---|-----------|------------|
| 20 | `should accept valid dependency edge` | Parses |
| 21 | `should reject edge where source === target` | Zod refinement error |

---

# 3. Integration Test Plan

Integration tests use a real in-memory SQLite database (via `better-sqlite3` or Drizzle's test mode) and real service classes. AI provider calls remain mocked.

```
__tests__/
  integration/
    project.integration.test.ts
    game-system.integration.test.ts
    dependency.integration.test.ts
    synthesis.integration.test.ts
    version-plan.integration.test.ts
    export.integration.test.ts
```

---

## 3.1 `__tests__/integration/project.integration.test.ts`

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should create a project and retrieve it by ID` | Fields match input |
| 2 | `should list all projects` | Created project appears in list |
| 3 | `should update project metadata` | Updated fields persisted |
| 4 | `should delete a project` | Project no longer retrievable |
| 5 | `should cascade delete project's systems, brainstorms, plans` | All child entities removed |
| 6 | `should reject duplicate project names` | Error or unique constraint violation |

---

## 3.2 `__tests__/integration/game-system.integration.test.ts`

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should create a system and persist to DB` | Retrievable with all fields |
| 2 | `should enforce unique slug per project` | Second insert with same slug fails |
| 3 | `should allow same slug across different projects` | Both inserts succeed |
| 4 | `should update system markdown and structured fields` | Both representations in sync |
| 5 | `should persist changelog entries across updates` | Changelog grows with each update |
| 6 | `should handle markdown ↔ struct toggle persistence` | Edit in markdown, read as struct — fields match |

---

## 3.3 `__tests__/integration/dependency.integration.test.ts`

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should add dependency and verify in graph` | Graph contains edge |
| 2 | `should reject dependency that creates a cycle (via DB + graph)` | Error, DB unchanged |
| 3 | `should remove dependency and verify graph updated` | Edge removed |
| 4 | `should rebuild graph from DB on service initialization` | Graph matches stored data |
| 5 | `should return correct implementation order from DB state` | Topological order matches |
| 6 | `should handle deleting a system that others depend on` | Error or cascade behavior defined |

---

## 3.4 `__tests__/integration/synthesis.integration.test.ts`

AI mocked to return deterministic synthesis output.

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should create brainstorm session and run synthesis` | Synthesis result stored |
| 2 | `should convert synthesis output to persisted systems` | Systems retrievable from DB |
| 3 | `should link created systems to source brainstorm session` | Foreign key set |
| 4 | `should persist prompt-response history for synthesis` | History retrievable |
| 5 | `should not mutate brainstorm session during synthesis` | Session content unchanged |
| 6 | `full flow: create brainstorm → synthesize → review → convert to systems` | All entities in expected states |

---

## 3.5 `__tests__/integration/version-plan.integration.test.ts`

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should create version plan with scope validated against dependency graph` | Plan persisted with valid scope |
| 2 | `should reject plan scope missing required dependency` | Error, plan not created |
| 3 | `should finalize plan and verify immutability` | Plan status = Finalized, subsequent updates rejected |
| 4 | `should list plans for a project ordered by version` | Correct ordering |
| 5 | `should associate plan with correct project` | Foreign key correct |

---

## 3.6 `__tests__/integration/export.integration.test.ts`

| # | Test Case | Assertions |
|---|-----------|------------|
| 1 | `should export GDD for project with multiple systems` | Markdown contains all system sections |
| 2 | `should export version PRD from finalized plan` | Markdown scoped to plan's systems |
| 3 | `should export JSON format with all fields` | Valid JSON, schema-conformant |
| 4 | `should export prompt bundle for a system` | Contains rendered prompts with context |
| 5 | `should handle export for empty project` | Minimal valid document or descriptive empty state |

---

# 4. E2E Test Plan (Playwright)

```
e2e/
  full-workflow.spec.ts
  brainstorm.spec.ts
  game-system.spec.ts
  dependency-graph.spec.ts
  system-merge-split.spec.ts
  version-plan.spec.ts
  prompt-generator.spec.ts
  export.spec.ts
```

---

## 4.1 `e2e/full-workflow.spec.ts`

**Test: Full workflow from project creation to export**

**Preconditions:** Clean database, application running.

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Navigate to home page | Page loads, "Create Project" button visible |
| 2 | Click "Create Project" | Project creation form/modal appears |
| 3 | Fill in project name: "Test RPG", genre: "RPG", status: "Ideation" | Fields accept input |
| 4 | Submit project form | Redirected to project dashboard, project name displayed |
| 5 | Click "Add Brainstorm" | Brainstorm input form appears |
| 6 | Select "Paste Discord" input method | Discord paste textarea visible |
| 7 | Paste sample Discord conversation | Text appears in textarea |
| 8 | Submit brainstorm | Brainstorm session listed, marked immutable |
| 9 | Click "Synthesize" on brainstorm session | Loading state shown, then synthesis results appear |
| 10 | Review synthesis output | Suggested systems listed with names and descriptions |
| 11 | Click "Convert to Systems" | Systems created, appear in systems list |
| 12 | Navigate to Systems tab | All converted systems visible |
| 13 | Click on a system | System detail page with markdown view |
| 14 | Set dependencies between systems | Dependency graph updates |
| 15 | Navigate to Dependency Graph view | Graph visualization renders with correct edges |
| 16 | Click "Create Version Plan" | Version plan form appears |
| 17 | Select systems for v1 scope | Systems checked, scope validated |
| 18 | Submit version plan | Plan created with phases and implementation order |
| 19 | Click "Export" | Export options shown (Markdown, JSON, Clipboard) |
| 20 | Select "Full GDD - Markdown" | Download initiated or preview shown |
| 21 | Verify exported content | Contains all systems in dependency order |

---

## 4.2 `e2e/brainstorm.spec.ts`

### Test: Discord paste input method

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Navigate to project brainstorm page | Page loads |
| 2 | Select "Discord Paste" tab | Discord input area visible |
| 3 | Paste multi-author Discord conversation | Content appears |
| 4 | Submit | Session created, messages parsed and displayed |
| 5 | Verify session is read-only | Edit controls absent or disabled |

### Test: Freeform text input method

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Select "Freeform Text" tab | Freeform textarea visible |
| 2 | Type ideas | Text appears |
| 3 | Submit | Session created, content preserved |

### Test: Markdown upload input method

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Select "Markdown Upload" tab | File upload input visible |
| 2 | Upload `.md` file | File name displayed, preview shown |
| 3 | Submit | Session created from uploaded content |

### Test: Brainstorm immutability

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Open existing brainstorm session | Content displayed |
| 2 | Attempt to edit content | No edit controls, or controls disabled |
| 3 | Verify via API (optional) | PUT/PATCH returns 403 or 400 |

---

## 4.3 `e2e/game-system.spec.ts`

### Test: System CRUD with markdown toggle

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Navigate to project systems | Systems list visible |
| 2 | Click "Add System" | Creation form appears |
| 3 | Fill in system name, slug, version, purpose | Fields accept input |
| 4 | Submit | System created, listed |
| 5 | Click system to open detail | Detail page loads |
| 6 | Toggle to markdown view | Full Section 7 markdown rendered |
| 7 | Edit markdown directly | Changes reflected |
| 8 | Toggle back to structured view | Fields updated from markdown |
| 9 | Edit structured field (e.g., Purpose) | Field updated |
| 10 | Toggle to markdown view | Markdown reflects structured edit |
| 11 | Delete system | System removed from list, confirmation dialog shown |

### Test: System slug uniqueness enforcement

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Create system with slug "combat" | Success |
| 2 | Attempt to create another system with slug "combat" | Error displayed: slug already exists |

---

## 4.4 `e2e/dependency-graph.spec.ts`

### Test: Dependency graph interaction

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Create 4 systems: Movement, Health, Combat, Economy | All listed |
| 2 | Navigate to dependency graph | Empty graph or nodes without edges |
| 3 | Add dependency: Combat → Health | Edge appears in graph |
| 4 | Add dependency: Combat → Movement | Second edge appears |
| 5 | Add dependency: Economy → Combat | Third edge appears |
| 6 | Verify visual graph shows correct DAG | Nodes and edges match expectations |
| 7 | Attempt to add: Health → Combat (would create cycle) | Error: cycle detected, edge not added |
| 8 | Click on Combat node | Impact analysis shown: Economy affected |
| 9 | View implementation order | Movement/Health first, then Combat, then Economy |

---

## 4.5 `e2e/system-merge-split.spec.ts`

### Test: System merge

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Create two systems: "Melee Combat" and "Ranged Combat" | Both created |
| 2 | Select both systems | Multi-select active |
| 3 | Click "Merge Systems" | Merge dialog appears |
| 4 | Provide merged system name: "Combat" | Name field filled |
| 5 | Confirm merge | New "Combat" system created, both originals deprecated |
| 6 | Open "Combat" system | Contains content from both originals |
| 7 | Verify originals show "Deprecated" status | Status badges visible |

### Test: System split

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Open "Combat" system | Detail page loads |
| 2 | Click "Split System" | Split dialog appears |
| 3 | Define two children: "Melee" and "Ranged" | Names entered |
| 4 | Confirm split | Two new systems created, original deprecated |
| 5 | Verify children have appropriate content | Content distributed |
| 6 | Verify original shows "Deprecated" | Status correct |

---

## 4.6 `e2e/version-plan.spec.ts`

### Test: Version plan creation and finalization

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Create project with 5 interconnected systems | Systems and dependencies set |
| 2 | Navigate to Version Plans | Empty list |
| 3 | Click "Create Version Plan" | Plan creation form |
| 4 | Set version: "v1.0" | Input accepted |
| 5 | Select 3 core systems for scope | Checkboxes selected |
| 6 | Verify scope validation | Warning if dependency missing, auto-include suggested |
| 7 | Submit plan | Plan created with phases, milestones, implementation order |
| 8 | Review plan detail page | All sections populated |
| 9 | Click "Finalize" | Confirmation dialog |
| 10 | Confirm finalization | Status changes to "Finalized" |
| 11 | Attempt to edit finalized plan | Edit controls disabled or absent |
| 12 | Attempt to change scope | Error: plan is immutable |

### Test: Scope validation enforcement

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Systems: A → B → C (A depends on B, B depends on C) | Dependencies set |
| 2 | Create plan with only A selected | Error: B and C required as dependencies |
| 3 | Create plan with A and B selected | Error: C required |
| 4 | Create plan with A, B, and C | Success |

---

## 4.7 `e2e/prompt-generator.spec.ts`

### Test: Prompt generation and history

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Open a game system detail page | System loaded |
| 2 | Click "Generate Prompt" | Prompt type selector appears |
| 3 | Select "Implementation" prompt | Prompt preview generated |
| 4 | Select output mode: "Prompt + structured context" | Output includes context |
| 5 | Click "Generate" / "Send to AI" | Loading state, then response displayed |
| 6 | Verify prompt and response stored | Appears in prompt history |
| 7 | Navigate to prompt history | All generated prompts listed chronologically |
| 8 | Click on a historical prompt | Full prompt and response displayed |

### Test: Prompt types

For each prompt type (Implementation, Architecture, Refactor, Balance, Expansion):

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Select prompt type | Template preview shows type-specific content |
| 2 | Generate prompt | Output includes system context relevant to type |

---

## 4.8 `e2e/export.spec.ts`

### Test: Export all formats

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Navigate to project with multiple systems and finalized plan | Data present |
| 2 | Click Export | Export options panel shown |
| 3 | Select "Full GDD" + Markdown | Download/preview of `.md` file |
| 4 | Verify GDD content | All systems present, dependency-ordered, TOC included |
| 5 | Select "Version PRD" + Markdown | Download/preview of `.md` file |
| 6 | Verify PRD content | Scoped to finalized plan's systems |
| 7 | Select "Individual System" + JSON | JSON output |
| 8 | Verify JSON | Schema-conformant, all fields present |
| 9 | Select "Roadmap Plan" + Markdown | Roadmap output |
| 10 | Verify Roadmap | Phases, milestones, implementation order |
| 11 | Select "Prompt Bundle" + Markdown | Bundle output |
| 12 | Verify Bundle | Contains prompts with system context |
| 13 | Click "Copy to Clipboard" | Clipboard contains markdown text |
| 14 | Verify clipboard | Content matches preview |

---

## 4.9 `e2e/idea-stream.spec.ts`

### Test: Idea Stream — create thread and post message

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Navigate to project (create or use existing) | Overview loaded |
| 2 | Click Idea Stream in sidebar | Idea Stream URL, two-panel layout |
| 3 | Fill "Start a new thread…" and submit | Thread appears in list, right panel shows thread |
| 4 | Fill "Write a message…" and send | Message appears in thread |
| 5 | (Optional) Select thread(s), Finalize + Synthesize | Brainstorm session created, redirect to synthesize |

Unit: Idea Stream Zod schemas are covered in `lib/validations/__tests__/schemas.test.ts` (createIdeaStreamThreadSchema, postIdeaStreamMessageSchema, editIdeaStreamMessageSchema, finalizeIdeaStreamThreadsSchema).

---

# 5. Test Infrastructure

## 5.1 File Naming Conventions

| Type | Pattern | Location |
|------|---------|----------|
| Unit test | `*.test.ts` | `lib/<module>/__tests__/<file>.test.ts` |
| Integration test | `*.integration.test.ts` | `__tests__/integration/<name>.integration.test.ts` |
| E2E test | `*.spec.ts` | `e2e/<name>.spec.ts` |
| Test fixtures | `*.fixture.ts` | `__tests__/fixtures/<name>.fixture.ts` |
| Test factories | `*.factory.ts` | `__tests__/factories/<name>.factory.ts` |
| Test helpers | `*.helper.ts` | `__tests__/helpers/<name>.helper.ts` |

## 5.2 Test Database Strategy

```
Database: SQLite (better-sqlite3 or Drizzle ORM test mode)

Unit Tests:
  - No database. Repositories are mocked.

Integration Tests:
  - In-memory SQLite via ':memory:' connection string.
  - Schema migrated fresh before each test suite (beforeAll).
  - Database cleared between tests (beforeEach) via TRUNCATE or DROP + re-migrate.
  - No shared state between test files.

E2E Tests:
  - File-based SQLite test database (e.g., test.db).
  - Seeded via API calls or direct DB insertion in globalSetup.
  - Cleaned in globalTeardown.
  - Each spec file starts with known state via beforeEach API fixture setup.
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node', // default for lib tests
    include: [
      'lib/**/*.test.ts',
      '__tests__/**/*.test.ts',
      '__tests__/**/*.integration.test.ts',
    ],
    exclude: ['e2e/**'],
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts'],
      exclude: ['lib/**/__tests__/**', 'lib/**/*.test.ts'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
})
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## 5.3 Mock Strategy for AI Provider Layer

```
lib/ai/__mocks__/
  providers.ts          # Mock implementations for OpenAI, Claude, Gemini
  responses/
    synthesis.json      # Deterministic synthesis response
    implementation.json # Deterministic implementation prompt response
    architecture.json   # Deterministic architecture prompt response

Strategy:
  - Unit tests: vi.mock('lib/ai/engine') — replace entire AI engine.
  - Integration tests: Mock at the HTTP level (msw) or provider adapter level.
  - E2E tests: Intercept API routes via Playwright route interception
    or use a dedicated test AI provider that returns canned responses.

Mock Contract:
  - Every mock provider must conform to the AIProvider interface.
  - Mock responses are version-controlled fixtures.
  - Mocks return deterministic content for assertion stability.
```

### Example Mock Provider

```typescript
// __tests__/mocks/ai-provider.mock.ts
import type { AIProvider, CompletionRequest, CompletionResponse } from '@/lib/ai/types'

export function createMockAIProvider(
  responses: Record<string, string> = {}
): AIProvider {
  return {
    name: 'mock',
    complete: async (request: CompletionRequest): Promise<CompletionResponse> => {
      const response = responses[request.template] ?? 'Mock AI response'
      return {
        content: response,
        model: 'mock-model',
        tokensUsed: response.length,
        timestamp: new Date().toISOString(),
      }
    },
  }
}
```

## 5.4 Test Data Factories

```
__tests__/factories/
  project.factory.ts
  game-system.factory.ts
  brainstorm.factory.ts
  version-plan.factory.ts
  dependency.factory.ts
```

### Example Factories

```typescript
// __tests__/factories/project.factory.ts
import type { Project } from '@/lib/types'

let counter = 0

export function buildProject(overrides: Partial<Project> = {}): Project {
  counter++
  return {
    id: `project-${counter}`,
    name: `Test Project ${counter}`,
    description: 'A test project',
    genre: 'RPG',
    targetPlatform: 'PC',
    status: 'Ideation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}
```

```typescript
// __tests__/factories/game-system.factory.ts
import type { GameSystem } from '@/lib/types'

let counter = 0

export function buildGameSystem(overrides: Partial<GameSystem> = {}): GameSystem {
  counter++
  const slug = overrides.systemId ?? `system-${counter}`
  return {
    id: `gs-${counter}`,
    projectId: 'project-1',
    name: `System ${counter}`,
    systemId: slug,
    version: 'v1.0',
    status: 'Draft',
    purpose: 'Test purpose',
    currentState: 'Initial state',
    targetState: 'Target state',
    coreMechanics: 'Core mechanics description',
    inputs: 'Player input',
    outputs: 'Game state changes',
    dependencies: [],
    dependedOnBy: [],
    failureStates: 'None defined',
    scalingBehavior: 'Linear',
    mvpCriticality: 'Core',
    implementationNotes: '',
    openQuestions: '',
    changeLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}
```

```typescript
// __tests__/factories/brainstorm.factory.ts
import type { BrainstormSession } from '@/lib/types'

let counter = 0

export function buildBrainstormSession(
  overrides: Partial<BrainstormSession> = {}
): BrainstormSession {
  counter++
  return {
    id: `brainstorm-${counter}`,
    projectId: 'project-1',
    author: 'TestUser',
    content: 'We should add a combat system with health bars and damage types.',
    inputMethod: 'freeform',
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}
```

```typescript
// __tests__/factories/version-plan.factory.ts
import type { VersionPlan } from '@/lib/types'

let counter = 0

export function buildVersionPlan(
  overrides: Partial<VersionPlan> = {}
): VersionPlan {
  counter++
  return {
    id: `plan-${counter}`,
    projectId: 'project-1',
    version: `v${counter}.0`,
    status: 'Draft',
    includedSystems: ['movement', 'health', 'combat'],
    excludedSystems: [],
    phases: [],
    milestones: [],
    riskAreas: [],
    implementationOrder: ['movement', 'health', 'combat'],
    scopeValidationNotes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}
```

## 5.5 Test Fixtures

```
__tests__/fixtures/
  markdown/
    complete-system.md          # All Section 7 fields populated
    minimal-system.md           # Only required fields
    malformed-system.md         # Missing headers, bad formatting
    system-with-nested-md.md    # Code blocks, lists inside sections
  discord/
    simple-conversation.txt     # 3 authors, 10 messages
    long-thread.txt             # 50+ messages
    edge-case-names.txt         # Special characters in usernames
  brainstorm/
    freeform-ideas.md           # Bullet-pointed ideas
    stream-of-consciousness.md  # Unstructured text
  version-plan/
    complete-plan.md            # All fields populated
    minimal-plan.md             # Minimal valid plan
  export/
    expected-gdd.md             # Expected GDD output for comparison
    expected-prd.md             # Expected PRD output for comparison
```

## 5.6 CI Pipeline Recommendations

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - run: npm run test:integration
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  type-check:
    name: TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
```

### npm Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --config vitest.config.ts",
    "test:integration": "vitest run --config vitest.config.ts --include '**/*.integration.test.ts'",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

# 6. Validation Rules to Test

Every validation rule implied or explicitly stated in the PRD, organized by domain.

---

## 6.1 Project Validation

| Rule | Source | Test Location |
|------|--------|---------------|
| Project name is required | PRD §6.1 | `schemas.test.ts #2`, `project.integration.test.ts #6` |
| Project status must be `Ideation \| Active \| Archived` | PRD §6.1 | `schemas.test.ts #3` |
| Genre is optional string | PRD §6.1 | `schemas.test.ts #4` |
| Target platform is optional string | PRD §6.1 | `schemas.test.ts #4` |
| Description is optional string | PRD §6.1 | `schemas.test.ts #4` |

## 6.2 Game System Validation

| Rule | Source | Test Location |
|------|--------|---------------|
| System slug (systemId) must be unique per project | PRD §6.3 | `game-system.service.test.ts #2`, `game-system.integration.test.ts #2` |
| System slug may duplicate across projects | Implied | `game-system.integration.test.ts #3` |
| System status must be `Draft \| Active \| Deprecated` | PRD §7 | `schemas.test.ts #7` |
| MVP Criticality must be `Core \| Important \| Later` | PRD §7 | `schemas.test.ts #8` |
| Version must match `vX.Y` format | PRD §7 | `schemas.test.ts #9` |
| System Name (from H1) is required | PRD §7 | `system-parser.test.ts #24` |
| System ID is required | PRD §7 | `system-parser.test.ts #25` |
| Version is required | PRD §7 | `system-parser.test.ts #26` |
| Purpose section is required | PRD §7 | `system-parser.test.ts` (implied by schema) |
| Dependencies is a list of valid system slugs | PRD §7 | `schemas.test.ts #10-11`, `dependency.service.test.ts #3` |
| Depended On By is optional, auto-generated | PRD §7 | `system-parser.test.ts #27` |
| Markdown must conform to Section 7 template | PRD §7 | `system-parser.test.ts #1-4` |

## 6.3 Dependency Validation

| Rule | Source | Test Location |
|------|--------|---------------|
| No circular dependencies allowed | PRD §6.4 | `engine.test.ts #8-13`, `dependency.service.test.ts #2` |
| Self-dependency not allowed | Implied | `dependency.service.test.ts #4`, `schemas.test.ts #21` |
| Dependency target must exist | Implied | `dependency.service.test.ts #3`, `engine.test.ts #4` |
| Dependency ordering must be deterministic | PRD §6.4 | `engine.test.ts #21` |
| Implementation order derived from topological sort | PRD §6.4 | `engine.test.ts #14-20`, `dependency.service.test.ts #5` |

## 6.4 Brainstorm Session Validation

| Rule | Source | Test Location |
|------|--------|---------------|
| Brainstorm sessions are immutable records | PRD §6.2 | `brainstorm.spec.ts (immutability)`, `synthesis.integration.test.ts #5` |
| Content is required | PRD §6.2 | `schemas.test.ts #13` |
| Author is required | PRD §6.2 | `schemas.test.ts #14` |
| Timestamp is auto-generated | PRD §6.2 | Implicit in factory/service tests |
| Tags are optional | PRD §6.2 | `schemas.test.ts #15` |
| Input method must be one of: discord-paste, freeform, markdown-upload | PRD §6.2 | Schema test (implied) |

## 6.5 Version Plan Validation

| Rule | Source | Test Location |
|------|--------|---------------|
| Version plans are immutable after finalization | PRD §6.5 | `version-plan.service.test.ts #9-10`, `version-plan.spec.ts #11-12` |
| Version identifier is required | PRD §6.5 | `schemas.test.ts #17`, `version-plan-parser.test.ts #13` |
| Version format must be `vX.Y` or similar | PRD §6.5 | `version-plan.service.test.ts #12` |
| Included systems list is required | PRD §6.5 | `schemas.test.ts #18` |
| Plan status must be `Draft \| Finalized` | PRD §6.5 | `schemas.test.ts #19` |
| Scope must include all transitive dependencies | PRD §6.5 | `version-plan.service.test.ts #2-3`, `version-plan.spec.ts (scope validation)` |
| Cannot include system without its dependency chain | PRD §6.5 | `version-plan.service.test.ts #2`, `version-plan.integration.test.ts #2` |
| Implementation sequence must follow dependency order | PRD §6.5 | `version-plan.service.test.ts #7` |

## 6.6 Prompt & AI Validation

| Rule | Source | Test Location |
|------|--------|---------------|
| All prompts stored with AI responses | PRD §6.6 | `engine.test.ts #16-17`, `synthesis.integration.test.ts #4` |
| Prompt type must be valid enum | PRD §6.6 | Schema test (implied) |
| Output mode must be valid enum | PRD §6.6 | Schema test (implied) |

## 6.7 Export Validation

| Rule | Source | Test Location |
|------|--------|---------------|
| Markdown is the primary export format | PRD §6.7 | `export.service.test.ts #1` |
| JSON export must include all fields | PRD §6.7 | `export.service.test.ts #2` |
| GDD export contains all project systems | PRD §6.7 | `export.service.test.ts #3` |
| Systems ordered by dependency in exports | PRD §6.7 | `export.service.test.ts #11` |

## 6.8 Architectural Validation

| Rule | Source | Test Location |
|------|--------|---------------|
| Business logic never in route handlers | PRD §12 | Code review / architectural lint |
| Routes only call services | PRD §12 | Code review / architectural lint |
| No cross-layer leakage | PRD §12 | Code review / structural test |
| Changes never auto-applied (review required) | PRD §8 | `synthesis.service.test.ts` (returns proposals, not persisted systems) |

---

# 7. Summary: Test Case Count Estimate

| Category | Test Cases |
|----------|------------|
| System Parser | ~33 |
| Brainstorm Parser | ~14 |
| Version Plan Parser | ~14 |
| Graph Engine | ~26 |
| Game System Service | ~25 |
| Dependency Service | ~10 |
| Synthesis Service | ~10 |
| Version Plan Service | ~13 |
| Export Service | ~11 |
| AI Engine | ~18 |
| Zod Schemas | ~21 |
| **Unit Total** | **~195** |
| Integration Tests | ~28 |
| E2E Tests | ~12 specs (~80+ steps) |
| **Grand Total** | **~235+ test cases** |

---

# Appendix A: Test Setup File

```typescript
// __tests__/setup.ts
import { beforeEach, afterEach } from 'vitest'

// Reset any module-level counters in factories
beforeEach(() => {
  // Runs before each test
})

afterEach(() => {
  // Cleanup mocks
  vi.restoreAllMocks()
})
```

# Appendix B: Integration Test Database Helper

```typescript
// __tests__/helpers/db.helper.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '@/lib/db/schema'

export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: './drizzle' })
  return { db, sqlite }
}

export function cleanTestDb(sqlite: Database.Database) {
  const tables = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[]

  for (const { name } of tables) {
    sqlite.prepare(`DELETE FROM ${name}`).run()
  }
}
```

# Appendix C: E2E Test Helpers

```typescript
// e2e/helpers/test-data.ts
import type { Page } from '@playwright/test'

export async function createProjectViaUI(page: Page, name: string) {
  await page.goto('/')
  await page.getByRole('button', { name: /create project/i }).click()
  await page.getByLabel(/project name/i).fill(name)
  await page.getByLabel(/genre/i).fill('RPG')
  await page.getByRole('button', { name: /create|submit/i }).click()
  await page.waitForURL(/\/projects\//)
}

export async function createSystemViaUI(
  page: Page,
  name: string,
  slug: string
) {
  await page.getByRole('button', { name: /add system/i }).click()
  await page.getByLabel(/system name/i).fill(name)
  await page.getByLabel(/system id|slug/i).fill(slug)
  await page.getByRole('button', { name: /create|submit/i }).click()
}

export async function addDependencyViaUI(
  page: Page,
  fromSlug: string,
  toSlug: string
) {
  // Navigate to dependency management and add edge
  await page.getByRole('tab', { name: /dependencies/i }).click()
  await page.getByRole('button', { name: /add dependency/i }).click()
  await page.getByLabel(/system/i).selectOption(fromSlug)
  await page.getByLabel(/depends on/i).selectOption(toSlug)
  await page.getByRole('button', { name: /confirm|add/i }).click()
}
```
