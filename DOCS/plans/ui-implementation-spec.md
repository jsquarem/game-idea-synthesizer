# GamePlan AI — UI Implementation Spec (Frontend Dev Handoff)
Date: 2026-02-17
Goal: Implement high-fidelity UI layouts using Next.js App Router + Tailwind + shadcn/ui matching the product spec.

---

## 0) Tech Assumptions
- Next.js (App Router)
- TailwindCSS
- shadcn/ui components
- lucide-react icons
- Optional: nuqs for URL state (filters/sorts/toggles)
- Optional: React Flow + dagre for dependency graph page (interactive), but initial can be mocked.

---

## 1) Design Tokens (Tailwind + CSS vars)
Use shadcn defaults as base. Add/confirm these semantic tokens in `globals.css` via CSS variables (or Tailwind theme mapping).

### Colors (dark-first)
- App background: zinc-950 (#09090B)
- Panel: zinc-900 (#18181B)
- Subtle surface: zinc-800 (#27272A)
- Border: zinc-800 (#27272A)
- Text primary: zinc-50 (#FAFAFA)
- Text secondary: zinc-400 (#A1A1AA)
- Text muted: zinc-500 (#71717A)

### Semantic
- status.draft: amber-500
- status.active: emerald-500
- status.deprecated: gray-500
- criticality.core: red-500
- criticality.important: amber-500
- criticality.later: sky-400

### Radii / spacing
- Card radius: 12px (`rounded-xl`)
- Panel radius: 12px (`rounded-xl`)
- Page padding: desktop 24px–32px; mobile 16px
- Content max width: 1280px (`max-w-7xl`)

### Shadow
- Card: `shadow-md` (keep subtle)
- Hover: `hover:shadow-lg` with small translate

---

## 2) App Shell Layout
### Top Bar
- Height: 64px
- Left: Logo (links to dashboard)
- Center-left: Breadcrumbs
- Right: Theme toggle + Settings icon + User/avatar icon

### Sidebar
- Width: 256px expanded, 64px collapsed
- Visible only inside project context routes: `/projects/:projectId/*`
- Items (order):
  1. Overview
  2. Brainstorms
  3. Systems
  4. Dependencies
  5. Versions
  6. Prompts
  7. Export
- Active indicator: left border or background tint
- Collapse toggle at bottom

### Content Area
- Centered container: `max-w-7xl mx-auto`
- Independent scroll in content region (optional)

---

## 3) Routes to Implement (UI)
- `/` or `/dashboard` — Project List
- `/projects/new` — Create Project
- `/projects/[projectId]/overview` — Project Overview
- `/projects/[projectId]/systems` — Systems List
- `/projects/[projectId]/systems/[systemId]` — System Detail (structured/markdown toggle)
- `/projects/[projectId]/dependencies` — Dependency Graph
(Other pages can be stubs.)

---

## 4) Shared UI Components (shadcn)
Use these shadcn primitives:
- Button, Card, Badge, Input, Textarea, Tabs, Separator
- DropdownMenu, Tooltip, Dialog/AlertDialog
- Sheet (mobile sidebar)
- Skeleton (loading states)
- Switch (structured/markdown toggle)
- Table (systems list table mode)
- ScrollArea (side panels)

---

## 5) Page Specs

# 5.1 Project List (Dashboard)
Route: `/dashboard` (or `/`)
Purpose: list projects + create new.

Layout:
- Header row: "Your Projects" + primary button "New Project"
- Controls row: Search input + Status filter + Sort dropdown
- Grid: responsive cards (1 col mobile, 2 tablet, 3–4 desktop)

Project Card:
- Title (bold)
- Description (2-line clamp)
- Badges: Genre, Status
- Meta row: System count, Last edited

Empty State:
- Icon/illustration placeholder
- Title: "Create your first project"
- CTA button: New Project

---

# 5.2 Project Overview
Route: `/projects/[projectId]/overview`
Purpose: project "control center".

Structure:
1) Project Header (Card or inline)
- H1: Project name
- Badges row: Genre, Platform, Status
- Description
- Top-right icon button: ⚙ opens "Edit Project" drawer (can be stubbed)

2) Quick Stats Row (4 stat cards)
- Brainstorms, Systems, Dependencies, Version Plans
- Each card: icon, big number, label; whole card clickable to relevant page

3) Two Column Section
Left (2/3):
- Dependency Mini Graph (non-interactive preview)
  - Mock nodes/edges (can be static placeholder)
  - Footer link: "View Full Graph →" to dependencies page

Right (1/3):
- Recent Activity (timeline list)
  - Item: icon + text + timestamp (mock data acceptable)

4) Quick Actions Row
- Primary: New Brainstorm
- Secondary: New System, Generate Version Plan

---

# 5.3 Systems List
Route: `/projects/[projectId]/systems`
Purpose: browse systems and create new.

Header:
- Title: "Systems"
- Right actions: "New System" button
- View toggle: Grid / Table

Controls:
- Search
- Filter dropdowns: Status, Criticality
- Sort dropdown (optional)

Grid Mode:
- Card grid with:
  - Name
  - Slug
  - Status badge
  - Criticality badge
  - Dependency count
  - Last updated (optional)

Table Mode:
- Columns: Name, ID, Status, Criticality, Version, Dependencies, Updated
- Row click navigates to system detail

Empty State:
- "Create your first system" CTA

---

# 5.4 System Detail
Route: `/projects/[projectId]/systems/[systemId]`
Purpose: edit & view system content.

Page Header:
- Left: H1 System name
- Under: slug in monospace (muted)
- Badges: Status + Criticality
- Right actions:
  - Save Changes (primary)
  - History (secondary)
  - Evolve (secondary)
  - Delete (destructive outline)

Mode Toggle:
- Segmented: Structured | Markdown
- Persist in URL query `?view=structured|markdown` (optional)

Main layout:
- Two columns:
  - Left 70%: system content cards
  - Right 30%: dependency side panel

Structured Mode (Left column cards):
- Each section as Card with title + content
  - Purpose
  - Current State
  - Target State
  - Core Mechanics
  - Inputs / Outputs (2-column inside one card)
  - Failure States (Accordion)
  - Scaling Behavior
  - Open Questions (Callout)

Right panel:
- Card: Dependencies
  - Depends On (list)
  - Depended On By (list)
  - Mini graph preview placeholder
  - Button: "View in Graph →" -> dependencies page

Markdown Mode:
- Split view optional (MVP can be single panel)
  - Editor (CodeMirror or Textarea) + Preview
  - If no editor yet, implement read-only render with placeholder.

---

# 5.5 Dependency Graph
Route: `/projects/[projectId]/dependencies`
Purpose: visualize and edit system dependencies.

Layout:
- Large canvas card (full width, ~70vh)
- Overlay controls (top-right inside canvas):
  - Zoom In, Zoom Out, Fit
  - Layout dropdown (Hierarchical / Force / LTR)
  - Filters: Status, Criticality
  - Toggle: Impact mode

Canvas MVP:
- If React Flow not implemented yet:
  - Render a placeholder "Graph coming soon" + list view below.
- If React Flow implemented:
  - Nodes styled by criticality and status
  - Directed edges
  - Node click opens detail side panel

Side panel (right slide-in or fixed right column):
- System name + badges
- Purpose excerpt
- Depends on / Depended on by lists
- Button: "Open System"

Impact Mode:
- Toggle to highlight downstream dependents of selected node (can be stubbed).

Below canvas (optional MVP):
- Implementation order list (topological sort — can be mocked)
- Edges list: Source → Target

---

## 6) Component API Sketch (Optional Guidance)
Implement minimal components so pages are composable:

- `<PageHeader title description actions />`
- `<StatusBadge status />`
- `<CriticalityBadge value />`
- `<StatCard icon label value href />`
- `<SystemCard system />`
- `<ProjectCard project />`
- `<DependencySidePanel system />`

---

## 7) Data Assumptions (MVP)
Use mocked data or server props:
- Project: `{ id, name, description, genre, platform, status, updatedAt }`
- System: `{ id, name, slug, status, mvpCriticality, version, dependencyCount, updatedAt }`
- Dependencies: `{ nodes: System[], edges: { sourceSlug, targetSlug }[] }`

---

## 8) Acceptance Criteria
- App shell matches layout: top bar + project sidebar only in project context
- Project Overview matches: header + stats + mini graph + activity + quick actions
- Systems List supports grid/table toggle and navigation to system detail
- System Detail supports structured/markdown mode toggle and dependency panel
- Dependency Graph page renders at least an MVP placeholder with side panel behavior
- All pages are responsive:
  - Mobile: sidebar becomes Sheet, content stacked
  - Tablet: sidebar collapsed icons-only (optional)
  - Desktop: full layout

---

## 9) UI Polish Checklist
- Consistent spacing and typography hierarchy
- Hover states for cards and primary actions
- Skeleton loading states for page sections
- Empty states for all lists
- Keyboard focus outlines preserved

---
End of spec.

## Change Log

- 2026-02-17: UI implementation spec for frontend handoff.
