# Backend Architecture Specification

**Product:** GamePlan AI  
**Version:** v1.0  
**Status:** Draft  
**Date:** 2026-02-17  

---

# Table of Contents

1. [Prisma Schema](#1-prisma-schema)
2. [Repository Layer](#2-repository-layer)
3. [Service Layer](#3-service-layer)
4. [Parser Layer](#4-parser-layer)
5. [Graph Engine](#5-graph-engine)
6. [AI Engine](#6-ai-engine)
7. [Server Actions / API Routes](#7-server-actions--api-routes)
8. [Application Subsystem Documentation](#8-application-subsystem-documentation)

---

# 1. Prisma Schema

Complete `prisma/schema.prisma` for SQLite.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── Project ────────────────────────────────────────────────────────

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  genre       String?
  platform    String?
  status      String   @default("ideation") // ideation | active | archived
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  brainstorms       BrainstormSession[]
  synthesizedOutputs SynthesizedOutput[]
  gameSystems       GameSystem[]
  versionPlans      VersionPlan[]
  promptHistories   PromptHistory[]
  exports           Export[]

  @@index([status])
  @@index([createdAt])
}

// ─── Brainstorm Session ─────────────────────────────────────────────

model BrainstormSession {
  id        String   @id @default(cuid())
  projectId String
  title     String
  source    String   @default("manual") // manual | discord | upload
  content   String                      // raw markdown/text content
  author    String?
  tags      String?                     // JSON array stored as string
  createdAt DateTime @default(now())

  project            Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  synthesizedOutputs SynthesizedOutput[]

  @@index([projectId])
  @@index([createdAt])
}

// ─── Synthesized Output ─────────────────────────────────────────────
// Intermediate artifact between brainstorm and game systems.
// Represents the AI-structured extraction before user review/conversion.

model SynthesizedOutput {
  id                  String   @id @default(cuid())
  projectId           String
  brainstormSessionId String
  title               String
  content             String            // structured markdown output from AI
  extractedSystems    String            // JSON array of system stubs
  status              String   @default("pending") // pending | reviewed | converted | discarded
  aiProvider          String?
  aiModel             String?
  promptTokens        Int?
  completionTokens    Int?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  project           Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  brainstormSession BrainstormSession @relation(fields: [brainstormSessionId], references: [id], onDelete: Cascade)
  gameSystems       GameSystem[]

  @@index([projectId])
  @@index([brainstormSessionId])
  @@index([status])
}

// ─── Game System ────────────────────────────────────────────────────
// Maps to every field from Section 7's markdown schema.

model GameSystem {
  id                   String   @id @default(cuid())
  projectId            String
  synthesizedOutputId  String?          // nullable: systems can be manually created
  systemSlug           String           // unique within project, e.g. "combat", "health"
  name                 String
  version              String   @default("v0.1")
  status               String   @default("draft") // draft | active | deprecated
  purpose              String?          // high-level description
  currentState         String?          // what is currently defined
  targetState          String?          // desired evolution
  coreMechanics        String?          // primary behaviors (markdown)
  inputs               String?          // consumed data/interactions (markdown)
  outputs              String?          // produced state/data (markdown)
  failureStates        String?          // how this system can break (markdown)
  scalingBehavior      String?          // how it evolves over time (markdown)
  mvpCriticality       String   @default("important") // core | important | later
  implementationNotes  String?          // constraints or assumptions (markdown)
  openQuestions        String?          // unresolved areas (markdown)
  markdownContent      String?          // full rendered markdown (canonical)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  project           Project            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  synthesizedOutput SynthesizedOutput?  @relation(fields: [synthesizedOutputId], references: [id], onDelete: SetNull)

  dependsOn         Dependency[]       @relation("DependsOn")
  dependedOnBy      Dependency[]       @relation("DependedOnBy")
  changeLogs        ChangeLog[]
  versionPlanItems  VersionPlanItem[]
  promptHistories   PromptHistory[]

  @@unique([projectId, systemSlug])
  @@index([projectId])
  @@index([status])
  @@index([mvpCriticality])
}

// ─── Dependency ─────────────────────────────────────────────────────
// Directed edge: sourceSystemId depends on targetSystemId

model Dependency {
  id             String   @id @default(cuid())
  sourceSystemId String           // the system that has the dependency
  targetSystemId String           // the system being depended upon
  dependencyType String   @default("requires") // requires | enhances | optional
  description    String?
  createdAt      DateTime @default(now())

  sourceSystem GameSystem @relation("DependsOn", fields: [sourceSystemId], references: [id], onDelete: Cascade)
  targetSystem GameSystem @relation("DependedOnBy", fields: [targetSystemId], references: [id], onDelete: Cascade)

  @@unique([sourceSystemId, targetSystemId])
  @@index([sourceSystemId])
  @@index([targetSystemId])
}

// ─── Change Log ─────────────────────────────────────────────────────
// Tracks system evolution over time (Section 7 Change Log field).

model ChangeLog {
  id           String   @id @default(cuid())
  gameSystemId String
  version      String           // version at time of change
  summary      String           // what changed
  details      String?          // extended description (markdown)
  changeType   String   @default("update") // create | update | merge | split | deprecate
  author       String?
  createdAt    DateTime @default(now())

  gameSystem GameSystem @relation(fields: [gameSystemId], references: [id], onDelete: Cascade)

  @@index([gameSystemId])
  @@index([createdAt])
}

// ─── Version Plan ───────────────────────────────────────────────────

model VersionPlan {
  id                String   @id @default(cuid())
  projectId         String
  versionLabel      String           // e.g. "v1", "v1.1", "v2"
  title             String
  description       String?
  status            String   @default("draft") // draft | finalized | archived
  includedSystems   String           // JSON array of system IDs
  excludedSystems   String?          // JSON array of system IDs
  phases            String?          // JSON array of phase objects
  milestones        String?          // JSON array of milestone objects
  riskAreas         String?          // JSON array of risk descriptions
  implementationOrder String?        // JSON array of ordered system IDs
  scopeValidation   String?          // markdown notes on scope validation
  markdownContent   String?          // full rendered markdown (canonical)
  finalizedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  project      Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  planItems    VersionPlanItem[]

  @@unique([projectId, versionLabel])
  @@index([projectId])
  @@index([status])
}

// ─── Version Plan Item ──────────────────────────────────────────────
// Junction table linking version plans to systems with ordering.

model VersionPlanItem {
  id            String @id @default(cuid())
  versionPlanId String
  gameSystemId  String
  phase         Int    @default(1)     // which phase this system belongs to
  sortOrder     Int    @default(0)     // order within phase
  notes         String?

  versionPlan VersionPlan @relation(fields: [versionPlanId], references: [id], onDelete: Cascade)
  gameSystem  GameSystem  @relation(fields: [gameSystemId], references: [id], onDelete: Cascade)

  @@unique([versionPlanId, gameSystemId])
  @@index([versionPlanId])
}

// ─── Prompt History ─────────────────────────────────────────────────

model PromptHistory {
  id              String   @id @default(cuid())
  projectId       String
  gameSystemId    String?          // nullable: prompts can target version plans, not just systems
  versionPlanId   String?
  promptType      String           // synthesis | implementation | architecture | refactor | balance | expansion | evolution_delta
  promptTemplate  String           // template key/name used
  promptInput     String           // assembled prompt sent to AI (full text)
  promptContext   String?          // JSON: structured context snapshot
  response        String?          // AI response text
  aiProvider      String
  aiModel         String
  promptTokens    Int?
  completionTokens Int?
  durationMs      Int?
  status          String   @default("completed") // pending | completed | failed | cancelled
  error           String?
  createdAt       DateTime @default(now())

  project    Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  gameSystem GameSystem? @relation(fields: [gameSystemId], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@index([gameSystemId])
  @@index([promptType])
  @@index([createdAt])
}

// ─── Export ─────────────────────────────────────────────────────────

model Export {
  id          String   @id @default(cuid())
  projectId   String
  exportType  String           // gdd | version_prd | system_doc | roadmap | prompt_bundle
  format      String   @default("markdown") // markdown | json
  content     String           // rendered export content
  metadata    String?          // JSON: export config, included systems, etc.
  createdAt   DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([exportType])
}
```

### Schema Design Notes

- **JSON-in-String pattern**: SQLite lacks a native JSON column type. Fields like `tags`, `extractedSystems`, `includedSystems`, `excludedSystems`, `phases`, `milestones`, `riskAreas`, `implementationOrder`, `promptContext`, and `metadata` are stored as `String` and serialized/deserialized via JSON utilities in the repository layer.
- **Cascade deletes**: Deleting a project cascades to all child records. Deleting a game system cascades dependencies and change logs.
- **`systemSlug` uniqueness**: Scoped to project via `@@unique([projectId, systemSlug])`.
- **`SynthesizedOutput`**: Serves as the intermediate artifact between brainstorm ingestion (step 3) and system creation (step 6). It captures the AI's structured extraction before user review.
- **`ChangeLog`**: Tracks all mutations to a game system over time, enabling the evolution model from Section 8.
- **Immutability**: `BrainstormSession` has no `updatedAt` — brainstorms are immutable records. `VersionPlan` enforces immutability at the service layer once `status = "finalized"`.

---

# 2. Repository Layer

All repositories live in `lib/repositories/`. Each exports pure data-access functions that operate on Prisma models. No business logic. No markdown parsing. No graph computation.

### Shared Types

```typescript
// lib/repositories/types.ts

export type PaginationParams = {
  page?: number
  pageSize?: number
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type SortDirection = 'asc' | 'desc'
```

---

## 2.1 `lib/repositories/project.repository.ts`

```typescript
import { Prisma, Project } from '@prisma/client'
import { PaginatedResult, PaginationParams } from './types'

export type CreateProjectInput = {
  name: string
  description?: string
  genre?: string
  platform?: string
  status?: string
}

export type UpdateProjectInput = Partial<CreateProjectInput>

export type ProjectFilter = {
  status?: string
  search?: string
}

// Create a new project
export async function createProject(data: CreateProjectInput): Promise<Project>

// Get project by ID (throws if not found)
export async function getProjectById(id: string): Promise<Project>

// Get project by ID or null
export async function findProjectById(id: string): Promise<Project | null>

// List all projects with optional filtering and pagination
export async function listProjects(
  filter?: ProjectFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<Project>>

// Update a project
export async function updateProject(id: string, data: UpdateProjectInput): Promise<Project>

// Delete a project (cascades all children)
export async function deleteProject(id: string): Promise<void>

// Get project with all related counts (dashboard summary)
export async function getProjectSummary(id: string): Promise<
  Project & {
    _count: {
      brainstorms: number
      gameSystems: number
      versionPlans: number
      synthesizedOutputs: number
    }
  }
>
```

---

## 2.2 `lib/repositories/brainstorm.repository.ts`

```typescript
import { BrainstormSession } from '@prisma/client'
import { PaginatedResult, PaginationParams } from './types'

export type CreateBrainstormInput = {
  projectId: string
  title: string
  source?: string
  content: string
  author?: string
  tags?: string[]  // serialized to JSON string before storage
}

export type BrainstormFilter = {
  projectId: string
  source?: string
  search?: string
}

// Create a new brainstorm session (immutable once created)
export async function createBrainstorm(data: CreateBrainstormInput): Promise<BrainstormSession>

// Get brainstorm by ID
export async function getBrainstormById(id: string): Promise<BrainstormSession>

// Find brainstorm by ID or null
export async function findBrainstormById(id: string): Promise<BrainstormSession | null>

// List brainstorms for a project
export async function listBrainstorms(
  filter: BrainstormFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<BrainstormSession>>

// Delete a brainstorm session
export async function deleteBrainstorm(id: string): Promise<void>

// Get brainstorm with its synthesized outputs
export async function getBrainstormWithOutputs(id: string): Promise<
  BrainstormSession & { synthesizedOutputs: SynthesizedOutput[] }
>
```

---

## 2.3 `lib/repositories/synthesized-output.repository.ts`

```typescript
import { SynthesizedOutput } from '@prisma/client'
import { PaginatedResult, PaginationParams } from './types'

export type CreateSynthesizedOutputInput = {
  projectId: string
  brainstormSessionId: string
  title: string
  content: string
  extractedSystems: object[]  // serialized to JSON string
  aiProvider?: string
  aiModel?: string
  promptTokens?: number
  completionTokens?: number
}

export type UpdateSynthesizedOutputInput = {
  status?: string
  content?: string
  extractedSystems?: object[]
}

// Create a synthesized output
export async function createSynthesizedOutput(
  data: CreateSynthesizedOutputInput
): Promise<SynthesizedOutput>

// Get by ID
export async function getSynthesizedOutputById(id: string): Promise<SynthesizedOutput>

// Find by ID or null
export async function findSynthesizedOutputById(id: string): Promise<SynthesizedOutput | null>

// List outputs for a project
export async function listSynthesizedOutputs(
  projectId: string,
  pagination?: PaginationParams
): Promise<PaginatedResult<SynthesizedOutput>>

// List outputs for a brainstorm session
export async function listOutputsByBrainstorm(
  brainstormSessionId: string
): Promise<SynthesizedOutput[]>

// Update output (status transitions, content edits)
export async function updateSynthesizedOutput(
  id: string,
  data: UpdateSynthesizedOutputInput
): Promise<SynthesizedOutput>

// Delete output
export async function deleteSynthesizedOutput(id: string): Promise<void>

// Get output with its generated game systems
export async function getOutputWithSystems(id: string): Promise<
  SynthesizedOutput & { gameSystems: GameSystem[] }
>
```

---

## 2.4 `lib/repositories/game-system.repository.ts`

```typescript
import { GameSystem, ChangeLog } from '@prisma/client'
import { PaginatedResult, PaginationParams } from './types'

export type CreateGameSystemInput = {
  projectId: string
  synthesizedOutputId?: string
  systemSlug: string
  name: string
  version?: string
  status?: string
  purpose?: string
  currentState?: string
  targetState?: string
  coreMechanics?: string
  inputs?: string
  outputs?: string
  failureStates?: string
  scalingBehavior?: string
  mvpCriticality?: string
  implementationNotes?: string
  openQuestions?: string
  markdownContent?: string
}

export type UpdateGameSystemInput = Partial<Omit<CreateGameSystemInput, 'projectId' | 'systemSlug'>>

export type GameSystemFilter = {
  projectId: string
  status?: string
  mvpCriticality?: string
  search?: string
}

export type GameSystemWithRelations = GameSystem & {
  dependsOn: (Dependency & { targetSystem: GameSystem })[]
  dependedOnBy: (Dependency & { sourceSystem: GameSystem })[]
  changeLogs: ChangeLog[]
}

// Create a new game system
export async function createGameSystem(data: CreateGameSystemInput): Promise<GameSystem>

// Get game system by ID
export async function getGameSystemById(id: string): Promise<GameSystem>

// Find by ID or null
export async function findGameSystemById(id: string): Promise<GameSystem | null>

// Get game system by project + slug
export async function getGameSystemBySlug(
  projectId: string,
  systemSlug: string
): Promise<GameSystem | null>

// List game systems for a project
export async function listGameSystems(
  filter: GameSystemFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<GameSystem>>

// Get all game systems for a project (no pagination, for graph building)
export async function getAllGameSystems(projectId: string): Promise<GameSystem[]>

// Update a game system
export async function updateGameSystem(
  id: string,
  data: UpdateGameSystemInput
): Promise<GameSystem>

// Delete a game system
export async function deleteGameSystem(id: string): Promise<void>

// Get game system with all relations (dependencies, changelog, etc.)
export async function getGameSystemFull(id: string): Promise<GameSystemWithRelations>

// Batch create game systems (for synthesis conversion)
export async function createGameSystemsBatch(
  systems: CreateGameSystemInput[]
): Promise<GameSystem[]>

// Add a change log entry
export async function createChangeLog(data: {
  gameSystemId: string
  version: string
  summary: string
  details?: string
  changeType?: string
  author?: string
}): Promise<ChangeLog>

// List change logs for a system
export async function listChangeLogs(gameSystemId: string): Promise<ChangeLog[]>
```

---

## 2.5 `lib/repositories/dependency.repository.ts`

```typescript
import { Dependency } from '@prisma/client'

export type CreateDependencyInput = {
  sourceSystemId: string
  targetSystemId: string
  dependencyType?: string
  description?: string
}

export type DependencyWithSystems = Dependency & {
  sourceSystem: { id: string; name: string; systemSlug: string }
  targetSystem: { id: string; name: string; systemSlug: string }
}

// Create a dependency edge
export async function createDependency(data: CreateDependencyInput): Promise<Dependency>

// Delete a dependency edge
export async function deleteDependency(id: string): Promise<void>

// Delete dependency by source + target pair
export async function deleteDependencyByPair(
  sourceSystemId: string,
  targetSystemId: string
): Promise<void>

// Get all dependencies for a project (via system IDs)
export async function listDependenciesByProject(
  projectId: string
): Promise<DependencyWithSystems[]>

// Get all dependencies where system is source (what it depends on)
export async function listDependenciesFrom(
  systemId: string
): Promise<DependencyWithSystems[]>

// Get all dependencies where system is target (what depends on it)
export async function listDependenciesTo(
  systemId: string
): Promise<DependencyWithSystems[]>

// Batch create dependencies
export async function createDependenciesBatch(
  deps: CreateDependencyInput[]
): Promise<Dependency[]>

// Delete all dependencies for a system (used during merge/split)
export async function deleteAllDependenciesForSystem(systemId: string): Promise<void>

// Check if a specific dependency exists
export async function dependencyExists(
  sourceSystemId: string,
  targetSystemId: string
): Promise<boolean>
```

---

## 2.6 `lib/repositories/version-plan.repository.ts`

```typescript
import { VersionPlan, VersionPlanItem } from '@prisma/client'
import { PaginatedResult, PaginationParams } from './types'

export type CreateVersionPlanInput = {
  projectId: string
  versionLabel: string
  title: string
  description?: string
  includedSystems: string[]    // JSON serialized
  excludedSystems?: string[]   // JSON serialized
  phases?: object[]
  milestones?: object[]
  riskAreas?: string[]
  implementationOrder?: string[]
  scopeValidation?: string
  markdownContent?: string
}

export type UpdateVersionPlanInput = Partial<
  Omit<CreateVersionPlanInput, 'projectId' | 'versionLabel'>
> & {
  status?: string
}

export type VersionPlanWithItems = VersionPlan & {
  planItems: (VersionPlanItem & { gameSystem: GameSystem })[]
}

// Create a version plan
export async function createVersionPlan(data: CreateVersionPlanInput): Promise<VersionPlan>

// Get version plan by ID
export async function getVersionPlanById(id: string): Promise<VersionPlan>

// Find by ID or null
export async function findVersionPlanById(id: string): Promise<VersionPlan | null>

// Get plan by project + version label
export async function getVersionPlanByLabel(
  projectId: string,
  versionLabel: string
): Promise<VersionPlan | null>

// List version plans for a project
export async function listVersionPlans(
  projectId: string,
  pagination?: PaginationParams
): Promise<PaginatedResult<VersionPlan>>

// Update version plan (fails if finalized — enforced in service layer)
export async function updateVersionPlan(
  id: string,
  data: UpdateVersionPlanInput
): Promise<VersionPlan>

// Finalize a version plan (sets finalizedAt, status = 'finalized')
export async function finalizeVersionPlan(id: string): Promise<VersionPlan>

// Delete version plan
export async function deleteVersionPlan(id: string): Promise<void>

// Get version plan with all plan items and their systems
export async function getVersionPlanFull(id: string): Promise<VersionPlanWithItems>

// ─── Plan Items ─────────────────────────────────────────────────────

// Add a system to a version plan
export async function addPlanItem(data: {
  versionPlanId: string
  gameSystemId: string
  phase?: number
  sortOrder?: number
  notes?: string
}): Promise<VersionPlanItem>

// Remove a system from a version plan
export async function removePlanItem(
  versionPlanId: string,
  gameSystemId: string
): Promise<void>

// Update plan item ordering
export async function updatePlanItem(
  id: string,
  data: { phase?: number; sortOrder?: number; notes?: string }
): Promise<VersionPlanItem>

// Batch set plan items (replace all items for a plan)
export async function setPlanItems(
  versionPlanId: string,
  items: { gameSystemId: string; phase: number; sortOrder: number; notes?: string }[]
): Promise<VersionPlanItem[]>
```

---

## 2.7 `lib/repositories/prompt-history.repository.ts`

```typescript
import { PromptHistory } from '@prisma/client'
import { PaginatedResult, PaginationParams } from './types'

export type CreatePromptHistoryInput = {
  projectId: string
  gameSystemId?: string
  versionPlanId?: string
  promptType: string
  promptTemplate: string
  promptInput: string
  promptContext?: object    // JSON serialized
  response?: string
  aiProvider: string
  aiModel: string
  promptTokens?: number
  completionTokens?: number
  durationMs?: number
  status?: string
  error?: string
}

export type UpdatePromptHistoryInput = {
  response?: string
  promptTokens?: number
  completionTokens?: number
  durationMs?: number
  status?: string
  error?: string
}

export type PromptHistoryFilter = {
  projectId: string
  gameSystemId?: string
  promptType?: string
}

// Create a prompt history entry
export async function createPromptHistory(
  data: CreatePromptHistoryInput
): Promise<PromptHistory>

// Get by ID
export async function getPromptHistoryById(id: string): Promise<PromptHistory>

// Update prompt history (used to record response after AI call)
export async function updatePromptHistory(
  id: string,
  data: UpdatePromptHistoryInput
): Promise<PromptHistory>

// List prompt history with filters
export async function listPromptHistory(
  filter: PromptHistoryFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<PromptHistory>>

// Get all prompt history for a system
export async function listPromptHistoryForSystem(
  gameSystemId: string
): Promise<PromptHistory[]>

// Delete prompt history entry
export async function deletePromptHistory(id: string): Promise<void>
```

---

# 3. Service Layer

All services live in `lib/services/`. Services contain business logic and orchestrate repository calls, parser invocations, graph operations, and AI engine calls. Services never touch Prisma directly — they go through repositories.

### Shared Service Types

```typescript
// lib/services/types.ts

export type ServiceResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
  code: 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' | 'IMMUTABLE' | 'AI_ERROR' | 'CYCLE_DETECTED' | 'INTERNAL'
}

export type EvolutionDelta = {
  systemId: string
  systemName: string
  deltaSummary: string
  requiredChanges: string[]
  dependencyImpact: {
    added: string[]
    removed: string[]
    modified: string[]
  }
  suggestedRefactorOrder: string[]
}
```

---

## 3.1 `lib/services/project.service.ts`

```typescript
import { Project } from '@prisma/client'
import { ServiceResult } from './types'
import { PaginatedResult, PaginationParams } from '../repositories/types'
import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilter
} from '../repositories/project.repository'

// Create a new project with validation
export async function createProject(input: CreateProjectInput): Promise<ServiceResult<Project>>

// Get project by ID
export async function getProject(id: string): Promise<ServiceResult<Project>>

// List projects
export async function listProjects(
  filter?: ProjectFilter,
  pagination?: PaginationParams
): Promise<ServiceResult<PaginatedResult<Project>>>

// Update project
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<ServiceResult<Project>>

// Delete project (warns about cascade)
export async function deleteProject(id: string): Promise<ServiceResult<void>>

// Get full project dashboard (counts, recent activity)
export async function getProjectDashboard(id: string): Promise<ServiceResult<{
  project: Project
  systemCount: number
  brainstormCount: number
  versionPlanCount: number
  synthesizedOutputCount: number
  recentSystems: GameSystem[]
  recentBrainstorms: BrainstormSession[]
}>>
```

---

## 3.2 `lib/services/brainstorm.service.ts`

```typescript
import { BrainstormSession } from '@prisma/client'
import { ServiceResult } from './types'
import { PaginatedResult, PaginationParams } from '../repositories/types'

export type BrainstormInput = {
  projectId: string
  title: string
  source?: 'manual' | 'discord' | 'upload'
  content: string
  author?: string
  tags?: string[]
}

// Ingest a new brainstorm session
// Validates project exists, stores content, optionally auto-triggers synthesis
export async function ingestBrainstorm(
  input: BrainstormInput
): Promise<ServiceResult<BrainstormSession>>

// Get brainstorm by ID with validation
export async function getBrainstorm(id: string): Promise<ServiceResult<BrainstormSession>>

// List brainstorms for project
export async function listBrainstorms(
  projectId: string,
  pagination?: PaginationParams
): Promise<ServiceResult<PaginatedResult<BrainstormSession>>>

// Delete brainstorm (also marks related synthesized outputs as discarded)
export async function deleteBrainstorm(id: string): Promise<ServiceResult<void>>

// Get brainstorm with all synthesis results
export async function getBrainstormWithSynthesis(id: string): Promise<ServiceResult<{
  brainstorm: BrainstormSession
  synthesizedOutputs: SynthesizedOutput[]
}>>
```

---

## 3.3 `lib/services/synthesis.service.ts`

Orchestrates the full brainstorm → synthesis → review → system conversion pipeline (PRD Section 9, steps 4–6).

```typescript
import { SynthesizedOutput, GameSystem } from '@prisma/client'
import { ServiceResult } from './types'

export type SynthesisOptions = {
  aiProvider?: string
  aiModel?: string
  additionalContext?: string
}

export type SystemStub = {
  name: string
  systemSlug: string
  purpose: string
  coreMechanics: string
  suggestedDependencies: string[]
  mvpCriticality: 'core' | 'important' | 'later'
}

export type ConversionOptions = {
  selectedSystems: string[]   // slugs from extracted systems to convert
  overrides?: Record<string, Partial<SystemStub>>  // user edits before conversion
}

// Step 4: Synthesize a brainstorm session into structured output
// Calls AI engine, parses response, stores SynthesizedOutput
export async function synthesizeBrainstorm(
  brainstormId: string,
  options?: SynthesisOptions
): Promise<ServiceResult<SynthesizedOutput>>

// Step 5: Get the structured review view of a synthesized output
// Parses extractedSystems JSON, resolves potential conflicts
export async function getReviewData(synthesizedOutputId: string): Promise<ServiceResult<{
  output: SynthesizedOutput
  systems: SystemStub[]
  potentialConflicts: { slug: string; existingSystemId: string }[]
}>>

// Step 6: Convert reviewed synthesized output into actual GameSystem records
// Creates systems, establishes initial dependencies, logs changelog entries
export async function convertToSystems(
  synthesizedOutputId: string,
  options: ConversionOptions
): Promise<ServiceResult<GameSystem[]>>

// Re-synthesize with different parameters (does not overwrite previous output)
export async function reSynthesize(
  brainstormId: string,
  options?: SynthesisOptions
): Promise<ServiceResult<SynthesizedOutput>>

// Discard a synthesized output
export async function discardOutput(
  synthesizedOutputId: string
): Promise<ServiceResult<void>>
```

---

## 3.4 `lib/services/game-system.service.ts`

Full CRUD plus evolution model (Section 8: delta summary, required changes, dependency impact, refactor order).

```typescript
import { GameSystem, ChangeLog } from '@prisma/client'
import { ServiceResult, EvolutionDelta } from './types'
import { PaginatedResult, PaginationParams } from '../repositories/types'
import {
  CreateGameSystemInput,
  UpdateGameSystemInput,
  GameSystemFilter,
  GameSystemWithRelations
} from '../repositories/game-system.repository'

// Create a game system manually
export async function createSystem(
  input: CreateGameSystemInput
): Promise<ServiceResult<GameSystem>>

// Get a game system by ID with full relations
export async function getSystem(id: string): Promise<ServiceResult<GameSystemWithRelations>>

// Get game system by project + slug
export async function getSystemBySlug(
  projectId: string,
  slug: string
): Promise<ServiceResult<GameSystem>>

// List systems for a project
export async function listSystems(
  filter: GameSystemFilter,
  pagination?: PaginationParams
): Promise<ServiceResult<PaginatedResult<GameSystem>>>

// Update a game system (validates, logs changelog, re-renders markdown)
export async function updateSystem(
  id: string,
  input: UpdateGameSystemInput,
  changeSummary: string
): Promise<ServiceResult<GameSystem>>

// Delete a game system (validates no dependents unless force)
export async function deleteSystem(
  id: string,
  force?: boolean
): Promise<ServiceResult<void>>

// ─── Merge & Split ──────────────────────────────────────────────────

// Merge two systems into one
// - Combines fields, unions dependencies, logs changelogs on all affected systems
// - Deprecates source systems, creates new merged system
export async function mergeSystems(
  systemIdA: string,
  systemIdB: string,
  mergedName: string,
  mergedSlug: string
): Promise<ServiceResult<GameSystem>>

// Split a system into multiple systems
// - Creates new systems from provided definitions
// - Redistributes dependencies
// - Deprecates original, logs changelogs
export async function splitSystem(
  systemId: string,
  newSystems: {
    name: string
    systemSlug: string
    purpose: string
    fieldOverrides?: Partial<CreateGameSystemInput>
  }[]
): Promise<ServiceResult<GameSystem[]>>

// ─── Evolution Model (Section 8) ────────────────────────────────────

// Generate an evolution delta for a system (AI-assisted)
// Compares currentState vs targetState, analyzes dependency impact
export async function generateEvolutionDelta(
  systemId: string
): Promise<ServiceResult<EvolutionDelta>>

// Apply a reviewed evolution delta (user-approved changes)
export async function applyEvolutionDelta(
  systemId: string,
  delta: EvolutionDelta,
  approvedChanges: string[]  // subset of requiredChanges the user approved
): Promise<ServiceResult<GameSystem>>

// ─── Markdown ───────────────────────────────────────────────────────

// Render system to markdown (using Section 7 template)
export async function renderSystemMarkdown(id: string): Promise<ServiceResult<string>>

// Import system from markdown text
export async function importSystemFromMarkdown(
  projectId: string,
  markdown: string
): Promise<ServiceResult<GameSystem>>

// Get changelog for a system
export async function getChangelog(systemId: string): Promise<ServiceResult<ChangeLog[]>>
```

---

## 3.5 `lib/services/dependency.service.ts`

Graph-oriented business logic. Delegates structural graph operations to `lib/graph/`.

```typescript
import { Dependency } from '@prisma/client'
import { ServiceResult } from './types'
import {
  DependencyWithSystems,
  CreateDependencyInput
} from '../repositories/dependency.repository'

export type DependencyGraph = {
  nodes: { id: string; name: string; systemSlug: string; mvpCriticality: string }[]
  edges: { source: string; target: string; type: string }[]
}

export type ImpactAnalysis = {
  directUpstream: string[]      // systems this depends on
  directDownstream: string[]    // systems that depend on this
  transitiveUpstream: string[]  // all recursive upstream
  transitiveDownstream: string[] // all recursive downstream
  riskSurface: string[]         // systems at risk if this changes
  implementationOrder: string[] // topologically sorted affected set
}

// Add a dependency (validates no cycles, systems exist and belong to same project)
export async function addDependency(
  input: CreateDependencyInput
): Promise<ServiceResult<Dependency>>

// Remove a dependency
export async function removeDependency(
  sourceSystemId: string,
  targetSystemId: string
): Promise<ServiceResult<void>>

// Get the full dependency graph for a project
export async function getProjectGraph(
  projectId: string
): Promise<ServiceResult<DependencyGraph>>

// Run impact analysis on a single system
export async function analyzeImpact(
  systemId: string
): Promise<ServiceResult<ImpactAnalysis>>

// Get topological implementation order for a project
export async function getImplementationOrder(
  projectId: string
): Promise<ServiceResult<string[]>>

// Detect cycles in the project's dependency graph
export async function detectCycles(
  projectId: string
): Promise<ServiceResult<string[][]>>

// Validate that a set of systems forms a valid scope (no dangling dependencies)
export async function validateScope(
  systemIds: string[]
): Promise<ServiceResult<{
  valid: boolean
  missingDependencies: { systemId: string; missingDep: string }[]
}>>

// Get risk surface (systems with high fan-in or fan-out)
export async function getRiskSurface(
  projectId: string
): Promise<ServiceResult<{
  highFanIn: { systemId: string; name: string; count: number }[]
  highFanOut: { systemId: string; name: string; count: number }[]
}>>

// Bulk set dependencies for a system (replace all outgoing edges)
export async function setDependencies(
  systemId: string,
  targetSystemIds: string[]
): Promise<ServiceResult<Dependency[]>>
```

---

## 3.6 `lib/services/version-plan.service.ts`

Version plan lifecycle with immutability enforcement.

```typescript
import { VersionPlan, VersionPlanItem } from '@prisma/client'
import { ServiceResult } from './types'
import { PaginatedResult, PaginationParams } from '../repositories/types'
import { VersionPlanWithItems } from '../repositories/version-plan.repository'

export type CreateVersionPlanInput = {
  projectId: string
  versionLabel: string
  title: string
  description?: string
  systemIds: string[]       // systems to include
}

export type GeneratedPlan = {
  plan: VersionPlan
  phases: {
    phase: number
    systems: { id: string; name: string; slug: string }[]
    description: string
  }[]
  milestones: { name: string; systems: string[]; description: string }[]
  riskAreas: string[]
  implementationOrder: string[]
  scopeValidation: {
    valid: boolean
    warnings: string[]
    missingDeps: string[]
  }
}

// Create a version plan (validates systems, computes phases via dependency graph)
export async function createVersionPlan(
  input: CreateVersionPlanInput
): Promise<ServiceResult<GeneratedPlan>>

// Get a version plan by ID
export async function getVersionPlan(id: string): Promise<ServiceResult<VersionPlanWithItems>>

// List version plans for a project
export async function listVersionPlans(
  projectId: string,
  pagination?: PaginationParams
): Promise<ServiceResult<PaginatedResult<VersionPlan>>>

// Update a draft version plan (fails if finalized)
export async function updateVersionPlan(
  id: string,
  input: {
    title?: string
    description?: string
    systemIds?: string[]
  }
): Promise<ServiceResult<VersionPlan>>

// Finalize a version plan (makes it immutable)
// Snapshots current system states, sets finalizedAt
export async function finalizeVersionPlan(
  id: string
): Promise<ServiceResult<VersionPlan>>

// Delete a version plan (fails if finalized)
export async function deleteVersionPlan(id: string): Promise<ServiceResult<void>>

// Regenerate phases and ordering for a draft plan
export async function regeneratePlan(
  id: string
): Promise<ServiceResult<GeneratedPlan>>

// Validate version scope against dependency graph
export async function validatePlanScope(
  id: string
): Promise<ServiceResult<{
  valid: boolean
  warnings: string[]
  missingDeps: string[]
  suggestedAdditions: string[]
}>>

// Render version plan to markdown
export async function renderPlanMarkdown(id: string): Promise<ServiceResult<string>>
```

---

## 3.7 `lib/services/prompt.service.ts`

Template management, prompt generation, history tracking.

```typescript
import { PromptHistory } from '@prisma/client'
import { ServiceResult } from './types'
import { PaginatedResult, PaginationParams } from '../repositories/types'

export type PromptType =
  | 'synthesis'
  | 'implementation'
  | 'architecture'
  | 'refactor'
  | 'balance'
  | 'expansion'
  | 'evolution_delta'

export type PromptOutputMode = 'raw' | 'with_context' | 'bundle'

export type GeneratePromptInput = {
  projectId: string
  promptType: PromptType
  targetSystemId?: string
  targetVersionPlanId?: string
  outputMode?: PromptOutputMode
  additionalContext?: string
  aiProvider?: string
  aiModel?: string
}

export type GeneratedPrompt = {
  promptText: string
  context: Record<string, unknown>
  templateUsed: string
  estimatedTokens: number
}

export type PromptExecutionResult = {
  history: PromptHistory
  response: string
  usage: {
    promptTokens: number
    completionTokens: number
    durationMs: number
  }
}

// Generate a prompt (without executing it)
export async function generatePrompt(
  input: GeneratePromptInput
): Promise<ServiceResult<GeneratedPrompt>>

// Generate and execute a prompt (calls AI, stores history)
export async function executePrompt(
  input: GeneratePromptInput
): Promise<ServiceResult<PromptExecutionResult>>

// List available prompt templates
export async function listTemplates(): Promise<ServiceResult<{
  type: PromptType
  name: string
  description: string
  requiredContext: string[]
}[]>>

// Get prompt history for a project
export async function getPromptHistory(
  projectId: string,
  filter?: { promptType?: PromptType; gameSystemId?: string },
  pagination?: PaginationParams
): Promise<ServiceResult<PaginatedResult<PromptHistory>>>

// Get a single prompt history entry
export async function getPromptHistoryEntry(
  id: string
): Promise<ServiceResult<PromptHistory>>

// Re-execute a previous prompt with same parameters
export async function reExecutePrompt(
  historyId: string
): Promise<ServiceResult<PromptExecutionResult>>
```

---

## 3.8 `lib/services/export.service.ts`

Document generation across all export types.

```typescript
import { Export } from '@prisma/client'
import { ServiceResult } from './types'

export type ExportType = 'gdd' | 'version_prd' | 'system_doc' | 'roadmap' | 'prompt_bundle'
export type ExportFormat = 'markdown' | 'json'

export type ExportInput = {
  projectId: string
  exportType: ExportType
  format?: ExportFormat
  options?: {
    versionPlanId?: string      // required for version_prd
    systemIds?: string[]        // for system_doc, subset selection
    includeChangelog?: boolean
    includeDependencyGraph?: boolean
    includePromptHistory?: boolean
  }
}

export type ExportResult = {
  export: Export
  content: string
  filename: string
  mimeType: string
}

// Generate a full Game Design Document
export async function exportGDD(
  projectId: string,
  format?: ExportFormat
): Promise<ServiceResult<ExportResult>>

// Generate a Version PRD for a specific version plan
export async function exportVersionPRD(
  versionPlanId: string,
  format?: ExportFormat
): Promise<ServiceResult<ExportResult>>

// Export individual system documents
export async function exportSystemDocs(
  systemIds: string[],
  format?: ExportFormat
): Promise<ServiceResult<ExportResult>>

// Export a roadmap plan
export async function exportRoadmap(
  projectId: string,
  format?: ExportFormat
): Promise<ServiceResult<ExportResult>>

// Export a prompt bundle (all prompts + context for a scope)
export async function exportPromptBundle(
  projectId: string,
  options?: { versionPlanId?: string; systemIds?: string[] }
): Promise<ServiceResult<ExportResult>>

// Generic export dispatcher
export async function generateExport(
  input: ExportInput
): Promise<ServiceResult<ExportResult>>

// List previous exports for a project
export async function listExports(
  projectId: string
): Promise<ServiceResult<Export[]>>

// Get export by ID
export async function getExport(id: string): Promise<ServiceResult<Export>>

// Delete export
export async function deleteExport(id: string): Promise<ServiceResult<void>>
```

---

# 4. Parser Layer

All parsers live in `lib/parsers/`. They convert between structured TypeScript objects and markdown text. Parsers are pure functions — no database access, no side effects.

### Parsing Approach

All parsers use **template literals for rendering** and **regex-based section extraction for parsing**. This avoids heavy AST dependencies while remaining reliable for the well-defined markdown templates in this system. For the structured markdown schema (Section 7), each `## Heading` is a known section boundary, making regex splitting reliable.

The general pattern:

1. **Render (struct → markdown)**: Template literal string interpolation.
2. **Parse (markdown → struct)**: Split by `## ` headings into a `Map<string, string>`, then extract typed fields from each section.

```typescript
// lib/parsers/shared.ts

// Split markdown into sections by ## headings
export function splitMarkdownSections(markdown: string): Map<string, string>

// Extract a section by heading name, trimmed
export function getSection(sections: Map<string, string>, heading: string): string | undefined

// Parse a markdown list into string array
export function parseMarkdownList(text: string): string[]

// Render a string array as a markdown list
export function renderMarkdownList(items: string[]): string

// Escape special markdown characters in user content
export function escapeMarkdown(text: string): string
```

---

## 4.1 `lib/parsers/system-parser.ts`

Bidirectional parser between `GameSystem` struct and Section 7 markdown template.

```typescript
// lib/parsers/system-parser.ts

import { GameSystem } from '@prisma/client'

// The structured representation of a game system for parsing/rendering
export type GameSystemData = {
  name: string
  systemSlug: string
  version: string
  status: string
  purpose: string
  currentState: string
  targetState: string
  coreMechanics: string
  inputs: string
  outputs: string
  dependencies: string[]       // system slugs
  dependedOnBy: string[]       // system slugs (auto-generated)
  failureStates: string
  scalingBehavior: string
  mvpCriticality: string
  implementationNotes: string
  openQuestions: string
  changeLog: { date: string; version: string; summary: string }[]
}

// Render a GameSystem (or GameSystemData) into Section 7 markdown format
export function renderSystemMarkdown(system: GameSystemData): string

// Parse Section 7 markdown into a GameSystemData struct
// Uses regex section splitting on ## headings
export function parseSystemMarkdown(markdown: string): GameSystemData

// Validate that markdown conforms to the Section 7 schema
// Returns list of missing/invalid sections
export function validateSystemMarkdown(markdown: string): {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Convert a Prisma GameSystem + relations to GameSystemData
export function toSystemData(
  system: GameSystem,
  dependsOn: string[],
  dependedOnBy: string[]
): GameSystemData

// Convert GameSystemData back to a Prisma-compatible input shape
export function toCreateInput(
  data: GameSystemData,
  projectId: string,
  synthesizedOutputId?: string
): CreateGameSystemInput
```

**Rendering approach**: Template literal producing the exact Section 7 format:

```typescript
export function renderSystemMarkdown(system: GameSystemData): string {
  return `# System: ${system.name}

## System ID
${system.systemSlug}

## Version
${system.version}

## Status
${system.status}

## Purpose
${system.purpose}

## Current State
${system.currentState}

## Target State
${system.targetState}

## Core Mechanics
${system.coreMechanics}

## Inputs
${system.inputs}

## Outputs
${system.outputs}

## Dependencies
${system.dependencies.map(d => `- ${d}`).join('\n')}

## Depended On By
${system.dependedOnBy.map(d => `- ${d}`).join('\n')}

## Failure States
${system.failureStates}

## Scaling Behavior
${system.scalingBehavior}

## MVP Criticality
${system.mvpCriticality}

## Implementation Notes
${system.implementationNotes}

## Open Questions
${system.openQuestions}

## Change Log
${system.changeLog.map(e => `- [${e.date}] (${e.version}) ${e.summary}`).join('\n')}
`
}
```

**Parsing approach**: Split on `^## (.+)$` regex, map heading → content, extract fields:

```typescript
export function parseSystemMarkdown(markdown: string): GameSystemData {
  const sections = splitMarkdownSections(markdown)
  const name = markdown.match(/^# System: (.+)$/m)?.[1]?.trim() ?? ''
  return {
    name,
    systemSlug: getSection(sections, 'System ID') ?? '',
    version: getSection(sections, 'Version') ?? 'v0.1',
    status: getSection(sections, 'Status') ?? 'draft',
    purpose: getSection(sections, 'Purpose') ?? '',
    currentState: getSection(sections, 'Current State') ?? '',
    targetState: getSection(sections, 'Target State') ?? '',
    coreMechanics: getSection(sections, 'Core Mechanics') ?? '',
    inputs: getSection(sections, 'Inputs') ?? '',
    outputs: getSection(sections, 'Outputs') ?? '',
    dependencies: parseMarkdownList(getSection(sections, 'Dependencies') ?? ''),
    dependedOnBy: parseMarkdownList(getSection(sections, 'Depended On By') ?? ''),
    failureStates: getSection(sections, 'Failure States') ?? '',
    scalingBehavior: getSection(sections, 'Scaling Behavior') ?? '',
    mvpCriticality: getSection(sections, 'MVP Criticality') ?? 'important',
    implementationNotes: getSection(sections, 'Implementation Notes') ?? '',
    openQuestions: getSection(sections, 'Open Questions') ?? '',
    changeLog: parseChangeLogEntries(getSection(sections, 'Change Log') ?? ''),
  }
}
```

---

## 4.2 `lib/parsers/brainstorm-parser.ts`

Parses raw brainstorm content (especially Discord-style conversation format) into structured messages.

```typescript
// lib/parsers/brainstorm-parser.ts

export type BrainstormMessage = {
  author: string
  timestamp?: string
  content: string
  isReply: boolean
  replyTo?: string
}

export type ParsedBrainstorm = {
  messages: BrainstormMessage[]
  topics: string[]              // extracted topic keywords
  rawContent: string
}

// Parse Discord-style conversation format
// Detects pattern: "Username — MM/DD/YYYY HH:MM AM/PM\nMessage content"
// Also handles "Username: message" simple format
export function parseDiscordFormat(content: string): ParsedBrainstorm

// Parse freeform text (no structured format — treat as single block)
export function parseFreeformText(content: string): ParsedBrainstorm

// Auto-detect format and parse accordingly
export function parseBrainstormContent(
  content: string,
  source: 'discord' | 'manual' | 'upload'
): ParsedBrainstorm

// Extract topic keywords from parsed messages (simple frequency analysis)
export function extractTopics(messages: BrainstormMessage[]): string[]

// Render parsed brainstorm back to a clean markdown format
export function renderBrainstormMarkdown(parsed: ParsedBrainstorm): string
```

**Discord format detection**: Regex pattern `^(.+?)\s*[—–-]\s*(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*$` to match the author/timestamp line, followed by content lines until the next author line.

---

## 4.3 `lib/parsers/version-plan-parser.ts`

Bidirectional conversion between `VersionPlan` struct and markdown format.

```typescript
// lib/parsers/version-plan-parser.ts

export type VersionPlanPhase = {
  phase: number
  name: string
  description: string
  systems: { name: string; slug: string; criticality: string }[]
}

export type VersionPlanMilestone = {
  name: string
  description: string
  targetSystems: string[]
}

export type VersionPlanData = {
  versionLabel: string
  title: string
  description: string
  phases: VersionPlanPhase[]
  milestones: VersionPlanMilestone[]
  includedSystems: string[]
  excludedSystems: string[]
  riskAreas: string[]
  implementationOrder: string[]
  scopeValidation: string
}

// Render version plan struct to markdown
export function renderVersionPlanMarkdown(plan: VersionPlanData): string

// Parse version plan markdown into struct
export function parseVersionPlanMarkdown(markdown: string): VersionPlanData

// Validate version plan markdown structure
export function validateVersionPlanMarkdown(markdown: string): {
  valid: boolean
  errors: string[]
}

// Convert Prisma VersionPlan + items to VersionPlanData (deserializes JSON fields)
export function toVersionPlanData(
  plan: VersionPlan,
  items: VersionPlanItem[]
): VersionPlanData
```

---

## 4.4 `lib/parsers/export-parser.ts`

Composite document assembly — builds complete export documents from multiple sub-documents.

```typescript
// lib/parsers/export-parser.ts

import { GameSystemData } from './system-parser'
import { VersionPlanData } from './version-plan-parser'

export type GDDData = {
  projectName: string
  projectDescription: string
  genre: string
  platform: string
  systems: GameSystemData[]
  dependencyGraph: { source: string; target: string; type: string }[]
  versionPlans: VersionPlanData[]
}

export type VersionPRDData = {
  projectName: string
  versionPlan: VersionPlanData
  systems: GameSystemData[]
  dependencySubgraph: { source: string; target: string; type: string }[]
}

// Assemble a full Game Design Document
export function renderGDD(data: GDDData): string

// Assemble a Version PRD
export function renderVersionPRD(data: VersionPRDData): string

// Assemble a roadmap document
export function renderRoadmap(data: {
  projectName: string
  versionPlans: VersionPlanData[]
  implementationOrder: string[]
}): string

// Assemble a prompt bundle document
export function renderPromptBundle(data: {
  projectName: string
  systems: GameSystemData[]
  prompts: { type: string; content: string; response?: string }[]
}): string

// Render an ASCII dependency graph (for markdown embedding)
export function renderDependencyGraphAscii(
  nodes: string[],
  edges: { source: string; target: string }[]
): string
```

---

# 5. Graph Engine

Lives in `lib/graph/`. Provides dependency graph operations independent of database. Operates on abstract node/edge data structures.

```typescript
// lib/graph/types.ts

export type GraphNode = {
  id: string
  label: string
  metadata?: Record<string, unknown>
}

export type GraphEdge = {
  source: string  // node ID
  target: string  // node ID
  type: string    // 'requires' | 'enhances' | 'optional'
}

export type DirectedGraph = {
  nodes: Map<string, GraphNode>
  adjacencyList: Map<string, Set<string>>       // outgoing: source → targets
  reverseAdjacencyList: Map<string, Set<string>> // incoming: target → sources
}
```

```typescript
// lib/graph/graph-engine.ts

import { GraphNode, GraphEdge, DirectedGraph } from './types'

// ─── Construction ───────────────────────────────────────────────────

// Build a directed graph from nodes and edges
export function buildGraph(nodes: GraphNode[], edges: GraphEdge[]): DirectedGraph

// Add a node to the graph (mutates)
export function addNode(graph: DirectedGraph, node: GraphNode): void

// Remove a node and all its edges (mutates)
export function removeNode(graph: DirectedGraph, nodeId: string): void

// Add an edge to the graph (mutates, returns false if would create cycle)
export function addEdge(
  graph: DirectedGraph,
  source: string,
  target: string,
  type?: string
): boolean

// Remove an edge from the graph (mutates)
export function removeEdge(graph: DirectedGraph, source: string, target: string): void

// ─── Cycle Detection ────────────────────────────────────────────────

// Detect all cycles in the graph using DFS
// Returns array of cycles, each cycle is an array of node IDs
export function detectCycles(graph: DirectedGraph): string[][]

// Check if adding an edge would create a cycle (without mutating)
export function wouldCreateCycle(
  graph: DirectedGraph,
  source: string,
  target: string
): boolean

// ─── Topological Sort ───────────────────────────────────────────────

// Kahn's algorithm for topological ordering
// Returns ordered node IDs or null if graph has cycles
export function topologicalSort(graph: DirectedGraph): string[] | null

// Topological sort restricted to a subgraph (subset of node IDs)
export function topologicalSortSubset(
  graph: DirectedGraph,
  subsetNodeIds: Set<string>
): string[] | null

// ─── Traversal ──────────────────────────────────────────────────────

// Get direct upstream dependencies (what this node depends on)
export function getDirectUpstream(graph: DirectedGraph, nodeId: string): string[]

// Get direct downstream dependents (what depends on this node)
export function getDirectDownstream(graph: DirectedGraph, nodeId: string): string[]

// Get all transitive upstream dependencies (recursive)
export function getTransitiveUpstream(graph: DirectedGraph, nodeId: string): string[]

// Get all transitive downstream dependents (recursive)
export function getTransitiveDownstream(graph: DirectedGraph, nodeId: string): string[]

// ─── Impact Analysis ────────────────────────────────────────────────

// Full impact analysis for a node
export function analyzeImpact(graph: DirectedGraph, nodeId: string): {
  directUpstream: string[]
  directDownstream: string[]
  transitiveUpstream: string[]
  transitiveDownstream: string[]
  riskSurface: string[]          // all transitive downstream (ripple zone)
  implementationOrder: string[]  // topological sort of affected subgraph
}

// ─── Risk Surface ───────────────────────────────────────────────────

// Identify high-risk nodes (high fan-in = many depend on it, high fan-out = depends on many)
export function identifyRiskNodes(graph: DirectedGraph): {
  highFanIn: { nodeId: string; count: number }[]   // sorted desc by count
  highFanOut: { nodeId: string; count: number }[]   // sorted desc by count
  isolatedNodes: string[]                            // no edges at all
}

// ─── Subgraph ───────────────────────────────────────────────────────

// Extract a subgraph containing only the specified nodes and edges between them
export function extractSubgraph(
  graph: DirectedGraph,
  nodeIds: Set<string>
): DirectedGraph

// Validate that a set of nodes is self-contained (no dangling dependencies)
export function validateScope(
  graph: DirectedGraph,
  nodeIds: Set<string>
): {
  valid: boolean
  missingDependencies: { nodeId: string; missingDep: string }[]
}

// ─── Phasing ────────────────────────────────────────────────────────

// Group nodes into implementation phases based on dependency layers
// Phase 1 = nodes with no dependencies, Phase 2 = nodes depending only on Phase 1, etc.
export function computePhases(
  graph: DirectedGraph,
  nodeIds?: Set<string>  // optional subset; if omitted, uses all nodes
): Map<number, string[]>
```

### Algorithm Details

- **Cycle Detection**: DFS with three coloring (white/gray/black). When a gray node is revisited, a cycle is found. Back-track to collect the full cycle.
- **Topological Sort**: Kahn's algorithm (BFS with in-degree tracking). Preferred over DFS-based sort for deterministic output and natural phase grouping.
- **Impact Analysis**: BFS from target node on the reverse adjacency list (upstream) and forward adjacency list (downstream). Risk surface is the union of all transitive downstream nodes.
- **Phase Computation**: Iterative layer peeling — find all zero-in-degree nodes (Phase 1), remove them, repeat for Phase 2, etc. Equivalent to the levels in a BFS from source nodes in topological order.

---

# 6. AI Engine

Lives in `lib/ai/`. Provides a provider-agnostic interface for AI completion calls, prompt template management, and context assembly.

---

## 6.1 Provider Interface

```typescript
// lib/ai/types.ts

export type AIMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type AICompletionRequest = {
  messages: AIMessage[]
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stopSequences?: string[]
}

export type AICompletionResponse = {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'content_filter' | 'error'
  durationMs: number
}

export type AIProviderConfig = {
  id: string                  // 'openai' | 'anthropic' | 'google' | 'local'
  name: string
  apiKey: string
  baseUrl?: string            // for custom endpoints / local models
  defaultModel: string
  availableModels: string[]
  maxRetries?: number
  timeoutMs?: number
}
```

```typescript
// lib/ai/provider.interface.ts

import {
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig
} from './types'

export interface AIProvider {
  readonly id: string
  readonly name: string

  // Initialize provider with configuration
  initialize(config: AIProviderConfig): void

  // Execute a completion request
  complete(request: AICompletionRequest): Promise<AICompletionResponse>

  // Execute a streaming completion request
  completeStream(
    request: AICompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<AICompletionResponse>

  // List available models for this provider
  listModels(): string[]

  // Check if provider is properly configured and reachable
  healthCheck(): Promise<boolean>

  // Estimate token count for a string (provider-specific tokenizer or heuristic)
  estimateTokens(text: string): number
}
```

---

## 6.2 Provider Implementations

```typescript
// lib/ai/providers/openai.provider.ts

import { AIProvider } from '../provider.interface'
import {
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig
} from '../types'

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai'
  readonly name = 'OpenAI'

  initialize(config: AIProviderConfig): void
  complete(request: AICompletionRequest): Promise<AICompletionResponse>
  completeStream(
    request: AICompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<AICompletionResponse>
  listModels(): string[]
  healthCheck(): Promise<boolean>
  estimateTokens(text: string): number
}
```

```typescript
// lib/ai/providers/anthropic.provider.ts
// Same shape as OpenAI, maps to Anthropic Messages API

export class AnthropicProvider implements AIProvider { /* ... */ }
```

```typescript
// lib/ai/providers/google.provider.ts
// Maps to Google Generative AI (Gemini) API

export class GoogleProvider implements AIProvider { /* ... */ }
```

---

## 6.3 AI Engine

```typescript
// lib/ai/engine.ts

import { AIProvider } from './provider.interface'
import {
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig
} from './types'

export type ProviderRouting = {
  strategy: 'primary' | 'fallback' | 'ab_test'
  primaryProvider: string
  fallbackProvider?: string
  abTestSplit?: number           // 0.0-1.0, fraction routed to provider B
  abProviderB?: string
}

export type EngineConfig = {
  providers: AIProviderConfig[]
  routing: ProviderRouting
  defaultTemperature: number
  defaultMaxTokens: number
}

// Register a provider implementation
export function registerProvider(provider: AIProvider): void

// Initialize engine with configuration
export function initializeEngine(config: EngineConfig): void

// Get the currently active provider based on routing config
export function resolveProvider(routing?: ProviderRouting): AIProvider

// Execute a completion (handles routing, retries, fallback)
export async function complete(
  request: AICompletionRequest,
  routing?: ProviderRouting
): Promise<AICompletionResponse>

// Execute a streaming completion
export async function completeStream(
  request: AICompletionRequest,
  onChunk: (chunk: string) => void,
  routing?: ProviderRouting
): Promise<AICompletionResponse>

// Get all registered providers
export function getProviders(): AIProvider[]

// Health check all providers
export async function healthCheckAll(): Promise<Record<string, boolean>>
```

---

## 6.4 Prompt Template System

Templates are defined as TypeScript objects in `lib/ai/templates/`. Each template specifies its type, system prompt, user prompt template, required context keys, and optional few-shot examples.

```typescript
// lib/ai/templates/types.ts

export type PromptTemplate = {
  id: string
  type: PromptType
  name: string
  description: string
  systemPrompt: string
  userPromptTemplate: string        // uses {{variable}} interpolation
  requiredContext: string[]          // context keys that must be provided
  optionalContext: string[]          // context keys that enhance the prompt
  defaultTemperature: number
  defaultMaxTokens: number
  examples?: {                      // optional few-shot examples
    input: string
    output: string
  }[]
}

// Context that can be assembled for any prompt
export type PromptContext = {
  projectName?: string
  projectDescription?: string
  genre?: string
  systemMarkdown?: string           // full Section 7 markdown for target system
  systemName?: string
  systemSlug?: string
  dependencyList?: string           // markdown list of dependencies
  dependedOnByList?: string         // markdown list of dependents
  versionPlanMarkdown?: string      // full version plan markdown
  allSystemsSummary?: string        // brief summary of all systems in project
  brainstormContent?: string        // raw brainstorm content
  changeLogMarkdown?: string        // change history
  currentState?: string
  targetState?: string
  additionalContext?: string        // user-provided extra instructions
}
```

```typescript
// lib/ai/templates/registry.ts

import { PromptTemplate, PromptType } from './types'

// Register a template
export function registerTemplate(template: PromptTemplate): void

// Get a template by ID
export function getTemplate(id: string): PromptTemplate | undefined

// Get all templates for a prompt type
export function getTemplatesForType(type: PromptType): PromptTemplate[]

// List all registered templates
export function listTemplates(): PromptTemplate[]
```

```typescript
// lib/ai/templates/index.ts
// Re-exports all built-in templates

export { synthesisTemplate } from './synthesis'
export { implementationTemplate } from './implementation'
export { architectureTemplate } from './architecture'
export { refactorTemplate } from './refactor'
export { balanceTemplate } from './balance'
export { expansionTemplate } from './expansion'
export { evolutionDeltaTemplate } from './evolution-delta'
```

### Template Files

Each template lives in its own file under `lib/ai/templates/`:

| File | Template ID | Required Context |
|------|-------------|-----------------|
| `synthesis.ts` | `synthesis-v1` | `brainstormContent`, `projectName`, `genre` |
| `implementation.ts` | `implementation-v1` | `systemMarkdown`, `dependencyList`, `versionPlanMarkdown` |
| `architecture.ts` | `architecture-v1` | `systemMarkdown`, `allSystemsSummary`, `dependencyList` |
| `refactor.ts` | `refactor-v1` | `systemMarkdown`, `changeLogMarkdown`, `currentState`, `targetState` |
| `balance.ts` | `balance-v1` | `systemMarkdown`, `allSystemsSummary`, `genre` |
| `expansion.ts` | `expansion-v1` | `systemMarkdown`, `dependencyList`, `projectDescription` |
| `evolution-delta.ts` | `evolution-delta-v1` | `systemMarkdown`, `currentState`, `targetState`, `dependencyList`, `dependedOnByList` |

---

## 6.5 Context Assembly

```typescript
// lib/ai/context.ts

import { PromptContext, PromptTemplate } from './templates/types'

// Assemble full prompt context for a game system
export async function assembleSystemContext(
  systemId: string
): Promise<PromptContext>

// Assemble full prompt context for a version plan
export async function assembleVersionPlanContext(
  versionPlanId: string
): Promise<PromptContext>

// Assemble context for synthesis (brainstorm → systems)
export async function assembleSynthesisContext(
  brainstormId: string
): Promise<PromptContext>

// Interpolate template variables with context values
// Replaces {{key}} with context[key], warns on missing required keys
export function interpolateTemplate(
  template: PromptTemplate,
  context: PromptContext
): {
  systemPrompt: string
  userPrompt: string
  warnings: string[]
}

// Estimate token count for assembled prompt
export function estimatePromptTokens(
  systemPrompt: string,
  userPrompt: string
): number
```

---

# 7. Server Actions / API Routes

All mutations use **Next.js Server Actions** (`'use server'`). Read operations use Server Components with direct service calls or API route handlers for client-initiated fetches.

### Zod Schemas

```typescript
// lib/validations/schemas.ts

import { z } from 'zod'

// ─── Project ────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  genre: z.string().max(100).optional(),
  platform: z.string().max(100).optional(),
  status: z.enum(['ideation', 'active', 'archived']).optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

// ─── Brainstorm ─────────────────────────────────────────────────────

export const createBrainstormSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(1).max(200),
  source: z.enum(['manual', 'discord', 'upload']).optional(),
  content: z.string().min(1).max(500000),
  author: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
})

// ─── Synthesize ─────────────────────────────────────────────────────

export const synthesizeSchema = z.object({
  brainstormId: z.string().cuid(),
  aiProvider: z.string().optional(),
  aiModel: z.string().optional(),
  additionalContext: z.string().max(5000).optional(),
})

export const convertToSystemsSchema = z.object({
  synthesizedOutputId: z.string().cuid(),
  selectedSystems: z.array(z.string()).min(1),
  overrides: z.record(z.string(), z.object({
    name: z.string().optional(),
    systemSlug: z.string().optional(),
    purpose: z.string().optional(),
    mvpCriticality: z.enum(['core', 'important', 'later']).optional(),
  })).optional(),
})

// ─── Game System ────────────────────────────────────────────────────

export const createGameSystemSchema = z.object({
  projectId: z.string().cuid(),
  systemSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  version: z.string().max(20).optional(),
  status: z.enum(['draft', 'active', 'deprecated']).optional(),
  purpose: z.string().max(5000).optional(),
  currentState: z.string().max(10000).optional(),
  targetState: z.string().max(10000).optional(),
  coreMechanics: z.string().max(10000).optional(),
  inputs: z.string().max(5000).optional(),
  outputs: z.string().max(5000).optional(),
  failureStates: z.string().max(5000).optional(),
  scalingBehavior: z.string().max(5000).optional(),
  mvpCriticality: z.enum(['core', 'important', 'later']).optional(),
  implementationNotes: z.string().max(10000).optional(),
  openQuestions: z.string().max(5000).optional(),
})

export const updateGameSystemSchema = createGameSystemSchema
  .omit({ projectId: true, systemSlug: true })
  .partial()
  .extend({
    changeSummary: z.string().min(1).max(500),
  })

export const mergeSystemsSchema = z.object({
  systemIdA: z.string().cuid(),
  systemIdB: z.string().cuid(),
  mergedName: z.string().min(1).max(200),
  mergedSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
})

export const splitSystemSchema = z.object({
  systemId: z.string().cuid(),
  newSystems: z.array(z.object({
    name: z.string().min(1).max(200),
    systemSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
    purpose: z.string().min(1),
  })).min(2),
})

export const importSystemMarkdownSchema = z.object({
  projectId: z.string().cuid(),
  markdown: z.string().min(1).max(100000),
})

// ─── Dependency ─────────────────────────────────────────────────────

export const addDependencySchema = z.object({
  sourceSystemId: z.string().cuid(),
  targetSystemId: z.string().cuid(),
  dependencyType: z.enum(['requires', 'enhances', 'optional']).optional(),
  description: z.string().max(500).optional(),
})

export const removeDependencySchema = z.object({
  sourceSystemId: z.string().cuid(),
  targetSystemId: z.string().cuid(),
})

export const setDependenciesSchema = z.object({
  systemId: z.string().cuid(),
  targetSystemIds: z.array(z.string().cuid()),
})

// ─── Version Plan ───────────────────────────────────────────────────

export const createVersionPlanSchema = z.object({
  projectId: z.string().cuid(),
  versionLabel: z.string().min(1).max(20).regex(/^v[\d]+(\.\d+)*$/),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  systemIds: z.array(z.string().cuid()).min(1),
})

export const updateVersionPlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  systemIds: z.array(z.string().cuid()).min(1).optional(),
})

// ─── Prompt ─────────────────────────────────────────────────────────

export const generatePromptSchema = z.object({
  projectId: z.string().cuid(),
  promptType: z.enum([
    'synthesis', 'implementation', 'architecture',
    'refactor', 'balance', 'expansion', 'evolution_delta'
  ]),
  targetSystemId: z.string().cuid().optional(),
  targetVersionPlanId: z.string().cuid().optional(),
  outputMode: z.enum(['raw', 'with_context', 'bundle']).optional(),
  additionalContext: z.string().max(5000).optional(),
  aiProvider: z.string().optional(),
  aiModel: z.string().optional(),
})

// ─── Export ─────────────────────────────────────────────────────────

export const exportSchema = z.object({
  projectId: z.string().cuid(),
  exportType: z.enum(['gdd', 'version_prd', 'system_doc', 'roadmap', 'prompt_bundle']),
  format: z.enum(['markdown', 'json']).optional(),
  options: z.object({
    versionPlanId: z.string().cuid().optional(),
    systemIds: z.array(z.string().cuid()).optional(),
    includeChangelog: z.boolean().optional(),
    includeDependencyGraph: z.boolean().optional(),
    includePromptHistory: z.boolean().optional(),
  }).optional(),
})
```

---

### Server Actions

All server actions live in `app/actions/`.

```
app/actions/
  project.actions.ts
  brainstorm.actions.ts
  synthesis.actions.ts
  game-system.actions.ts
  dependency.actions.ts
  version-plan.actions.ts
  prompt.actions.ts
  export.actions.ts
```

| Action File | Action Function | Service Call | Zod Schema |
|---|---|---|---|
| `project.actions.ts` | `createProjectAction` | `projectService.createProject` | `createProjectSchema` |
| | `updateProjectAction` | `projectService.updateProject` | `updateProjectSchema` |
| | `deleteProjectAction` | `projectService.deleteProject` | `z.object({ id: z.string().cuid() })` |
| `brainstorm.actions.ts` | `createBrainstormAction` | `brainstormService.ingestBrainstorm` | `createBrainstormSchema` |
| | `deleteBrainstormAction` | `brainstormService.deleteBrainstorm` | `z.object({ id: z.string().cuid() })` |
| `synthesis.actions.ts` | `synthesizeBrainstormAction` | `synthesisService.synthesizeBrainstorm` | `synthesizeSchema` |
| | `convertToSystemsAction` | `synthesisService.convertToSystems` | `convertToSystemsSchema` |
| | `discardOutputAction` | `synthesisService.discardOutput` | `z.object({ id: z.string().cuid() })` |
| | `reSynthesizeAction` | `synthesisService.reSynthesize` | `synthesizeSchema` |
| `game-system.actions.ts` | `createSystemAction` | `gameSystemService.createSystem` | `createGameSystemSchema` |
| | `updateSystemAction` | `gameSystemService.updateSystem` | `updateGameSystemSchema` |
| | `deleteSystemAction` | `gameSystemService.deleteSystem` | `z.object({ id: z.string().cuid(), force: z.boolean().optional() })` |
| | `mergeSystemsAction` | `gameSystemService.mergeSystems` | `mergeSystemsSchema` |
| | `splitSystemAction` | `gameSystemService.splitSystem` | `splitSystemSchema` |
| | `importSystemMarkdownAction` | `gameSystemService.importSystemFromMarkdown` | `importSystemMarkdownSchema` |
| | `generateEvolutionDeltaAction` | `gameSystemService.generateEvolutionDelta` | `z.object({ systemId: z.string().cuid() })` |
| | `applyEvolutionDeltaAction` | `gameSystemService.applyEvolutionDelta` | (custom per delta) |
| `dependency.actions.ts` | `addDependencyAction` | `dependencyService.addDependency` | `addDependencySchema` |
| | `removeDependencyAction` | `dependencyService.removeDependency` | `removeDependencySchema` |
| | `setDependenciesAction` | `dependencyService.setDependencies` | `setDependenciesSchema` |
| `version-plan.actions.ts` | `createVersionPlanAction` | `versionPlanService.createVersionPlan` | `createVersionPlanSchema` |
| | `updateVersionPlanAction` | `versionPlanService.updateVersionPlan` | `updateVersionPlanSchema` |
| | `finalizeVersionPlanAction` | `versionPlanService.finalizeVersionPlan` | `z.object({ id: z.string().cuid() })` |
| | `deleteVersionPlanAction` | `versionPlanService.deleteVersionPlan` | `z.object({ id: z.string().cuid() })` |
| | `regeneratePlanAction` | `versionPlanService.regeneratePlan` | `z.object({ id: z.string().cuid() })` |
| `prompt.actions.ts` | `generatePromptAction` | `promptService.generatePrompt` | `generatePromptSchema` |
| | `executePromptAction` | `promptService.executePrompt` | `generatePromptSchema` |
| | `reExecutePromptAction` | `promptService.reExecutePrompt` | `z.object({ historyId: z.string().cuid() })` |
| `export.actions.ts` | `generateExportAction` | `exportService.generateExport` | `exportSchema` |
| | `deleteExportAction` | `exportService.deleteExport` | `z.object({ id: z.string().cuid() })` |

### API Routes (for client-initiated reads & streaming)

```
app/api/
  projects/
    route.ts                    GET: list projects
    [id]/
      route.ts                  GET: get project + dashboard
  brainstorms/
    [id]/
      route.ts                  GET: get brainstorm with synthesis
  synthesized-outputs/
    [id]/
      route.ts                  GET: get review data
  systems/
    route.ts                    GET: list systems (filtered)
    [id]/
      route.ts                  GET: get system full
      markdown/
        route.ts                GET: get rendered markdown
  dependencies/
    graph/
      route.ts                  GET: get project dependency graph
    impact/
      [systemId]/
        route.ts                GET: get impact analysis
  version-plans/
    [id]/
      route.ts                  GET: get version plan full
      validate/
        route.ts                GET: validate plan scope
  prompt-history/
    route.ts                    GET: list prompt history
    [id]/
      route.ts                  GET: get prompt history entry
  exports/
    route.ts                    GET: list exports
    [id]/
      route.ts                  GET: get export content
    [id]/download/
      route.ts                  GET: download export as file
  ai/
    stream/
      route.ts                  POST: streaming AI completion (SSE)
    health/
      route.ts                  GET: provider health check
```

Each API route handler:
1. Validates query/path params with Zod
2. Calls the corresponding service function
3. Returns JSON with appropriate status codes
4. Uses `NextResponse.json()` for responses

---

# 8. Application Subsystem Documentation

Content outlines for each of the 7 app subsystem spec docs in `docs/app-systems/`.

---

## 8.1 `docs/app-systems/ingestion.md`

```markdown
# System: Ingestion

## Purpose
Handles the intake of raw brainstorming content from multiple sources (manual paste, Discord threads, markdown upload) into the application's storage layer.

## Responsibilities
- Accept and validate raw text input from the UI
- Detect input format (Discord conversation, freeform text, structured markdown)
- Store immutable brainstorm sessions linked to projects
- Parse raw content into structured messages via brainstorm-parser
- Trigger downstream synthesis pipeline on user request

## Inputs
- Raw text content (pasted or uploaded)
- Source type indicator (manual | discord | upload)
- Project reference
- Optional author and tags metadata

## Outputs
- Stored BrainstormSession record
- Parsed BrainstormMessage array (for UI display)
- Trigger signal to synthesis subsystem

## Dependencies
- doc-store (for persistence)
- brainstorm-parser (for format detection and parsing)

## Code Mapping
- Service: `lib/services/brainstorm.service.ts`
- Repository: `lib/repositories/brainstorm.repository.ts`
- Parser: `lib/parsers/brainstorm-parser.ts`
- Actions: `app/actions/brainstorm.actions.ts`
- Zod schema: `createBrainstormSchema`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- v1 does not support real-time Discord bot integration
- File upload limited to plain text and markdown
- No OCR or voice-to-text support

## Target Evolution
- Discord bot integration for live ingestion
- Voice recording transcription
- Image/whiteboard scanning
- Batch import from multiple sources

## Change Log
(Chronological updates)
```

---

## 8.2 `docs/app-systems/system-extraction.md`

```markdown
# System: System Extraction

## Purpose
Transforms raw brainstorm content into structured game system definitions through AI-assisted synthesis and user-guided review.

## Responsibilities
- Orchestrate the brainstorm → synthesized output pipeline
- Call AI engine with synthesis prompt template and brainstorm context
- Parse AI response into system stubs (name, slug, purpose, mechanics, dependencies)
- Store intermediate SynthesizedOutput artifacts
- Present structured review interface data
- Convert user-approved stubs into full GameSystem records
- Detect conflicts with existing systems (duplicate slugs)

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
- Service: `lib/services/synthesis.service.ts`
- Repository: `lib/repositories/synthesized-output.repository.ts`
- Parser: `lib/parsers/system-parser.ts`
- AI Template: `lib/ai/templates/synthesis.ts`
- Context: `lib/ai/context.ts` → `assembleSynthesisContext`
- Actions: `app/actions/synthesis.actions.ts`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- AI extraction quality depends on brainstorm clarity
- No confidence scoring on extracted systems
- Single-pass extraction (no iterative refinement loop in v1)

## Target Evolution
- Multi-pass extraction with refinement
- Confidence scoring per extracted system
- Interactive extraction where user guides AI in real-time
- Pattern library for common game system archetypes

## Change Log
(Chronological updates)
```

---

## 8.3 `docs/app-systems/dependency-graph.md`

```markdown
# System: Dependency Graph

## Purpose
Builds, maintains, and queries the directed dependency graph between game systems. Provides structural analysis for implementation ordering, impact assessment, and scope validation.

## Responsibilities
- Maintain directed edges between game systems
- Prevent circular dependencies
- Compute topological sort (implementation ordering)
- Perform upstream/downstream impact analysis
- Detect risk surfaces (high fan-in/fan-out nodes)
- Validate version plan scope completeness
- Compute implementation phases from dependency layers

## Inputs
- GameSystem records (nodes)
- Dependency records (edges)
- System IDs for targeted analysis
- Scope sets for validation

## Outputs
- Full dependency graph structure (nodes + edges)
- Topologically sorted implementation order
- Impact analysis reports
- Risk surface identification
- Phase groupings
- Cycle detection results
- Scope validation results

## Dependencies
- doc-store (reads system and dependency data)

## Code Mapping
- Engine: `lib/graph/graph-engine.ts`
- Types: `lib/graph/types.ts`
- Service: `lib/services/dependency.service.ts`
- Repository: `lib/repositories/dependency.repository.ts`
- Actions: `app/actions/dependency.actions.ts`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- Graph is recomputed on each request (not cached in v1)
- No weighted edges (all dependencies treated equally except type)
- Visualization is frontend concern, engine only provides data

## Target Evolution
- Cached/incremental graph updates
- Weighted dependency strengths
- Suggested dependency detection via AI
- Graph diff between version plan snapshots

## Change Log
(Chronological updates)
```

---

## 8.4 `docs/app-systems/doc-store.md`

```markdown
# System: Doc Store

## Purpose
Provides the persistence layer for all application data. Abstracts database access behind repository interfaces. Handles JSON serialization for SQLite string fields.

## Responsibilities
- CRUD operations for all domain models
- JSON serialization/deserialization for complex fields stored as strings in SQLite
- Pagination and filtering
- Cascade delete management
- Transaction support for multi-step operations (merge, split, conversion)
- Unique constraint enforcement

## Inputs
- Typed input objects from service layer
- Filter and pagination parameters

## Outputs
- Typed domain model records
- Paginated result sets
- Relation-included queries (e.g., system with dependencies)

## Dependencies
- Prisma Client (ORM)
- SQLite database

## Code Mapping
- Prisma schema: `prisma/schema.prisma`
- Repositories: `lib/repositories/*.repository.ts`
- Shared types: `lib/repositories/types.ts`
- Prisma client singleton: `lib/db.ts`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- SQLite single-writer constraint (not an issue for single-user/small-team use)
- JSON fields are not queryable via SQL (must deserialize in application layer)
- No full-text search index in v1

## Target Evolution
- PostgreSQL migration option for multi-user deployments
- Full-text search via SQLite FTS5 extension
- Database migration versioning strategy
- Backup/restore utilities

## Change Log
(Chronological updates)
```

---

## 8.5 `docs/app-systems/versioning.md`

```markdown
# System: Versioning

## Purpose
Manages version plans that scope game systems into release targets (v1, v1.1, v2). Enforces immutability after finalization and provides phased implementation roadmaps.

## Responsibilities
- Create version plans with selected system scope
- Compute dependency-ordered implementation phases
- Validate scope completeness (no dangling dependencies)
- Generate milestones and risk assessments
- Enforce immutability on finalized plans
- Render version plan markdown documents

## Inputs
- Project reference
- Version label (v1, v1.1, etc.)
- Selected system IDs
- User edits to draft plans

## Outputs
- VersionPlan records with phases, milestones, risks
- VersionPlanItem records (system ↔ plan junction)
- Scope validation results
- Rendered version plan markdown

## Dependencies
- doc-store (persistence)
- dependency-graph (phase computation, scope validation, implementation ordering)
- system-parser (for system data assembly)
- version-plan-parser (for markdown rendering)

## Code Mapping
- Service: `lib/services/version-plan.service.ts`
- Repository: `lib/repositories/version-plan.repository.ts`
- Parser: `lib/parsers/version-plan-parser.ts`
- Actions: `app/actions/version-plan.actions.ts`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- No version plan diffing between revisions
- No automatic system version bumping
- Finalization is one-way (no unfinalizing)

## Target Evolution
- Version plan comparison/diff view
- Auto-suggest scope based on MVP criticality
- Branching plans (experimental variants)
- System version auto-increment on plan finalization

## Change Log
(Chronological updates)
```

---

## 8.6 `docs/app-systems/export-engine.md`

```markdown
# System: Export Engine

## Purpose
Generates exportable documents in markdown and JSON formats. Assembles composite documents (GDD, Version PRD, Roadmap) from individual system and plan data.

## Responsibilities
- Render full Game Design Documents
- Render Version PRDs
- Render individual system documentation
- Render roadmap plans
- Render prompt bundles
- Store export records for history
- Support markdown and JSON output formats
- Provide download endpoints

## Inputs
- Project data
- GameSystem records with relations
- VersionPlan records
- DependencyGraph data
- PromptHistory records (for prompt bundles)
- Export configuration options

## Outputs
- Rendered document content (string)
- Export records (stored for retrieval)
- Downloadable file responses

## Dependencies
- doc-store (reads all domain data)
- system-parser (for individual system markdown)
- version-plan-parser (for version plan markdown)
- export-parser (for composite document assembly)
- dependency-graph (for graph data in documents)

## Code Mapping
- Service: `lib/services/export.service.ts`
- Parser: `lib/parsers/export-parser.ts`
- Actions: `app/actions/export.actions.ts`
- API route: `app/api/exports/[id]/download/route.ts`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- No PDF export in v1
- No collaborative editing of exports
- Export is a point-in-time snapshot, not live-linked

## Target Evolution
- PDF rendering via headless browser or mdx
- HTML export with styled theme
- Live-updating document links
- Export templates (customizable document structure)

## Change Log
(Chronological updates)
```

---

## 8.7 `docs/app-systems/ai-engine.md`

```markdown
# System: AI Engine

## Purpose
Provides a provider-agnostic interface for AI completion calls. Manages prompt templates, context assembly, provider routing, and prompt/response history tracking.

## Responsibilities
- Abstract multiple AI providers (OpenAI, Anthropic, Google) behind a common interface
- Register and manage provider configurations
- Route completion requests (primary, fallback, A/B testing)
- Manage prompt templates (registration, retrieval, interpolation)
- Assemble prompt context from domain data (systems, dependencies, plans)
- Execute completion calls (standard and streaming)
- Track token usage and latency
- Coordinate with prompt history repository for persistence

## Inputs
- Prompt type and template selection
- Target entity (system ID, version plan ID, brainstorm ID)
- AI provider/model preferences
- Additional user context

## Outputs
- Generated prompt text
- AI completion responses
- Token usage statistics
- PromptHistory records

## Dependencies
- doc-store (for context assembly — reads systems, plans, dependencies)
- External AI provider APIs (OpenAI, Anthropic, Google)
- Prompt history repository (for persistence)

## Code Mapping
- Provider interface: `lib/ai/provider.interface.ts`
- Provider implementations: `lib/ai/providers/*.provider.ts`
- Engine: `lib/ai/engine.ts`
- Types: `lib/ai/types.ts`
- Templates: `lib/ai/templates/*.ts`
- Template registry: `lib/ai/templates/registry.ts`
- Context assembly: `lib/ai/context.ts`
- Service integration: `lib/services/prompt.service.ts`
- API route (streaming): `app/api/ai/stream/route.ts`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- No function calling / tool use support in v1
- No automatic prompt optimization
- No cost tracking beyond token counts
- A/B testing is random split, not user-segmented

## Target Evolution
- Function calling for structured AI responses
- Prompt optimization via feedback loop
- Cost tracking and budgeting
- Provider performance comparison dashboard
- Fine-tuned model support
- Local model support (Ollama, vLLM)

## Change Log
(Chronological updates)
```

---

# Appendix: Directory Structure Overview

```
prisma/
  schema.prisma

lib/
  db.ts                              # Prisma client singleton
  repositories/
    types.ts
    project.repository.ts
    brainstorm.repository.ts
    synthesized-output.repository.ts
    game-system.repository.ts
    dependency.repository.ts
    version-plan.repository.ts
    prompt-history.repository.ts
  services/
    types.ts
    project.service.ts
    brainstorm.service.ts
    synthesis.service.ts
    game-system.service.ts
    dependency.service.ts
    version-plan.service.ts
    prompt.service.ts
    export.service.ts
  parsers/
    shared.ts
    system-parser.ts
    brainstorm-parser.ts
    version-plan-parser.ts
    export-parser.ts
  graph/
    types.ts
    graph-engine.ts
  ai/
    types.ts
    provider.interface.ts
    engine.ts
    context.ts
    providers/
      openai.provider.ts
      anthropic.provider.ts
      google.provider.ts
    templates/
      types.ts
      registry.ts
      index.ts
      synthesis.ts
      implementation.ts
      architecture.ts
      refactor.ts
      balance.ts
      expansion.ts
      evolution-delta.ts
  validations/
    schemas.ts

app/
  actions/
    project.actions.ts
    brainstorm.actions.ts
    synthesis.actions.ts
    game-system.actions.ts
    dependency.actions.ts
    version-plan.actions.ts
    prompt.actions.ts
    export.actions.ts
  api/
    projects/
      route.ts
      [id]/route.ts
    brainstorms/[id]/route.ts
    synthesized-outputs/[id]/route.ts
    systems/
      route.ts
      [id]/
        route.ts
        markdown/route.ts
    dependencies/
      graph/route.ts
      impact/[systemId]/route.ts
    version-plans/
      [id]/
        route.ts
        validate/route.ts
    prompt-history/
      route.ts
      [id]/route.ts
    exports/
      route.ts
      [id]/
        route.ts
        download/route.ts
    ai/
      stream/route.ts
      health/route.ts

docs/
  app-systems/
    ingestion.md
    system-extraction.md
    dependency-graph.md
    doc-store.md
    versioning.md
    export-engine.md
    ai-engine.md
```
