# GamePlan AI — Design Specification

**Version:** 1.0  
**Status:** Draft  
**Date:** 2026-02-17  
**Companion to:** `game-idea-synthesizer-PRD.md`

---

## Table of Contents

1. [Information Architecture](#1-information-architecture)
2. [Layout System](#2-layout-system)
3. [Key UI Components](#3-key-ui-components)
4. [Core User Flows](#4-core-user-flows)
5. [Design System Tokens](#5-design-system-tokens)

---

# 1. Information Architecture

## 1.1 Site Map

```
/                                   → Dashboard (project list)
/new                                → New Project wizard

/projects/:projectId                → Project Overview (redirect to /projects/:projectId/overview)
/projects/:projectId/overview       → Project Overview dashboard
/projects/:projectId/brainstorms    → Brainstorm Sessions list
/projects/:projectId/brainstorms/new           → New Brainstorm entry
/projects/:projectId/brainstorms/:sessionId    → View Brainstorm session
/projects/:projectId/brainstorms/:sessionId/synthesize → Synthesize flow

/projects/:projectId/systems        → Systems list (card grid + table toggle)
/projects/:projectId/systems/new    → Create new system manually
/projects/:projectId/systems/:systemId         → View/Edit system document
/projects/:projectId/systems/:systemId/history → System change log / version history
/projects/:projectId/systems/:systemId/evolve  → System evolution (delta review)

/projects/:projectId/dependencies   → Dependency Graph (interactive DAG)

/projects/:projectId/versions       → Version Plans list
/projects/:projectId/versions/new   → New Version Plan builder
/projects/:projectId/versions/:planId          → View Version Plan
/projects/:projectId/versions/:planId/edit     → Edit Version Plan

/projects/:projectId/prompts        → Prompt History list
/projects/:projectId/prompts/new    → New Prompt Generator
/projects/:projectId/prompts/:promptId         → View Prompt + Response pair

/projects/:projectId/export         → Export center

/settings                           → App settings (AI provider config, theme)
```

## 1.2 Navigation Hierarchy

```
Level 0: App Shell
├── Dashboard (/)
├── Settings (/settings)
│
Level 1: Project Context (/projects/:projectId)
├── Overview
├── Brainstorms
├── Systems
├── Dependencies
├── Versions
├── Prompts
└── Export
```

## 1.3 Page Inventory

### 1.3.1 Dashboard (`/`)

| Element               | Description                                                     |
|-----------------------|-----------------------------------------------------------------|
| Page title            | "Your Projects"                                                 |
| Project cards grid    | Each card: name, genre, status badge, system count, last edited |
| Empty state           | Illustration + CTA "Create your first project"                  |
| Create project button | Persistent FAB / top-right primary button                       |
| Search / filter bar   | Filter by status (Ideation / Active / Archived), text search    |
| Sort control          | Last edited, alphabetical, creation date                        |

### 1.3.2 New Project (`/new`)

| Element             | Description                                              |
|---------------------|----------------------------------------------------------|
| Form fields         | Name*, Description, Genre, Target Platform, Status       |
| Validation          | Name required; Zod schema                                |
| Submit action       | Server Action → redirect to `/projects/:id/overview`     |
| Cancel              | Returns to Dashboard                                     |

### 1.3.3 Project Overview (`/projects/:projectId/overview`)

| Element                  | Description                                                  |
|--------------------------|--------------------------------------------------------------|
| Project header           | Name, genre badge, platform badge, status badge              |
| Quick-stats row          | Brainstorm count, System count, Dependency count, Plan count |
| Recent activity timeline | Last 10 actions across all sub-sections                      |
| Quick actions            | "New Brainstorm", "New System", "Generate Plan"              |
| Project settings gear    | Opens project edit drawer                                    |
| Dependency mini-graph    | Small, non-interactive preview of dependency graph           |

### 1.3.4 Brainstorms List (`/projects/:projectId/brainstorms`)

| Element          | Description                                           |
|------------------|-------------------------------------------------------|
| Session cards    | Title, date, author, tag pills, word count, synthesized status |
| New session CTA  | Button → `/brainstorms/new`                           |
| Filter/sort      | By date, by tag, synthesized vs raw                   |
| Empty state      | "Paste your first brainstorm to get started"          |

### 1.3.5 New Brainstorm (`/projects/:projectId/brainstorms/new`)

| Element             | Description                                                        |
|---------------------|--------------------------------------------------------------------|
| Input mode tabs     | **Paste** / **Freeform** / **Upload**                              |
| Paste mode          | Large textarea, auto-detect Discord formatting                     |
| Freeform mode       | Markdown editor with toolbar                                       |
| Upload mode         | Drag-and-drop zone for `.md` / `.txt` files                       |
| Metadata fields     | Author (text), Tags (tag input with autocomplete)                  |
| Save action         | Server Action → redirect to session view                           |
| Save & Synthesize   | Server Action → save then redirect to synthesize flow              |

### 1.3.6 View Brainstorm (`/projects/:projectId/brainstorms/:sessionId`)

| Element                | Description                                                  |
|------------------------|--------------------------------------------------------------|
| Session header         | Title, author, date, tags                                    |
| Content display        | Rendered markdown (read-only)                                |
| Action bar             | "Synthesize", "Edit Tags", "Delete"                          |
| Synthesized outputs    | If synthesized: linked card(s) to synthesized output         |

### 1.3.7 Synthesize Flow (`/projects/:projectId/brainstorms/:sessionId/synthesize`)

This is a **multi-step wizard**:

| Step | Name               | Description                                                         |
|------|--------------------|---------------------------------------------------------------------|
| 1    | Configure          | Select AI model, set focus areas (optional), confirm source text    |
| 2    | Processing         | Loading state with streaming AI response preview                   |
| 3    | Review Output      | Rendered structured output: extracted system candidates, key themes, suggested dependencies |
| 4    | Convert to Systems | Checkbox list of extracted systems → "Create Selected Systems"     |

### 1.3.8 Systems List (`/projects/:projectId/systems`)

| Element             | Description                                                              |
|---------------------|--------------------------------------------------------------------------|
| View toggle         | **Grid** (cards) / **Table** (rows)                                      |
| System cards        | Name, System ID slug, status badge, criticality badge, dependency count  |
| Table columns       | Name, ID, Status, Criticality, Version, Dependencies, Last Updated       |
| Filters             | Status (Draft/Active/Deprecated), Criticality (Core/Important/Later)     |
| Sort                | Alphabetical, criticality, last updated, dependency count                |
| Bulk actions        | Merge selected, Delete selected                                          |
| New system CTA      | Button → `/systems/new`                                                  |

### 1.3.9 Create/Edit System (`/projects/:projectId/systems/new`, `/systems/:systemId`)

| Element                  | Description                                                         |
|--------------------------|---------------------------------------------------------------------|
| Mode toggle              | **Form View** / **Markdown View**                                   |
| Form view                | Structured fields matching the System Markdown Schema (Section 7 of PRD) |
| Markdown view            | Full markdown editor with live preview split-pane                   |
| Field: Name*             | Text input                                                          |
| Field: System ID*        | Auto-generated slug from name (editable)                            |
| Field: Version           | Semver input (default v0.1)                                         |
| Field: Status            | Select: Draft / Active / Deprecated                                 |
| Field: Purpose           | Textarea                                                            |
| Field: Current State     | Markdown textarea                                                   |
| Field: Target State      | Markdown textarea                                                   |
| Field: Core Mechanics    | Markdown textarea                                                   |
| Field: Inputs            | Markdown textarea                                                   |
| Field: Outputs           | Markdown textarea                                                   |
| Field: Dependencies      | Multi-select of existing system IDs (with graph preview)            |
| Field: Failure States    | Markdown textarea                                                   |
| Field: Scaling Behavior  | Markdown textarea                                                   |
| Field: MVP Criticality   | Select: Core / Important / Later                                    |
| Field: Implementation Notes | Markdown textarea                                                |
| Field: Open Questions    | Markdown textarea                                                   |
| Save action              | Server Action → persist markdown document                           |
| Delete action            | Confirmation dialog → soft delete (archive)                         |

### 1.3.10 System History (`/projects/:projectId/systems/:systemId/history`)

| Element           | Description                                               |
|-------------------|-----------------------------------------------------------|
| Timeline list     | Change log entries with timestamps                        |
| Diff view         | Side-by-side or unified diff between versions             |
| Restore action    | Revert to a previous version (with confirmation)          |

### 1.3.11 System Evolution (`/projects/:projectId/systems/:systemId/evolve`)

| Element                 | Description                                                     |
|-------------------------|-----------------------------------------------------------------|
| Current state panel     | Read-only rendered markdown of current system state             |
| AI analysis trigger     | "Analyze Evolution" button → AI generates delta                 |
| Delta summary           | AI-generated summary of required changes                        |
| Required changes list   | Itemized change proposals with accept/reject per item           |
| Dependency impact panel | Shows affected upstream/downstream systems                      |
| Apply accepted changes  | Server Action → creates new version, appends to change log      |

### 1.3.12 Dependency Graph (`/projects/:projectId/dependencies`)

| Element                  | Description                                                      |
|--------------------------|------------------------------------------------------------------|
| Interactive DAG canvas   | Zoomable, pannable, node-link diagram                            |
| System nodes             | Colored by criticality, labeled with name + status               |
| Dependency edges         | Directed arrows, styled by dependency type                       |
| Selection panel          | Click a node → side panel with system summary + direct dependencies |
| Add edge action          | Select source → target nodes, confirm                            |
| Remove edge action       | Click edge → confirm removal                                     |
| Impact analysis mode     | Toggle: highlight all downstream dependents of selected node     |
| Layout options           | Hierarchical (top-down) / Force-directed / Left-to-right         |
| Mini-map                 | Corner overlay for large graphs                                  |
| Legend                   | Color key for criticality + status                               |
| Filter controls          | Filter by criticality, status; hide/show deprecated              |

### 1.3.13 Version Plans List (`/projects/:projectId/versions`)

| Element            | Description                                          |
|--------------------|------------------------------------------------------|
| Plan cards         | Version label (v1, v1.1, v2), system count, phase count, creation date |
| Status badge       | Draft / Finalized                                    |
| New plan CTA       | "Create Version Plan" button                         |
| Empty state        | "Define your first version milestone"                |

### 1.3.14 New/Edit Version Plan (`/projects/:projectId/versions/new`, `/versions/:planId/edit`)

| Element                   | Description                                                          |
|---------------------------|----------------------------------------------------------------------|
| Version label input       | e.g., "v1.0", "v1.1-alpha"                                          |
| System picker             | Checkbox list of all systems with criticality/status indicators      |
| Explicit exclusions       | Systems intentionally deferred (with reason text)                    |
| Phase editor              | Sortable list of phases; each phase has a name, description, and assigned systems |
| Add phase button          | Appends a new empty phase                                            |
| Drag-to-reorder           | Phases and systems within phases are drag-sortable                   |
| AI generate phases        | "Auto-generate Phases" → AI suggests phase ordering from dependency graph |
| Milestone fields          | Per-phase milestone description                                      |
| Risk areas                | Textarea per plan or AI-generated                                    |
| Scope validation          | Auto-check: warns if selected systems have unmet dependencies        |
| Preview panel             | Live-rendered markdown preview of the version plan document          |
| Save as Draft             | Persist without finalizing                                           |
| Finalize                  | Lock plan as immutable snapshot (confirmation dialog)                |

### 1.3.15 View Version Plan (`/projects/:projectId/versions/:planId`)

| Element                    | Description                                                    |
|----------------------------|----------------------------------------------------------------|
| Plan header                | Version label, status, creation date                           |
| Included systems list      | Cards or table with status + criticality                       |
| Excluded systems list      | With deferral reasons                                          |
| Phase timeline             | Visual timeline or accordion of phases with system assignments |
| Dependency sub-graph       | Filtered graph showing only systems in this plan               |
| Risk areas display         | Rendered markdown                                              |
| Action bar                 | "Generate Prompts", "Export", "Duplicate as Draft"             |

### 1.3.16 Prompt Generator (`/projects/:projectId/prompts/new`)

| Element                  | Description                                                        |
|--------------------------|--------------------------------------------------------------------|
| Prompt target selector   | Pick a System or Version Plan as context source                    |
| Prompt type selector     | Implementation / Architecture / Refactor / Balance / Expansion     |
| Output mode selector     | Raw Prompt / Prompt + Context / Prompt Bundle (markdown)           |
| Additional instructions  | Textarea for user-added focus or constraints                       |
| Generate button          | Server Action → AI call → streaming response                      |
| Output display           | Markdown-rendered prompt output with copy-to-clipboard             |
| Save to history          | Auto-saved on generation; links to prompt history                  |

### 1.3.17 Prompt History (`/projects/:projectId/prompts`)

| Element             | Description                                                 |
|---------------------|-------------------------------------------------------------|
| Prompt list         | Date, target system/plan name, prompt type, truncated preview |
| Filter              | By type, by target, by date range                           |
| Click to expand     | Opens `/prompts/:promptId`                                  |

### 1.3.18 View Prompt (`/projects/:projectId/prompts/:promptId`)

| Element              | Description                                    |
|----------------------|------------------------------------------------|
| Prompt metadata      | Date, type, target, output mode                |
| Generated prompt     | Rendered markdown (copyable)                   |
| AI response          | If stored: rendered markdown of AI response    |
| Regenerate action    | Re-run with same config                        |
| Copy actions         | Copy prompt, copy response, copy both          |

### 1.3.19 Export Center (`/projects/:projectId/export`)

| Element                 | Description                                                  |
|-------------------------|--------------------------------------------------------------|
| Export type selector     | Full GDD / Version PRD / Individual System / Roadmap / Prompt Bundle |
| Scope selector           | Depends on type: pick specific systems, plans, or "all"      |
| Format selector          | Markdown (.md) / JSON / Clipboard                            |
| Preview panel            | Live preview of export output                                |
| Download / Copy button   | Triggers file download or copies to clipboard                |
| Export history            | List of previous exports with timestamps                     |

### 1.3.20 Settings (`/settings`)

| Element              | Description                                         |
|----------------------|-----------------------------------------------------|
| AI Provider config   | Provider select (OpenAI / Claude / Gemini), API key input, model select |
| Theme toggle         | Light / Dark / System                               |
| Default project settings | Default genre, platform presets                  |
| Data management      | Import/export all project data (JSON backup)         |

## 1.4 CRUD Flow Summary

| Entity           | Create                        | Read                    | Update                        | Delete/Archive                   |
|------------------|-------------------------------|-------------------------|-------------------------------|----------------------------------|
| Project          | `/new` form                   | Dashboard cards, `/overview` | Edit drawer on overview     | Archive via project settings     |
| Brainstorm       | `/brainstorms/new`            | `/brainstorms/:id`      | Edit tags only (content immutable) | Delete with confirmation    |
| System           | `/systems/new` or Synthesize convert | `/systems/:id`  | Form/Markdown editor          | Archive with confirmation        |
| Dependency       | Graph edge interaction or system form | Graph view, system detail | Graph edge interaction  | Graph edge removal               |
| Version Plan     | `/versions/new`               | `/versions/:id`         | `/versions/:id/edit` (draft only) | Delete draft only            |
| Prompt           | `/prompts/new`                | `/prompts/:id`          | Not editable (immutable)      | Delete with confirmation         |
| Export           | `/export` center              | Preview in export center | N/A                          | N/A                              |

---

# 2. Layout System

## 2.1 App Shell Architecture

The application uses a **sidebar + top bar** hybrid layout:

```
┌──────────────────────────────────────────────────────┐
│  Top Bar (app-level)                                 │
│  [Logo/Home]    [Project Name breadcrumb]   [⚙ ][👤]│
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │  Content Area                             │
│          │                                           │
│ Overview │  ┌─────────────────────────────────────┐  │
│ Brainst. │  │  Page Header (title + actions)      │  │
│ Systems  │  ├─────────────────────────────────────┤  │
│ Deps.    │  │                                     │  │
│ Versions │  │  Page Content                       │  │
│ Prompts  │  │                                     │  │
│ Export   │  │                                     │  │
│          │  └─────────────────────────────────────┘  │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

### Top Bar (64px height)

| Element               | Position   | Behavior                                         |
|-----------------------|------------|--------------------------------------------------|
| App logo / Home link  | Left       | Always links to Dashboard (`/`)                  |
| Breadcrumb trail      | Center-left| `Projects > [Project Name] > [Section]`          |
| Theme toggle          | Right      | Light/Dark/System                                |
| Settings icon         | Right      | Links to `/settings`                             |

### Sidebar (256px width, collapsible to 64px icon-only)

| Element              | Behavior                                                  |
|----------------------|-----------------------------------------------------------|
| Visibility           | Only shown when inside a project context (`/projects/:id/*`) |
| Dashboard (/)        | No sidebar — full-width layout                            |
| Navigation items     | Icon + label; icon-only when collapsed                    |
| Active indicator      | Left border highlight on current section                  |
| Collapse toggle      | Chevron button at sidebar bottom                          |
| Project status badge | Below nav items; shows project status                     |

**Sidebar Navigation Items (in order):**

1. Overview (LayoutDashboard icon)
2. Brainstorms (MessageSquare icon)
3. Systems (Boxes icon)
4. Dependencies (GitBranch icon)
5. Versions (Milestone icon)
6. Prompts (Sparkles icon)
7. Export (Download icon)

### Content Area

| Property       | Value                                      |
|----------------|--------------------------------------------|
| Max width      | `1280px` (centered within available space) |
| Padding        | `24px` on desktop, `16px` on mobile        |
| Scroll         | Content area scrolls independently          |

## 2.2 Responsive Breakpoints

| Breakpoint   | Tailwind Class | Width       | Behavior                                    |
|--------------|----------------|-------------|---------------------------------------------|
| Mobile       | `sm`           | < 640px     | Sidebar hidden; hamburger menu; stacked layouts |
| Tablet       | `md`           | 640–1023px  | Sidebar collapsed (icons only); 2-col grids become 1-col |
| Desktop      | `lg`           | 1024–1279px | Sidebar expanded; full layouts               |
| Wide Desktop | `xl`           | ≥ 1280px    | Sidebar expanded; content max-width centered |

### Mobile Behavior

- Sidebar becomes an **off-canvas drawer** triggered by hamburger icon in top bar
- Cards stack vertically
- Tables become scrollable horizontally or switch to card view
- Dependency graph gets a full-screen toggle
- Multi-step wizards use full-width single-column layout
- Modal dialogs become full-screen sheets on mobile

## 2.3 Project Context Persistence

The project context (`projectId`) is derived from the URL path. The sidebar and top bar breadcrumb update reactively via Next.js layout nesting:

```
app/
  layout.tsx                          → App shell (top bar only)
  page.tsx                            → Dashboard (no sidebar)
  new/page.tsx                        → New project (no sidebar)
  projects/[projectId]/
    layout.tsx                        → Project shell (sidebar + top bar)
    page.tsx                          → Redirect to overview
    overview/page.tsx
    brainstorms/
      page.tsx
      new/page.tsx
      [sessionId]/
        page.tsx
        synthesize/page.tsx
    systems/
      page.tsx
      new/page.tsx
      [systemId]/
        page.tsx
        history/page.tsx
        evolve/page.tsx
    dependencies/page.tsx
    versions/
      page.tsx
      new/page.tsx
      [planId]/
        page.tsx
        edit/page.tsx
    prompts/
      page.tsx
      new/page.tsx
      [promptId]/page.tsx
    export/page.tsx
  settings/page.tsx                   → Settings (no sidebar)
```

The `projects/[projectId]/layout.tsx` fetches project data server-side and provides it to all child routes via React Server Component props and a `ProjectProvider` context (client component, used only for the sidebar active state and quick-access project metadata).

---

# 3. Key UI Components

## 3.1 Component Inventory

Below is every distinct component the application requires, organized by category.

### 3.1.1 Layout Components

| Component               | Type   | Description                                                 |
|--------------------------|--------|-------------------------------------------------------------|
| `AppShell`              | Server | Root layout: top bar + content slot                         |
| `TopBar`                | Client | App-level navigation bar with breadcrumbs                   |
| `Breadcrumb`            | Server | Dynamic breadcrumb trail from URL segments                  |
| `ProjectSidebar`        | Client | Collapsible sidebar with navigation links                   |
| `SidebarNavItem`        | Client | Individual nav link with icon, label, active state          |
| `SidebarCollapseToggle` | Client | Collapse/expand toggle button                               |
| `MobileDrawer`          | Client | Off-canvas sidebar for mobile viewports                     |
| `PageHeader`            | Server | Page title + description + action buttons slot              |
| `PageContainer`         | Server | Max-width centered content wrapper                          |

### 3.1.2 Dashboard Components

| Component              | Type   | Description                                                  |
|------------------------|--------|--------------------------------------------------------------|
| `ProjectCardGrid`      | Server | Responsive grid of project cards                             |
| `ProjectCard`          | Server | Card with project name, genre, status, stats, last edited    |
| `ProjectSearchBar`     | Client | Search input + status filter dropdown                        |
| `ProjectSortSelect`    | Client | Sort dropdown (last edited, alpha, created)                  |
| `EmptyProjectState`    | Server | Illustration + CTA for zero-project state                    |

### 3.1.3 Project Overview Components

| Component               | Type   | Description                                                   |
|--------------------------|--------|---------------------------------------------------------------|
| `ProjectHeader`         | Server | Large header with project metadata + badges                   |
| `QuickStatsRow`         | Server | Row of stat cards (brainstorms, systems, deps, plans)         |
| `StatCard`              | Server | Single metric: icon, count, label                             |
| `RecentActivityTimeline`| Server | Chronological list of recent project actions                  |
| `ActivityItem`          | Server | Single activity: icon, description, timestamp                 |
| `QuickActionsBar`       | Server | Row of primary action buttons                                 |
| `DependencyMiniGraph`   | Client | Small, non-interactive preview of the dependency graph        |
| `ProjectEditDrawer`     | Client | Drawer form for editing project metadata                      |

### 3.1.4 Brainstorm Components

| Component                | Type   | Description                                                   |
|--------------------------|--------|---------------------------------------------------------------|
| `BrainstormCardList`     | Server | List/grid of brainstorm session cards                         |
| `BrainstormCard`         | Server | Card: title, date, author, tags, word count, synth status     |
| `BrainstormInputTabs`    | Client | Tab switcher for Paste / Freeform / Upload modes              |
| `PasteInput`             | Client | Large textarea with Discord format detection                  |
| `FreeformEditor`         | Client | Markdown editor with toolbar (bold, headers, lists, code)     |
| `FileUploadZone`         | Client | Drag-and-drop zone for .md/.txt files                         |
| `TagInput`               | Client | Multi-tag input with autocomplete from existing tags          |
| `BrainstormViewer`       | Server | Rendered markdown display of brainstorm content               |
| `SynthesizeStatusBadge`  | Server | Badge indicating if session has been synthesized              |

### 3.1.5 Synthesize Flow Components

| Component                 | Type   | Description                                                   |
|---------------------------|--------|---------------------------------------------------------------|
| `SynthesizeWizard`        | Client | Multi-step wizard container (steps 1–4)                       |
| `WizardStepIndicator`     | Client | Horizontal step progress indicator                            |
| `SynthConfigStep`         | Client | Step 1: model select, focus areas, source preview             |
| `SynthProcessingStep`     | Client | Step 2: loading spinner + streaming AI output preview         |
| `SynthReviewStep`         | Client | Step 3: rendered structured output with extracted systems     |
| `SynthConvertStep`        | Client | Step 4: checkbox list of systems to create                    |
| `ExtractedSystemCard`     | Client | Preview card for an AI-extracted system candidate             |
| `StreamingTextDisplay`    | Client | Progressive text rendering for AI streaming responses         |

### 3.1.6 System Components

| Component                 | Type   | Description                                                   |
|---------------------------|--------|---------------------------------------------------------------|
| `SystemCardGrid`          | Server | Grid layout for system cards                                  |
| `SystemCard`              | Server | Card: name, ID, status badge, criticality badge, dep count   |
| `SystemTable`             | Client | Sortable, filterable table of systems                         |
| `SystemViewToggle`        | Client | Grid / Table view toggle buttons                              |
| `SystemFormEditor`        | Client | Structured form matching the System Markdown Schema           |
| `SystemMarkdownEditor`    | Client | Full markdown editor with split-pane preview                  |
| `SystemEditorModeToggle`  | Client | Form View / Markdown View toggle                             |
| `StatusBadge`             | Server | Colored badge: Draft (yellow), Active (green), Deprecated (gray) |
| `CriticalityBadge`        | Server | Colored badge: Core (red), Important (orange), Later (blue)  |
| `DependencyMultiSelect`   | Client | Multi-select dropdown of system IDs with mini-graph preview   |
| `SystemDiffViewer`        | Client | Side-by-side or unified diff display                          |
| `SystemTimeline`          | Server | Change log timeline with version markers                      |
| `SystemMergeDialog`       | Client | Modal: select two systems → preview merged output → confirm   |
| `SystemSplitDialog`       | Client | Modal: select sections to split → preview new systems → confirm |

### 3.1.7 System Evolution Components

| Component                     | Type   | Description                                                |
|-------------------------------|--------|------------------------------------------------------------|
| `EvolutionSplitView`         | Client | Side-by-side: current state (left) vs proposed state (right) |
| `DeltaSummaryPanel`          | Server | AI-generated summary of what needs to change               |
| `ChangeProposalList`         | Client | Itemized list of changes with accept/reject toggles        |
| `ChangeProposalItem`         | Client | Single change: description, affected field, accept/reject  |
| `DependencyImpactPanel`     | Client | List of upstream/downstream systems affected by changes    |
| `ApplyChangesConfirmDialog`  | Client | Confirmation with summary of accepted changes              |

### 3.1.8 Dependency Graph Components

| Component                 | Type   | Description                                                   |
|---------------------------|--------|---------------------------------------------------------------|
| `DependencyGraphCanvas`   | Client | Main interactive DAG visualization (React Flow or D3)         |
| `GraphNode`               | Client | System node: name, status icon, criticality color             |
| `GraphEdge`               | Client | Directed arrow between nodes                                  |
| `GraphControls`           | Client | Zoom, pan, fit-to-screen, layout mode buttons                 |
| `GraphMiniMap`            | Client | Corner overlay miniature of full graph                        |
| `GraphLegend`             | Client | Color key for criticality + status                            |
| `GraphFilterBar`          | Client | Filter by criticality, status; toggle deprecated visibility   |
| `NodeDetailPanel`         | Client | Slide-out panel showing selected system summary               |
| `AddEdgeDialog`           | Client | Modal: source system select → target system select → confirm  |
| `RemoveEdgeDialog`        | Client | Confirmation dialog for edge removal                          |
| `ImpactHighlightToggle`   | Client | Toggle button to activate/deactivate impact analysis mode     |
| `LayoutModeSelect`        | Client | Dropdown: Hierarchical / Force-directed / Left-to-right       |

### 3.1.9 Version Plan Components

| Component                 | Type   | Description                                                   |
|---------------------------|--------|---------------------------------------------------------------|
| `VersionPlanCardList`     | Server | List of version plan cards                                    |
| `VersionPlanCard`         | Server | Card: version label, system count, phase count, status badge  |
| `VersionLabelInput`       | Client | Text input for version label                                  |
| `SystemPicker`            | Client | Checkbox list with criticality/status indicators + search     |
| `ExclusionList`           | Client | Deferred systems with reason text inputs                      |
| `PhaseEditor`             | Client | Sortable list of phase blocks                                 |
| `PhaseBlock`              | Client | Phase name, description, assigned systems (drag-sortable)     |
| `AddPhaseButton`          | Client | Appends new empty phase block                                 |
| `AutoGeneratePhasesButton`| Client | AI-powered phase ordering from dependency graph               |
| `ScopeValidationWarning`  | Client | Warning banner if dependency gaps detected                    |
| `PlanPreviewPanel`        | Client | Live markdown preview of version plan                         |
| `FinalizePlanDialog`      | Client | Confirmation dialog with "this action is permanent" warning   |
| `PlanPhaseTimeline`       | Server | Visual timeline or accordion of phases                        |
| `PlanDependencySubgraph`  | Client | Filtered dependency graph for plan-scoped systems             |

### 3.1.10 Prompt Components

| Component                | Type   | Description                                                   |
|--------------------------|--------|---------------------------------------------------------------|
| `PromptHistoryList`      | Server | List of prompt entries                                        |
| `PromptHistoryItem`      | Server | Row: date, target, type, truncated preview                    |
| `PromptTargetSelector`   | Client | Select a System or Version Plan as context                    |
| `PromptTypeSelector`     | Client | Radio group: Implementation / Architecture / Refactor / Balance / Expansion |
| `OutputModeSelector`     | Client | Radio group: Raw / +Context / Bundle                          |
| `AdditionalInstructions` | Client | Textarea for user notes                                       |
| `PromptOutputDisplay`    | Client | Rendered markdown with copy-to-clipboard                      |
| `PromptResponseDisplay`  | Client | Rendered AI response markdown                                 |
| `CopyButton`             | Client | Click-to-copy with toast confirmation                         |
| `RegenerateButton`       | Client | Re-run prompt with same configuration                         |

### 3.1.11 Export Components

| Component                | Type   | Description                                                   |
|--------------------------|--------|---------------------------------------------------------------|
| `ExportTypeSelector`     | Client | Radio/card group for export type                              |
| `ExportScopeSelector`    | Client | Dynamic picker based on export type (systems, plans, etc.)    |
| `ExportFormatSelector`   | Client | Radio: Markdown / JSON / Clipboard                            |
| `ExportPreviewPanel`     | Client | Live preview of export output                                 |
| `DownloadButton`         | Client | Triggers file download (.md or .json)                         |
| `CopyToClipboardButton`  | Client | Copies export content to clipboard with toast                 |
| `ExportHistoryList`      | Server | Previous exports with timestamps and quick-redownload         |

### 3.1.12 Shared / Primitive Components

| Component                | Type   | Description                                                   |
|--------------------------|--------|---------------------------------------------------------------|
| `MarkdownEditor`         | Client | Reusable markdown editor with toolbar (extends Shadcn Textarea) |
| `MarkdownPreview`        | Server | Rendered markdown display (uses `react-markdown` or similar)  |
| `MarkdownSplitPane`      | Client | Editor + Preview side-by-side with toggle                     |
| `ConfirmDialog`          | Client | Reusable "Are you sure?" dialog (extends Shadcn AlertDialog)  |
| `FormDrawer`             | Client | Slide-out drawer for edit forms (extends Shadcn Sheet)        |
| `EmptyState`             | Server | Reusable empty state: illustration + message + CTA            |
| `LoadingSkeleton`        | Server | Skeleton loaders for cards, tables, text blocks               |
| `StatusFilter`           | Client | Reusable status filter dropdown                               |
| `SearchInput`            | Client | Debounced search input (uses `nuqs` for URL state)            |
| `SortSelect`             | Client | Reusable sort dropdown                                        |
| `TagPill`                | Server | Colored pill for tags                                         |
| `BadgeGroup`             | Server | Row of badges (status + criticality combined)                 |
| `ToastNotification`      | Client | Success/error/info toasts (Shadcn Sonner)                     |
| `DropZone`               | Client | Reusable file drag-and-drop area                              |
| `StepIndicator`          | Client | Horizontal multi-step wizard progress bar                     |

---

# 4. Core User Flows

## 4.1 New Project Creation

```
Screen 1: Dashboard (/)
  → User clicks "New Project" button

Screen 2: New Project Form (/new)
  → User fills in: Name*, Description, Genre, Platform, Status
  → User clicks "Create Project"
  → Server Action validates with Zod
  → On success: redirect to /projects/:newId/overview
  → On error: inline validation errors

Screen 3: Project Overview (/projects/:newId/overview)
  → Empty state with quick-action CTAs
  → "Add your first brainstorm" prompt
```

## 4.2 Brainstorm Session Entry

```
Screen 1: Brainstorms List (/projects/:id/brainstorms)
  → User clicks "New Brainstorm"

Screen 2: New Brainstorm (/projects/:id/brainstorms/new)
  → User selects input mode tab:

  [Tab: Paste]
    → User pastes Discord conversation into large textarea
    → System auto-detects Discord formatting

  [Tab: Freeform]
    → User types/edits in markdown editor with toolbar
    → Supports headers, lists, bold, code blocks

  [Tab: Upload]
    → User drags .md or .txt file into drop zone
    → Content populates the editor for review

  → User adds Author name
  → User adds tags via tag input
  → User clicks "Save" or "Save & Synthesize"

  [If Save]: redirect to /projects/:id/brainstorms/:sessionId
  [If Save & Synthesize]: redirect to synthesize flow
```

## 4.3 Synthesize Brainstorm → Review → Convert to Systems

```
Screen 1: Brainstorm View (/projects/:id/brainstorms/:sessionId)
  → User clicks "Synthesize" in action bar

Screen 2: Synthesize Wizard — Step 1: Configure
  (/projects/:id/brainstorms/:sessionId/synthesize)
  → User selects AI model (dropdown)
  → User optionally sets focus areas (tag input)
  → Source text preview shown (read-only)
  → User clicks "Synthesize"

Screen 3: Synthesize Wizard — Step 2: Processing
  → Loading animation + streaming text preview
  → AI response streams in real-time
  → "Cancel" button available
  → Auto-advances to Step 3 on completion

Screen 4: Synthesize Wizard — Step 3: Review Output
  → Rendered structured output:
    - Key themes identified
    - System candidates (name, purpose, suggested dependencies)
    - Suggested criticality ratings
  → User can review each extracted system candidate
  → User clicks "Continue to Convert"

Screen 5: Synthesize Wizard — Step 4: Convert to Systems
  → Checkbox list of extracted system candidates
  → Each row: ☐ System Name | Purpose summary | [Edit] link
  → "Select All" / "Deselect All" controls
  → User checks desired systems
  → User clicks "Create Selected Systems"
  → Server Action: creates system documents for each selected system
  → Toast: "X systems created"
  → Redirect to /projects/:id/systems
```

## 4.4 Create/Edit Game System

```
Screen 1: Systems List (/projects/:id/systems)
  → User clicks "New System"

Screen 2: System Editor (/projects/:id/systems/new)
  → Mode toggle at top: [Form View] | [Markdown View]

  [Form View]
    → Structured fields:
      - Name* (text input, auto-generates System ID slug)
      - System ID (editable slug)
      - Version (semver, default v0.1)
      - Status (select: Draft / Active / Deprecated)
      - Purpose (textarea)
      - Current State (markdown textarea)
      - Target State (markdown textarea)
      - Core Mechanics (markdown textarea)
      - Inputs (markdown textarea)
      - Outputs (markdown textarea)
      - Dependencies (multi-select of existing system IDs)
      - Failure States (markdown textarea)
      - Scaling Behavior (markdown textarea)
      - MVP Criticality (select: Core / Important / Later)
      - Implementation Notes (markdown textarea)
      - Open Questions (markdown textarea)
    → Switching to Markdown View syncs form → markdown

  [Markdown View]
    → Full markdown editor on left, live preview on right
    → Editing the markdown syncs markdown → form fields
    → Template pre-populated with System Markdown Schema

  → User fills fields and clicks "Save System"
  → Server Action: validate with Zod, persist markdown document
  → Redirect to /projects/:id/systems/:systemId

  [Edit flow]
    → Same screen, pre-populated with existing data
    → "Save Changes" replaces "Save System"
    → Change appended to Change Log automatically
```

## 4.5 System Merge

```
Screen 1: Systems List (/projects/:id/systems)
  → User selects two system cards via checkboxes
  → "Merge Selected" button activates

Screen 2: System Merge Dialog (modal overlay)
  → Left panel: System A summary
  → Right panel: System B summary
  → Center: AI-generated merge preview
    - Merged name suggestion
    - Combined purpose
    - Unified dependencies
    - Merged fields with conflict highlights
  → User reviews and edits merged output
  → User clicks "Confirm Merge"
  → Server Action:
    - Creates new merged system
    - Archives original two systems
    - Updates all dependency references
  → Toast: "Systems merged into [New Name]"
  → Redirect to merged system page
```

## 4.6 System Split

```
Screen 1: System View (/projects/:id/systems/:systemId)
  → User clicks "Split System" in action menu

Screen 2: System Split Dialog (modal overlay)
  → Current system displayed with section checkboxes
  → User groups sections into System A and System B
  → User provides names for each new system
  → AI generates preview of both resulting systems
  → User reviews and edits
  → User clicks "Confirm Split"
  → Server Action:
    - Creates two new system documents
    - Archives original system
    - Distributes dependencies appropriately
  → Toast: "System split into [A] and [B]"
  → Redirect to systems list
```

## 4.7 System Evolution: View Delta, Review Changes, Accept/Reject

```
Screen 1: System View (/projects/:id/systems/:systemId)
  → User clicks "Evolve" in action bar

Screen 2: Evolution View (/projects/:id/systems/:systemId/evolve)
  → Left panel: Current system state (rendered markdown, read-only)
  → User clicks "Analyze Evolution"
  → AI processes current state vs target state

Screen 3: Evolution View — Results loaded
  → Top: Delta Summary (AI-generated narrative)
  → Center: Change Proposal List
    - Each item: field name, description of change, [Accept ✓] [Reject ✗]
    - Accepted items highlighted green
    - Rejected items highlighted red/struck-through
  → Right panel: Dependency Impact
    - List of upstream/downstream systems affected
    - Impact severity indicators
  → User reviews each proposal, accepts or rejects

Screen 4: Apply Changes
  → User clicks "Apply Accepted Changes"
  → Confirmation dialog: summary of N accepted / M rejected changes
  → Server Action:
    - Creates new version of the system
    - Appends all accepted changes
    - Updates Change Log
  → Toast: "System updated to v[X.Y]"
  → Redirect to updated system view
```

## 4.8 Dependency Graph Interaction

```
Screen 1: Dependencies (/projects/:id/dependencies)
  → Interactive DAG renders with all project systems
  → Nodes colored by criticality, bordered by status
  → Edges show dependency direction

  [View interactions]
    → Zoom: scroll wheel / pinch
    → Pan: click + drag on background
    → Fit: "Fit to Screen" control button
    → Layout: switch between Hierarchical / Force / LTR

  [Select a node]
    → Node highlights
    → Side panel slides in with system summary:
      - Name, status, criticality, version
      - Direct dependencies (incoming)
      - Depended on by (outgoing)
      - Quick link: "View System", "Edit System"

  [Add an edge]
    → User clicks "Add Dependency" button
    → Dialog opens: select Source system → Target system
    → Validation: check for circular dependency
    → On confirm: edge added, graph re-renders
    → Toast: "[Source] now depends on [Target]"

  [Remove an edge]
    → User clicks on an existing edge
    → Edge highlights, "Remove" tooltip appears
    → Confirmation dialog: "Remove dependency from [A] to [B]?"
    → On confirm: edge removed, graph re-renders

  [Impact Analysis mode]
    → User clicks "Impact Analysis" toggle
    → User clicks a node
    → All downstream dependents highlight in cascade
    → Side panel shows full impact chain with depth levels
```

## 4.9 Version Plan Creation and Finalization

```
Screen 1: Versions List (/projects/:id/versions)
  → User clicks "Create Version Plan"

Screen 2: Version Plan Builder (/projects/:id/versions/new)
  → Version Label input: e.g., "v1.0"
  → System Picker:
    - Checkbox list of all systems
    - Each row: ☐ [Name] | [Status badge] | [Criticality badge]
    - Search/filter within picker
  → Explicit Exclusions:
    - For unchecked systems: optional "reason for deferral" text
  → Phase Editor:
    - Default: 1 empty phase
    - "Add Phase" button
    - Each phase: name, description, assigned systems (drag from picked list)
    - Drag-to-reorder phases and systems within phases
  → "Auto-Generate Phases" button:
    - AI uses dependency graph to suggest optimal phase ordering
    - Preview before accepting
  → Scope Validation:
    - Warning banner if selected systems depend on excluded systems
    - "Include dependency" quick-fix links
  → Preview Panel (right side or bottom):
    - Live markdown rendering of the version plan document
  → User clicks "Save as Draft" or "Finalize"

  [Save as Draft]
    → Persists as editable draft
    → Redirect to /projects/:id/versions/:planId

  [Finalize]
    → Confirmation dialog: "Finalizing makes this plan immutable. Continue?"
    → On confirm: plan locked, status set to "Finalized"
    → Redirect to plan view
```

## 4.10 Prompt Generation and History

```
Screen 1: Prompts List (/projects/:id/prompts)
  → User clicks "New Prompt"

Screen 2: Prompt Generator (/projects/:id/prompts/new)
  → Prompt Target: select a System or Version Plan from dropdown
  → Prompt Type: select one of:
    - Implementation
    - Architecture
    - Refactor
    - Balance
    - Expansion
  → Output Mode: select one of:
    - Raw Prompt Only
    - Prompt + Structured Context
    - Prompt Bundle (markdown)
  → Additional Instructions: optional textarea
  → User clicks "Generate"
  → Loading state with streaming AI response
  → Output rendered as markdown
  → Buttons: "Copy Prompt", "Copy Response", "Copy Both"
  → Auto-saved to prompt history

Screen 3: View Prompt (/projects/:id/prompts/:promptId)
  → Full prompt + response display
  → Metadata: date, type, target, output mode
  → "Regenerate" button (re-opens generator with same config)
  → "Copy" actions
```

## 4.11 Export Flows

```
Screen 1: Export Center (/projects/:id/export)
  → Step 1: Select Export Type (card/radio)
    - Full GDD
    - Version PRD (select which plan)
    - Individual System (select which system(s))
    - Roadmap Plan
    - Prompt Bundle (select which prompts)

  → Step 2: Select Format
    - Markdown (.md)
    - JSON
    - Clipboard

  → Step 3: Preview
    - Live preview of export output in the preview panel
    - User can scroll/review

  → Step 4: Export
    [Markdown]: click "Download .md" → browser file download
    [JSON]: click "Download .json" → browser file download
    [Clipboard]: click "Copy to Clipboard" → toast "Copied!"

  → Export logged to Export History on the same page
```

---

# 5. Design System Tokens

## 5.1 Color Scheme

**Support both Light and Dark modes** (with system preference detection).

This is a tool for developers who work in dark environments (game dev, AI tooling). Dark mode is the **default** theme.

### Base Palette (CSS Custom Properties via Tailwind + Shadcn)

```
// Background layers
--background:           Dark: hsl(224, 20%, 6%)      Light: hsl(0, 0%, 100%)
--background-secondary: Dark: hsl(224, 18%, 10%)     Light: hsl(220, 14%, 96%)
--background-tertiary:  Dark: hsl(224, 16%, 14%)     Light: hsl(220, 13%, 91%)

// Foreground
--foreground:           Dark: hsl(210, 40%, 96%)     Light: hsl(224, 20%, 10%)
--foreground-muted:     Dark: hsl(215, 20%, 55%)     Light: hsl(215, 16%, 47%)

// Border
--border:               Dark: hsl(224, 14%, 18%)     Light: hsl(220, 13%, 87%)
--border-focus:         Dark: hsl(213, 94%, 58%)     Light: hsl(213, 94%, 48%)

// Primary (action blue)
--primary:              hsl(213, 94%, 58%)
--primary-hover:        hsl(213, 94%, 52%)
--primary-foreground:   hsl(0, 0%, 100%)

// Accent (creative purple — reflects "synthesis/AI" actions)
--accent:               hsl(262, 80%, 60%)
--accent-hover:         hsl(262, 80%, 54%)
--accent-foreground:    hsl(0, 0%, 100%)
```

### Semantic Color Tokens

#### Entity Status Colors

| Status       | Token                | Color (Dark)          | Color (Light)         | Usage                        |
|--------------|----------------------|-----------------------|-----------------------|------------------------------|
| Draft        | `--status-draft`     | `hsl(45, 93%, 58%)`  | `hsl(45, 93%, 47%)`  | System, Plan status badges   |
| Active       | `--status-active`    | `hsl(142, 71%, 48%)` | `hsl(142, 71%, 40%)` | System, Plan status badges   |
| Deprecated   | `--status-deprecated`| `hsl(215, 14%, 44%)` | `hsl(215, 14%, 55%)` | System status badges         |
| Ideation     | `--status-ideation`  | `hsl(200, 80%, 55%)` | `hsl(200, 80%, 45%)` | Project status               |
| Archived     | `--status-archived`  | `hsl(215, 14%, 34%)` | `hsl(215, 14%, 65%)` | Project status               |
| Finalized    | `--status-finalized` | `hsl(262, 60%, 55%)` | `hsl(262, 60%, 45%)` | Plan status                  |

#### MVP Criticality Colors

| Criticality | Token                  | Color (Dark)            | Color (Light)           | Usage                      |
|-------------|------------------------|-------------------------|-------------------------|----------------------------|
| Core        | `--criticality-core`   | `hsl(0, 72%, 58%)`     | `hsl(0, 72%, 50%)`     | System cards, graph nodes  |
| Important   | `--criticality-important` | `hsl(25, 95%, 55%)`  | `hsl(25, 95%, 48%)`    | System cards, graph nodes  |
| Later       | `--criticality-later`  | `hsl(213, 70%, 55%)`   | `hsl(213, 70%, 48%)`   | System cards, graph nodes  |

#### Feedback Colors

| Feedback   | Token           | Value                   | Usage                        |
|------------|-----------------|-------------------------|------------------------------|
| Success    | `--success`     | `hsl(142, 71%, 48%)`   | Toast, form validation       |
| Warning    | `--warning`     | `hsl(45, 93%, 58%)`    | Scope validation warnings    |
| Error      | `--error`       | `hsl(0, 72%, 58%)`     | Toast, form validation       |
| Info       | `--info`        | `hsl(213, 94%, 58%)`   | Toast, info banners          |

#### Graph-Specific Colors

| Element             | Token                     | Description                              |
|---------------------|---------------------------|------------------------------------------|
| Node fill (Core)    | `--graph-node-core`       | Matches `--criticality-core` at 20% opacity background |
| Node fill (Important)| `--graph-node-important` | Matches `--criticality-important` at 20% opacity       |
| Node fill (Later)   | `--graph-node-later`      | Matches `--criticality-later` at 20% opacity           |
| Node border (Draft) | `--graph-border-draft`    | Dashed, `--status-draft` color           |
| Node border (Active)| `--graph-border-active`   | Solid, `--status-active` color           |
| Edge default        | `--graph-edge`            | `--foreground-muted` at 50% opacity      |
| Edge highlighted    | `--graph-edge-highlight`  | `--primary` full opacity                 |
| Impact cascade      | `--graph-impact`          | `--warning` pulsing glow                 |

## 5.2 Typography

Use the **Inter** font family (available via `next/font/google`). Monospace sections (code, system IDs, markdown) use **JetBrains Mono**.

### Type Scale

| Token    | Size   | Weight   | Line Height | Usage                                  |
|----------|--------|----------|-------------|----------------------------------------|
| `h1`     | 30px   | 700      | 1.2         | Page titles                            |
| `h2`     | 24px   | 600      | 1.25        | Section headers                        |
| `h3`     | 20px   | 600      | 1.3         | Card titles, dialog titles             |
| `h4`     | 16px   | 600      | 1.4         | Sub-section headers                    |
| `body`   | 14px   | 400      | 1.5         | Default body text                      |
| `body-lg`| 16px   | 400      | 1.5         | Emphasized body (descriptions)         |
| `small`  | 12px   | 400      | 1.4         | Captions, timestamps, metadata         |
| `mono`   | 13px   | 400      | 1.5         | System IDs, code, markdown source      |
| `label`  | 13px   | 500      | 1.4         | Form labels, table headers             |
| `badge`  | 11px   | 600      | 1.0         | Badge text (uppercase)                 |

### Tailwind Config Mapping

```ts
// tailwind.config.ts
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
}
```

## 5.3 Spacing & Sizing

### Spacing Scale (Tailwind Default Extended)

| Token   | Value | Usage                                      |
|---------|-------|--------------------------------------------|
| `0.5`   | 2px   | Inline badge padding                       |
| `1`     | 4px   | Icon-text gaps, tight spacing              |
| `1.5`   | 6px   | Badge internal padding                     |
| `2`     | 8px   | Small component padding, card badge margins|
| `3`     | 12px  | Card internal padding (compact)            |
| `4`     | 16px  | Default padding, gap-4 in grids            |
| `5`     | 20px  | Form field spacing                         |
| `6`     | 24px  | Section spacing, content padding desktop   |
| `8`     | 32px  | Page section gaps                          |
| `10`    | 40px  | Large section separators                   |
| `12`    | 48px  | Page top/bottom margins                    |
| `16`    | 64px  | Top bar height, sidebar collapsed width    |

### Component Sizing

| Component        | Dimensions                                         |
|------------------|----------------------------------------------------|
| Top bar          | Height: 64px (h-16)                                |
| Sidebar expanded | Width: 256px (w-64)                                |
| Sidebar collapsed| Width: 64px (w-16)                                 |
| Card minimum     | Width: 280px; Height: auto                         |
| Card grid columns| `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |
| Dialog small     | max-w-md (448px)                                   |
| Dialog medium    | max-w-lg (512px)                                   |
| Dialog large     | max-w-2xl (672px)                                  |
| Dialog full      | max-w-4xl (896px) — used for merge/split/evolution |
| Drawer           | Width: 480px (w-[480px]) on desktop, full on mobile|
| Graph canvas     | Full content area minus any open panels             |

### Border Radius Scale

| Token        | Value | Usage                              |
|--------------|-------|------------------------------------|
| `rounded-sm` | 4px   | Badges, small pills                |
| `rounded-md` | 6px   | Buttons, inputs                    |
| `rounded-lg` | 8px   | Cards, dialogs                     |
| `rounded-xl` | 12px  | Large cards, panels                |

## 5.4 Shadows (Dark Mode Adapted)

Dark mode uses subtle border-glow instead of traditional drop shadows:

| Token          | Dark Mode                                    | Light Mode                              |
|----------------|----------------------------------------------|-----------------------------------------|
| `shadow-sm`    | `0 0 0 1px hsl(224 14% 20%)`               | `0 1px 2px rgba(0,0,0,0.05)`           |
| `shadow-md`    | `0 0 0 1px hsl(224 14% 18%), 0 4px 12px rgba(0,0,0,0.3)` | `0 4px 6px rgba(0,0,0,0.07)` |
| `shadow-lg`    | `0 0 0 1px hsl(224 14% 18%), 0 8px 24px rgba(0,0,0,0.5)` | `0 10px 15px rgba(0,0,0,0.1)` |

## 5.5 Animation & Transitions

| Property          | Value                      | Usage                                |
|-------------------|----------------------------|--------------------------------------|
| Default duration  | `150ms`                    | Hovers, active states                |
| Medium duration   | `200ms`                    | Drawer open/close, panel slides      |
| Long duration     | `300ms`                    | Page transitions, modal open/close   |
| Easing            | `ease-in-out`              | All transitions                      |
| Graph animation   | `300ms ease-out`           | Node/edge additions, layout changes  |
| Streaming text    | Character-by-character, 10ms delay | AI response streaming display  |
| Skeleton pulse    | `2s ease-in-out infinite`  | Loading skeletons                    |

## 5.6 Custom Shadcn Component Extensions

The following Shadcn components need custom extensions or compositions:

| Base Component        | Extension Name          | Modifications                                               |
|-----------------------|-------------------------|-------------------------------------------------------------|
| `Card`                | `SystemCard`            | Add status badge slot, criticality border-left accent, dependency count footer |
| `Card`                | `ProjectCard`           | Add genre badge, stats row, status dot indicator            |
| `Card`                | `PlanCard`              | Add version label prominence, phase count, system count     |
| `Badge`               | `StatusBadge`           | Custom color variants for Draft/Active/Deprecated/Finalized |
| `Badge`               | `CriticalityBadge`     | Custom color variants for Core/Important/Later              |
| `Sheet` (Drawer)      | `FormDrawer`            | Right-side drawer with form layout, save/cancel footer      |
| `AlertDialog`         | `ConfirmDialog`         | Standardized confirm/cancel pattern with danger variant     |
| `Tabs`                | `ViewToggleTabs`        | Icon-only tabs for Grid/Table view switching                |
| `Textarea`            | `MarkdownTextarea`      | Extended with toolbar (bold, italic, headings, lists, code) |
| `Select`              | `MultiSelect`           | Multi-value select with pills (for dependencies, systems)   |
| `Command`             | `TagInput`              | Combobox-style tag input with create-on-enter               |
| `Sonner` (Toast)      | `AppToast`              | Styled variants for success/error/warning/info              |
| `ResizablePanelGroup` | `SplitPane`             | For markdown editor + preview, evolution side-by-side       |
| `Skeleton`            | `CardSkeleton`          | Pre-shaped skeleton matching card layouts                   |
| `Skeleton`            | `TableSkeleton`         | Pre-shaped skeleton matching table layouts                  |

## 5.7 Iconography

Use **Lucide React** icons (bundled with Shadcn). Key icon assignments:

| Concept          | Icon Name              |
|------------------|------------------------|
| Overview         | `LayoutDashboard`      |
| Brainstorms      | `MessageSquare`        |
| Systems          | `Boxes`                |
| Dependencies     | `GitBranch`            |
| Versions         | `Milestone`            |
| Prompts          | `Sparkles`             |
| Export           | `Download`             |
| Settings         | `Settings`             |
| Create/Add       | `Plus`                 |
| Edit             | `Pencil`               |
| Delete           | `Trash2`               |
| Archive          | `Archive`              |
| Search           | `Search`               |
| Filter           | `Filter`               |
| Sort             | `ArrowUpDown`          |
| Expand           | `ChevronDown`          |
| Collapse         | `ChevronUp`            |
| Close            | `X`                    |
| Copy             | `Copy`                 |
| Check/Accept     | `Check`                |
| Reject           | `X`                    |
| Warning          | `AlertTriangle`        |
| Info             | `Info`                 |
| AI/Synthesize    | `Sparkles`             |
| Merge            | `Merge`                |
| Split            | `Split`                |
| Evolution        | `RefreshCw`            |
| Impact           | `Zap`                  |
| Drag handle      | `GripVertical`         |
| External link    | `ExternalLink`         |
| Clock/History    | `Clock`                |
| File             | `FileText`             |
| Upload           | `Upload`               |
| Grid view        | `LayoutGrid`           |
| Table view       | `List`                 |
| Zoom in          | `ZoomIn`               |
| Zoom out         | `ZoomOut`              |
| Fit to screen    | `Maximize2`            |

## 5.8 Third-Party Library Recommendations

| Purpose                   | Library                   | Rationale                                      |
|---------------------------|---------------------------|------------------------------------------------|
| Dependency graph viz      | `@xyflow/react` (React Flow) | Best-in-class interactive DAG for React     |
| Markdown editing          | `@uiw/react-md-editor` or custom with `textarea` + toolbar | Lightweight, customizable |
| Markdown rendering        | `react-markdown` + `remark-gfm` | Server-compatible, extensible             |
| Syntax highlighting       | `rehype-highlight` or `shiki` | For code blocks in markdown previews       |
| Drag and drop (phases)    | `@dnd-kit/core` + `@dnd-kit/sortable` | Accessible, performant DnD            |
| Diff viewing              | `react-diff-viewer-continued` | Side-by-side and unified diffs            |
| File download             | Native `Blob` + `URL.createObjectURL` | No library needed                   |
| Search params state       | `nuqs`                    | As specified in engineering guidelines         |
| AI streaming              | `ai` (Vercel AI SDK)     | StreamingTextResponse, useChat, useCompletion  |
| Date formatting           | `date-fns`               | Lightweight, tree-shakeable                     |
| Schema validation         | `zod`                    | As specified in engineering guidelines          |
| Toast notifications       | `sonner`                 | Bundled with Shadcn                             |

---

# Appendix A: File-to-Route Mapping

```
app/
├── layout.tsx                                    → AppShell (TopBar)
├── page.tsx                                      → Dashboard
├── loading.tsx                                   → Dashboard skeleton
├── not-found.tsx                                 → 404 page
├── new/
│   └── page.tsx                                  → New Project form
├── projects/
│   └── [projectId]/
│       ├── layout.tsx                            → ProjectShell (Sidebar + TopBar)
│       ├── page.tsx                              → Redirect → overview
│       ├── loading.tsx                           → Project skeleton
│       ├── not-found.tsx                         → Project 404
│       ├── overview/
│       │   └── page.tsx                          → Project Overview
│       ├── brainstorms/
│       │   ├── page.tsx                          → Brainstorm list
│       │   ├── new/
│       │   │   └── page.tsx                      → New Brainstorm
│       │   └── [sessionId]/
│       │       ├── page.tsx                      → View Brainstorm
│       │       └── synthesize/
│       │           └── page.tsx                  → Synthesize Wizard
│       ├── systems/
│       │   ├── page.tsx                          → Systems list
│       │   ├── new/
│       │   │   └── page.tsx                      → New System
│       │   └── [systemId]/
│       │       ├── page.tsx                      → View/Edit System
│       │       ├── history/
│       │       │   └── page.tsx                  → System History
│       │       └── evolve/
│       │           └── page.tsx                  → System Evolution
│       ├── dependencies/
│       │   └── page.tsx                          → Dependency Graph
│       ├── versions/
│       │   ├── page.tsx                          → Version Plans list
│       │   ├── new/
│       │   │   └── page.tsx                      → New Version Plan
│       │   └── [planId]/
│       │       ├── page.tsx                      → View Version Plan
│       │       └── edit/
│       │           └── page.tsx                  → Edit Version Plan
│       ├── prompts/
│       │   ├── page.tsx                          → Prompt History
│       │   ├── new/
│       │   │   └── page.tsx                      → Prompt Generator
│       │   └── [promptId]/
│       │       └── page.tsx                      → View Prompt
│       └── export/
│           └── page.tsx                          → Export Center
└── settings/
    └── page.tsx                                  → App Settings
```

---

# Appendix B: Zustand Store Slices

Client-side state should be minimal. The following Zustand slices are anticipated:

| Store Slice         | Purpose                                               | Key State                              |
|---------------------|-------------------------------------------------------|----------------------------------------|
| `uiStore`           | Global UI preferences                                 | `sidebarCollapsed`, `theme`, `viewMode` (grid/table) |
| `graphStore`        | Dependency graph interaction state                    | `selectedNodeId`, `impactMode`, `layoutMode`, `zoom` |
| `synthesizeStore`   | Synthesize wizard transient state                     | `currentStep`, `config`, `streamingOutput`, `extractedSystems` |
| `versionBuilderStore` | Version plan builder transient state               | `selectedSystems`, `exclusions`, `phases`, `validation` |

All persistent data (projects, systems, brainstorms, plans, prompts) lives server-side and is fetched via Server Components or Server Actions. Zustand stores hold only ephemeral UI state.

---

# Appendix C: Accessibility Checklist

| Requirement                           | Implementation                                       |
|---------------------------------------|------------------------------------------------------|
| Keyboard navigation                   | All interactive elements focusable + activatable     |
| Focus visible                         | `ring-2 ring-offset-2 ring-primary` focus styles     |
| Screen reader labels                  | `aria-label` on icon-only buttons                    |
| Graph accessibility                   | Provide table-based alternative view of dependencies |
| Color contrast                        | All text meets WCAG AA (4.5:1 normal, 3:1 large)    |
| Reduced motion                        | `prefers-reduced-motion` disables graph animations   |
| Form errors                           | `aria-invalid` + `aria-describedby` for error text   |
| Dialog focus trap                     | Radix handles via Shadcn AlertDialog/Dialog          |
| Skip navigation                       | Skip-to-content link on app shell                    |
| Status announcements                  | `aria-live="polite"` for toast notifications         |
