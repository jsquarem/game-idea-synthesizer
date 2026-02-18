# GamePlan AI

Documentation-first game design and system planning. Turn brainstorming into structured, versioned, dependency-aware systems and executable plans.

## Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Language:** TypeScript (strict)
- **Database:** SQLite via Prisma
- **UI:** Tailwind CSS 4, Shadcn-style components (Radix UI, CVA)
- **Typography:** Inter (UI) + JetBrains Mono (code/slugs) via `next/font/google`
- **Design:** Dark-first oklch color system, action-blue primary, border-glow shadows
- **State:** Zustand, nuqs for URL state

## Setup

This project uses [just](https://github.com/casey/just) as a command runner. Run `just` to see all available recipes.

**Quick start:**

```bash
just setup   # install deps, generate Prisma client, push schema, create .env if missing
just dev     # start dev server (Turbopack)
```

Open [http://localhost:3000](http://localhost:3000). You are redirected to the dashboard.

**Environment:** `just setup` copies `.env.example` to `.env` if missing. The key variable is `WORKSPACE_SECRETS_MASTER_KEY`, used to encrypt workspace AI API keys at rest. Use a 32-byte hex string or any passphrase (hashed to 32 bytes). Omit only if you do not use workspace AI config in settings.

**Seed data:** Optionally seed the sample game (Guild of Emergent Minds: project, brainstorm, 7 systems, dependencies):

```bash
just seed
```

## Commands

Run `just` to list all recipes. Key commands:

| Command | Description |
|---------|-------------|
| `just setup` | First-time project setup (install, generate, push schema) |
| `just dev` | Start dev server (Turbopack) |
| `just build` | Production build |
| `just start` | Start production server |
| `just check` | Run all checks (lint + typecheck + tests) |
| `just lint` | Lint |
| `just typecheck` | TypeScript type-check |
| `just test` | Unit + integration tests (watch mode) |
| `just test-unit` | Unit + integration tests (single run) |
| `just test-integration` | Integration tests only |
| `just test-e2e` | E2E tests (Playwright; run `npx playwright install` first) |
| `just test-coverage` | Tests with coverage report |
| `just studio` | Open Prisma Studio |
| `just seed` | Seed sample game data |
| `just db-reset` | Drop + recreate database + seed |
| `just db-generate` | Generate Prisma client |
| `just db-push` | Push schema changes to dev database |
| `just db-migrate` | Create a new migration |
| `just docker-up` | Build and start with Docker Compose |
| `just docker-down` | Stop Docker Compose |

## Docker

```bash
just docker-up    # or: docker compose up --build
just docker-down  # or: docker compose down
```

The app runs on port 3000. SQLite data is stored in a volume. On first run you may need to apply the schema (e.g. run `npx prisma db push` in the container or mount an existing `dev.db`).

## Project structure

- `app/` — Next.js App Router (dashboard, projects, brainstorms, systems, dependencies, versions, prompts, export)
- `lib/` — Repositories, services, parsers, graph engine, validations, actions
- `prisma/` — Schema and migrations
- `DOCS/app-systems/` — Subsystem documentation (ingestion, system-extraction, dependency-graph, doc-store, versioning, export-engine, ai-engine, workspace)
- `DOCS/ux-research.md` — UX research findings and best practices
- `DOCS/ux-design-plan.md` — UX design improvement plan (phased)
- `DOCS/ux-review-summary.md` — QA review of UX redesign

## Docs

See `DOCS/` for:

- Product and architecture (PRD, design, frontend/backend, QA)
- UX research, design plan, and review summary
- User Manual

## Change Log

- 2026-02-18: UX redesign — Inter/JetBrains Mono fonts, oklch dark palette with action-blue primary, border-glow shadows, refined components (buttons, cards, badges, inputs, dialogs), slimmer top bar with backdrop blur, sidebar active states, removed jarring card hover translations, page-level polish across dashboard/brainstorms/systems/versions/settings, WCAG AA contrast compliance.
- 2026-02-17: Setup, scripts, structure, workspace AI config env.
