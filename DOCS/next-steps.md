# Next Steps

This document captures the recommended follow-up work after the current implementation pass.

## 1) Stabilize and Validate Current Build (Immediate)

- Run full local verification:
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- Install Playwright browsers and run E2E:
  - `npx playwright install`
  - `npm run test:e2e`
- Validate Docker startup path end-to-end:
  - `docker compose build`
  - `docker compose up`
  - verify app boot + DB initialization behavior
- Confirm Prisma schema state in all environments:
  - local dev DB
  - containerized DB path
  - CI runner behavior

## 2) Close Functional Gaps in Existing Features (High Priority)

### 2.1 Brainstorm Upload Mode
- Implement real file upload parsing for `.md`/`.txt` in brainstorm creation.
- Support drag-and-drop UX (not just tab/placeholder mode).
- Add validation + graceful errors for malformed files.

### 2.2 System Markdown/Form Parity
- Ensure markdown view is fully editable and saves back to structured fields.
- Implement conflict-safe form/markdown toggle behavior while editing.
- Add round-trip safeguards for parser fidelity.

### 2.3 Dependency UX Improvements
- Add remove/edit dependency actions directly on dependency page.
- Add impact analysis panel for selected systems.
- Replace list-only graph view with full interactive DAG canvas (React Flow + dagre).

### 2.4 Version Plan Scope UX
- Improve scope validation messaging (surface exact system names, not only IDs).
- Add phase grouping and milestone generation display.
- Enforce immutability on finalized plans consistently across all update paths.

## 3) Complete AI and Synthesis Layer (Core Product Value)

- Implement provider-agnostic AI engine contracts and provider adapters.
- Build synthesis pipeline:
  - configure
  - processing/streaming
  - review
  - convert to systems
- Add prompt template registry and execution tracking.
- Persist prompt history with robust metadata (duration, token usage, status).

## 4) Expand Testing to Match PRD/QA Targets

- Add missing unit tests for:
  - parsers (system, brainstorm, version plan)
  - graph engine cycle/order/impact behavior
  - services (project, brainstorm, system, dependency, version, export)
- Replace placeholder integration tests with real DB-backed flows.
- Expand E2E scenarios:
  - project creation/edit/delete
  - brainstorm all input modes
  - system CRUD + changelog + markdown toggle
  - dependency creation/cycle rejection
  - version plan creation/finalization
  - export generation/download
- Re-enable strict CI gates once coverage approaches target thresholds.

## 5) Production Readiness and Hardening

- Add environment-specific config handling and clear deployment defaults.
- Improve error reporting + structured server logging.
- Add route-level loading and error boundaries where missing.
- Perform accessibility pass:
  - keyboard navigation
  - focus states
  - ARIA labeling
- Performance pass:
  - reduce unnecessary client components
  - profile expensive server paths
  - optimize data-fetch boundaries

## 6) Documentation and Developer Experience

- Update `README.md` with:
  - complete feature matrix
  - testing workflow
  - known limitations
- Add contributor/dev guide for:
  - architecture boundaries
  - service/repo/parser conventions
  - test patterns
- Keep `DOCS/app-systems/*.md` in sync with implementation changes.

## Suggested Execution Order

1. Stabilization + full test/build verification
2. Brainstorm upload + system markdown parity
3. Dependency UX + version plan UX hardening
4. AI/synthesis implementation
5. Full test suite expansion
6. Production hardening + docs finalization

