# GamePlan AI

Documentation-first game design and system planning. Turn brainstorming into structured, versioned, dependency-aware systems and executable plans.

## Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Language:** TypeScript (strict)
- **Database:** SQLite via Prisma
- **UI:** Tailwind CSS 4, Shadcn-style components
- **State:** Zustand, nuqs for URL state

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Create `.env` with:

   ```
   DATABASE_URL="file:./dev.db"
   ```

3. **Database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

   Optionally seed the sample game (Guild of Emergent Minds: project, brainstorm, 7 systems, dependencies):

   ```bash
   npm run db:seed
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You are redirected to the dashboard.

## Scripts

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run typecheck` — TypeScript check
- `npm run test` — Unit/integration tests (Vitest)
- `npm run test:e2e` — E2E tests (Playwright; run `npx playwright install` first)
- `npm run db:studio` — Open Prisma Studio
- `npm run db:seed` — Seed sample game (Guild of Emergent Minds); skips if already present

## Docker

```bash
docker compose build
docker compose up
```

The app runs on port 3000. SQLite data is stored in a volume. On first run you may need to apply the schema (e.g. run `npx prisma db push` in the container or mount an existing `dev.db`).

## Project structure

- `app/` — Next.js App Router (dashboard, projects, brainstorms, systems, dependencies, versions, prompts, export)
- `lib/` — Repositories, services, parsers, graph engine, validations, actions
- `prisma/` — Schema and migrations
- `docs/app-systems/` — Subsystem documentation (ingestion, system-extraction, dependency-graph, doc-store, versioning, export-engine, ai-engine)

## Docs

See `DOCS/` for:

- Product and architecture (PRD, design, frontend/backend, QA)
- User Manual
