# AI Tools Implementation Plan

## Overview

Each core system in GamePlan AI exposes a set of **AI-callable tools** — typed function definitions that the primary assistant can invoke on behalf of the user. Every CRUD tool produces a structured result containing:

1. **`apiCall`** — the service function invoked and the exact payload used
2. **`description`** — a human-readable summary shown to the user (e.g. "Created game system 'Combat Engine' in project Dungeon Crawler")

The user should rarely need to take manual action. The assistant discovers tools from a central registry, calls the appropriate services, and presents results. Destructive operations (deletes, finalizations) require confirmation; everything else auto-executes.

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User message                                           │
└────────────────┬────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────┐
│  AI Engine  (lib/ai/engine.ts)                          │
│  - Resolves provider config (workspace-scoped)          │
│  - Sends messages + tool definitions to LLM             │
│  - Handles multi-turn tool call loops                   │
└────────────────┬────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Tool Registry  (lib/ai/tools/registry.ts)              │
│  - Holds all ToolDefinitions from each system           │
│  - Converts to OpenAI / Anthropic format                │
│  - Resolves tool by name → execute()                    │
└────────────────┬────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Tool Executor  (lib/ai/tools/executor.ts)              │
│  - Validates params with Zod                            │
│  - Checks requiresConfirmation → pauses if needed       │
│  - Calls tool.execute(params, context)                  │
│  - Wraps result into ToolCallResult                     │
│  - Logs to PromptHistory                                │
└────────────────┬────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Existing Service Layer  (lib/services/*.ts)            │
│  - Business logic unchanged                             │
│  - Returns ServiceResult<T> as always                   │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Service layer is the integration point.** Tools call services directly, not server actions. This avoids FormData conversion, gets clean `ServiceResult<T>` returns, and keeps all business logic (validation, cycle detection, immutability guards) intact.
- **Server actions remain for the UI.** Nothing changes for form-based flows. The AI tools are a parallel entry point into the same services.
- **Cache revalidation after tool execution.** The executor calls `revalidatePath()` after mutations so the UI stays in sync, mirroring what server actions already do.
- **Provider-agnostic tool definitions.** Both OpenAI and Anthropic use JSON Schema for parameters — a thin adapter converts our definitions to either format.

---

## 2. Core Types

### `lib/ai/tools/types.ts`

```typescript
import type { ServiceResult } from '@/lib/services/types'
import type { ZodSchema } from 'zod'

// ---------- Tool Definition ----------

export type ToolCategory =
  | 'project'
  | 'game-system'
  | 'brainstorm'
  | 'dependency'
  | 'version-plan'
  | 'idea-stream'
  | 'export'

export type ToolMutationType = 'create' | 'read' | 'update' | 'delete' | 'action'

export type ToolDefinition<TParams = Record<string, unknown>, TResult = unknown> = {
  /** Unique tool name: "create_game_system", "list_projects", etc. */
  name: string

  /** Description shown to the LLM to help it decide when to use this tool */
  description: string

  /** Which system owns this tool */
  category: ToolCategory

  /** CRUD classification — used for confirmation logic and logging */
  mutationType: ToolMutationType

  /** JSON Schema for parameters (used by both OpenAI and Anthropic) */
  parameters: JsonSchema

  /** Zod schema for server-side validation before execution */
  parameterSchema: ZodSchema<TParams>

  /** Whether the user must confirm before execution (deletes, finalizations) */
  requiresConfirmation: boolean

  /** Execute the tool against the service layer */
  execute: (params: TParams, context: ToolContext) => Promise<ServiceResult<TResult>>

  /** Generate the human-readable description from the params and result */
  describe: (params: TParams, result: ServiceResult<TResult>) => string
}

// ---------- Execution Context ----------

export type ToolContext = {
  projectId: string
  workspaceId: string
  userId: string
}

// ---------- Execution Result ----------

export type ToolCallResult = {
  /** Tool that was invoked */
  toolName: string

  /** Human-readable summary for the user */
  description: string

  /** The API call that was made — full transparency */
  apiCall: {
    service: string       // e.g. "gameSystemService.createSystem"
    payload: Record<string, unknown>
    mutationType: ToolMutationType
  }

  /** The raw service result */
  result: ServiceResult<unknown>

  /** ISO timestamp */
  executedAt: string
}

// ---------- JSON Schema (subset for tool params) ----------

export type JsonSchema = {
  type: 'object'
  properties: Record<string, JsonSchemaProperty>
  required?: string[]
}

export type JsonSchemaProperty = {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description?: string
  enum?: string[]
  items?: JsonSchemaProperty
  default?: unknown
  minimum?: number
  maximum?: number
}
```

---

## 3. Tool Registry

### `lib/ai/tools/registry.ts`

```typescript
import type { ToolDefinition, ToolCategory } from './types'

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`)
    }
    this.tools.set(tool.name, tool)
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  getByCategory(category: ToolCategory): ToolDefinition[] {
    return this.getAll().filter(t => t.category === category)
  }

  /** Convert to OpenAI function calling format */
  toOpenAITools() {
    return this.getAll().map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }))
  }

  /** Convert to Anthropic tool use format */
  toAnthropicTools() {
    return this.getAll().map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }))
  }
}

export const toolRegistry = new ToolRegistry()
```

### `lib/ai/tools/index.ts` — Registration Entry Point

```typescript
import { toolRegistry } from './registry'
import { projectTools } from './project.tools'
import { gameSystemTools } from './game-system.tools'
import { brainstormTools } from './brainstorm.tools'
import { dependencyTools } from './dependency.tools'
import { versionPlanTools } from './version-plan.tools'
import { ideaStreamTools } from './idea-stream.tools'
import { exportTools } from './export.tools'

const allTools = [
  ...projectTools,
  ...gameSystemTools,
  ...brainstormTools,
  ...dependencyTools,
  ...versionPlanTools,
  ...ideaStreamTools,
  ...exportTools,
]

allTools.forEach(t => toolRegistry.register(t))

export { toolRegistry }
export type { ToolDefinition, ToolCallResult, ToolContext } from './types'
```

---

## 4. Tool Executor

### `lib/ai/tools/executor.ts`

```typescript
import { toolRegistry } from './registry'
import type { ToolCallResult, ToolContext } from './types'
import { createPromptHistory } from '@/lib/repositories/prompt-history.repository'
import { revalidatePath } from 'next/cache'

export type ConfirmationRequest = {
  toolName: string
  description: string
  params: Record<string, unknown>
}

export type ExecutionOptions = {
  /** Called when a tool needs user confirmation. Return true to proceed. */
  onConfirmationNeeded?: (req: ConfirmationRequest) => Promise<boolean>
}

export async function executeTool(
  toolName: string,
  params: Record<string, unknown>,
  context: ToolContext,
  options?: ExecutionOptions,
): Promise<ToolCallResult> {
  const tool = toolRegistry.get(toolName)
  if (!tool) {
    return {
      toolName,
      description: `Unknown tool: ${toolName}`,
      apiCall: { service: 'unknown', payload: params, mutationType: 'read' },
      result: { success: false, error: `Tool "${toolName}" not found`, code: 'NOT_FOUND' },
      executedAt: new Date().toISOString(),
    }
  }

  // Validate params
  const parsed = tool.parameterSchema.safeParse(params)
  if (!parsed.success) {
    return {
      toolName,
      description: `Invalid parameters for ${toolName}`,
      apiCall: { service: toolName, payload: params, mutationType: tool.mutationType },
      result: { success: false, error: parsed.error.message, code: 'VALIDATION' },
      executedAt: new Date().toISOString(),
    }
  }

  // Confirmation gate for destructive operations
  if (tool.requiresConfirmation && options?.onConfirmationNeeded) {
    const previewDescription = tool.describe(
      parsed.data,
      { success: true, data: null } // preview before execution
    )
    const approved = await options.onConfirmationNeeded({
      toolName,
      description: previewDescription,
      params: parsed.data,
    })
    if (!approved) {
      return {
        toolName,
        description: `User declined: ${toolName}`,
        apiCall: { service: toolName, payload: parsed.data, mutationType: tool.mutationType },
        result: { success: false, error: 'User declined this action', code: 'FORBIDDEN' },
        executedAt: new Date().toISOString(),
      }
    }
  }

  // Execute
  const startTime = Date.now()
  const result = await tool.execute(parsed.data, context)
  const durationMs = Date.now() - startTime
  const description = tool.describe(parsed.data, result)

  const toolCallResult: ToolCallResult = {
    toolName,
    description,
    apiCall: {
      service: `${tool.category}Service.${toolName}`,
      payload: parsed.data,
      mutationType: tool.mutationType,
    },
    result,
    executedAt: new Date().toISOString(),
  }

  // Log to prompt history
  await createPromptHistory({
    projectId: context.projectId,
    promptType: `tool:${toolName}`,
    promptTemplate: tool.description,
    promptInput: JSON.stringify(parsed.data),
    promptContext: { context, mutationType: tool.mutationType },
    response: JSON.stringify(result),
    aiProvider: 'tool_executor',
    aiModel: 'n/a',
    durationMs,
    status: result.success ? 'completed' : 'failed',
    error: result.success ? undefined : result.error,
  })

  // Revalidate UI cache for mutations
  if (tool.mutationType !== 'read' && result.success) {
    revalidatePath(`/projects/${context.projectId}`, 'layout')
  }

  return toolCallResult
}
```

---

## 5. Per-System Tool Catalog

### 5.1 Project Tools — `lib/ai/tools/project.tools.ts`

| Tool Name | Type | Description | Requires Confirmation |
|-----------|------|-------------|-----------------------|
| `list_projects` | read | List all projects with optional status filter | No |
| `get_project` | read | Get project details and dashboard counts | No |
| `create_project` | create | Create a new game design project | No |
| `update_project` | update | Update project name, description, genre, platform, or status | No |
| `delete_project` | delete | Delete a project and all its contents | **Yes** |
| `get_project_activity` | read | Get recent activity feed for a project | No |

### 5.2 Game System Tools — `lib/ai/tools/game-system.tools.ts`

| Tool Name | Type | Description | Requires Confirmation |
|-----------|------|-------------|-----------------------|
| `list_game_systems` | read | List systems in a project with optional filters (status, mvpCriticality, search) | No |
| `get_game_system` | read | Get full system details including dependencies and changelog | No |
| `create_game_system` | create | Create a new game system with structured fields | No |
| `update_game_system` | update | Update system fields (purpose, mechanics, status, etc.) with a change summary | No |
| `delete_game_system` | delete | Delete a game system and its dependencies | **Yes** |
| `import_system_from_markdown` | create | Create a system by parsing a markdown document | No |

### 5.3 Brainstorm Tools — `lib/ai/tools/brainstorm.tools.ts`

| Tool Name | Type | Description | Requires Confirmation |
|-----------|------|-------------|-----------------------|
| `list_brainstorms` | read | List brainstorm sessions in a project | No |
| `get_brainstorm` | read | Get a brainstorm session with its synthesis outputs | No |
| `create_brainstorm` | create | Ingest a new brainstorm session (content, author, tags) | No |
| `delete_brainstorm` | delete | Delete a brainstorm session | **Yes** |

### 5.4 Dependency Tools — `lib/ai/tools/dependency.tools.ts`

| Tool Name | Type | Description | Requires Confirmation |
|-----------|------|-------------|-----------------------|
| `get_dependency_graph` | read | Get the full dependency graph with implementation order | No |
| `add_dependency` | create | Add a dependency between two systems (requires/enhances/optional) | No |
| `remove_dependency` | delete | Remove a dependency between two systems | No |
| `get_impact_analysis` | read | Get transitive downstream impact of changing a system | No |

### 5.5 Version Plan Tools — `lib/ai/tools/version-plan.tools.ts`

| Tool Name | Type | Description | Requires Confirmation |
|-----------|------|-------------|-----------------------|
| `list_version_plans` | read | List all version plans in a project | No |
| `get_version_plan` | read | Get version plan details with included systems and phases | No |
| `create_version_plan` | create | Create a version plan with selected systems (validates scope) | No |
| `validate_version_scope` | read | Check if a set of systems forms a valid scope (all deps satisfied) | No |
| `finalize_version_plan` | action | Lock a version plan (irreversible) | **Yes** |
| `delete_version_plan` | delete | Delete a draft version plan | **Yes** |

### 5.6 Idea Stream Tools — `lib/ai/tools/idea-stream.tools.ts`

| Tool Name | Type | Description | Requires Confirmation |
|-----------|------|-------------|-----------------------|
| `list_idea_threads` | read | List discussion threads in a project with unread counts | No |
| `get_thread_messages` | read | Get messages in a thread | No |
| `create_idea_thread` | create | Start a new discussion thread | No |
| `post_idea_message` | create | Post a message to an existing thread | No |
| `finalize_threads_to_brainstorm` | action | Convert selected threads into a brainstorm session | **Yes** |

### 5.7 Export Tools — `lib/ai/tools/export.tools.ts`

| Tool Name | Type | Description | Requires Confirmation |
|-----------|------|-------------|-----------------------|
| `list_exports` | read | List generated exports for a project | No |
| `generate_export` | action | Generate a GDD, PRD, or other document export | No |

---

## 6. Example Tool Definition

Here's a full example showing how `create_game_system` is defined:

```typescript
// lib/ai/tools/game-system.tools.ts

import { z } from 'zod'
import type { ToolDefinition } from './types'
import * as gameSystemService from '@/lib/services/game-system.service'

const createGameSystemParams = z.object({
  name: z.string().describe('Human-readable name for the system'),
  systemSlug: z.string().describe('URL-friendly identifier (e.g. "combat-engine")'),
  purpose: z.string().optional().describe('What this system does in the game'),
  coreMechanics: z.string().optional().describe('Core gameplay mechanics'),
  mvpCriticality: z.enum(['core', 'important', 'later']).optional()
    .describe('How critical this system is for MVP'),
  status: z.enum(['draft', 'active', 'deprecated']).optional(),
  currentState: z.string().optional(),
  targetState: z.string().optional(),
  inputs: z.string().optional(),
  outputs: z.string().optional(),
  failureStates: z.string().optional(),
  scalingBehavior: z.string().optional(),
  implementationNotes: z.string().optional(),
  openQuestions: z.string().optional(),
})

type CreateGameSystemParams = z.infer<typeof createGameSystemParams>

const createGameSystem: ToolDefinition<CreateGameSystemParams> = {
  name: 'create_game_system',
  description: 'Create a new game system within the current project. A game system represents a distinct gameplay mechanic or subsystem (e.g. combat, inventory, progression). Provide at minimum a name and slug.',
  category: 'game-system',
  mutationType: 'create',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Human-readable name' },
      systemSlug: { type: 'string', description: 'URL-friendly identifier' },
      purpose: { type: 'string', description: 'What this system does in the game' },
      coreMechanics: { type: 'string', description: 'Core gameplay mechanics' },
      mvpCriticality: {
        type: 'string',
        enum: ['core', 'important', 'later'],
        description: 'MVP criticality level',
      },
      status: { type: 'string', enum: ['draft', 'active', 'deprecated'] },
      currentState: { type: 'string', description: 'Current implementation state' },
      targetState: { type: 'string', description: 'Target implementation state' },
      inputs: { type: 'string', description: 'System inputs' },
      outputs: { type: 'string', description: 'System outputs' },
      failureStates: { type: 'string', description: 'Known failure states' },
      scalingBehavior: { type: 'string', description: 'How the system scales' },
      implementationNotes: { type: 'string', description: 'Implementation notes' },
      openQuestions: { type: 'string', description: 'Open questions to resolve' },
    },
    required: ['name', 'systemSlug'],
  },
  parameterSchema: createGameSystemParams,
  requiresConfirmation: false,
  execute: async (params, context) => {
    return gameSystemService.createSystem({
      projectId: context.projectId,
      systemSlug: params.systemSlug,
      name: params.name,
      purpose: params.purpose,
      coreMechanics: params.coreMechanics,
      mvpCriticality: params.mvpCriticality ?? 'important',
      status: params.status ?? 'draft',
      currentState: params.currentState,
      targetState: params.targetState,
      inputs: params.inputs,
      outputs: params.outputs,
      failureStates: params.failureStates,
      scalingBehavior: params.scalingBehavior,
      implementationNotes: params.implementationNotes,
      openQuestions: params.openQuestions,
    })
  },
  describe: (params, result) => {
    if (!result.success) return `Failed to create game system "${params.name}": ${result.error}`
    return `Created game system "${params.name}" (${params.systemSlug})`
  },
}

export const gameSystemTools: ToolDefinition[] = [
  createGameSystem,
  // ... other tools follow the same pattern
]
```

---

## 7. Execution Flow — End to End

### Single tool call

```
1. User: "Create a combat system for my RPG"

2. AI Engine sends to LLM:
   - System prompt (with project context)
   - User message
   - Tool definitions (from registry.toOpenAITools() or .toAnthropicTools())

3. LLM responds with tool_call:
   {
     name: "create_game_system",
     arguments: {
       name: "Combat System",
       systemSlug: "combat-system",
       purpose: "Handles all combat encounters...",
       coreMechanics: "Turn-based combat with initiative...",
       mvpCriticality: "core"
     }
   }

4. Executor:
   - Looks up tool in registry
   - Validates params with Zod schema
   - requiresConfirmation = false → auto-execute
   - Calls gameSystemService.createSystem(...)
   - Gets back ServiceResult<GameSystem>
   - Generates description: 'Created game system "Combat System" (combat-system)'
   - Logs to PromptHistory
   - Revalidates /projects/{id} paths

5. Returns ToolCallResult to AI Engine:
   {
     toolName: "create_game_system",
     description: 'Created game system "Combat System" (combat-system)',
     apiCall: {
       service: "gameSystemService.createSystem",
       payload: { name: "Combat System", systemSlug: "combat-system", ... },
       mutationType: "create"
     },
     result: { success: true, data: { id: "clx...", name: "Combat System", ... } }
   }

6. AI Engine feeds result back to LLM as tool_result

7. LLM generates final response:
   "I've created the Combat System for your RPG. It's set as a core MVP system
    with turn-based combat mechanics. You can find it in your systems list."

8. UI renders:
   - Assistant message with the response
   - Tool call card: ✓ Created game system "Combat System" (combat-system)
```

### Multi-step tool chain

```
User: "Create a combat system and a loot system, then make loot depend on combat"

LLM Round 1 → tool_calls:
  [create_game_system("Combat System"), create_game_system("Loot System")]
  → Both auto-execute in parallel
  → Results fed back

LLM Round 2 → tool_call:
  [add_dependency(source: loot-system-id, target: combat-system-id, type: "requires")]
  → Auto-executes (cycle check passes)
  → Result fed back

LLM Round 3 → text response:
  "Done! I created both systems and linked Loot → Combat as a requirement.
   The implementation order is: Combat System → Loot System."

UI renders:
  ✓ Created game system "Combat System" (combat-system)
  ✓ Created game system "Loot System" (loot-system)
  ✓ Added dependency: Loot System requires Combat System
```

### With confirmation

```
User: "Delete the old prototype system"

LLM → tool_call: delete_game_system({ systemId: "..." })

Executor: requiresConfirmation = true
  → UI shows: "The assistant wants to delete game system 'Old Prototype'. Approve?"
  → User clicks [Approve]
  → Executes deletion

UI renders:
  ✓ Deleted game system "Old Prototype"
```

---

## 8. File Structure

```
lib/ai/
├── get-workspace-provider-config.ts   # ✅ EXISTS — decrypt provider keys
├── engine.ts                          # NEW — orchestrates LLM calls + tool loop
├── providers/
│   ├── openai.provider.ts             # NEW — OpenAI API adapter
│   └── anthropic.provider.ts          # NEW — Anthropic API adapter
├── tools/
│   ├── types.ts                       # NEW — ToolDefinition, ToolCallResult, etc.
│   ├── registry.ts                    # NEW — ToolRegistry class
│   ├── executor.ts                    # NEW — executeTool() with validation + logging
│   ├── index.ts                       # NEW — registers all tools, exports registry
│   ├── project.tools.ts              # NEW — 6 project tools
│   ├── game-system.tools.ts          # NEW — 6 game system tools
│   ├── brainstorm.tools.ts           # NEW — 4 brainstorm tools
│   ├── dependency.tools.ts           # NEW — 4 dependency tools
│   ├── version-plan.tools.ts         # NEW — 6 version plan tools
│   ├── idea-stream.tools.ts          # NEW — 5 idea stream tools
│   └── export.tools.ts              # NEW — 2 export tools
├── context.ts                         # NEW — assembles project context for system prompt
└── templates/
    └── system-prompt.ts               # NEW — base system prompt template

app/api/ai/
├── chat/route.ts                      # NEW — streaming chat endpoint
└── tools/route.ts                     # NEW — direct tool execution endpoint (optional)
```

**Total: 33 tools across 7 systems, ~17 new files**

---

## 9. Dependencies to Install

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

The [Vercel AI SDK](https://sdk.vercel.ai/) provides:
- Unified `generateText()` / `streamText()` with built-in tool calling support
- Provider adapters for OpenAI and Anthropic
- Streaming helpers for Next.js API routes
- Tool result handling in the message loop
- Handles the OpenAI vs Anthropic format differences internally

---

## 10. Integration with Existing Code

### What changes in existing code: Almost nothing

| Layer | Change |
|-------|--------|
| Prisma schema | None — PromptHistory already supports tool logging |
| Repositories | None — tools call services, not repos |
| Services | None — tools invoke existing service functions as-is |
| Server actions | None — UI forms continue to use actions |
| Validations | Minor — reuse existing Zod schemas as bases for tool param schemas |
| UI components | New — assistant chat panel, tool call result cards |

### What's new

| Component | Purpose |
|-----------|---------|
| `lib/ai/tools/*` | Tool definitions, registry, executor |
| `lib/ai/engine.ts` | LLM orchestration with tool loop |
| `lib/ai/providers/*` | Thin wrappers using Vercel AI SDK |
| `lib/ai/context.ts` | Project context assembly for system prompts |
| `app/api/ai/chat/route.ts` | Streaming chat API endpoint |
| Chat UI components | Assistant panel with message + tool result rendering |

---

## 11. Implementation Order

### Phase 1: Foundation (tool types + registry + executor)
1. `lib/ai/tools/types.ts` — core type definitions
2. `lib/ai/tools/registry.ts` — ToolRegistry class
3. `lib/ai/tools/executor.ts` — executeTool() with validation + logging

### Phase 2: Tool definitions (one system at a time)
4. `lib/ai/tools/project.tools.ts` — start simple
5. `lib/ai/tools/game-system.tools.ts` — the richest system
6. `lib/ai/tools/brainstorm.tools.ts`
7. `lib/ai/tools/dependency.tools.ts`
8. `lib/ai/tools/version-plan.tools.ts`
9. `lib/ai/tools/idea-stream.tools.ts`
10. `lib/ai/tools/export.tools.ts`
11. `lib/ai/tools/index.ts` — wire registration

### Phase 3: AI engine + providers
12. Install `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`
13. `lib/ai/providers/openai.provider.ts`
14. `lib/ai/providers/anthropic.provider.ts`
15. `lib/ai/context.ts` — project context assembly
16. `lib/ai/engine.ts` — orchestration with multi-turn tool loop

### Phase 4: API + UI
17. `app/api/ai/chat/route.ts` — streaming endpoint
18. Chat UI panel component
19. Tool call result card components
20. Confirmation dialog for destructive tools

---

## 12. Security Considerations

- **API keys never leave the server.** Provider configs are decrypted only in server runtime via `getDecryptedWorkspaceProviderConfig()`.
- **Param validation is mandatory.** Every tool validates input with its Zod schema before execution. The LLM cannot bypass service-layer validation.
- **User context is server-derived.** `ToolContext.userId` comes from the auth cookie, never from LLM output. The AI cannot impersonate users.
- **Destructive operations require confirmation.** Delete and finalize tools set `requiresConfirmation: true`.
- **Full audit trail.** Every tool invocation is logged to PromptHistory with params, result, duration, and status.
- **No new DB permissions.** Tools call existing services that already enforce business rules (project existence checks, cycle detection, immutability guards, author-only edits).

---

## Change Log

- 2026-02-18: Initial implementation plan created.
