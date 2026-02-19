# Roll-up strategy: Option A — Map system details to sections

This document records the **chosen** roll-up approach for the [Behaviors as structured system definition](.cursor/plans/behaviors_as_structured_system_definition_922199cd.plan.md) plan: **Option A — Map to sections.**

Derive GameSystem section content from system details. Purpose = short summary or first mechanic spec. Implement consistently per [ai-submission-generation.md](ai-submission-generation.md) §5.1.

---

## DetailType → GameSystem section mapping

| detailType | GameSystem field | Markdown section |
|------------|------------------|------------------|
| mechanic | coreMechanics | Core Mechanics |
| input | inputs | Inputs |
| output | outputs | Outputs |
| ui_hint | implementationNotes | Implementation Notes |
| content | (see below) | Content or new section |

---

## Roll-up rules

- **Concatenation**: For each mapped field, concatenate the `spec` of all system details of that type, ordered by `sortOrder` then `createdAt`. Use a consistent separator (e.g. `\n\n`) so multiple details of the same type form one section.
- **content**: No dedicated GameSystem field today. Either:
  - **(a)** Add optional `content` (or `contentNotes`) to `GameSystem` in Prisma and to system markdown, or
  - **(b)** Fold into `implementationNotes` with a prefix (e.g. "Content: …").
  - Recommend **(a)** so content-type details have a clear home.
- **Purpose**: Derive from system details: e.g. first `mechanic` detail's spec truncated to ~1–2 sentences, or a one-line summary of mechanic names. Allow optional override: if the system has an explicit purpose (from synthesis stub or user), keep it; otherwise derive when generating markdown / export / snapshot.
- **Other sections**: `currentState`, `targetState`, `failureStates`, `scalingBehavior`, `openQuestions` have no detailType. Keep as standalone GameSystem fields; they are **not** overwritten by roll-up. Roll-up only fills `coreMechanics`, `inputs`, `outputs`, `implementationNotes` (and `content` if added).
- **Source of truth**: For the mapped sections, **system details are the source**. When rendering markdown, building export, or showing form section content, derive from `listSystemDetailsByGameSystemId` via this mapping. The form should show editable system details; section text is derived (or any direct section edit must sync back to a system detail).

---

## Implementation

- Add a helper, e.g. `deriveSectionsFromSystemDetails(systemDetails: SystemDetail[])`, returning
  `{ purpose, coreMechanics, inputs, outputs, implementationNotes, content? }`.
- Place it in `lib/services/game-system.service.ts` or a small `lib/services/system-detail-roll-up.service.ts`.
- Use it wherever section text is needed: markdown render, export, context snapshot.
- Optionally: when system details change, persist derived values into GameSystem so legacy code and queries that read `coreMechanics` / `inputs` / etc. still work; or keep those fields as caches updated on system detail save.

---

## Plan sections to align with Option A

When implementing the main plan:

- **§2 System detail**: Show system details as the editable list; derived sections can be read-only preview or omitted in form (markdown/export still derive from system details).
- **§3 System markdown**: **Render** — build section content by calling `deriveSectionsFromSystemDetails(system.systemDetails)` and emitting Purpose, Core Mechanics, Inputs, Outputs, Implementation Notes (and Content if added). **Parse** — a "System details" section in markdown can still be parsed into system detail stubs for round-trip; when saving, persist as SystemDetail rows and optionally run roll-up to update GameSystem section fields.
- **§4 Export**: For each system, derive section content from system details via the same helper; output Purpose (derived or override), then Core Mechanics, Inputs, Outputs, Implementation Notes, Content.
- **§5 Generation**: When building snapshot or after convert, if purpose is empty and system has system details, set purpose from `deriveSectionsFromSystemDetails(...).purpose`.

---

## Change Log

- 2026-02-18: Option A chosen; mapping and roll-up rules documented.
- 2026-02-18: Implementation complete: system-detail-roll-up.service, system detail System details block, markdown/export/context use derived sections.
- 2026-02-18: Renamed from behaviors-rollup-option-a.md; terminology "behaviors" → "system details", behaviorType → detailType, SystemBehavior → SystemDetail.
