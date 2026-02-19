# AI Suggestion: Per-Recommendation Justifications, Conversational UI, Apply → Extraction Conformance, Collapsible Preview

**Status:** Plan  
**Date:** 2026-02-18  
**Related:** [system-extraction.md](../app-systems/system-extraction.md), convert-suggest service and API

---

## Goals

1. **Per-recommendation justifications** — One justification for each recommendation (each create, merge, skip, and optionally each dependency or a single dependencies blurb).
2. **Apply suggestion updates extraction UI** — When the user clicks "Apply suggestion," the extraction list and finalize state should visually conform to the suggestion (selections, expanded rows, scroll into view).
3. **AI suggestion as conversation** — The "Get AI suggestion" experience should feel like a conversation with the AI: show what we asked, then the AI response with per-item justifications in a chat-like layout; expand the container as needed.
4. **Make room** — Markdown preview becomes **collapsible** so we can give more space to the AI suggestion / conversation area when needed.

---

## 1. Per-recommendation justifications

### Backend (AI contract and parsing)

- **Extend response shape** in `lib/services/synthesis-convert-suggest.service.ts`:
  - Keep `create`, `merge`, `discard`, `dependencies` as today.
  - Add **per-item justifications** in one of these forms:
    - **Option A (recommended):** Arrays of `{ index: number, reason: string }` (or same length as create/merge/discard): `createReasons: string[]`, `mergeReasons: string[]`, `skipReasons: string[]` (by candidate index order), plus optional `dependenciesReason: string`.
    - **Option B:** Inline in each item: `create: { index: number, reason: string }[]`, `merge: { candidateIndex, intoExistingSlug, reason: string }[]`, `discard: { index: number, reason: string }[]`.
  - Ask the model in the system/user prompt to include a short reason for each create, each merge, each skip, and optionally one for dependencies. Parse and normalize; if the model omits reasons, leave them empty so the UI can hide or show "No reason provided."

- **Types:** Extend `ConvertSuggestion` (and API response) with e.g. `createReasons?: string[]`, `mergeReasons?: string[]`, `skipReasons?: string[]`, `dependenciesReason?: string` (or the chosen structure). Keep backward compatible: all optional.

### Frontend

- In the AI suggestion block, for each **Create** / **Merge** / **Skip** / **Dependencies** line, show the corresponding **reason** below or beside it (e.g. muted text, or a small "Why?" expand). Use the same order as the suggestion so the user can match recommendation → justification 1:1.

---

## 2. Apply suggestion → extraction UI conformance

Today **Apply suggestion** already:

- Sets `convertSelections`, `dependencyEdges`, `selectedSystemIndices`, and clears `convertSuggestion`.

Add:

- **Expand suggested systems** — After applying, set `expandedSystemValues` to the system indices that are **included** (create + merge), so those accordion rows are open and the user sees the applied state: e.g. `setExpandedSystemValues([...convertSuggestion.create, ...convertSuggestion.merge.map(m => m.candidateIndex)].map(String))`.
- **Scroll into view (optional)** — After applying, scroll the "Extracted systems" section (or the first expanded item) into view so the user sees the updated list without hunting.

No backend changes; all in `handleApplySuggestion` in `synthesize-wizard.tsx`.

---

## 3. AI suggestion as conversation

- **Layout:** Replace the current single "AI suggestion" box with a **conversation-style block**:
  - **Message 1 (user / "what we asked"):** e.g. "Based on N candidates and M existing systems: [expandable or inline summary]. [Optional: Show full prompt]."
  - **Message 2 (assistant):** The AI response: the recommendation (Create / Merge / Skip / Dependencies) with **per-recommendation justifications** and optional overall rationale. Style as a reply (e.g. distinct background, avatar or icon, left/right or stacked).
- **Container:** Give this block more space: either a dedicated scrollable area or an expanded card so the conversation doesn’t feel cramped. If the right column (markdown preview) is collapsible, the main column can use the freed space for this block.
- **Copy / expand:** Keep "Show prompt" (expandable) and copy for the prompt; optionally copy for the AI response.

Implementation: Refactor the Finalize "Get AI suggestion" + suggestion display into a small **conversation component** (or a clear two-message structure inside the existing card). Reuse existing state: `convertSuggestion`, `suggestError`, and new fields for prompt summary / user prompt when we add API support.

---

## 4. Collapsible markdown preview

- **Behavior:** The right column (Markdown preview card) should be **collapsible** so the user can collapse it to get more horizontal space for the wizard and the AI suggestion conversation.
- **UI:** Add a collapse/expand control (e.g. chevron or "Collapse preview" button) in the Markdown preview card header. When collapsed:
  - The aside can show a narrow strip (e.g. a vertical "Preview" tab or icon) that expands again on click, or
  - The grid can change to single column so the main content uses full width.
- **Persistence:** Optional: remember collapse state in session state or `useState` for the duration of the page (no need for localStorage unless desired).

Implementation: In `synthesize-wizard.tsx`, the layout is `grid grid-cols-1 lg:grid-cols-[1fr_minmax(360px,1fr)]` with the aside as the second column. Add state e.g. `markdownPreviewCollapsed: boolean`; when true, render the aside as a slim column (e.g. fixed width with an expand button) or hide it and use `grid-cols-1`, and allow expanding again so the two-column layout returns.

---

## 5. Implementation order

1. **Backend: per-recommendation justifications** — Extend prompt and response shape in `synthesis-convert-suggest.service.ts`; return reasons in API. Types in service and API response.
2. **Frontend: collapsible markdown preview** — State + toggle; collapse/expand layout so more room is available for the main column.
3. **Frontend: conversational AI suggestion UI** — Two-message layout (what we asked + AI response with per-item justifications); expand container as needed; optional "Show prompt" and copy.
4. **Frontend: Apply suggestion → extraction conformance** — In `handleApplySuggestion`, set `expandedSystemValues` for suggested systems and optionally scroll "Extracted systems" into view.
5. **Docs** — Update `DOCS/app-systems/system-extraction.md` (and user manual if applicable) with the new behavior and changelog.

---

## 6. Terminology (from prior plan)

Prefer **Skip** over **Discard** in UI and optionally in API/prompt so the mental model is "don't add this candidate this time" rather than "remove." Can be done in the same pass as the justification and UI work.

---

## Change Log

- 2026-02-18: Initial plan: per-recommendation justifications, apply → extraction conformance, conversational AI suggest UI, collapsible markdown preview.
