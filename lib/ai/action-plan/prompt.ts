import type { ProjectContext } from './context'
import type { ToolDefinition } from '@/lib/ai/tools/types'

type ThreadWithMessagesAndAuthors = {
  id: string
  title: string | null
  createdAt: Date
  createdBy: { displayName: string | null }
  messages: {
    content: string
    createdAt: Date
    editedAt: Date | null
    deletedAt: Date | null
    parentMessageId: string | null
    author: { displayName: string | null }
  }[]
}

function formatToolCatalog(tools: ToolDefinition[]): string {
  return tools
    .map((tool) => {
      const params = JSON.stringify(tool.parameters, null, 2)
      return [
        `### ${tool.name}`,
        `Category: ${tool.category} | Mutation: ${tool.mutationType}`,
        tool.description,
        '```json',
        params,
        '```',
      ].join('\n')
    })
    .join('\n\n')
}

function formatProjectState(ctx: ProjectContext): string {
  const lines: string[] = []

  lines.push(`## Project: ${ctx.project.name}`)
  if (ctx.project.description) lines.push(`Description: ${ctx.project.description}`)
  if (ctx.project.genre) lines.push(`Genre: ${ctx.project.genre}`)
  if (ctx.project.platform) lines.push(`Platform: ${ctx.project.platform}`)
  lines.push(`Status: ${ctx.project.status}`)
  lines.push('')

  if (ctx.systems.length > 0) {
    lines.push('## Game Systems')
    for (const s of ctx.systems) {
      lines.push(
        `- **${s.name}** (id: ${s.id}, slug: ${s.systemSlug}, status: ${s.status}, mvp: ${s.mvpCriticality})` +
          (s.purpose ? ` — ${s.purpose}` : '')
      )
    }
    lines.push('')
  }

  if (ctx.dependencies.edges.length > 0) {
    lines.push('## Dependencies')
    for (const e of ctx.dependencies.edges) {
      const sourceLabel = ctx.dependencies.nodes.find((n) => n.id === e.source)?.label ?? e.source
      const targetLabel = ctx.dependencies.nodes.find((n) => n.id === e.target)?.label ?? e.target
      lines.push(`- ${sourceLabel} --[${e.type}]--> ${targetLabel}`)
    }
    if (ctx.dependencies.implementationOrder.length > 0) {
      const orderLabels = ctx.dependencies.implementationOrder.map(
        (id) => ctx.dependencies.nodes.find((n) => n.id === id)?.label ?? id
      )
      lines.push(`Implementation order: ${orderLabels.join(' → ')}`)
    }
    lines.push('')
  }

  if (ctx.versionPlans.length > 0) {
    lines.push('## Version Plans')
    for (const vp of ctx.versionPlans) {
      lines.push(`- ${vp.versionLabel}: ${vp.title} (${vp.status})`)
    }
    lines.push('')
  }

  if (ctx.brainstormCount > 0) {
    lines.push(`Brainstorm sessions: ${ctx.brainstormCount}`)
  }

  return lines.join('\n')
}

export function buildSystemPrompt(
  projectContext: ProjectContext,
  availableTools: ToolDefinition[]
): string {
  const toolNames = availableTools.map((t) => t.name)

  return `You are an expert game design AI assistant that creates structured action plans.

Given a conversation from an idea stream and the current project state, generate an ordered list of tool calls that implement the ideas discussed.

# CRITICAL: Valid Tool Names

You may ONLY use these exact tool names (snake_case). Any other tool name will cause a validation error:

${toolNames.map((n) => `- ${n}`).join('\n')}

# Tool Reference

${formatToolCatalog(availableTools)}

# Current Project State

${formatProjectState(projectContext)}

# Output Format

You must produce a JSON object matching this schema:
- title: A short title for the action plan
- summary: A brief summary of what the plan accomplishes
- steps: An ordered array of steps, each with:
  - stepId: A human-readable kebab-case ID (e.g. "create-combat-system")
  - description: What this step does
  - toolName: MUST be one of the exact tool names listed above (snake_case). Do NOT invent names like "CreateDesignDocument" or "ImplementGameSystem".
  - params: Array of {key, value} objects for tool parameters. Values are always strings. Use [] if no params needed.
    Example: [{"key": "name", "value": "Combat System"}, {"key": "status", "value": "draft"}]
  - paramRefs: Array of references to previous step outputs. Use [] if no refs needed. Each entry has:
    - paramName: The parameter name to set
    - stepIndex: The 0-based index of the step whose output to reference
    - path: A dot-separated path into the step's result (e.g. "data.id")
    Example: [{"paramName": "systemId", "stepIndex": 0, "path": "data.id"}]
  - dependsOn: Array of step indices this step depends on. Use [] if it just depends on the previous step.

# Rules

1. ONLY use tool names from the valid list above. Every toolName MUST exactly match one of those names. Never invent or guess tool names.
2. Use existing system IDs/slugs when referring to existing systems (found in project state above).
3. When a step creates a new entity and a later step needs its ID, use paramRefs with the path "data.id" to reference the created entity's ID.
4. paramRefs stepIndex must always reference a PRIOR step (lower index). Never reference the current step or a future step.
5. Keep plans focused and practical. Don't add unnecessary steps.
6. Order steps logically — create before update, dependencies before dependents.
7. Use project-specific terminology from the conversation.
8. For new game design ideas, use create_game_system to create them, then update_game_system to add details. Use create_brainstorm to capture design notes.
`
}

function authorDisplay(author: { displayName: string | null }): string {
  return author.displayName?.trim() || 'Unknown'
}

export function buildUserPrompt(threads: ThreadWithMessagesAndAuthors[]): string {
  const lines: string[] = [
    'Here is the idea stream conversation to synthesize into actions:',
    '',
  ]

  for (const thread of threads) {
    const title =
      thread.title?.trim() ||
      (thread.messages[0] && !thread.messages[0].deletedAt
        ? thread.messages[0].content.trim().slice(0, 60) +
          (thread.messages[0].content.length > 60 ? '...' : '')
        : 'Untitled')

    lines.push(`## Thread: ${title}`)
    lines.push(`Created by: ${authorDisplay(thread.createdBy)}`)
    lines.push('')

    for (const msg of thread.messages) {
      if (msg.deletedAt) continue
      const name = authorDisplay(msg.author)
      const edited = msg.editedAt ? ' (edited)' : ''
      if (msg.parentMessageId) {
        lines.push(`  > ${name}: ${msg.content}${edited}`)
      } else {
        lines.push(`- ${name}: ${msg.content}${edited}`)
      }
    }
    lines.push('')
  }

  lines.push(
    'Based on this conversation, create an action plan that implements the discussed ideas using the available tools.'
  )

  return lines.join('\n')
}
