# System: System Extraction

## Purpose
Transforms raw brainstorm content into structured game system definitions through AI-assisted synthesis and user-guided review.

## Responsibilities
- Orchestrate the brainstorm → synthesized output pipeline
- Call AI engine with synthesis prompt template and brainstorm context
- Parse AI response into system stubs and **system detail stubs** (name, slug, purpose, dependencies; details with name, detailType, spec)
- Store intermediate SynthesizedOutput artifacts (extractedSystems + extractedSystemDetails)
- Present structured review interface data
- Convert user-approved stubs into full GameSystem and SystemDetail records
- Detect conflicts with existing systems (duplicate slugs)
- **System details as structured definition:** Systems are defined by their system details; purpose and section content (Core Mechanics, Inputs, Outputs, Implementation Notes) are derived from system details (Option A roll-up) where applicable.

## Inputs
- BrainstormSession content
- AI provider/model selection
- User review decisions (select, modify, discard)

## Outputs
- SynthesizedOutput records
- GameSystem records (upon conversion)
- ChangeLog entries for newly created systems
- Initial Dependency records between new systems

## Dependencies
- ingestion (provides brainstorm data)
- ai-engine (for synthesis completion)
- doc-store (for persistence)
- dependency-graph (for initial dependency creation)
- system-parser (for markdown rendering of new systems)

## Code Mapping
- Service: `lib/services/synthesis.service.ts`, `lib/services/synthesis-convert.service.ts`, `lib/services/synthesis-refine.service.ts`, `lib/services/synthesis-convert-suggest.service.ts`, `lib/services/system-detail-roll-up.service.ts` (deriveSectionsFromSystemDetails, derivePurposeFromSystemDetails)
- Context: `lib/services/context-builder.service.ts` (snapshot + delta assembly; derives purpose from system details when empty), `lib/services/context-snapshot.service.ts`
- Repository: `lib/repositories/synthesized-output.repository.ts`, `lib/repositories/system-detail.repository.ts`, `lib/repositories/game-system.repository.ts` (getGameSystemFull includes systemDetails; getAllGameSystemsWithDetails for Review-step project comparison), `lib/repositories/project-context-snapshot.repository.ts`, `lib/repositories/synthesis-conversation.repository.ts`
- Parser: `lib/ai/parse-synthesis-response.ts` (extractedSystems + extractedSystemDetails)
- AI: `lib/ai/run-completion.ts`, `lib/ai/providers/openai.provider.ts`
- Actions: `app/actions/synthesis.actions.ts`, `app/actions/system-detail.actions.ts` (create/update/delete system detail on system detail page)
- API: `app/api/projects/[projectId]/synthesis/stream/route.ts` (streaming), `app/api/projects/[projectId]/synthesis/refine/route.ts` (review iteration), `app/api/projects/[projectId]/synthesis/convert-suggest/route.ts` (convert suggestion), `app/api/projects/[projectId]/synthesis/output/route.ts` (GET raw content for Prompt & raw tab)
- Service: `lib/services/extraction-markdown.ts` (extractionToMarkdown for preview panel)

## Current Implementation
- During synthesis: load **last context snapshot** for project (or build full context if none); compute **delta** since snapshot; assemble prompt (snapshot + delta + new brainstorm + instructions); single AI request (streaming); parse into system stubs and **system detail stubs**; store SynthesizedOutput (extractedSystems + extractedSystemDetails); create new ProjectContextSnapshot after success. Rerun options: "Rerun" (reuse snapshot) or "Update context and rerun".
- **Review (final step) & iterate:** 3-step wizard (Configure → Processing → Review). Review is the last step and includes both refinement and finalize. Refine API accepts current extraction + conversation history + user message; optional **focusedSystemSlugs** (array) to refine only selected systems, or refine entire extraction when none selected. Returns full extraction (full replace). Messages stored in SynthesisConversationMessage; latest extraction persisted on SynthesizedOutput. Wizard: **single refine form** at top of Extraction tab (one input + Refine button); scope = no selection → refine all, or selected systems only (via **focusedSystemSlugs**). **Finalize block** (Get AI suggestion, Apply suggestion, Create selected) sits below the refine form and above the extracted systems list. **Extracted systems** are **independently expandable list items** (expand handle on the left; multiple items can be open at once). Each row has the **Include/Exclude** (or "In finalize") control on the **far right** of the list item. The **Extracted systems header row** (same row as the title and subtitle) includes **Add all** and **Exclude all** controls aligned right with the same margin as the per-row Include buttons. Selection is shown as **buttons** with icons (clearly actions); status is shown as **"New"** / **"Existing"** **badges** with light coloring (emerald for New, amber for Existing) and icons (read-only, not confused with selection). **Iconography** is used consistently (steps, Refine, Finalize, Extracted systems, tabs). Expand to see system details; each detail has an **Include/Exclude** button (same style as system row) to include or exclude from finalize. No per-system refine UI. New/Existing badges are based on comparison to existing project systems and system details (getAllGameSystemsWithDetails; systems matched by slug, details by name+detailType). **Step navigation:** any step 0..maxStepReached is clickable; state preserved when navigating.
- **Finalize (on Review):** Get AI suggestion / Apply suggestion fill create/merge/discard and dependencies. **Purpose of Get AI suggestion:** recommend which extraction candidates to add (create or merge) and which to skip for this conversion, plus suggested dependencies; it does not recommend removing any existing systems. The UI shows "Based on N candidates, M existing systems," an expandable "Show prompt" (with copy) for what was sent to the AI, and the AI suggestion with an optional **rationale** ("Why") when the model provides one. The convert-suggest API returns suggestion (create, merge, discard, dependencies, optional rationale), userPrompt, and promptSummary; it **normalizes** AI responses: any candidate index (0 to N-1) not present in create, merge, or discard is **auto-assigned to discard**. Create selected systems (or merge into existing); optional per-detail exclusions. Dependencies with cycle check (dependency.service). "Create selected" calls convertSynthesisAction and redirects to systems.
- **Convert (backend):** create/update GameSystem; create SystemDetail from stubs (per candidate); merge into existing or create new; detailIndices filtered by user-excluded details.
- **System detail:** getGameSystemFull includes systemDetails; system detail page has a System details block (accordion list, add/edit/delete) and CRUD via system-detail.actions. Markdown render and export derive section content from system details (Option A: mechanic→Core Mechanics, input→Inputs, output→Outputs, ui_hint→Implementation Notes, content→Content).
- Frontend: **3-step wizard** (Configure → Processing → Review) at `.../brainstorms/[sessionId]/synthesize`; two-column layout (wizard left, markdown preview right). Processing step shows live-shaped skeleton (ExtractionAccordion without selection) that populates as the stream is parsed; Review step Extraction tab: single refine form, then Finalize block (Get AI suggestion, Apply suggestion, Create selected), then extracted systems as independently expandable list (left expand handle, Include/Exclude button per system on far right; header row with Add all/Exclude all; selection as buttons with icons, status as New/Existing badges; consistent iconography). Prompt & raw tab shows prompt and raw output. Markdown preview (right) driven by extraction state via extractionToMarkdown. Entry from session "Synthesize", Idea Stream "Finalize + Synthesize", and session output links `?output=<id>`. System detail at `.../systems/[systemId]` includes System details block.

## Known Limitations
- AI extraction quality depends on brainstorm clarity
- No confidence scoring on extracted systems
- Refine and convert-suggest use non-streaming completion

## Target Evolution
- Multi-pass extraction with refinement
- Confidence scoring per extracted system
- Interactive extraction where user guides AI in real-time
- Pattern library for common game system archetypes

## Change Log

- 2026-02-17: Doc synced with codebase; current implementation and code mapping.
- 2026-02-18: Context snapshot + delta flow; SystemBehavior; synthesis and convert services; streaming API; wizard; code mapping updated.
- 2026-02-18: Review & iterate (refine service, refine API, SynthesisConversationMessage); Convert suggestion (convert-suggest service and API); wizard chat and Apply suggestion.
- 2026-02-18: Review step accordion: systems accordion with per-system panel (system details accordion, scope options, refine UI); full refinement at bottom; refine API scope and focusedSystemSlug.
- 2026-02-18: System details as structured system definition (Option A roll-up); system-detail-roll-up.service; getGameSystemFull includes systemDetails; system detail System details block + CRUD; extraction instructions prefer system details; snapshot derives purpose from system details when empty.
- 2026-02-18: Renamed "behaviors" to "system details" throughout (AI contract: extractedSystemDetails, detailType; DB: SystemDetail; UI: System details block; docs).
- 2026-02-18: Synthesize wizard: two-column layout with markdown preview (right); live-shaped skeleton (ExtractionAccordion) during Processing; extraction-markdown.service and synthesis/output API for Prompt & raw tab.
- 2026-02-18: Review step: tabs (Extraction, Prompt & raw) in card header right of title; copy buttons on Prompt used and Raw output; Markdown preview has Preview/Source toggle and Source view (code block + copy).
- 2026-02-18: Review step: Refine entire extraction moved to top; Added/Updated badges on systems and system details after refine.
- 2026-02-18: Review step: Added/Updated badges based on existing project systems and details (getAllGameSystemsWithDetails); step navigation via maxStepReached (any reached step clickable).
- 2026-02-18: Review as final step: 3-step wizard (Configure → Processing → Review); single refine form (scope = all or selected systems via focusedSystemSlugs); selectable expandable system cards; finalize (create/merge/discard, Get AI suggestion, Apply suggestion, Create selected) on Review step; optional per-detail exclude for finalize; refine API and synthesis-refine.service support focusedSystemSlugs.
- 2026-02-18: Review Extraction tab: Finalize block above Extracted systems; systems list multi-expand, left expand handle, Added/Excluded button per system.
- 2026-02-18: Convert-suggest normalizes missing candidate indices to discard; Extracted systems: Include/Exclude on far right, Add all/Exclude all in header row; selection as buttons with icons, status as New/Existing badges; consistent iconography across synthesize flow.
- 2026-02-18: Add all/Exclude all aligned right (ml-auto, same margin as row buttons); system details use Include/Exclude toggle buttons instead of checkboxes; New/Existing badges use light emerald/amber coloring.
- 2026-02-18: Get AI suggestion transparency and justifications: convert-suggest returns userPrompt, promptSummary, and suggestion.rationale; Finalize block shows "Based on N candidates, M existing systems," expandable "Show prompt" with copy, and AI rationale ("Why") when present.
