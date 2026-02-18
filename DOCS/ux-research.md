# UX Research: GamePlan AI Redesign

> Research compiled for the UX redesign of GamePlan AI — a game design documentation/planning SaaS tool built with Next.js 15, React 19, Tailwind CSS 4, and Shadcn-style components (Radix UI).

---

## Table of Contents

1. [Dashboard Patterns](#1-dashboard-patterns)
2. [Dark-Mode Design System](#2-dark-mode-design-system)
3. [Navigation Patterns](#3-navigation-patterns)
4. [Typography & Spacing](#4-typography--spacing)
5. [Card/Table Hybrid Patterns](#5-cardtable-hybrid-patterns)
6. [Color Palette Recommendations](#6-color-palette-recommendations)
7. [Interaction & Motion Patterns](#7-interaction--motion-patterns)
8. [Actionable Implementation Plan](#8-actionable-implementation-plan)

---

## 1. Dashboard Patterns

### Key Principles (from Linear, Notion, Figma, Jira)

**F-Pattern & Z-Pattern Scanning**: Users scan dashboards in predictable patterns. Place the highest-priority content (project list, recent activity) in the top-left quadrant. Secondary actions (create new, filters) go top-right.

**Bento Grid Layout**: Modern SaaS dashboards (Linear, Notion) use modular grid blocks rather than rigid column layouts. This allows flexible content cards that adapt to different data types.

**Progressive Disclosure**: Don't show everything at once. The best SaaS UX reveals depth gradually:
- Dashboard shows project cards with summary info
- Click to drill into full project detail
- Sidebar navigation reveals sub-pages only in context

**Minimal Chrome, Maximum Content**: Linear's redesign philosophy prioritizes content over UI chrome. Reduce visual noise from borders, shadows, and decorative elements. Let the data breathe.

### Recommended Dashboard Layout for GamePlan AI

```
+--------------------------------------------------+
| TopBar: Logo | Breadcrumbs | Search (Cmd+K) | User |
+--------------------------------------------------+
| [Optional Sidebar]  |  Page Content              |
|                      |                            |
| (collapsed on        |  Dashboard:                |
|  dashboard view,     |  - Welcome/stats row       |
|  expanded in         |  - Project grid (cards)    |
|  project detail)     |  - Recent activity feed    |
|                      |                            |
+--------------------------------------------------+
```

**Specific Recommendations:**
- Use a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for project cards
- Cards should have `min-h-[180px]` to feel substantial, not cramped
- Gap between cards: `gap-4` (16px) minimum, `gap-6` (24px) preferred
- Page padding: `px-6 py-6` on desktop, `px-4 py-4` on mobile
- Maximum content width: `max-w-7xl mx-auto` (1280px) to prevent ultra-wide sprawl

---

## 2. Dark-Mode Design System

### Core Principles

**Never use pure black (#000000)**: Use deep charcoal/zinc tones (#09090b is good — the app already does this). Pure black creates harsh contrast and visual fatigue.

**Elevation through lightness, not shadows**: In dark mode, higher-elevation surfaces should be *lighter*, not shadowed. Use progressively lighter zinc tones:

| Layer | Current | Recommended | Tailwind Token |
|-------|---------|-------------|----------------|
| Base background | `#09090b` | `#09090b` (keep) | `--color-background` |
| Card / Surface 1 | `#18181b` | `#18181b` (keep) | `--color-card` |
| Surface 2 (popover, dropdown) | `#18181b` | `#1c1c20` | `--color-popover` |
| Surface 3 (hover state) | — | `#27272a` | `--color-muted` |
| Elevated surface (modal) | — | `#2a2a2e` | `--color-elevated` |

**Soft white foreground**: Use `#fafafa` for primary text (already correct) and `#a1a1aa` (zinc-400) for secondary text instead of `#71717a` (zinc-500) which may not meet WCAG contrast on dark backgrounds.

**Border treatment**: Borders should be subtle. Use `rgba(255,255,255,0.08)` to `rgba(255,255,255,0.12)` for borders on dark surfaces. Current `#27272a` is acceptable but consider semi-transparent borders for better layering:

```css
--color-border: oklch(1 0 0 / 10%);  /* matches shadcn v4 */
--color-input: oklch(1 0 0 / 15%);
```

### LCH/OKLCH Color Space (Linear's Approach)

Linear migrated from HSL to LCH because it's perceptually uniform — a red and yellow at the same lightness actually *look* equally light. For GamePlan AI, consider OKLCH for the accent palette to ensure consistent perceived brightness across status colors.

---

## 3. Navigation Patterns

### Sidebar Design

**Dimensions (industry standard):**
- Expanded width: `w-60` (240px) — the sweet spot between usable and space-efficient
- Collapsed width: `w-16` (64px) — enough for recognizable icons
- Item height: `h-9` (36px) for nav items, `h-8` (32px) for sub-items
- Icon size: `w-4 h-4` (16px) for nav icons
- Padding: `px-3` left/right within items, `py-1.5` top/bottom
- Gap between sections: `gap-6` (24px) with section labels in `text-xs font-medium text-muted-foreground uppercase tracking-wider`

**Collapsible Behavior:**
- Animate width with `transition-[width] duration-200 ease-in-out`
- In collapsed state, show only icons with tooltips on hover
- Persist collapsed/expanded state in localStorage
- On mobile: use sheet/drawer overlay instead of inline sidebar

**Active State Pattern:**
```
// Active item
bg-accent text-accent-foreground rounded-md font-medium

// Hover (non-active)
hover:bg-muted/50 rounded-md transition-colors

// Muted/disabled
text-muted-foreground opacity-60
```

**Hierarchy for Nested Project Navigation:**
```
Sidebar:
  [Section: Main]
    Dashboard
    Projects
    Settings

  [Section: Current Project — "My RPG"]
    Overview
    Brainstorms
    Systems
    Dependencies
    Versions
    Idea Stream
    Export
```

### Breadcrumb Navigation

Breadcrumbs are essential as secondary navigation for nested structures (Notion's approach):

```
Dashboard > My RPG > Systems > Combat System
```

- Use `text-sm text-muted-foreground` for breadcrumb links
- Current page in `text-foreground font-medium`
- Separator: `/` or `>` with `mx-1.5` spacing
- Truncate long names with `max-w-[160px] truncate`

### Command Palette (Cmd+K)

This is a **high-impact, low-cost** addition inspired by Linear:
- Global search across projects, brainstorms, systems
- Shows keyboard shortcuts next to actions
- Fuzzy matching for quick navigation
- Shadcn has a `<Command>` component (cmdk) ready to use

---

## 4. Typography & Spacing

### Font Stack

**Recommended:** Inter as primary, with Inter Display for headings.

```css
@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-display: 'Inter Display', 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}
```

Inter is the de facto standard for SaaS tools (Linear, Vercel, Shadcn itself). It has excellent legibility at small sizes and proper tabular number support for data-dense views.

### Type Scale

For data-dense applications, use a tighter scale than default Tailwind. Based on best practices from Linear and Notion:

| Role | Size | Line Height | Weight | Tracking | Tailwind Class |
|------|------|-------------|--------|----------|----------------|
| Display/Hero | 2rem (32px) | 2.25rem (36px) | 700 | `-0.02em` | `text-[2rem] leading-9 font-bold tracking-tight` |
| Page title (h1) | 1.5rem (24px) | 2rem (32px) | 600 | `-0.015em` | `text-2xl leading-8 font-semibold tracking-tight` |
| Section title (h2) | 1.125rem (18px) | 1.625rem (26px) | 600 | `-0.01em` | `text-lg leading-[1.625rem] font-semibold` |
| Sub-section (h3) | 0.9375rem (15px) | 1.375rem (22px) | 500 | normal | `text-[0.9375rem] leading-[1.375rem] font-medium` |
| Body | 0.875rem (14px) | 1.375rem (22px) | 400 | normal | `text-sm leading-[1.375rem]` |
| Small/Caption | 0.8125rem (13px) | 1.125rem (18px) | 400 | `0.01em` | `text-[0.8125rem] leading-[1.125rem] tracking-wide` |
| Tiny/Label | 0.75rem (12px) | 1rem (16px) | 500 | `0.02em` | `text-xs leading-4 font-medium tracking-wider` |

**Key insight:** Tighter tracking (letter-spacing) conveys professionalism and cohesion. Use `tracking-tight` (-0.025em) on headings, normal on body text.

### Spacing System

Use a consistent 4px base grid. All spacing should be multiples of 4:

| Use Case | Value | Tailwind |
|----------|-------|----------|
| Inline element gap | 4px | `gap-1` |
| Tight component padding | 8px | `p-2` |
| Standard component padding | 12px | `p-3` |
| Card inner padding | 16-20px | `p-4` or `p-5` |
| Section gap | 24px | `gap-6` |
| Page padding | 24-32px | `p-6` or `p-8` |
| Major section divider | 32-48px | `my-8` to `my-12` |

**Page content area:** Use `space-y-6` for vertical rhythm between sections on a page.

---

## 5. Card/Table Hybrid Patterns

### When to Use Cards vs. Tables

| Content Type | Pattern | Reason |
|-------------|---------|--------|
| Projects on dashboard | Cards (grid) | Visual, scannable, status-at-a-glance |
| Brainstorms list | Card list or compact cards | Creative content benefits from preview |
| Systems list | Table with expandable rows | Data-dense, needs sorting/filtering |
| Dependencies | Table | Relational data, needs columns |
| Versions | Timeline/table hybrid | Chronological, needs comparison |
| Idea Stream | Feed/card list | Chronological, mixed content types |

### Card Design Specifications

```
Project Card:
+-------------------------------------------+
| [Status badge]           [3-dot menu]     |
|                                           |
| Project Title                             |
| Description excerpt (2 lines max)         |
|                                           |
| [Tag] [Tag]     Last edited: 2d ago      |
+-------------------------------------------+

Dimensions:
- Border radius: rounded-xl (12px)
- Padding: p-5 (20px)
- Border: border border-border/50
- Hover: hover:border-border transition-colors
- Background: bg-card
- Min-height: min-h-[180px]
- Title: text-base font-semibold text-card-foreground
- Description: text-sm text-muted-foreground line-clamp-2
- Metadata: text-xs text-muted-foreground
```

### Table Design Specifications

```
Header row:
- bg-muted/50
- text-xs font-medium text-muted-foreground uppercase tracking-wider
- h-10 (40px) height
- px-4 py-2 cell padding

Data rows:
- h-12 (48px) for comfortable reading
- px-4 py-3 cell padding
- border-b border-border/50
- hover:bg-muted/30 transition-colors

Text alignment:
- Left-align text columns
- Right-align numeric columns
- Center-align status/icon columns
```

### Hybrid Pattern: Expandable Card-Rows

For systems and brainstorms, consider a hybrid where each row can expand to show detail:

```
+------------------------------------------------------+
| > Combat System    [Active]  Core  |  12 deps  | ... |
+------------------------------------------------------+
    | Expanded detail view with rich content,           |
    | mini-cards for sub-items, inline editing          |
    +---------------------------------------------------+
```

- Expand/collapse with `transition-all duration-200`
- Chevron icon rotates on expand: `transition-transform duration-200`
- Expanded content gets `bg-muted/20 rounded-b-lg p-4`

---

## 6. Color Palette Recommendations

### Current Palette Analysis

The existing zinc/rose palette is solid. Here are refinements:

### Refined Color Tokens

```css
@theme {
  /* === Base surfaces (zinc scale) === */
  --color-background: #09090b;        /* zinc-950 */
  --color-foreground: #fafafa;         /* zinc-50 */
  --color-card: #18181b;              /* zinc-900 */
  --color-card-foreground: #fafafa;
  --color-popover: #1c1c20;           /* slightly lighter than card */
  --color-popover-foreground: #fafafa;

  /* === Interactive (rose accent) === */
  --color-primary: #e11d48;           /* rose-600 — keep */
  --color-primary-foreground: #fafafa;
  --color-primary-hover: #be123c;     /* rose-700 — darker on hover */
  --color-primary-muted: rgba(225, 29, 72, 0.15); /* for subtle backgrounds */

  /* === Neutral surfaces === */
  --color-muted: #27272a;             /* zinc-800 */
  --color-muted-foreground: #a1a1aa;  /* zinc-400 — UPGRADE from zinc-500 */
  --color-accent: #27272a;
  --color-accent-foreground: #fafafa;
  --color-secondary: #27272a;
  --color-secondary-foreground: #fafafa;

  /* === Borders & inputs === */
  --color-border: #27272a;            /* or oklch(1 0 0 / 10%) */
  --color-border-hover: #3f3f46;      /* zinc-700 — visible on hover */
  --color-input: #27272a;
  --color-ring: #e11d48;

  /* === Semantic status === */
  --color-status-draft: #f59e0b;      /* amber-500 */
  --color-status-active: #10b981;     /* emerald-500 */
  --color-status-deprecated: #6b7280; /* gray-500 */
  --color-status-archived: #6b7280;

  /* === Semantic criticality === */
  --color-criticality-core: #ef4444;      /* red-500 */
  --color-criticality-important: #f59e0b; /* amber-500 */
  --color-criticality-later: #38bdf8;     /* sky-400 */

  /* === Feedback === */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-destructive: #dc2626;
  --color-destructive-foreground: #fafafa;
  --color-info: #38bdf8;
}
```

### Contrast Ratios (WCAG AA Compliance)

| Combination | Ratio | Status |
|------------|-------|--------|
| `#fafafa` on `#09090b` | 19.4:1 | Exceeds AAA |
| `#a1a1aa` on `#09090b` | 7.5:1 | Passes AAA |
| `#71717a` on `#09090b` | 4.2:1 | Barely passes AA (upgrade recommended) |
| `#e11d48` on `#09090b` | 4.8:1 | Passes AA |
| `#a1a1aa` on `#18181b` | 5.7:1 | Passes AA |
| `#71717a` on `#18181b` | 3.2:1 | FAILS AA (must upgrade) |

**Key fix:** Upgrade muted-foreground from `#71717a` (zinc-500) to `#a1a1aa` (zinc-400) for proper contrast on card surfaces.

### Rose Accent Usage Guidelines

- **Primary buttons/CTAs**: Solid `bg-primary text-primary-foreground`
- **Active states/selections**: Subtle `bg-primary-muted text-primary` (rose with 15% opacity)
- **Links/interactive text**: `text-primary hover:text-primary-hover`
- **Status indicators**: Rose for "urgent" or "featured" only — don't overuse
- **Avoid**: Rose backgrounds on large areas (overwhelming in dark mode)

---

## 7. Interaction & Motion Patterns

### Transition Timing

Use consistent, quick transitions throughout. Linear targets sub-100ms for interactions:

```css
/* Standard transitions */
--transition-fast: 100ms ease-out;     /* hover states, opacity */
--transition-normal: 150ms ease-out;   /* color changes, transforms */
--transition-smooth: 200ms ease-in-out; /* layout shifts, expand/collapse */
--transition-slow: 300ms ease-in-out;  /* page transitions, modals */
```

Tailwind equivalents:
- `transition-colors duration-100` for hover states
- `transition-all duration-150` for interactive elements
- `transition-all duration-200 ease-in-out` for layout changes

### Hover & Focus States

```
Buttons:
- hover: lighten/darken by one shade + subtle scale(1.01)
- active: scale(0.98) for tactile feedback
- focus-visible: ring-2 ring-ring ring-offset-2 ring-offset-background

Cards:
- hover: border-border (from border-border/50)
- hover: optional subtle translateY(-1px) with shadow
- transition-all duration-150

Inputs:
- focus: ring-1 ring-ring border-ring
- placeholder: text-muted-foreground/60

Nav items:
- hover: bg-muted/50 rounded-md
- active: bg-accent text-accent-foreground
```

### Keyboard Shortcuts (Linear-inspired)

High-impact shortcuts to implement:
- `Cmd+K` / `Ctrl+K`: Command palette (global search)
- `C`: Create new (context-aware — new project on dashboard, new brainstorm in project)
- `1-7`: Navigate sidebar items (in project view)
- `?`: Show keyboard shortcut reference
- `Esc`: Close modal/sheet/popover, go back

### Loading & Empty States

- Use skeleton loading (`<Skeleton>` component) for content areas
- Pulse animation: `animate-pulse` with `bg-muted rounded`
- Empty states: Centered illustration/icon + helpful message + primary CTA
- Use `min-h-[400px]` on content areas to prevent layout shift during loading

---

## 8. Actionable Implementation Plan

### Phase 1: Foundation (globals.css + typography)

1. **Update `globals.css`** with refined color tokens (Section 6)
2. **Add font configuration**: Import Inter + Inter Display via `next/font/google`
3. **Add transition CSS custom properties**
4. **Upgrade muted-foreground** from zinc-500 to zinc-400
5. **Add missing tokens**: `--color-popover`, `--color-elevated`, `--color-primary-hover`, `--color-primary-muted`, border hover, success/warning/info

### Phase 2: Core Component Upgrades

Priority order:
1. **Button** — add hover/active states, consistent sizing (h-9, h-10, h-11), focus-visible ring
2. **Card** — refine border treatment, hover state, consistent padding (p-5)
3. **Input/Textarea** — focus ring, placeholder color, height standardization (h-10)
4. **Badge** — consistent sizing, muted variants for status colors
5. **Table** — header styling, row hover, cell padding standardization
6. **Tabs** — underline style (Linear-like) vs. boxed, active indicator
7. **Dialog/Sheet** — backdrop blur, elevated surface color

### Phase 3: Layout Improvements

1. **Sidebar**: 240px width, collapsible to 64px, proper section grouping, active states
2. **TopBar**: Tighten height (h-14), add breadcrumbs, add search trigger
3. **Page structure**: Consistent `max-w-7xl mx-auto px-6 py-6` content wrapper
4. **Responsive breakpoints**: Stack sidebar below `lg`, single-column cards below `md`

### Phase 4: Page-Level Polish

1. **Dashboard**: Bento grid project cards, recent activity section, empty state
2. **Project detail pages**: Section headers, data tables, expandable rows
3. **Settings**: Form layout consistency, save state feedback

### Phase 5: Interaction Layer (Future)

1. **Command palette** (`cmdk` via Shadcn)
2. **Keyboard shortcuts** (global handler)
3. **Toast notifications** (Sonner or similar)
4. **Skeleton loading** throughout

---

## Sources

- [Linear Design: The SaaS Design Trend — LogRocket](https://blog.logrocket.com/ux-design/linear-design/)
- [How We Redesigned the Linear UI — Linear](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear's Delightful Design Patterns — Gunpowder Labs](https://gunpowderlabs.com/2024/12/22/linear-delightful-patterns)
- [B2B SaaS UX Design in 2026 — Onething Design](https://www.onething.design/post/b2b-saas-ux-design)
- [SaaS Design Trends 2026 — JetBase](https://jetbase.io/blog/saas-design-trends-best-practices)
- [Effective Dashboard UX Design — Excited Agency](https://excited.agency/blog/dashboard-ux-design)
- [Table Design UX Guide — Eleken](https://www.eleken.co/blog-posts/table-design-ux)
- [Color Systems for SaaS — Merveilleux Design](https://www.merveilleux.design/en/blog/article/color-systems-for-saas)
- [Tailwind CSS Best Practices: Design Tokens — FrontendTools](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)
- [Theming — Shadcn/UI](https://ui.shadcn.com/docs/theming)
- [Best UX Practices for Sidebar Menus — Various](https://www.navbar.gallery/blog/best-side-bar-navigation-menu-design-examples)
- [Breadcrumbs UX Navigation — Pencil & Paper](https://www.pencilandpaper.io/articles/breadcrumbs-ux)
- [SaaS Navigation Menu Design — Lollypop](https://lollypop.design/blog/2025/december/saas-navigation-menu-design/)
- [Command Palette UX Patterns — Alicja Suska](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1)
- [SaaS Dashboard UI Examples — SaasFrame](https://www.saasframe.io/categories/dashboard)
