# UX Design Improvement Plan — GamePlan AI

**Version:** 1.1
**Date:** 2026-02-18
**Status:** Actionable
**Based on:** Full codebase audit of current UI + design-specification.md + frontend-architecture.md + UX research (ux-research.md)

---

## Executive Summary

GamePlan AI has a solid functional foundation but its visual layer needs refinement to feel like a professional SaaS tool rather than a developer prototype. The key gaps are:

1. **No custom typography** — relies on system fonts instead of Inter + JetBrains Mono
2. **Muted text fails WCAG on cards** — `#71717a` (zinc-500) on `#18181b` (card) is only 3.2:1 contrast ratio, below the 4.5:1 AA minimum. Must upgrade to `#a1a1aa` (zinc-400) which achieves 5.7:1.
3. **Jumpy hover effects** — `hover:-translate-y-0.5` on cards creates layout shift that affects neighboring grid items
4. **Inconsistent component usage** — some pages use raw styled Links instead of Button/Card components
5. **Missing dark-mode shadows** — uses generic `shadow-sm`/`shadow-lg` instead of dark-optimized border-glow style
6. **No typography scale** — headings, body, labels all lack systematic sizing

> **Design decision — Primary color**: The design spec recommends action-blue (hsl 213,94%,58%), while the UX research supports keeping rose-red (#e11d48) as the established brand color. **We will keep rose-red** as primary since it's already implemented and changing primary color mid-project is high-risk with potential visual regressions. The rose-red passes WCAG AA (4.8:1 on background). If the team later wants to explore blue, it can be done in a single globals.css change.

This plan addresses these issues across 4 phases, with exact file paths, current code, and recommended replacements.

---

## Phase 1: Foundation (globals.css, Typography, Spacing, Color Refinement)

### 1.1 Add Inter + JetBrains Mono Fonts

**File:** `app/layout.tsx`

**Current code (line 17):**
```tsx
<body className="min-h-screen bg-background font-sans antialiased">
```

**Recommended:**
```tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// In the return:
<body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans antialiased`}>
```

**Why:** The design spec mandates Inter for UI text and JetBrains Mono for system IDs, code blocks, and markdown source. System fonts lack the consistent metrics and professional feel of Inter's open-source type family. `next/font/google` provides automatic self-hosting and zero CLS.

---

### 1.2 Register Font Families in Tailwind

**File:** `app/globals.css`

**Current code (line 3–38, @theme block):**
```css
@theme {
  /* Spec: dark-first palette */
  --color-background: #09090b;
  /* ... colors only, no font-family ... */
}
```

**Add to @theme block:**
```css
@theme {
  /* Typography */
  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono), ui-monospace, 'Cascadia Code', monospace;

  /* ... existing color tokens ... */
}
```

**Why:** Tailwind v4 requires font-family in `@theme` for `font-sans` / `font-mono` utilities to work. Without this, `font-mono` on system IDs won't use JetBrains Mono.

---

### 1.3 Refine Color Palette — Background Depth Layers

**File:** `app/globals.css`

**Current @theme colors:**
```css
--color-background: #09090b;
--color-card: #18181b;
--color-muted: #27272a;
--color-border: #27272a;
--color-primary: #e11d48;
```

**Recommended @theme colors:**
```css
/* Base surfaces — keep zinc scale (validated by UX research) */
--color-background: #09090b;        /* zinc-950 — keep */
--color-foreground: #fafafa;         /* zinc-50 — keep */
--color-card: #18181b;              /* zinc-900 — keep */
--color-card-foreground: #fafafa;
--color-popover: #1c1c20;           /* slightly lighter than card for dropdown layering */
--color-popover-foreground: #fafafa;

/* CRITICAL FIX: Muted foreground contrast */
--color-muted: #27272a;             /* zinc-800 — keep */
--color-muted-foreground: #a1a1aa;  /* zinc-400 — UPGRADED from #71717a (zinc-500) */
--color-accent: #27272a;
--color-accent-foreground: #fafafa;

/* Borders — keep current but add hover variant */
--color-border: #27272a;
--color-input: #27272a;

/* Primary — keep rose-red (see design decision note above) */
--color-primary: #e11d48;           /* rose-600 — keep */
--color-primary-foreground: #fafafa;
--color-ring: #e11d48;

/* Destructive stays red */
--color-destructive: #dc2626;
--color-destructive-foreground: #fafafa;

/* Secondary */
--color-secondary: #27272a;
--color-secondary-foreground: #fafafa;

/* Feedback colors (new — from UX research) */
--color-success: #10b981;
--color-warning: #f59e0b;
--color-info: #38bdf8;
```

**Why:** The most critical change is upgrading `--color-muted-foreground` from `#71717a` to `#a1a1aa`. Per UX research WCAG analysis: `#71717a` on card background `#18181b` achieves only 3.2:1 contrast ratio — **below WCAG AA minimum of 4.5:1**. The upgraded `#a1a1aa` achieves 5.7:1 on cards and 7.5:1 on the base background. The zinc surface scale is validated by research as appropriate for dark-mode SaaS. The popover surface (`#1c1c20`) is slightly lighter than card to communicate elevation in dropdowns and tooltips.

---

### 1.4 Consolidate Duplicate :root Block

**File:** `app/globals.css`

**Current (lines 40–47) — duplicate declarations:**
```css
:root {
  --background: #09090b;
  --foreground: #fafafa;
  --card: #18181b;
  --card-foreground: #fafafa;
  --popover: #18181b;
  --popover-foreground: #fafafa;
}
```

**Recommended: Remove the :root block entirely.** Tailwind v4's `@theme` block handles all CSS custom properties. The `:root` block creates duplicates that can desync. If popover colors are needed:

**Add to @theme:**
```css
--color-popover: oklch(0.205 0.015 285);
--color-popover-foreground: oklch(0.985 0 0);
```

**Why:** Dual definitions cause confusion during maintenance. A single source of truth in `@theme` ensures changes propagate consistently.

---

### 1.5 Add Dark-Mode Optimized Shadow Tokens

**File:** `app/globals.css`

**Current:** No custom shadow tokens. Components use default Tailwind `shadow-sm`, `shadow-lg`.

**Add to @theme:**
```css
/* Dark-optimized shadows — border-glow style */
--shadow-sm: 0 0 0 1px oklch(0.274 0.013 285);
--shadow-md: 0 0 0 1px oklch(0.254 0.013 285), 0 4px 12px rgba(0,0,0,0.3);
--shadow-lg: 0 0 0 1px oklch(0.254 0.013 285), 0 8px 24px rgba(0,0,0,0.4);
```

**Why:** Traditional drop shadows are nearly invisible on dark backgrounds. The border-glow pattern (a 1px ring + subtle spread) creates visible elevation in dark mode. This is the industry standard approach used by Linear, Vercel, and other dark-first SaaS tools.

---

### 1.6 Add Larger Border Radius Token

**File:** `app/globals.css`

**Current radii:**
```css
--radius-sm: 0.25rem;
--radius-md: 0.375rem;
--radius-lg: 0.5rem;
--radius-xl: 0.75rem;
```

**Recommended — add one more for panels/modals:**
```css
--radius-sm: 0.25rem;   /* 4px — badges, pills */
--radius-md: 0.375rem;  /* 6px — buttons, inputs */
--radius-lg: 0.5rem;    /* 8px — cards */
--radius-xl: 0.75rem;   /* 12px — large cards, panels */
--radius-2xl: 1rem;     /* 16px — modals, popovers */
```

**Why:** The design spec calls for 12px radius on cards/panels. The current `--radius-xl: 0.75rem` (12px) covers this, but dialogs and popovers benefit from a slightly larger `1rem` (16px) to feel premium. Modern SaaS tools (Linear, Notion) use 12–16px radii on elevated surfaces.

---

### 1.7 Add Transition Tokens

**File:** `app/globals.css`

**Add after the @theme block:**
```css
@layer base {
  /* Smooth transitions for interactive elements */
  * {
    --transition-fast: 150ms ease-in-out;
    --transition-default: 200ms ease-in-out;
    --transition-slow: 300ms ease-in-out;
  }

  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}
```

**Why:** Consistent transition timing across components. The existing button cursor fix stays.

---

## Phase 2: Core Component Upgrades

### 2.1 Button — Add Subtle Hover Transition

**File:** `components/ui/button.tsx`

**Current base class (line 8):**
```ts
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
```

**Recommended change — replace `transition-all` with targeted transition:**
```ts
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
```

**Why:** `transition-all` can cause unexpected animation of padding, margin, or transforms. Targeting specific properties prevents layout jank and improves rendering performance. Adding `duration-150` makes the hover feel snappy and professional.

---

### 2.2 Card — Refine Shadow and Remove Gap

**File:** `components/ui/card.tsx`

**Current Card class (line 10):**
```ts
"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
```

**Recommended:**
```ts
"bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm"
```

**Why:** The `gap-6` and `py-6` baked into Card forces all cards to have the same internal spacing, even when consumers explicitly set their own padding via `CardContent className="p-6"`. This causes double-spacing issues. Removing these lets each Card usage control its own spacing via CardHeader/CardContent/CardFooter padding. The gap-6 between Card children creates excessive whitespace when cards have both header and content.

**Also update CardHeader (line 23) — remove excessive grid layout for simple headers:**

**Current:**
```ts
"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
```

This is fine as-is since it handles CardAction layout. No changes needed to CardHeader.

---

### 2.3 Badge — Improve Readability

**File:** `components/ui/badge.tsx`

**Current base class (line 8):**
```ts
"inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden"
```

**Recommended — add slight letter spacing and tracking:**
```ts
"inline-flex items-center justify-center rounded-md border border-transparent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden"
```

**Key changes:**
- `rounded-full` → `rounded-md`: Rounded-md looks more structured and professional for status labels
- `text-xs` → `text-[11px] font-semibold uppercase tracking-wider`: Better badge typography per the design spec's badge token (11px, weight 600, uppercase)
- `px-2` → `px-2.5`: Slightly more breathing room

**Why:** The design spec defines a specific badge type token: 11px, font-weight 600, line-height 1.0, uppercase. This makes badges read as structured labels rather than casual tags. The `rounded-md` shape differentiates badges from tag pills, which should remain `rounded-full`.

**Note:** StatusBadge and CriticalityBadge already pass `capitalize` which will override `uppercase`, so those components need to be updated to remove the `capitalize` class since the base badge now handles casing.

---

### 2.4 StatusBadge — Use CSS Variables

**File:** `components/status-badge.tsx`

**Current (lines 4–9):**
```ts
const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  active: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  deprecated: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
  ideation: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
}
```

**Recommended — reference CSS variables and add missing statuses:**
```ts
const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-status-draft/20 text-status-draft border-status-draft/30',
  active: 'bg-status-active/20 text-status-active border-status-active/30',
  deprecated: 'bg-status-deprecated/20 text-status-deprecated border-status-deprecated/30',
  ideation: 'bg-sky-400/20 text-sky-400 border-sky-400/30',
  archived: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
}
```

**Note:** The existing `--color-status-draft`, `--color-status-active`, and `--color-status-deprecated` tokens in globals.css already define these colors. The badge styles just need to reference them via Tailwind's color utilities (e.g., `bg-status-draft/20`).

**Also update the component (line 19) — remove `capitalize` since base Badge now handles casing:**
```tsx
<Badge variant="outline" className={cn(style, className)}>
  {status}
</Badge>
```

**Why:** Using CSS variables instead of hardcoded Tailwind colors means the palette can be adjusted in one place (globals.css) rather than hunting through component files. This is the design-token approach that scales.

---

### 2.5 CriticalityBadge — Same Pattern

**File:** `components/criticality-badge.tsx`

**Current (lines 4–8):**
```ts
const CRITICALITY_STYLES: Record<string, string> = {
  core: 'bg-red-500/20 text-red-500 border-red-500/30',
  important: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  later: 'bg-sky-400/20 text-sky-400 border-sky-400/30',
}
```

**Recommended:**
```ts
const CRITICALITY_STYLES: Record<string, string> = {
  core: 'bg-criticality-core/20 text-criticality-core border-criticality-core/30',
  important: 'bg-criticality-important/20 text-criticality-important border-criticality-important/30',
  later: 'bg-criticality-later/20 text-criticality-later border-criticality-later/30',
}
```

**Note:** The existing `--color-criticality-core`, `--color-criticality-important`, and `--color-criticality-later` tokens in globals.css already define these colors. The badge styles just need to reference them via Tailwind's color utilities (e.g., `bg-criticality-core/20`).

**Also remove `capitalize` from the Badge render for the same reason as StatusBadge.**

**Why:** Same reasoning — design tokens in CSS variables enable one-place palette changes.

---

### 2.6 Input/Textarea — Add Hover State

**File:** `components/ui/input.tsx`

**Current (line 11):**
```ts
"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
```

**Recommended — add hover border color:**
```ts
"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input hover:border-muted-foreground/50 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow,border-color] duration-150 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
```

**Key changes:**
- Added `hover:border-muted-foreground/50` — subtle border lighten on hover
- `transition-[color,box-shadow]` → `transition-[color,box-shadow,border-color] duration-150` — animate the border change

**File:** `components/ui/textarea.tsx` — Apply same hover pattern.

**Why:** Inputs without hover feedback feel static and unresponsive. A subtle border color change on hover signals interactivity before the user clicks.

---

### 2.7 Dialog — Use Larger Radius for Premium Feel

**File:** `components/ui/dialog.tsx`

**Current DialogContent class (line 64):**
```ts
"bg-background ... rounded-lg border p-6 shadow-lg ..."
```

**Recommended:**
```ts
"bg-background ... rounded-xl border p-6 shadow-lg ..."
```

**Why:** Modals are prominent elevated surfaces. Using `rounded-xl` (12px) instead of `rounded-lg` (8px) matches the design spec's recommendation for large cards and panels, and creates consistency with Card components which already use `rounded-xl`.

---

### 2.8 Table — Improve Header Contrast

**File:** `components/ui/table.tsx`

**Current TableHead class (line 73):**
```ts
"text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap ..."
```

**Recommended:**
```ts
"text-muted-foreground h-10 px-2 text-left align-middle text-xs font-medium uppercase tracking-wider whitespace-nowrap ..."
```

**Why:** Table headers should be visually distinct from data cells. Using `text-muted-foreground` + `uppercase tracking-wider text-xs` creates the classic "label" treatment that clearly differentiates headers from content — this is a standard SaaS table pattern (see Linear, Stripe Dashboard).

---

## Phase 3: Layout Improvements

### 3.1 TopBar — Better Visual Hierarchy

**File:** `components/top-bar.tsx`

**Current (line 20):**
```tsx
<header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
```

**Recommended:**
```tsx
<header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6">
```

**Key changes:**
- `h-16` → `h-14`: Slightly shorter top bar (56px vs 64px). Modern SaaS tools use 48–56px headers to maximize content space.
- `bg-card` → `bg-background/80 backdrop-blur-sm`: Frosted glass effect. When content scrolls behind the header, it creates a premium layered feel. This is the pattern used by Vercel, Linear, and Apple.

**Also update the brand link (line 22–26):**

**Current:**
```tsx
<Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-semibold text-foreground">
  GamePlan AI
</Link>
```

**Recommended:**
```tsx
<Link href="/dashboard" className="flex shrink-0 items-center gap-2 text-sm font-bold tracking-tight text-foreground hover:text-foreground/80 transition-colors">
  GamePlan AI
</Link>
```

**Key changes:**
- Added `text-sm` — brand text shouldn't dominate; let the breadcrumbs convey context
- Added `tracking-tight` — tighter letter-spacing looks more logo-like
- Added `hover:text-foreground/80 transition-colors` — subtle hover feedback

**Also remove the redundant Settings icon button (lines 31–34):**

**Current:**
```tsx
<Button variant="ghost" size="icon" aria-label="Settings" asChild>
  <Link href="/settings">
    <Settings className="size-4" />
  </Link>
</Button>
<Button variant="ghost" size="icon" aria-label="Profile and settings" asChild>
  <Link href="/settings">
    {/* avatar */}
  </Link>
</Button>
```

**Recommended: Remove the standalone Settings icon button.** The avatar already links to settings. Two elements linking to the same page creates confusion and wastes horizontal space.

```tsx
<div className="flex shrink-0 items-center gap-1">
  <Button variant="ghost" size="icon" aria-label="Profile and settings" asChild>
    <Link href="/settings">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ring-2 ring-transparent hover:ring-primary/30 transition-all"
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </span>
    </Link>
  </Button>
</div>
```

**Why:** The avatar now has a subtle ring hover effect that signals interactivity. Removing the duplicate settings icon simplifies the top-right area.

---

### 3.2 Project Sidebar — Refined Active State

**File:** `components/project-sidebar.tsx`

**Current active link class (lines 73–77):**
```tsx
isActive
  ? 'bg-muted text-foreground border-l-2 border-primary'
  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
```

**Recommended:**
```tsx
isActive
  ? 'bg-primary/10 text-primary font-medium'
  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
```

**Key changes:**
- `bg-muted text-foreground border-l-2 border-primary` → `bg-primary/10 text-primary font-medium`: The `border-l-2` inside a `rounded-lg` element looks visually broken — the left border doesn't follow the border radius. Instead, using `bg-primary/10` creates a soft highlight wash, and `text-primary` makes the active item text pop in the brand color.
- `hover:bg-muted` → `hover:bg-muted/50`: Softer hover background prevents the hover from competing visually with the active state.

**Why:** The `border-l-2` + `rounded-lg` combination is a common anti-pattern — the sharp left edge conflicts with the rounded corners. A tinted background fill is the cleaner modern pattern (used by Linear, Notion, GitHub).

---

### 3.3 Project Layout — Better Content Padding

**File:** `app/(app)/projects/[projectId]/layout.tsx`

**Current (line 21):**
```tsx
<div className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8">
  <div className="mx-auto max-w-7xl">{children}</div>
</div>
```

**Recommended:**
```tsx
<div className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-10">
  <div className="mx-auto max-w-6xl">{children}</div>
</div>
```

**Key changes:**
- Added `overflow-y-auto` — ensures the content area scrolls independently from the sidebar
- `md:px-6 lg:px-8` → `md:px-8 lg:px-10`: Slightly more generous horizontal padding on larger screens
- `max-w-7xl` → `max-w-6xl`: Narrower max width (72rem → 72rem → actually 7xl=80rem, 6xl=72rem). Content lines shouldn't stretch beyond ~80 characters for readability. With the sidebar taking 256px, max-w-6xl keeps content comfortable.

**Why:** `max-w-7xl` (80rem/1280px) creates very wide content when the sidebar is present. Reducing to `max-w-6xl` keeps content density optimal for readability.

---

### 3.4 Sidebar Collapse Animation

**File:** `components/project-sidebar.tsx`

**Current (line 109):**
```tsx
className={cn(
  'hidden shrink-0 flex-col border-r border-border bg-card transition-[width] md:flex',
  collapsed ? 'w-16' : 'w-64'
)}
```

**Recommended — add duration:**
```tsx
className={cn(
  'hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-in-out md:flex',
  collapsed ? 'w-16' : 'w-64'
)}
```

**Why:** The `transition-[width]` is already there but without a duration it uses the default (which might be 0 or the browser default). Adding `duration-200 ease-in-out` ensures a smooth, intentional collapse animation.

---

### 3.5 Mobile Sidebar Sheet — Better Header

**File:** `components/project-sidebar.tsx`

**Current (line 127):**
```tsx
<div className="border-b border-border p-4 font-semibold">Menu</div>
```

**Recommended:**
```tsx
<div className="border-b border-border px-4 py-3">
  <span className="text-sm font-bold tracking-tight">GamePlan AI</span>
</div>
```

**Why:** "Menu" is generic and uninformative. Showing the brand name creates consistency with the top bar and helps users orient themselves in the mobile experience.

---

## Phase 4: Page-Level Polish

### 4.1 Dashboard — Remove Card Hover Translate

**File:** `components/stat-card.tsx`

**Current (line 34):**
```ts
const cardClass = cn(
  'transition-shadow hover:shadow-lg hover:-translate-y-0.5',
  href && 'cursor-pointer',
  className
)
```

**Recommended:**
```ts
const cardClass = cn(
  'transition-shadow duration-150 hover:shadow-md',
  href && 'cursor-pointer',
  className
)
```

**Key changes:**
- Removed `hover:-translate-y-0.5`: This creates layout shift that can cause adjacent elements to reflow. It looks good on isolated cards but feels janky in a dense grid.
- `hover:shadow-lg` → `hover:shadow-md`: More subtle shadow elevation is enough to convey interactivity.
- Added `duration-150`: Fast, snappy transition.

**Apply the same pattern to:**

**File:** `components/project-card.tsx` (line 31)
```ts
// Remove hover:-translate-y-0.5
'transition-shadow duration-150 hover:shadow-md'
```

**File:** `components/system-card.tsx` (line 33)
```ts
// Remove hover:-translate-y-0.5
'transition-shadow duration-150 hover:shadow-md'
```

**File:** `components/dashboard-project-card.tsx` (line 18)
```ts
// Current: "transition-shadow hover:shadow-lg flex flex-col h-full"
// Recommended:
"transition-shadow duration-150 hover:shadow-md flex flex-col h-full"
```

**Why:** `translate-y` on hover causes layout shifts that affect neighboring elements in a grid. Shadow-only elevation changes are the industry standard (Linear, Notion, Jira) because they don't affect the DOM layout.

---

### 4.2 Brainstorms Page — Use Proper Components

**File:** `app/(app)/projects/[projectId]/brainstorms/page.tsx`

**Current header (lines 18–25) — raw styled Link as button:**
```tsx
<div className="flex items-center justify-between">
  <h1 className="text-2xl font-bold">Brainstorms</h1>
  <Link
    href={`/projects/${projectId}/brainstorms/new`}
    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
  >
    New session
  </Link>
</div>
```

**Recommended — use PageHeader + Button components:**
```tsx
<PageHeader
  title="Brainstorms"
  actions={
    <Button asChild>
      <Link href={`/projects/${projectId}/brainstorms/new`}>New Session</Link>
    </Button>
  }
/>
```

**Current brainstorm cards (lines 42–69) — raw styled Link cards:**
```tsx
<Link
  href={...}
  className="block rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow"
>
```

**Recommended — use Card component:**
```tsx
<Link href={...}>
  <Card className="transition-shadow duration-150 hover:shadow-md">
    <CardContent className="p-4">
      {/* ... content ... */}
    </CardContent>
  </Card>
</Link>
```

**Also replace raw tag spans with Badge component:**
```tsx
// Current:
<span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
  {session.source}
</span>

// Recommended:
<Badge variant="secondary">{session.source}</Badge>
```

**Why:** Using raw inline styles instead of the existing component library creates visual inconsistency. The brainstorms page looks different from the systems page because one uses Card components and the other uses raw styled divs. This is the lowest-hanging fruit for visual consistency.

---

### 4.3 Version Plans Page — Same Treatment

**File:** `app/(app)/projects/[projectId]/versions/page.tsx`

**Apply the same pattern as brainstorms:**

**Current header (lines 18–26) — raw styled Link:**
```tsx
<Link
  href={...}
  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
>
  New version plan
</Link>
```

**Recommended:**
```tsx
<PageHeader
  title="Version Plans"
  actions={
    <Button asChild>
      <Link href={`/projects/${projectId}/versions/new`}>New Version Plan</Link>
    </Button>
  }
/>
```

**Current plan items (lines 39–49) — raw styled cards:**
Replace with Card + CardContent + Badge, same as brainstorms.

**Why:** Same reasoning — component consistency. Every list page should use the same card pattern.

---

### 4.4 Project Overview — Improve Section Spacing

**File:** `app/(app)/projects/[projectId]/overview/page.tsx`

**Current top-level wrapper (line 57):**
```tsx
<div className="space-y-8">
```

This is fine. No change needed to the overall spacing.

**Current quick actions section (lines 189–199):**
```tsx
<section className="flex flex-wrap gap-3">
  <Button asChild>
    <Link href={`/projects/${projectId}/brainstorms/new`}>New Brainstorm</Link>
  </Button>
  <Button variant="secondary" asChild>
    <Link href={`/projects/${projectId}/systems/new`}>New System</Link>
  </Button>
  <Button variant="secondary" asChild>
    <Link href={`/projects/${projectId}/versions/new`}>Generate Version Plan</Link>
  </Button>
</section>
```

**Recommended — wrap in a Card for consistency:**
```tsx
<Card>
  <CardContent className="flex flex-wrap items-center gap-3 py-4 px-6">
    <span className="text-sm font-medium text-muted-foreground mr-2">Quick actions</span>
    <Button size="sm" asChild>
      <Link href={`/projects/${projectId}/brainstorms/new`}>New Brainstorm</Link>
    </Button>
    <Button size="sm" variant="secondary" asChild>
      <Link href={`/projects/${projectId}/systems/new`}>New System</Link>
    </Button>
    <Button size="sm" variant="secondary" asChild>
      <Link href={`/projects/${projectId}/versions/new`}>Generate Version Plan</Link>
    </Button>
  </CardContent>
</Card>
```

**Why:** The quick actions section currently floats at the bottom of the page without any visual container. Wrapping it in a Card with a label gives it visual weight and makes the page feel complete rather than trailing off.

---

### 4.5 Dashboard Content — Tighter Search/Filter Bar

**File:** `app/(app)/dashboard/dashboard-content.tsx`

**Current filter bar (lines 142–189) — search + 2 dropdowns in a column/row flex:**
```tsx
<div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
```

**Recommended — tighter gap, aligned sizing:**
```tsx
<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
```

**Also: add a consistent size to the filter buttons:**

**Current:**
```tsx
<Button variant="outline">
  Status: {initialStatus || 'All'}
</Button>
```

**Recommended:**
```tsx
<Button variant="outline" size="sm">
  Status: {initialStatus || 'All'}
</Button>
```

**Why:** Using `size="sm"` on filter controls makes them visually subordinate to the primary action buttons. Filters are secondary controls and should look lighter than "New Project".

---

### 4.6 Idea Stream — Thread List Checkbox Styling

**File:** `app/(app)/projects/[projectId]/idea-stream/idea-stream-content.tsx`

**Current checkbox (lines 301–307):**
```tsx
<input
  type="checkbox"
  checked={selectedThreadIds.has(thread.id)}
  onChange={() => toggleThreadSelection(thread.id)}
  onClick={(e) => e.stopPropagation()}
  aria-label={`Select thread ${thread.id}`}
  className="mt-1 size-4 shrink-0"
/>
```

**Recommended — style the native checkbox for dark mode:**
```tsx
<input
  type="checkbox"
  checked={selectedThreadIds.has(thread.id)}
  onChange={() => toggleThreadSelection(thread.id)}
  onClick={(e) => e.stopPropagation()}
  aria-label={`Select thread ${thread.id}`}
  className="mt-1 size-4 shrink-0 rounded border-border accent-primary"
/>
```

**Key changes:**
- Added `rounded` for a softer checkbox shape
- Added `border-border` for dark-mode-appropriate border
- Added `accent-primary` — uses the CSS `accent-color` property to tint the checkbox with the primary color

**Why:** Default HTML checkboxes look jarring in a dark-themed app. The `accent-color` CSS property provides a simple way to theme native checkboxes without a full custom implementation.

---

### 4.7 Settings Page — Add Subtle Borders Between Sections

**File:** `app/(app)/settings/page.tsx`

The settings page already uses `border-t border-border` to separate sections within cards. This is good practice and no changes needed.

**One improvement — the prototype card (line 104):**

**Current:**
```tsx
<Card className="rounded-xl border-dashed">
```

**Recommended:**
```tsx
<Card className="rounded-xl border-dashed border-muted-foreground/30">
```

**Why:** The default dashed border uses `border-border` which is very subtle. Using `border-muted-foreground/30` makes the dashed line more visible, clearly communicating "this is a development/prototype section."

---

### 4.8 Systems Page — Grid/Table Toggle Improvement

**File:** `app/(app)/projects/[projectId]/systems/systems-content.tsx`

**Current toggle (lines 84–101):**
```tsx
<div className="flex rounded-lg border border-border p-1">
  <Button
    variant={view === 'grid' ? 'secondary' : 'ghost'}
    size="sm"
    ...
  >
```

**Recommended — use a tighter segmented control:**
```tsx
<div className="flex rounded-md border border-border p-0.5 bg-muted/50">
  <Button
    variant={view === 'grid' ? 'secondary' : 'ghost'}
    size="sm"
    className="h-7 px-2.5 text-xs"
    ...
  >
```

**Key changes:**
- `rounded-lg` → `rounded-md` and `p-1` → `p-0.5`: Tighter segmented control
- Added `bg-muted/50` to the wrapper: Gives the toggle a "recessed" look
- Added `className="h-7 px-2.5 text-xs"` to buttons: Smaller toggle buttons that don't compete with the primary action

**Why:** The view toggle is a secondary control. Making it compact prevents it from visually competing with the "New System" primary button.

---

## Implementation Priority

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | 1.1–1.2 Font loading | Low | High — immediate typography uplift |
| 2 | 1.3 Color palette refinement | Medium | High — entire app feels different |
| 3 | 4.1 Remove translate hover | Low | Medium — fixes jank across all cards |
| 4 | 3.1 TopBar refinements | Low | Medium — header is always visible |
| 5 | 3.2 Sidebar active state | Low | Medium — fixes visual bug |
| 6 | 2.1–2.2 Button/Card refinements | Low | Medium — cleaner base components |
| 7 | 2.3–2.5 Badge/Status improvements | Medium | Medium — design token consistency |
| 8 | 4.2–4.3 Brainstorms/Versions pages | Medium | High — biggest inconsistency fix |
| 9 | 1.4–1.7 Cleanup globals.css | Low | Low — maintenance quality |
| 10 | 4.4–4.8 Page-level polish | Medium | Medium — polish pass |

---

## Files Modified Summary

| File | Phase | Changes |
|------|-------|---------|
| `app/layout.tsx` | 1.1 | Add Inter + JetBrains Mono font imports |
| `app/globals.css` | 1.2–1.7 | Font families, color refinement, shadow tokens, radius, transitions, remove :root dups |
| `components/ui/button.tsx` | 2.1 | Targeted transition instead of transition-all |
| `components/ui/card.tsx` | 2.2 | Remove gap-6 and py-6 from Card base |
| `components/ui/badge.tsx` | 2.3 | Badge typography: 11px, semibold, uppercase, rounded-md |
| `components/status-badge.tsx` | 2.4 | Use CSS variable colors, remove capitalize |
| `components/criticality-badge.tsx` | 2.5 | Use CSS variable colors, remove capitalize |
| `components/ui/input.tsx` | 2.6 | Add hover border state |
| `components/ui/textarea.tsx` | 2.6 | Add hover border state |
| `components/ui/dialog.tsx` | 2.7 | rounded-lg → rounded-xl |
| `components/ui/table.tsx` | 2.8 | Header: muted-foreground, xs, uppercase, tracking |
| `components/top-bar.tsx` | 3.1 | Height, backdrop-blur, remove duplicate settings link |
| `components/project-sidebar.tsx` | 3.2, 3.4, 3.5 | Active state fix, collapse animation, mobile header |
| `app/(app)/projects/[projectId]/layout.tsx` | 3.3 | Content padding + max-width adjustment |
| `components/stat-card.tsx` | 4.1 | Remove translate hover |
| `components/project-card.tsx` | 4.1 | Remove translate hover |
| `components/system-card.tsx` | 4.1 | Remove translate hover |
| `components/dashboard-project-card.tsx` | 4.1 | Remove translate hover |
| `app/(app)/projects/[projectId]/brainstorms/page.tsx` | 4.2 | Use PageHeader + Button + Card + Badge |
| `app/(app)/projects/[projectId]/versions/page.tsx` | 4.3 | Use PageHeader + Button + Card + Badge |
| `app/(app)/projects/[projectId]/overview/page.tsx` | 4.4 | Quick actions in Card |
| `app/(app)/dashboard/dashboard-content.tsx` | 4.5 | Tighter filter bar |
| `app/(app)/projects/[projectId]/idea-stream/idea-stream-content.tsx` | 4.6 | Checkbox styling |
| `app/(app)/settings/page.tsx` | 4.7 | Prototype card border visibility |
| `app/(app)/projects/[projectId]/systems/systems-content.tsx` | 4.8 | Tighter view toggle |

---

## Design Principles Applied

1. **Subtlety over spectacle**: Shadow-only hover states instead of translate. Muted colors for secondary elements. Let content be the hero.
2. **Consistency through components**: Every list page should use the same Card + Badge + Button pattern. No inline-styled one-offs.
3. **Dark-first optimization**: Border-glow shadows, higher-contrast muted text (#a1a1aa vs #71717a), backdrop-blur layering — all techniques that work specifically in dark themes.
4. **Typography as hierarchy**: Inter for UI, JetBrains Mono for code/IDs, systematic size scale from 11px badges to 24px page titles.
5. **Token-driven design**: Colors, radii, shadows, and transitions defined once in globals.css and referenced everywhere via Tailwind utilities.
6. **WCAG AA compliance**: All text combinations verified for 4.5:1 contrast ratio minimum. The muted-foreground upgrade is the highest priority accessibility fix.

---

## UX Research Integration Notes

The following recommendations from `DOCS/ux-research.md` have been incorporated into this plan:

### Incorporated
- **Muted foreground contrast fix** (Section 6): #71717a → #a1a1aa. This is the most impactful accessibility fix.
- **Keep rose-red primary** (Section 6): Research validates current accent. No primary color change.
- **TopBar height reduction** (Section 3): h-16 → h-14 aligns with modern SaaS patterns.
- **Sidebar active state** (Section 3): `bg-accent text-accent-foreground` replaces border-l-2 pattern.
- **Table header treatment** (Section 5): uppercase, tracking-wider, muted-foreground, xs font.
- **Transition timing** (Section 7): 100–300ms range with ease-out/ease-in-out.
- **Typography scale** (Section 4): Inter + JetBrains Mono with tighter tracking on headings.

### Deferred to Future Phase
- **Command palette** (Cmd+K): High-impact UX feature. Shadcn has `<Command>` component ready. Should be Phase 5.
- **Keyboard shortcuts** (Section 7): Global shortcut handler for power users. Phase 5.
- **Expandable card-rows** (Section 5): Hybrid card/table pattern for systems list. Phase 5.
- **Skeleton loading states**: Already partially implemented; full coverage in Phase 5.
- **Semi-transparent borders** (`oklch(1 0 0 / 10%)`): An option for softer border treatment. Can be A/B tested.

### Acknowledged but Not Applied
- **Sidebar width 240px** (Section 3): Research recommends w-60 (240px) vs current w-64 (256px). The 16px difference is minor and changing it would require re-testing responsive breakpoints. Keep w-64.
- **Card min-height 180px** (Section 5): Not applied — cards should size to their content. Fixed min-heights create awkward whitespace when content is short.
- **Inter Display for headings** (Section 4): The weight/optical-size differences between Inter and Inter Display are minimal at our heading sizes (18–24px). Using one font family simplifies the font loading budget.
