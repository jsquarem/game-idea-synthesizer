# Frontend Architecture Specification

**Product:** GamePlan AI  
**Version:** v1.1  
**Status:** Draft  
**Last Updated:** 2026-02-18  
**Implementation refs:** `plans/ui-implementation-spec.md`, `plans/collab-implementation-spec.md` (Idea Stream)

---

## Table of Contents

1. [Route Structure](#1-route-structure)
2. [Component Inventory](#2-component-inventory)
3. [State Management Strategy](#3-state-management-strategy)
4. [Data Flow Patterns](#4-data-flow-patterns)
5. [Markdown Handling](#5-markdown-handling)
6. [Dependency Graph Visualization](#6-dependency-graph-visualization)
7. [Key Technical Decisions](#7-key-technical-decisions)

---

# 1. Route Structure

## 1.1 Complete File Tree

```
app/
├── layout.tsx                          # Root layout (Server) — html/body, font, ThemeProvider shell
├── page.tsx                            # Landing / dashboard redirect (Server)
├── loading.tsx                         # Root loading skeleton
├── error.tsx                           # Root error boundary (Client — required by Next.js)
├── not-found.tsx                       # Root 404 (Server)
├── globals.css                         # Tailwind base + Shadcn CSS variables
│
├── (marketing)/
│   ├── layout.tsx                      # Marketing layout (Server) — minimal nav, no sidebar
│   └── page.tsx                        # Public landing page (Server)
│
├── (app)/
│   ├── layout.tsx                      # App layout (Server) — top bar only; no sidebar here
│   ├── loading.tsx                     # App-level loading skeleton
│   ├── error.tsx                       # App-level error boundary (Client)
│   │
│   ├── dashboard/
│   │   └── page.tsx                    # Project list / recent activity (Server)
│   │
│   ├── projects/
│   │   ├── new/
│   │   │   └── page.tsx               # Create project form (Server + Server Action)
│   │   │
│   │   └── [projectId]/
│   │       ├── layout.tsx             # Project-scoped layout (Server) — ProjectSidebar + content
│   │       ├── loading.tsx            # Project loading skeleton
│   │       ├── error.tsx              # Project error boundary (Client)
│   │       ├── not-found.tsx          # Project 404 (Server)
│   │       │
│   │       ├── brainstorms/
│   │       │   ├── page.tsx           # Brainstorm session list (Server)
│   │       │   ├── new/
│   │       │   │   └── page.tsx       # New brainstorm session (Server + Server Action)
│   │       │   └── [sessionId]/
│   │       │       ├── page.tsx       # Redirect to synthesize (Server)
│   │       │       ├── not-found.tsx  # Session 404
│   │       │       └── synthesize/
│   │       │           └── page.tsx   # Synthesis review page (Server + Client island)
│   │       │
│   │       ├── systems/
│   │       │   ├── page.tsx           # All systems list (Server)
│   │       │   ├── new/
│   │       │   │   └── page.tsx       # Create system (Server + Server Action)
│   │       │   └── [systemId]/
│   │       │       ├── page.tsx       # System detail — structured + markdown toggle (Server + Client island)
│   │       │       ├── loading.tsx    # System loading
│   │       │       ├── not-found.tsx  # System 404
│   │       │       └── edit/
│   │       │           └── page.tsx   # System editor (Server shell + Client editor)
│   │       │
│   │       ├── dependencies/
│   │       │   └── page.tsx           # Full dependency graph view (Server shell + Client graph)
│   │       │
│   │       ├── idea-stream/
│   │       │   ├── page.tsx           # Idea Stream 2-panel (Server shell + Client content)
│   │       │   ├── loading.tsx        # Idea Stream loading skeleton
│   │       │   └── idea-stream-content.tsx  # Client: thread list, messages, polling
│   │       │
│   │       ├── versions/
│   │       │   ├── page.tsx           # Version plan list (Server)
│   │       │   ├── new/
│   │       │   │   └── page.tsx       # Generate version plan (Server + Client form)
│   │       │   └── [versionId]/
│   │       │       ├── page.tsx       # Version plan detail (Server)
│   │       │       └── not-found.tsx  # Version 404
│   │       │
│   │       ├── prompts/
│   │       │   ├── page.tsx           # Prompt history list (Server)
│   │       │   └── [promptId]/
│   │       │       └── page.tsx       # Prompt + response detail (Server)
│   │       │
│   │       └── export/
│   │           └── page.tsx           # Export hub — choose format + scope (Server + Client form)
│   │
│   └── settings/
│       ├── layout.tsx                 # Container padding (px-4 py-6 md:px-6 lg:px-8, max-w-7xl)
│       ├── page.tsx                  # Settings — Profile, Workspace, Prototype cards (Server + Client forms)
│       └── loading.tsx               # Settings loading skeleton
```

## 1.2 Route Group Rationale

| Group | Purpose | Layout |
|-------|---------|--------|
| `(marketing)` | Public pages, no auth context, minimal chrome | Minimal nav, centered content |
| `(app)` | Authenticated app shell | Top bar only; sidebar only inside project context (`/projects/[projectId]/*`) |

## 1.3 Server vs Client Classification by Page

| Route | Rendering | Rationale |
|-------|-----------|-----------|
| `(app)/dashboard/page.tsx` | **Server** | Fetches project list; optional client for search/filter |
| `(app)/projects/new/page.tsx` | **Server** with Server Action | Progressive form, no client JS needed |
| `(app)/projects/[projectId]/overview/page.tsx` | **Server** | Read-only project overview |
| `(app)/projects/[projectId]/brainstorms/page.tsx` | **Server** | List page |
| `(app)/projects/[projectId]/brainstorms/new/page.tsx` | **Server** with Server Action | New brainstorm form: title (default "Brainstorm - datetime"), content, tags; author from current user |
| `(app)/projects/[projectId]/brainstorms/[sessionId]/page.tsx` | **Server** | Redirect to synthesize |
| `(app)/projects/[projectId]/brainstorms/[sessionId]/synthesize/page.tsx` | **Server** shell + **Client** island | AI streaming response requires client interactivity |
| `(app)/projects/[projectId]/systems/page.tsx` | **Server** | List + filter via URL params |
| `(app)/projects/[projectId]/systems/new/page.tsx` | **Server** with Server Action | Structured form |
| `(app)/projects/[projectId]/systems/[systemId]/page.tsx` | **Server** shell + **Client** toggle | Markdown/structured toggle is interactive |
| `(app)/projects/[projectId]/systems/[systemId]/edit/page.tsx` | **Server** shell + **Client** editor | Editor requires full client interactivity |
| `(app)/projects/[projectId]/dependencies/page.tsx` | **Server** shell + **Client** graph | Graph visualization is entirely client-rendered |
| `(app)/projects/[projectId]/idea-stream/page.tsx` | **Server** shell + **Client** content | Idea Stream: thread list, messages, reply/edit/delete, finalize → brainstorm (client island; polling) |
| `(app)/projects/[projectId]/activity/page.tsx` | **Server** + **Client** list | Full project activity history (thread activity, Load more) |
| `(app)/projects/[projectId]/versions/page.tsx` | **Server** | List page |
| `(app)/projects/[projectId]/versions/new/page.tsx` | **Server** shell + **Client** form | System selection checkboxes, AI generation |
| `(app)/projects/[projectId]/versions/[versionId]/page.tsx` | **Server** | Read-only immutable snapshot |
| `(app)/projects/[projectId]/prompts/page.tsx` | **Server** | List page |
| `(app)/projects/[projectId]/prompts/[promptId]/page.tsx` | **Server** | Read-only prompt + response |
| `(app)/projects/[projectId]/export/page.tsx` | **Server** shell + **Client** form | Format selection, download triggers |
| `(app)/settings/page.tsx` | **Server** shell + **Client** form | Three cards: Profile (avatar, display name), Workspace (members, AI provider config), Prototype (active-user selector + “Use this user in this browser” button, create-user form); container padding via settings layout |

## 1.4 Dynamic Segments

| Segment | Type | Validation |
|---------|------|------------|
| `[projectId]` | `string` (CUID2) | Validated in layout, triggers `notFound()` |
| `[sessionId]` | `string` (CUID2) | Validated in page |
| `[systemId]` | `string` (slug, e.g. `combat-system`) | Validated in page |
| `[versionId]` | `string` (CUID2) | Validated in page |
| `[promptId]` | `string` (CUID2) | Validated in page |

---

# 2. Component Inventory

## 2.1 Shadcn UI Primitives (`components/ui/`)

Every component below is installed via `npx shadcn@latest add <name>`:

| Component | Usage |
|-----------|-------|
| `button` | Primary actions, form submits, navigation |
| `input` | Text inputs across all forms |
| `textarea` | Brainstorm paste, markdown editing, notes |
| `label` | Form field labels |
| `select` | Status dropdowns, genre selection, export format |
| `checkbox` | System selection in version plans, bulk actions |
| `radio-group` | MVP criticality selection, prompt mode |
| `switch` | Markdown/structured toggle, settings booleans |
| `dialog` | Confirmations, quick-create modals |
| `sheet` | Mobile sidebar, system quick-view |
| `dropdown-menu` | Context menus, action menus on cards |
| `command` | Command palette (Cmd+K) for navigation |
| `popover` | Tooltips, mini previews |
| `tooltip` | Icon button labels, graph node info |
| `tabs` | Project sub-navigation, view mode switching |
| `card` | Project cards, system cards, session cards |
| `badge` | Status indicators, tags, MVP criticality |
| `separator` | Visual dividers |
| `skeleton` | Loading states for all data-driven sections |
| `scroll-area` | Scrollable panels (system list, markdown preview) |
| `toast` | Success/error notifications via `sonner` |
| `alert` | Inline warnings, validation errors |
| `alert-dialog` | Destructive action confirmations (delete project/system) |
| `avatar` | User/author indicators |
| `breadcrumb` | Navigation breadcrumbs in app shell |
| `collapsible` | Sidebar sections, expandable system details |
| `form` | React Hook Form integration wrapper |
| `progress` | AI synthesis progress indicator |
| `resizable` | Split pane for editor + preview |
| `table` | Version plan phases, prompt history |
| `accordion` | System section expand/collapse in detail view |

**Total: 34 Shadcn components**

## 2.2 Shared App Components (`components/`)

### Layout Components

#### `components/top-bar.tsx` — **Server**
App-level top bar: logo (link to dashboard), breadcrumbs, settings and user (avatar) links.

```ts
// No props — Breadcrumbs component reads pathname
```
Rendered from `(app)/layout.tsx`. No sidebar at app level.

#### `components/project-sidebar.tsx` — **Client**
Collapsible sidebar shown only inside project context (`/projects/[projectId]/*`). Width 256px expanded, 64px collapsed (persisted in localStorage).

```ts
interface ProjectSidebarProps {
  projectId: string
}
```
Nav items: Overview, Activity, Brainstorms, Idea Stream, Systems, Dependencies, Versions, Prompts, Export. Uses `usePathname()` for active state. Mobile: Sheet drawer with hamburger trigger.

#### `components/breadcrumbs.tsx` — **Client**
Breadcrumbs derived from pathname; project segment shows project name (from ProjectBreadcrumbContext set by project layout) and links to overview.
Dynamic breadcrumb trail from URL segments (e.g. Projects > Project Name > Section).

#### `components/command-palette.tsx` — **Client** (optional)
Global Cmd+K command palette for quick navigation. Uses Shadcn `Command`.

### Project Components

#### `components/project-card.tsx` — **Server**
Card displaying project summary in list views.

```ts
interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string
    genre: string
    status: 'ideation' | 'active' | 'archived'
    systemCount: number
    updatedAt: Date
  }
}
```

#### `components/project-status-badge.tsx` — **Server**
Badge showing project status with color coding.

```ts
interface ProjectStatusBadgeProps {
  status: 'ideation' | 'active' | 'archived'
}
```

### Brainstorm Components

#### `components/brainstorm-input.tsx` — **Client**
Large textarea for pasting Discord threads or freeform text.

```ts
interface BrainstormInputProps {
  projectId: string
  onSubmitAction: (formData: FormData) => Promise<ActionResult>
}
```
Supports drag-and-drop `.md` file upload. Character count display.

#### `components/brainstorm-message-list.tsx` — **Server**
Renders parsed brainstorm messages in a chat-like timeline.

```ts
interface BrainstormMessageListProps {
  messages: Array<{
    author: string
    content: string
    timestamp: Date
    tags?: string[]
  }>
}
```

### Idea Stream Components (see `plans/collab-implementation-spec.md`)

#### `app/(app)/projects/[projectId]/idea-stream/idea-stream-content.tsx` — **Client**
Two-panel Idea Stream: thread list (left), active thread messages + composer (right). Polling every 2s for threads and messages; Server Actions for create thread, post message, edit/delete message, mark read, finalize → brainstorm.

```ts
interface IdeaStreamContentProps {
  projectId: string
}
```
State: `activeThreadId`, `selectedThreadIds`, `replyToMessageId`, draft content; server as source of truth. Uses `/api/me` and `/api/projects/[projectId]/idea-stream/threads` (and thread messages) for data; `app/actions/idea-stream.actions.ts` for mutations.

### System Components

#### `components/system-card.tsx` — **Server**
Card for system list views with status, criticality badge.

```ts
interface SystemCardProps {
  system: {
    id: string
    slug: string
    name: string
    status: 'draft' | 'active' | 'deprecated'
    mvpCriticality: 'core' | 'important' | 'later'
    version: string
    dependencyCount: number
  }
}
```

#### `components/system-structured-view.tsx` — **Server**
Renders a game system in structured form view (read-only).

```ts
interface SystemStructuredViewProps {
  system: GameSystem  // see types below
}
```

#### `components/system-markdown-view.tsx` — **Client**
Renders system markdown with syntax highlighting.

```ts
interface SystemMarkdownViewProps {
  markdown: string
}
```

#### `components/system-view-toggle.tsx` — **Client**
Toggle switch between structured and markdown views.

```ts
interface SystemViewToggleProps {
  mode: 'structured' | 'markdown'
  onModeChange: (mode: 'structured' | 'markdown') => void
}
```

#### `components/system-form.tsx` — **Client**
Full structured form for creating/editing a game system. Maps 1:1 to the System Markdown Schema (PRD Section 7).

```ts
interface SystemFormProps {
  projectId: string
  initialData?: Partial<GameSystem>
  submitAction: (formData: FormData) => Promise<ActionResult>
  mode: 'create' | 'edit'
}
```
Fields map to every section in the system markdown schema.

#### `components/system-dependency-select.tsx` — **Client**
Multi-select for choosing system dependencies from available systems.

```ts
interface SystemDependencySelectProps {
  projectId: string
  currentSystemId?: string
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  availableSystems: Array<{ id: string; name: string; slug: string }>
}
```

#### `components/mvp-criticality-selector.tsx` — **Client**
Radio group for Core / Important / Later selection.

```ts
interface MvpCriticalitySelectorProps {
  value: 'core' | 'important' | 'later'
  onChange: (value: 'core' | 'important' | 'later') => void
}
```

### Markdown Components

#### `components/markdown-editor.tsx` — **Client**
The primary markdown editor component. Wraps CodeMirror.

```ts
interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  readOnly?: boolean
}
```

#### `components/markdown-preview.tsx` — **Client**
Renders markdown to styled HTML using remark/rehype.

```ts
interface MarkdownPreviewProps {
  content: string
  className?: string
}
```

#### `components/markdown-split-editor.tsx` — **Client**
Side-by-side editor + preview using Shadcn Resizable panels.

```ts
interface MarkdownSplitEditorProps {
  value: string
  onChange: (value: string) => void
}
```

### Dependency Graph Components

#### `components/dependency-graph.tsx` — **Client**
Full interactive dependency graph visualization.

```ts
interface DependencyGraphProps {
  systems: Array<{
    id: string
    slug: string
    name: string
    status: 'draft' | 'active' | 'deprecated'
    mvpCriticality: 'core' | 'important' | 'later'
  }>
  edges: Array<{
    source: string  // system slug
    target: string  // system slug
  }>
  onNodeClick?: (systemId: string) => void
  onEdgeAdd?: (source: string, target: string) => void
  onEdgeRemove?: (source: string, target: string) => void
  selectedNodeId?: string | null
  highlightPath?: string[]  // slugs to highlight
}
```

#### `components/dependency-graph-controls.tsx` — **Client**
Toolbar for graph interactions: zoom, fit, layout, filter.

```ts
interface DependencyGraphControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onLayoutChange: (layout: 'dagre' | 'force' | 'tree') => void
  currentLayout: string
  onFilterChange: (filter: { criticality?: string; status?: string }) => void
}
```

#### `components/dependency-graph-node.tsx` — **Client**
Custom node renderer for the graph.

```ts
interface DependencyGraphNodeProps {
  data: {
    label: string
    status: string
    mvpCriticality: string
    dependencyCount: number
    isSelected: boolean
    isHighlighted: boolean
  }
}
```

### Version Plan Components

#### `components/version-plan-card.tsx` — **Server**
Card for version plan list views.

```ts
interface VersionPlanCardProps {
  plan: {
    id: string
    name: string  // e.g. "v1.0"
    systemCount: number
    phaseCount: number
    createdAt: Date
  }
}
```

#### `components/version-system-selector.tsx` — **Client**
Checkbox grid for selecting which systems to include in a version.

```ts
interface VersionSystemSelectorProps {
  systems: Array<{
    id: string
    name: string
    slug: string
    mvpCriticality: 'core' | 'important' | 'later'
    dependencies: string[]
  }>
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}
```
Shows dependency warnings if a selected system's dependency is not selected.

#### `components/version-phase-timeline.tsx` — **Server**
Visual timeline of development phases within a version plan.

```ts
interface VersionPhaseTimelineProps {
  phases: Array<{
    name: string
    systems: string[]
    milestones: string[]
    order: number
  }>
}
```

#### `components/version-plan-detail.tsx` — **Server**
Full read-only render of a version plan.

```ts
interface VersionPlanDetailProps {
  plan: VersionPlan  // see types below
}
```

### Prompt Components

#### `components/prompt-generator-form.tsx` — **Client**
Form to configure and generate a prompt.

```ts
interface PromptGeneratorFormProps {
  projectId: string
  targetType: 'system' | 'version-plan'
  targetId: string
  onGenerate: (config: PromptConfig) => void
}
```

#### `components/prompt-result-view.tsx` — **Server**
Displays generated prompt text and AI response.

```ts
interface PromptResultViewProps {
  prompt: {
    id: string
    input: string
    output: string
    model: string
    createdAt: Date
    mode: 'raw' | 'structured' | 'bundle'
  }
}
```

#### `components/prompt-copy-button.tsx` — **Client**
Copy-to-clipboard button with toast feedback.

```ts
interface PromptCopyButtonProps {
  content: string
  label?: string
}
```

### Export Components

#### `components/export-format-selector.tsx` — **Client**
Radio/card selection for export format.

```ts
interface ExportFormatSelectorProps {
  value: 'markdown' | 'json' | 'clipboard'
  onChange: (format: 'markdown' | 'json' | 'clipboard') => void
}
```

#### `components/export-scope-selector.tsx` — **Client**
Selects what to export: full GDD, version PRD, individual system, etc.

```ts
interface ExportScopeSelectorProps {
  projectId: string
  value: ExportScope
  onChange: (scope: ExportScope) => void
  systems: Array<{ id: string; name: string }>
  versions: Array<{ id: string; name: string }>
}
```

### Synthesis Components

#### `components/synthesis-progress.tsx` — **Client**
Shows AI synthesis progress with streaming text output.

```ts
interface SynthesisProgressProps {
  status: 'idle' | 'synthesizing' | 'complete' | 'error'
  streamedText: string
  onCancel: () => void
}
```

#### `components/synthesis-review.tsx` — **Client**
Review extracted systems from a synthesis before confirming.

```ts
interface SynthesisReviewProps {
  extractedSystems: Array<Partial<GameSystem>>
  onAccept: (systemIds: string[]) => void
  onEdit: (index: number, system: Partial<GameSystem>) => void
  onReject: (index: number) => void
}
```

### Shared Utility Components

#### `components/empty-state.tsx` — **Server**
Reusable empty state with icon, title, description, CTA.

```ts
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; href: string }
}
```

#### `components/confirm-dialog.tsx` — **Client**
Reusable confirmation dialog for destructive actions.

```ts
interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

#### `components/status-badge.tsx` — **Server**
Generic status badge with configurable color map.

```ts
interface StatusBadgeProps {
  status: string
  colorMap?: Record<string, string>
}
```

#### `components/page-header.tsx` — **Server**
Consistent page header with title, description, and actions slot.

```ts
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}
```

#### `components/data-table.tsx` — **Client**
Reusable sortable, filterable table built on Shadcn Table + TanStack Table.

```ts
interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  searchKey?: string
  filterOptions?: Record<string, string[]>
}
```

## 2.3 Route-Colocated Components

| Route | Local Components |
|-------|-----------------|
| `projects/[projectId]/brainstorms/[sessionId]/synthesize/` | `_components/synthesis-stream.tsx` (Client) — handles SSE/streaming from AI |
| `projects/[projectId]/idea-stream/` | `idea-stream-content.tsx` (Client) — thread list, messages, composer, polling, finalize |
| `projects/[projectId]/systems/[systemId]/` | `_components/system-tab-content.tsx` (Client) — manages structured/markdown tab state |
| `projects/[projectId]/systems/[systemId]/edit/` | `_components/system-edit-form.tsx` (Client) — wraps form + editor with unsaved changes tracking |
| `projects/[projectId]/dependencies/` | `_components/graph-panel.tsx` (Client) — wraps graph + sidebar detail panel |
| `projects/[projectId]/versions/new/` | `_components/version-wizard.tsx` (Client) — multi-step version plan creation wizard |
| `projects/[projectId]/export/` | `_components/export-preview.tsx` (Client) — live preview of export output |
| `settings/` | `settings-switch-user-select.tsx` (Client) — prototype: select user + “Use this user in this browser” button; `settings-create-user-form.tsx` (Client) — prototype: create new user by name; `settings-display-name-form.tsx` (Client) — display name for Idea Stream / profile; `settings-workspace-members-form.tsx` in Workspace card |

---

# 3. State Management Strategy

## 3.1 Zustand Stores

### `store/ui-store.ts` — UI State

```ts
interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}
```

### `store/graph-store.ts` — Dependency Graph Interaction State

```ts
interface GraphState {
  // Viewport
  zoom: number
  panX: number
  panY: number

  // Selection
  selectedNodeId: string | null
  highlightedPath: string[]

  // Layout
  layoutAlgorithm: 'dagre' | 'force' | 'tree'

  // Filters
  criticalityFilter: ('core' | 'important' | 'later')[]
  statusFilter: ('draft' | 'active' | 'deprecated')[]

  // Edge editing
  isEdgeEditMode: boolean
  pendingEdgeSource: string | null

  // Actions
  selectNode: (id: string | null) => void
  highlightDependencyPath: (nodeId: string) => void
  clearHighlight: () => void
  setLayout: (layout: 'dagre' | 'force' | 'tree') => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  toggleEdgeEditMode: () => void
  setPendingEdgeSource: (id: string | null) => void
  setCriticalityFilter: (values: string[]) => void
  setStatusFilter: (values: string[]) => void
  resetFilters: () => void
}
```

### `store/editor-store.ts` — Markdown Editor State

```ts
interface EditorState {
  // Content tracking
  hasUnsavedChanges: boolean
  lastSavedContent: string

  // View mode
  viewMode: 'structured' | 'markdown' | 'split'
  setViewMode: (mode: 'structured' | 'markdown' | 'split') => void

  // Dirty tracking
  setHasUnsavedChanges: (dirty: boolean) => void
  setLastSavedContent: (content: string) => void
  resetEditor: () => void
}
```

### `store/synthesis-store.ts` — AI Synthesis State

```ts
interface SynthesisState {
  // Streaming
  status: 'idle' | 'synthesizing' | 'complete' | 'error'
  streamedText: string
  extractedSystems: Array<Partial<GameSystem>>
  error: string | null

  // Actions
  startSynthesis: () => void
  appendStream: (chunk: string) => void
  setExtractedSystems: (systems: Array<Partial<GameSystem>>) => void
  setError: (error: string) => void
  reset: () => void
}
```

## 3.2 Server State (NOT in Zustand)

The following data is **only** fetched in Server Components and passed as props. It is never duplicated into global client state:

| Data | Fetched By | Passed To |
|------|-----------|-----------|
| Project list | `dashboard/page.tsx` | `ProjectCard` |
| Project detail | `[projectId]/layout.tsx` | Layout context, child pages |
| Brainstorm sessions | `brainstorms/page.tsx` | `BrainstormMessageList` |
| System list | `systems/page.tsx` | `SystemCard` list |
| System detail | `[systemId]/page.tsx` | `SystemStructuredView`, `SystemMarkdownView` |
| Dependency edges | `dependencies/page.tsx` | `DependencyGraph` |
| Version plans | `versions/page.tsx` | `VersionPlanCard` list |
| Version detail | `[versionId]/page.tsx` | `VersionPlanDetail` |
| Prompt history | `prompts/page.tsx` | `DataTable` |
| Prompt detail | `[promptId]/page.tsx` | `PromptResultView` |
| Idea Stream threads/messages | Client fetch from API routes | `IdeaStreamContent` (polling); not in global state |

## 3.3 URL State via `nuqs`

| Page | Search Params | Purpose |
|------|--------------|---------|
| `projects/page.tsx` | `?status=active&q=search` | Filter project list |
| `systems/page.tsx` | `?status=draft&criticality=core&q=search&sort=name` | Filter + sort systems |
| `[systemId]/page.tsx` | `?view=structured\|markdown` | Persist view mode in URL |
| `dependencies/page.tsx` | `?selected=combat-system&layout=dagre` | Persist graph selection + layout |
| `versions/page.tsx` | `?q=search` | Search version plans |
| `prompts/page.tsx` | `?type=implementation&q=search` | Filter prompt history |
| `export/page.tsx` | `?scope=full-gdd&format=markdown` | Persist export configuration |

Implementation via `nuqs`:

```ts
// Example: systems/page.tsx
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'

const systemFilters = {
  status: parseAsStringEnum(['draft', 'active', 'deprecated']),
  criticality: parseAsStringEnum(['core', 'important', 'later']),
  q: parseAsString.withDefault(''),
  sort: parseAsStringEnum(['name', 'updated', 'criticality']).withDefault('name'),
}
```

## 3.4 Form State Approach

| Form | Approach | Rationale |
|------|----------|-----------|
| Create project | **Server Action** + native `<form>` | Simple fields, progressive enhancement |
| Create brainstorm | **Server Action** + native `<form>` | Textarea paste, simple |
| Create/edit system (structured) | **react-hook-form** + Zod + Server Action | Complex form with 15+ fields, conditional validation, dependency multi-select |
| Create version plan | **react-hook-form** + Zod + Server Action | Multi-step wizard with system selection |
| Generate prompt | **react-hook-form** + Zod + Server Action | Config form with mode selection |
| Export | **Server Action** | Simple format + scope selection |
| Settings | **Server Action** + native form / **react-hook-form** | Display name (Profile); API key, theme (future) |
| System markdown editor | **Zustand (editor-store)** + Server Action on save | Freeform text, not a traditional form |

---

# 4. Data Flow Patterns

## 4.1 Server Component Data Fetching

All data fetching happens in Server Components through a service layer. Route handlers call services; services call repositories.

**Idea Stream** uses a hybrid approach: **GET** API routes for client polling (e.g. `GET /api/me`, `GET /api/projects/[projectId]/idea-stream/threads`, `GET .../threads/[threadId]/messages`) and **Server Actions** for all mutations (create thread, post message, edit/delete, mark read, finalize). See `plans/collab-implementation-spec.md`.

```
app/
  [projectId]/systems/page.tsx      ← Server Component (async)
    → lib/services/system-service.ts  ← Business logic
      → lib/repositories/system-repo.ts  ← File/DB I/O
        → reads markdown files from storage
      → lib/parsers/system-parser.ts  ← Markdown → GameSystem object
```

### Service Layer (`lib/services/`)

```ts
// lib/services/project-service.ts
export async function getProjects(filters?: ProjectFilters): Promise<Project[]>
export async function getProject(id: string): Promise<Project | null>
export async function createProject(data: CreateProjectInput): Promise<Project>
export async function updateProject(id: string, data: UpdateProjectInput): Promise<Project>
export async function deleteProject(id: string): Promise<void>

// lib/services/brainstorm-service.ts
export async function getSessions(projectId: string): Promise<BrainstormSession[]>
export async function getSession(projectId: string, sessionId: string): Promise<BrainstormSession | null>
export async function createSession(projectId: string, data: CreateSessionInput): Promise<BrainstormSession>

// lib/services/system-service.ts
export async function getSystems(projectId: string, filters?: SystemFilters): Promise<GameSystem[]>
export async function getSystem(projectId: string, systemId: string): Promise<GameSystem | null>
export async function createSystem(projectId: string, data: CreateSystemInput): Promise<GameSystem>
export async function updateSystem(projectId: string, systemId: string, data: UpdateSystemInput): Promise<GameSystem>
export async function deleteSystem(projectId: string, systemId: string): Promise<void>
export async function getSystemMarkdown(projectId: string, systemId: string): Promise<string>
export async function updateSystemFromMarkdown(projectId: string, systemId: string, markdown: string): Promise<GameSystem>

// lib/services/dependency-service.ts
export async function getDependencyGraph(projectId: string): Promise<DependencyGraph>
export async function addDependency(projectId: string, source: string, target: string): Promise<void>
export async function removeDependency(projectId: string, source: string, target: string): Promise<void>
export async function getImplementationOrder(projectId: string): Promise<string[]>
export async function getImpactAnalysis(projectId: string, systemId: string): Promise<ImpactAnalysis>

// lib/services/version-service.ts
export async function getVersionPlans(projectId: string): Promise<VersionPlan[]>
export async function getVersionPlan(projectId: string, versionId: string): Promise<VersionPlan | null>
export async function generateVersionPlan(projectId: string, config: VersionPlanConfig): Promise<VersionPlan>

// lib/services/prompt-service.ts
export async function getPrompts(projectId: string, filters?: PromptFilters): Promise<PromptRecord[]>
export async function getPrompt(projectId: string, promptId: string): Promise<PromptRecord | null>
export async function generatePrompt(projectId: string, config: PromptConfig): Promise<PromptRecord>

// lib/services/export-service.ts
export async function exportProject(projectId: string, scope: ExportScope, format: ExportFormat): Promise<ExportResult>

// lib/services/synthesis-service.ts
export async function synthesizeBrainstorm(projectId: string, sessionId: string): AsyncGenerator<string>
export async function confirmSynthesis(projectId: string, sessionId: string, systems: Partial<GameSystem>[]): Promise<GameSystem[]>

// lib/services/idea-stream.service.ts (see plans/collab-implementation-spec.md)
export async function ensureUserCanAccessProject(projectId: string, userId: string): Promise<ServiceResult<void>>
export async function createThreadWithFirstMessage(projectId: string, userId: string, content: string, title?: string | null): Promise<ServiceResult<{ thread, message }>>
export async function listThreadsForProject(projectId: string, userId: string, opts?: { cursor?, limit }): Promise<ThreadListItem[]>
export async function listMessages(projectId: string, threadId: string, since?: string): Promise<MessageWithAuthor[]>
export async function finalizeThreadsToBrainstorm(projectId: string, userId: string, threadIds: string[], title?: string): Promise<ServiceResult<{ brainstormSessionId: string }>>
// + postMessage, updateMessageContent, softDeleteMessage, upsertThreadRead
```

### Example Server Component Data Flow

```ts
// app/(app)/projects/[projectId]/systems/page.tsx
import { getSystems } from '@/lib/services/system-service'
import { SystemCard } from '@/components/system-card'

export default async function SystemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ status?: string; criticality?: string; q?: string }>
}) {
  const { projectId } = await params
  const filters = await searchParams
  const systems = await getSystems(projectId, filters)

  return (
    <div>
      <PageHeader title="Systems" actions={<Link href="systems/new">New System</Link>} />
      <SystemFilterBar />  {/* Client component using nuqs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {systems.map(system => (
          <SystemCard key={system.id} system={system} />
        ))}
      </div>
    </div>
  )
}
```

## 4.2 Server Action Mutation Flows

All mutations use Server Actions defined in `lib/actions/`.

### File Structure

```
app/actions/
├── idea-stream.actions.ts   # createThread, postMessage, editMessage, deleteMessage, markRead, finalize
├── user.actions.ts          # updateDisplayName (for Settings / Idea Stream identity)
lib/actions/ or app/actions/
├── project-actions.ts
├── brainstorm-actions.ts
├── system-actions.ts
├── dependency-actions.ts
├── version-actions.ts
├── prompt-actions.ts
└── export-actions.ts
```

### Action Return Type

```ts
// lib/types/actions.ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

### Example: Create System Flow

```ts
// lib/actions/system-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSystem } from '@/lib/services/system-service'

const createSystemSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  purpose: z.string().min(1),
  status: z.enum(['draft', 'active', 'deprecated']),
  mvpCriticality: z.enum(['core', 'important', 'later']),
  // ... all system schema fields
})

export async function createSystemAction(
  projectId: string,
  formData: FormData
): Promise<ActionResult<GameSystem>> {
  const parsed = createSystemSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const system = await createSystem(projectId, parsed.data)
  revalidatePath(`/projects/${projectId}/systems`)
  redirect(`/projects/${projectId}/systems/${system.slug}`)
}
```

### Example: Update System from Markdown

```ts
// lib/actions/system-actions.ts
export async function updateSystemMarkdownAction(
  projectId: string,
  systemId: string,
  markdown: string
): Promise<ActionResult<GameSystem>> {
  // Parser converts markdown → structured object
  // Validates structural integrity
  // Persists both the markdown and derived structured data
  const system = await updateSystemFromMarkdown(projectId, systemId, markdown)
  revalidatePath(`/projects/${projectId}/systems/${systemId}`)
  return { success: true, data: system }
}
```

## 4.3 Optimistic Updates

Optimistic updates are used sparingly, only where perceived latency matters:

| Action | Optimistic Behavior |
|--------|-------------------|
| Toggle dependency edge | Immediately update graph edge visually; revert on error |
| Update MVP criticality | Immediately update badge color; revert on error |
| Delete system | Immediately remove from list with undo toast (5s); commit on timeout |

Implementation via `useOptimistic` from React:

```ts
// In dependency graph Client Component
const [optimisticEdges, addOptimisticEdge] = useOptimistic(
  edges,
  (state, newEdge: Edge) => [...state, newEdge]
)
```

## 4.4 Markdown-as-Canonical Principle in the UI

The core architectural principle: **Markdown is the source of truth. Structured data is derived.**

### Structured Form → Markdown Generation

```
User fills SystemForm (structured fields)
  → Form submit triggers Server Action
  → Server Action calls systemService.createSystem()
  → Service calls systemParser.toMarkdown(structuredData)
  → Repository persists the generated markdown file
  → Parser re-parses markdown → structured object (round-trip validation)
  → Returns structured object to UI
```

### Markdown Editor → Structured Parsing

```
User edits raw markdown in MarkdownEditor
  → On save, triggers Server Action with raw markdown string
  → Server Action calls systemService.updateSystemFromMarkdown()
  → Service calls systemParser.fromMarkdown(markdownString)
  → Parser extracts structured fields from markdown sections
  → Validation: checks required sections present, validates field values
  → Repository persists the markdown file
  → Returns structured object to UI
```

### Parser Layer (`lib/parsers/`)

```ts
// lib/parsers/system-parser.ts
export function toMarkdown(system: GameSystem): string
export function fromMarkdown(markdown: string): GameSystem
export function validateMarkdownStructure(markdown: string): ValidationResult

// lib/parsers/brainstorm-parser.ts
export function parseDiscordThread(raw: string): BrainstormMessage[]
export function parseFreeformText(raw: string): BrainstormMessage[]

// lib/parsers/version-parser.ts
export function toMarkdown(plan: VersionPlan): string
export function fromMarkdown(markdown: string): VersionPlan
```

### Toggle Behavior in the UI

When viewing a system at `systems/[systemId]/page.tsx`:

1. **Default: Structured View** — Server Component renders `SystemStructuredView` with parsed data
2. **User toggles to Markdown** — Client Component switches to `SystemMarkdownView` which renders the raw markdown
3. **URL updates** — `?view=markdown` persisted via `nuqs` so refresh preserves state
4. **Both views reflect the same source** — the markdown file. Structured view is just a parsed render.

When editing at `systems/[systemId]/edit/page.tsx`:

1. **Structured mode**: `SystemForm` with all fields → on save → generates markdown → persists
2. **Markdown mode**: `MarkdownSplitEditor` with raw text → on save → parses to validate → persists
3. **Switching mid-edit**: If user toggles from structured to markdown, the form state is serialized to markdown and loaded into the editor (and vice versa). Unsaved changes warning if content differs.

---

# 5. Markdown Handling

## 5.1 Editor Component

**Library: CodeMirror 6** via `@codemirror/view` and related packages.

Rationale:
- Best-in-class extensibility and performance
- First-class markdown mode with syntax highlighting
- Accessible (ARIA roles, keyboard navigation)
- Supports custom keybindings
- Works well in React via `@uiw/react-codemirror`

NOT using:
- MDX — we're editing pure markdown, not JSX-in-markdown
- Monaco — too heavy for markdown-only editing
- Plain textarea — insufficient for syntax highlighting and user experience

### Editor Setup

```ts
// components/markdown-editor.tsx
'use client'

import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'

export function MarkdownEditor({ value, onChange, ...props }: MarkdownEditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[
        markdown({ base: markdownLanguage }),
        EditorView.lineWrapping,
      ]}
      // Custom theme matching app theme
      // Accessible: proper roles, focusable, keyboard nav
    />
  )
}
```

## 5.2 Preview Rendering

**Pipeline: unified + remark + rehype**

```
markdown string
  → unified()
  → remark-parse          (markdown → mdast)
  → remark-gfm            (GitHub Flavored Markdown)
  → remark-rehype          (mdast → hast)
  → rehype-sanitize        (security: strip dangerous HTML)
  → rehype-highlight       (syntax highlighting in code blocks)
  → rehype-stringify        (hast → HTML string)
  → render via react-markdown or dangerouslySetInnerHTML (sanitized)
```

Alternatively, using `react-markdown` for React-native rendering:

```ts
// components/markdown-preview.tsx
'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <ReactMarkdown
      className={cn('prose dark:prose-invert max-w-none', className)}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize, rehypeHighlight]}
    >
      {content}
    </ReactMarkdown>
  )
}
```

## 5.3 Structured ↔ Markdown Toggle Behavior

### State Machine

```
┌──────────────┐    toggle     ┌──────────────┐
│  Structured  │ ◄──────────► │   Markdown   │
│    View      │              │    View      │
└──────┬───────┘              └──────┬───────┘
       │ edit                         │ edit
       ▼                              ▼
┌──────────────┐    toggle     ┌──────────────┐
│  Structured  │ ◄──────────► │   Markdown   │
│   Editor     │   serialize   │   Editor     │
└──────────────┘   / parse     └──────────────┘
```

### Toggle During Editing

When switching from **Structured Editor → Markdown Editor**:
1. Serialize current form state to markdown via `systemParser.toMarkdown(formValues)`
2. Load resulting markdown into CodeMirror editor
3. Mark as "derived from structured" (for round-trip tracking)

When switching from **Markdown Editor → Structured Editor**:
1. Parse current markdown via `systemParser.fromMarkdown(editorContent)`
2. If parsing fails (malformed sections), show inline error and prevent switch
3. If parsing succeeds, populate form fields with parsed values
4. Mark as "derived from markdown"

### Conflict Resolution

If both modes have been edited and user toggles, show a dialog:
- "You have unsaved changes in [structured/markdown] mode. Switching will overwrite them. Continue?"
- Options: "Switch and Discard" / "Cancel"

## 5.4 System Markdown Schema as Form and Rendered Markdown

### Form Mapping (SystemForm)

Every section in the PRD Section 7 schema maps to a form field:

| Markdown Section | Form Field Type | Component |
|-----------------|----------------|-----------|
| `# System: <Name>` | Text input | `<Input>` |
| `## System ID` | Auto-generated slug | `<Input>` (derived from name, editable) |
| `## Version` | Text input with pattern | `<Input>` (e.g. "v1.0") |
| `## Status` | Select | `<Select>` options: Draft, Active, Deprecated |
| `## Purpose` | Textarea | `<Textarea>` |
| `## Current State` | Textarea | `<Textarea>` |
| `## Target State` | Textarea | `<Textarea>` |
| `## Core Mechanics` | Rich textarea / bullet list editor | `<Textarea>` with markdown support |
| `## Inputs` | Textarea | `<Textarea>` |
| `## Outputs` | Textarea | `<Textarea>` |
| `## Dependencies` | Multi-select | `<SystemDependencySelect>` |
| `## Depended On By` | Read-only list | Auto-computed, displayed as badges |
| `## Failure States` | Textarea | `<Textarea>` |
| `## Scaling Behavior` | Textarea | `<Textarea>` |
| `## MVP Criticality` | Radio group | `<MvpCriticalitySelector>` |
| `## Implementation Notes` | Textarea | `<Textarea>` |
| `## Open Questions` | Textarea / bullet list | `<Textarea>` |
| `## Change Log` | Read-only list + add entry | Append-only log entries |

### Rendered Markdown Example

```markdown
# System: Combat

## System ID
combat

## Version
v1.0

## Status
Active

## Purpose
Handles all player and NPC combat interactions including damage calculation,
hit detection, and combat state management.

## Current State
Basic melee attacks with fixed damage values.

## Target State
Full combat system with ranged attacks, elemental damage types,
combo system, and AI-driven enemy attack patterns.

## Core Mechanics
- Melee attack chains (3-hit combo)
- Ranged projectile attacks
- Elemental damage multipliers
- Block and parry system
- Stagger and knockback

## Inputs
- Player input actions (attack, block, dodge)
- Enemy AI decisions
- Weapon stats from Inventory system
- Character stats from Progression system

## Outputs
- Damage events → Health system
- Loot drop triggers → Economy system
- Experience points → Progression system

## Dependencies
- health
- movement
- inventory

## Depended On By
- economy
- progression

## Failure States
- Desync between animation and hitbox timing
- Damage overflow on rapid multi-hit scenarios
- AI lock-up during complex combo chains

## Scaling Behavior
- Damage scales with level and equipment
- Enemy complexity increases per zone
- New mechanics unlock progressively

## MVP Criticality
Core

## Implementation Notes
- Use a state machine for combat states (idle, attacking, blocking, staggered)
- Hitbox detection via overlap checks, not raycasting
- Damage formula: base_damage * weapon_modifier * elemental_bonus - defense

## Open Questions
- Should dodge have i-frames?
- How does PvP combat differ from PvE?

## Change Log
- 2026-02-17: Initial system definition
```

---

# 6. Dependency Graph Visualization

## 6.1 Library Choice

**Primary: React Flow** (`@xyflow/react`, formerly `reactflow`)

Rationale:
- Purpose-built for node-based graph UIs in React
- Excellent performance with large graphs
- Built-in pan, zoom, minimap, controls
- Custom node and edge renderers
- Accessible (keyboard navigation, ARIA)
- Active maintenance, strong community
- Supports dagre layout via `dagre` library for auto-layout

**Layout: dagre** (`dagre` npm package)

Provides automatic directed graph layout (top-to-bottom or left-to-right).

NOT using:
- D3.js directly — too low-level for this use case, would require building node interaction from scratch
- vis.js — heavier, less React-native
- Cytoscape.js — powerful but overkill; React Flow covers our needs with better DX
- Mermaid — static rendering only, no interactivity

## 6.2 Rendering Approach

**Current implementation:** Layout is produced by a **bake-off adapter** in `getLayoutedFlow` (`lib/graph/transform.ts`) that evaluates candidate **ELK layered** and **Graphviz DOT** layouts, scores them using readability metrics (near-square footprint, crossing proxy, edge span), and uses the best-scoring result. Candidate override is available via `NEXT_PUBLIC_GRAPH_LAYOUT_STRATEGY` (`auto`/`elk`/`graphviz`). ELK is still configured for orthogonal routing and crossing minimization, but no longer force-partitions nodes by precomputed dependency levels. The custom edge component draws right-angle paths with per-edge offset to reduce overlap; labels are multiline and shown only when zoom ≥ 0.45 (readability-by-zoom). Default **layout mode** is "Organized" (group + fewer crossings); Layout dropdown offers Top–down / Left–right. Canvas uses a flowchart-style grid background (major/minor lines).

### Graph Data Transformation

```ts
// lib/graph/transform.ts
import { type Node, type Edge } from '@xyflow/react'
import dagre from 'dagre'

export function transformToReactFlow(
  systems: GameSystem[],
  dependencies: DependencyEdge[]
): { nodes: Node[]; edges: Edge[] } {
  // 1. Create dagre graph for auto-layout
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 })
  g.setDefaultEdgeLabel(() => ({}))

  // 2. Add nodes with dimensions
  systems.forEach(system => {
    g.setNode(system.slug, { width: 220, height: 100 })
  })

  // 3. Add edges
  dependencies.forEach(dep => {
    g.setEdge(dep.source, dep.target)
  })

  // 4. Compute layout
  dagre.layout(g)

  // 5. Map to React Flow nodes/edges
  const nodes: Node[] = systems.map(system => {
    const pos = g.node(system.slug)
    return {
      id: system.slug,
      type: 'systemNode',
      position: { x: pos.x - 110, y: pos.y - 50 },
      data: {
        label: system.name,
        status: system.status,
        mvpCriticality: system.mvpCriticality,
        dependencyCount: system.dependencies.length,
      },
    }
  })

  const edges: Edge[] = dependencies.map(dep => ({
    id: `${dep.source}-${dep.target}`,
    source: dep.source,
    target: dep.target,
    animated: false,
    style: { stroke: 'var(--border)' },
    markerEnd: { type: 'arrowclosed' },
  }))

  return { nodes, edges }
}
```

### Custom Node Component

```ts
// components/dependency-graph-node.tsx
'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'

const criticalityColors = {
  core: 'border-red-500 bg-red-50 dark:bg-red-950',
  important: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  later: 'border-gray-400 bg-gray-50 dark:bg-gray-900',
}

export function SystemNode({ data, selected }: NodeProps) {
  return (
    <div className={cn(
      'rounded-lg border-2 px-4 py-3 shadow-sm transition-all',
      criticalityColors[data.mvpCriticality],
      selected && 'ring-2 ring-primary',
      data.isHighlighted && 'ring-2 ring-blue-500',
    )}>
      <Handle type="target" position={Position.Top} />
      <div className="text-sm font-semibold">{data.label}</div>
      <div className="flex items-center gap-2 mt-1">
        <StatusBadge status={data.status} />
        <span className="text-xs text-muted-foreground">
          {data.dependencyCount} deps
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

## 6.3 Interactive Features

| Feature | Implementation |
|---------|---------------|
| **Click node** | `onNodeClick` → updates `selectedNodeId` in `graph-store` → opens side panel with system summary + link to detail page |
| **Add edge** | Toggle "edge edit mode" → click source node → click target node → calls `addDependencyAction` Server Action → revalidates graph |
| **Remove edge** | Right-click edge → context menu → "Remove dependency" → calls `removeDependencyAction` → revalidates |
| **Highlight dependency path** | Click node → `highlightDependencyPath(nodeId)` → BFS traversal highlights all ancestors and descendants |
| **Filter by criticality** | Toolbar checkboxes → `setCriticalityFilter` → dims/hides non-matching nodes |
| **Filter by status** | Toolbar select → `setStatusFilter` → dims/hides non-matching nodes |
| **Auto-layout** | Toolbar layout switcher → recalculates dagre layout → animates nodes to new positions |
| **Zoom/Pan** | Built-in React Flow controls + scroll wheel + drag |
| **Minimap** | React Flow `<MiniMap>` component in bottom-right |
| **Fit view** | Toolbar button → `reactFlowInstance.fitView()` |

## 6.4 Page Integration

The dependency graph lives at `projects/[projectId]/dependencies/page.tsx`.

Layout: **Full page with right column** (graph 2:1 wider than sidebar). Right column order: (1) **System preview** — `DependencySidePanel` when a node is selected, skeleton when none; (2) **Interaction links** card (definition-style list: source → target, description below, Remove per link); (3) **Add interaction link** card (form with optional description). Suggested build order has been removed.

```
┌─────────────────────────────────────────────────────┐
│  Page Header: "Systems interaction"   [Controls Bar]  │
├────────────────────────────┬────────────────────────┤
│                            │  System preview       │
│     Interactive Graph      │  (panel or skeleton)   │
│     (React Flow Canvas)    │                        │
│     Edges with labels      │  Interaction links    │
│                            │  Add interaction link  │
├────────────────────────────┴────────────────────────┤
```

When no node is selected, the system preview slot shows a skeleton to keep layout stable.

The graph is also embeddable as a compact version in:
- `projects/[projectId]/page.tsx` — project overview shows a read-only mini graph
- `projects/[projectId]/versions/new/page.tsx` — shows graph with selected systems highlighted

---

# 7. Key Technical Decisions

## 7.1 Package List

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `^15` | App Router, RSC, Server Actions |
| `react` | `^19` | UI library |
| `react-dom` | `^19` | DOM rendering |
| `typescript` | `^5.5` | Type safety |

### Styling & UI

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | `^4` | Utility-first CSS |
| `@shadcn/ui` | (CLI-installed) | Component primitives (34 components listed above) |
| `@radix-ui/*` | (via Shadcn) | Accessible headless UI primitives |
| `class-variance-authority` | `^0.7` | Variant-based component styling |
| `clsx` | `^2` | Conditional class joining |
| `tailwind-merge` | `^2` | Merge Tailwind classes without conflicts |
| `lucide-react` | `^0.400` | Icon library (consistent with Shadcn) |
| `next-themes` | `^0.4` | Dark/light theme switching |
| `sonner` | `^1` | Toast notifications |

### State Management & URL

| Package | Version | Purpose |
|---------|---------|---------|
| `zustand` | `^5` | Client-side global state |
| `nuqs` | `^2` | Type-safe URL search param state |

### Forms & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | `^3` | Schema validation (server + client) |
| `react-hook-form` | `^7` | Complex client-side form state |
| `@hookform/resolvers` | `^3` | Zod resolver for react-hook-form |

### Markdown

| Package | Version | Purpose |
|---------|---------|---------|
| `react-markdown` | `^9` | Markdown → React rendering |
| `remark-gfm` | `^4` | GitHub Flavored Markdown support |
| `rehype-sanitize` | `^6` | Sanitize rendered HTML for security |
| `rehype-highlight` | `^7` | Syntax highlighting in code blocks |
| `@uiw/react-codemirror` | `^4` | React wrapper for CodeMirror 6 |
| `@codemirror/lang-markdown` | `^6` | CodeMirror markdown language support |
| `@codemirror/view` | `^6` | CodeMirror editor view |
| `@codemirror/state` | `^6` | CodeMirror editor state |

### Graph Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| `@xyflow/react` | `^12` | React Flow graph canvas |
| `elkjs` | (see package.json) | Layered graph auto-layout (replaces dagre for dependency graph) |

### Data & Backend

| Package | Version | Purpose |
|---------|---------|---------|
| `@paralleldrive/cuid2` | `^2` | Collision-resistant unique IDs |
| `date-fns` | `^4` | Date formatting and manipulation |
| `gray-matter` | `^4` | YAML frontmatter parsing for markdown files |

### AI Integration

| Package | Version | Purpose |
|---------|---------|---------|
| `ai` | `^4` | Vercel AI SDK — streaming, tool calling |
| `@ai-sdk/openai` | `^1` | OpenAI provider for Vercel AI SDK |
| `@ai-sdk/anthropic` | `^1` | Claude provider for Vercel AI SDK |
| `@ai-sdk/google` | `^1` | Gemini provider for Vercel AI SDK |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `eslint` | `^9` | Linting |
| `eslint-config-next` | `^15` | Next.js ESLint config |
| `prettier` | `^3` | Code formatting |
| `prettier-plugin-tailwindcss` | `^0.6` | Tailwind class sorting |
| `vitest` | `^2` | Unit testing |
| `@testing-library/react` | `^16` | React component testing |
| `@playwright/test` | `^1` | End-to-end testing |

## 7.2 Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useDebounce` | `hooks/use-debounce.ts` | Debounce values for search inputs and auto-save |
| `useAutoSave` | `hooks/use-auto-save.ts` | Auto-save markdown editor content at intervals, calls Server Action |
| `useUnsavedChanges` | `hooks/use-unsaved-changes.ts` | Warns on navigation when editor has unsaved changes (`beforeunload` + Next.js route change) |
| `useMarkdownParser` | `hooks/use-markdown-parser.ts` | Client-side markdown → structured object parsing for live preview in editor |
| `useCopyToClipboard` | `hooks/use-copy-to-clipboard.ts` | Clipboard API wrapper with success/error toast feedback |
| `useGraphLayout` | `hooks/use-graph-layout.ts` | Wraps dagre layout calculation, re-runs when systems/edges change |
| `useStreamResponse` | `hooks/use-stream-response.ts` | Handles SSE/streaming from AI synthesis endpoint, feeds `synthesis-store` |
| `useDependencyPath` | `hooks/use-dependency-path.ts` | BFS/DFS traversal to find all ancestors + descendants of a graph node |
| `useMediaQuery` | `hooks/use-media-query.ts` | Responsive breakpoint detection for layout switching |
| `useHotkeys` | `hooks/use-hotkeys.ts` | Global keyboard shortcut registration (Cmd+K, Cmd+S, etc.) |

### Hook Implementation Sketches

```ts
// hooks/use-auto-save.ts
export function useAutoSave(
  content: string,
  saveAction: (content: string) => Promise<ActionResult>,
  intervalMs: number = 30000
): { isSaving: boolean; lastSaved: Date | null; saveNow: () => void }

// hooks/use-unsaved-changes.ts
export function useUnsavedChanges(
  hasChanges: boolean,
  message?: string
): void  // Sets up beforeunload listener

// hooks/use-stream-response.ts
export function useStreamResponse(
  url: string
): {
  data: string
  isStreaming: boolean
  error: Error | null
  start: (body: unknown) => void
  cancel: () => void
}

// hooks/use-dependency-path.ts
export function useDependencyPath(
  edges: Array<{ source: string; target: string }>,
  nodeId: string | null
): {
  ancestors: string[]
  descendants: string[]
  fullPath: string[]
}
```

## 7.3 Type Definitions

```ts
// lib/types/project.ts
export interface Project {
  id: string
  name: string
  description: string
  genre: string
  targetPlatform: string
  status: 'ideation' | 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
}

// lib/types/brainstorm.ts
export interface BrainstormSession {
  id: string
  projectId: string
  author: string
  content: string
  messages: BrainstormMessage[]
  tags: string[]
  createdAt: Date
}

export interface BrainstormMessage {
  author: string
  content: string
  timestamp: Date
  tags?: string[]
}

// lib/types/system.ts
export interface GameSystem {
  id: string
  projectId: string
  slug: string
  name: string
  version: string
  status: 'draft' | 'active' | 'deprecated'
  purpose: string
  currentState: string
  targetState: string
  coreMechanics: string
  inputs: string
  outputs: string
  dependencies: string[]        // slugs
  dependedOnBy: string[]        // slugs (auto-computed)
  failureStates: string
  scalingBehavior: string
  mvpCriticality: 'core' | 'important' | 'later'
  implementationNotes: string
  openQuestions: string
  changeLog: ChangeLogEntry[]
  rawMarkdown: string           // canonical source
  createdAt: Date
  updatedAt: Date
}

export interface ChangeLogEntry {
  date: Date
  description: string
}

// lib/types/dependency.ts
export interface DependencyGraph {
  nodes: Array<{
    id: string
    slug: string
    name: string
    status: string
    mvpCriticality: string
  }>
  edges: DependencyEdge[]
}

export interface DependencyEdge {
  source: string  // slug
  target: string  // slug
}

export interface ImpactAnalysis {
  systemId: string
  directDependents: string[]
  transitiveDependents: string[]
  riskLevel: 'low' | 'medium' | 'high'
  affectedVersionPlans: string[]
}

// lib/types/version.ts
export interface VersionPlan {
  id: string
  projectId: string
  name: string
  description: string
  includedSystems: string[]
  excludedSystems: string[]
  phases: VersionPhase[]
  milestones: string[]
  riskAreas: string[]
  scopeNotes: string
  implementationOrder: string[]
  rawMarkdown: string
  createdAt: Date
}

export interface VersionPhase {
  name: string
  order: number
  systems: string[]
  milestones: string[]
  description: string
}

// lib/types/prompt.ts
export interface PromptRecord {
  id: string
  projectId: string
  targetType: 'system' | 'version-plan'
  targetId: string
  promptType: 'implementation' | 'architecture' | 'refactor' | 'balance' | 'expansion'
  mode: 'raw' | 'structured' | 'bundle'
  input: string
  output: string
  model: string
  createdAt: Date
}

export interface PromptConfig {
  targetType: 'system' | 'version-plan'
  targetId: string
  promptType: string
  mode: 'raw' | 'structured' | 'bundle'
  additionalContext?: string
}

// lib/types/export.ts
export type ExportScope =
  | { type: 'full-gdd' }
  | { type: 'version-prd'; versionId: string }
  | { type: 'system'; systemId: string }
  | { type: 'roadmap' }
  | { type: 'prompt-bundle'; promptIds: string[] }

export type ExportFormat = 'markdown' | 'json' | 'clipboard'

export interface ExportResult {
  content: string
  filename: string
  mimeType: string
}

// lib/types/actions.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

## 7.4 Image/Asset Handling

This application is document-centric, not media-heavy. Asset handling is minimal:

| Asset Type | Handling |
|-----------|----------|
| App logo / icons | Static in `public/` directory, served directly |
| User-uploaded images | Not in v1 scope. Future: upload to local storage, reference in markdown |
| System diagrams | Generated via dependency graph (exported as SVG/PNG via React Flow) |
| Favicon / OG images | Static in `public/`, configured in `app/layout.tsx` metadata |

Use `next/image` for any rendered images with explicit `width` and `height` props. No external image domains configured in v1.

## 7.5 Accessibility Considerations

### Dependency Graph

| Concern | Solution |
|---------|----------|
| Graph not accessible to screen readers | Provide a **table alternative view** (`DataTable` with system name, dependencies, status) toggled via accessible button |
| Keyboard navigation in graph | React Flow supports Tab to focus nodes, Enter to select, arrow keys to navigate |
| Color-only criticality indicators | Combine color with icon + text label (e.g., red circle + "Core" text) |
| Zoom/pan controls | Provide visible button controls in addition to scroll/drag |
| Edge editing | Keyboard-accessible: Tab to node, Enter to start edge, Tab to target, Enter to confirm |

### Markdown Editor

| Concern | Solution |
|---------|----------|
| CodeMirror accessibility | CodeMirror 6 has native ARIA roles, `role="textbox"`, `aria-multiline`, screen reader support |
| Editor/preview toggle | Use `aria-pressed` on toggle button, `aria-live="polite"` on preview region |
| Unsaved changes | Announce via `aria-live` region when autosave completes |
| Keyboard shortcuts | Displayed in tooltip; also available via Command Palette |

### General

| Concern | Solution |
|---------|----------|
| Focus management on navigation | Next.js App Router handles focus reset on route change |
| Loading states | `aria-busy="true"` on containers during loading; Skeleton components have `aria-hidden` |
| Destructive actions | Confirm dialogs are focus-trapped, Escape to close, announced to screen readers |
| Form validation errors | Linked to fields via `aria-describedby`; announced via `aria-live` |
| Color contrast | Shadcn default themes meet WCAG AA; verify custom colors |
| Reduced motion | Respect `prefers-reduced-motion` for graph animations and transitions |

---

## Appendix: Complete File Tree Summary

```
game-idea-synthesizer/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── globals.css
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── (app)/
│       ├── layout.tsx
│       ├── loading.tsx
│       ├── error.tsx
│       ├── dashboard/
│       │   └── page.tsx
│       ├── projects/
│       │   ├── page.tsx
│       │   ├── new/
│       │   │   └── page.tsx
│       │   └── [projectId]/
│       │       ├── layout.tsx
│       │       ├── loading.tsx
│       │       ├── error.tsx
│       │       ├── not-found.tsx
│       │       ├── page.tsx
│       │       ├── brainstorms/
│       │       │   ├── page.tsx
│       │       │   ├── new/
│       │       │   │   └── page.tsx
│       │       │   └── [sessionId]/
│       │       │       ├── page.tsx
│       │       │       ├── not-found.tsx
│       │       │       └── synthesize/
│       │       │           └── page.tsx
│       │       ├── systems/
│       │       │   ├── page.tsx
│       │       │   ├── new/
│       │       │   │   └── page.tsx
│       │       │   └── [systemId]/
│       │       │       ├── page.tsx
│       │       │       ├── loading.tsx
│       │       │       ├── not-found.tsx
│       │       │       └── edit/
│       │       │           └── page.tsx
│       │       ├── dependencies/
│       │       │   └── page.tsx
│       │       ├── versions/
│       │       │   ├── page.tsx
│       │       │   ├── new/
│       │       │   │   └── page.tsx
│       │       │   └── [versionId]/
│       │       │       ├── page.tsx
│       │       │       └── not-found.tsx
│       │       ├── prompts/
│       │       │   ├── page.tsx
│       │       │   └── [promptId]/
│       │       │       └── page.tsx
│       │       └── export/
│       │           └── page.tsx
│       └── settings/
│           └── page.tsx
├── components/
│   ├── ui/                          # 34 Shadcn components
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── command.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── resizable.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── tooltip.tsx
│   ├── app-shell.tsx
│   ├── sidebar-nav.tsx
│   ├── top-bar.tsx
│   ├── breadcrumb-trail.tsx
│   ├── command-palette.tsx
│   ├── project-card.tsx
│   ├── project-status-badge.tsx
│   ├── brainstorm-input.tsx
│   ├── brainstorm-message-list.tsx
│   ├── system-card.tsx
│   ├── system-structured-view.tsx
│   ├── system-markdown-view.tsx
│   ├── system-view-toggle.tsx
│   ├── system-form.tsx
│   ├── system-dependency-select.tsx
│   ├── mvp-criticality-selector.tsx
│   ├── markdown-editor.tsx
│   ├── markdown-preview.tsx
│   ├── markdown-split-editor.tsx
│   ├── dependency-graph.tsx
│   ├── dependency-graph-controls.tsx
│   ├── dependency-graph-node.tsx
│   ├── version-plan-card.tsx
│   ├── version-system-selector.tsx
│   ├── version-phase-timeline.tsx
│   ├── version-plan-detail.tsx
│   ├── prompt-generator-form.tsx
│   ├── prompt-result-view.tsx
│   ├── prompt-copy-button.tsx
│   ├── export-format-selector.tsx
│   ├── export-scope-selector.tsx
│   ├── synthesis-progress.tsx
│   ├── synthesis-review.tsx
│   ├── empty-state.tsx
│   ├── confirm-dialog.tsx
│   ├── status-badge.tsx
│   ├── page-header.tsx
│   └── data-table.tsx
├── lib/
│   ├── services/
│   │   ├── project-service.ts
│   │   ├── brainstorm-service.ts
│   │   ├── system-service.ts
│   │   ├── dependency-service.ts
│   │   ├── version-service.ts
│   │   ├── prompt-service.ts
│   │   ├── export-service.ts
│   │   └── synthesis-service.ts
│   ├── repositories/
│   │   ├── project-repo.ts
│   │   ├── brainstorm-repo.ts
│   │   ├── system-repo.ts
│   │   ├── version-repo.ts
│   │   └── prompt-repo.ts
│   ├── parsers/
│   │   ├── system-parser.ts
│   │   ├── brainstorm-parser.ts
│   │   └── version-parser.ts
│   ├── graph/
│   │   ├── engine.ts              # Build + query dependency graph
│   │   └── transform.ts           # Graph data → React Flow format
│   ├── ai/
│   │   ├── client.ts              # AI SDK client setup
│   │   ├── prompts.ts             # Prompt templates
│   │   └── synthesis.ts           # Synthesis-specific AI logic
│   ├── actions/
│   │   ├── project-actions.ts
│   │   ├── brainstorm-actions.ts
│   │   ├── system-actions.ts
│   │   ├── dependency-actions.ts
│   │   ├── version-actions.ts
│   │   ├── prompt-actions.ts
│   │   └── export-actions.ts
│   ├── types/
│   │   ├── project.ts
│   │   ├── brainstorm.ts
│   │   ├── system.ts
│   │   ├── dependency.ts
│   │   ├── version.ts
│   │   ├── prompt.ts
│   │   ├── export.ts
│   │   └── actions.ts
│   ├── validations/
│   │   ├── project-schema.ts
│   │   ├── brainstorm-schema.ts
│   │   ├── system-schema.ts
│   │   ├── version-schema.ts
│   │   └── prompt-schema.ts
│   └── utils.ts                    # cn(), formatDate(), slugify(), etc.
├── store/
│   ├── ui-store.ts
│   ├── graph-store.ts
│   ├── editor-store.ts
│   └── synthesis-store.ts
├── hooks/
│   ├── use-debounce.ts
│   ├── use-auto-save.ts
│   ├── use-unsaved-changes.ts
│   ├── use-markdown-parser.ts
│   ├── use-copy-to-clipboard.ts
│   ├── use-graph-layout.ts
│   ├── use-stream-response.ts
│   ├── use-dependency-path.ts
│   ├── use-media-query.ts
│   └── use-hotkeys.ts
├── public/
│   ├── favicon.ico
│   └── og-image.png
├── DOCS/
│   ├── game-idea-synthesizer-PRD.md
│   └── frontend-architecture.md
├── .cursor/
│   └── rules/
│       └── nextjs-engineering.mdc
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── .eslintrc.json
├── .prettierrc
├── .gitignore
└── README.md
```

## Change Log

- 2026-02-17: Initial system definition; routes, components, state, data flow, markdown, dependency graph.
- 2026-02-18: Activity page (`projects/[projectId]/activity`); Activity in sidebar nav; breadcrumbs use ProjectBreadcrumbContext for project name and overview link.
- 2026-02-19: §6.4 Dependencies page: system preview with skeleton when no selection; Suggested build order removed; Interaction links as definition-style list; Add link form with optional description (see edge-labels-and-visible-connections plan).
- 2026-02-19: Dependency graph layout: dagre replaced with elkjs; lib/graph/transform.ts exports async getLayoutedFlow; custom dependencyEdge component for labeled edges; Interaction links show "— No description" when empty; synthesis extraction and convert fallback populate dependency descriptions.
- 2026-02-19: §6.2: Orthogonal (right-angle) flowchart edges; temporary high-visibility edge/arrow styling; multiline wrapped labels; grid background. Custom edge uses getSmoothStepPath(borderRadius: 0).
- 2026-02-19: §6.2: Readability logic — pre-layout organization, ELK crossing minimization and spacing, edge path offset, zoom-dependent labels, default layout mode "Organized".
- 2026-02-19: §6.2 layout bake-off added in `lib/graph/transform.ts`: candidate ELK and Graphviz layouts are scored by readability (aspect ratio, crossing proxy, edge span) and the winner is rendered; `NEXT_PUBLIC_GRAPH_LAYOUT_STRATEGY` allows local override.
- 2026-02-19: Brainstorm preview removed: brainstorms/[sessionId]/page redirects to synthesize; list and post-create go directly to synthesize; wizard back link goes to brainstorms list; Configure step shows synthesis list (load, rename, delete); Processing/Review show markdown preview.
- 2026-02-19: Synthesize wizard keyed by output id so Load opens Processing; Configure step adds synthesis name (optional, default) and date/time.
- 2026-02-19: New brainstorm page: author from current user; default title "Brainstorm - datetime"; input mode UI removed; form has title, content, tags only.
